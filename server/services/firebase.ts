/**
 * Firebase service for server-side operations
 * Handles image storage and retrieval for the gallery
 */
import axios from 'axios';
import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { v4 as uuidv4 } from 'uuid';
import { CONFIG } from '../config';
import { logEvent, logError } from './logging';

// Initialize Firebase Admin if not already initialized
let firebaseApp: any;

// Function to ensure Firebase is initialized
const initializeFirebase = () => {
  if (!firebaseApp) {
    try {
      // Check for required configuration
      if (!CONFIG.firebase.projectId) {
        throw new Error('Missing Firebase project ID in configuration');
      }

      // Use configuration for Firebase initialization
      firebaseApp = initializeApp({
        // If service account is available, use it; otherwise use project ID only
        projectId: CONFIG.firebase.projectId,
        storageBucket: CONFIG.firebase.storageBucket,
      });

      logEvent('firebase', 'Firebase Admin initialized successfully', {
        project_id: CONFIG.firebase.projectId
      });
    } catch (error) {
      logError('firebase_init', error instanceof Error ? error : 'Unknown error');
      throw new Error(`Failed to initialize Firebase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  return firebaseApp;
};

/**
 * Upload an image to Firebase Storage from a URL
 * 1. Downloads the image from the provided URL
 * 2. Uploads it to Firebase Storage
 * 3. Returns the permanent Firebase Storage URL
 * 
 * @param imageUrl URL of the image to upload
 * @param metadata Additional metadata to store with the image
 * @returns Promise resolving to the Firebase Storage URL
 */
export const uploadImageFromUrl = async (
  imageUrl: string, 
  metadata: { 
    studentName: string; 
    missionNumber: number; 
    sessionId: string;
    prompt?: string;
  }
): Promise<string> => {
  try {
    // Initialize Firebase if needed
    initializeFirebase();
    
    let imageData;
    let contentType = 'image/jpeg';
    
    // Check if the URL is a local path or an external URL
    if (imageUrl.startsWith('/generated-images/')) {
      // It's a local path, read the file from disk
      const fs = require('fs');
      const path = require('path');
      
      // Convert relative path to absolute path
      const fullPath = path.join(process.cwd(), 'server/public', imageUrl);
      
      try {
        // Read the file directly from the filesystem
        imageData = await fs.promises.readFile(fullPath);
        
        // Determine contentType based on file extension
        const ext = path.extname(fullPath).toLowerCase();
        if (ext === '.png') contentType = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        else if (ext === '.gif') contentType = 'image/gif';
        else if (ext === '.webp') contentType = 'image/webp';
        
        console.log(`🔍 DEBUG - Firebase: Reading local file from ${fullPath} with type ${contentType}`);
      } catch (error) {
        const fileError = error as Error;
        console.error(`🔍 DEBUG - Firebase: Error reading local file: ${fileError.message}`);
        throw new Error(`Failed to read local image file: ${fileError.message}`);
      }
    } else {
      // It's an external URL, download it
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
      });
      
      // Get the content type from the response headers
      contentType = response.headers['content-type'] || 'image/jpeg';
      imageData = Buffer.from(response.data);
    }
    
    // Generate a unique filename
    const sanitizedName = (metadata.studentName || 'student').replace(/\s+/g, '_');
    const missionNum = metadata.missionNumber || 1;
    const fileName = `gallery/${sanitizedName}_${missionNum}_${Date.now()}_${uuidv4().substring(0, 8)}`;
    
    // Get a reference to the storage bucket
    const bucket = getStorage().bucket();
    const file = bucket.file(fileName);
    
    // Upload the image with metadata (imageData already contains the file content)
    await file.save(imageData, {
      metadata: {
        contentType,
        metadata: {
          studentName: metadata.studentName,
          missionNumber: String(metadata.missionNumber),
          sessionId: metadata.sessionId,
          prompt: metadata.prompt || '',
          uploadedAt: new Date().toISOString(),
        },
      },
    });
    
    // Make the file publicly accessible
    await file.makePublic();
    
    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    
    logEvent('firebase_upload', 'Image uploaded to Firebase Storage', {
      student_name: metadata.studentName,
      mission_number: metadata.missionNumber,
    });
    
    return publicUrl;
  } catch (error) {
    logError('firebase_upload', error instanceof Error ? error : 'Unknown error');
    throw new Error(`Failed to upload image to Firebase: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * List all images in the gallery with pagination
 * @param limit Maximum number of images to return
 * @param pageToken Token for pagination
 * @returns Promise resolving to an array of image URLs and metadata
 */
export const listGalleryImages = async (limit: number = 20, pageToken?: string) => {
  try {
    // Initialize Firebase if needed
    initializeFirebase();
    
    // Get a reference to the storage bucket
    const bucket = getStorage().bucket();
    
    // List files in the gallery directory with pagination
    const [files, nextPageToken] = await bucket.getFiles({
      prefix: 'gallery/',
      maxResults: limit,
      pageToken,
    });
    
    // Get details for each file
    const fileDetails = await Promise.all(
      files.map(async (file) => {
        // Get the file metadata
        const [metadata] = await file.getMetadata();
        
        return {
          name: file.name,
          url: `https://storage.googleapis.com/${bucket.name}/${file.name}`,
          contentType: metadata.contentType,
          size: typeof metadata.size === 'string' ? parseInt(metadata.size, 10) : (typeof metadata.size === 'number' ? metadata.size : 0),
          timeCreated: metadata.timeCreated,
          updated: metadata.updated,
          metadata: metadata.metadata || {},
        };
      })
    );
    
    return {
      files: fileDetails,
      nextPageToken,
    };
  } catch (error) {
    logError('firebase_list_images', error instanceof Error ? error : 'Unknown error');
    throw new Error(`Failed to list gallery images: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};