/**
 * Gallery Routes
 * Handles all gallery-related operations including image sharing, retrieval, and likes
 */
import express, { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { logEvent, logError } from '../services/logging';
import { uploadImageFromUrl, listGalleryImages } from '../services/firebase';
import { z } from 'zod';
import { insertGalleryImageSchema, galleryImages, galleryLikes } from '@shared/schema';
import { db } from '../db';
import { SessionData } from 'express-session';

// Extended request type with gallery session
interface RequestWithGallery extends Request {
  session: Request['session'] & {
    gallerySessionId?: string;
  };
  // Include user identity fields if available
  body: any & {
    firebaseUid?: string;
    deviceId?: string;
  };
}

// Validation schema for gallery image sharing
const shareImageSchema = z.object({
  imageUrl: z.string(), // Accept any string for image URL, including local paths
  studentName: z.string().optional(),
  prompt: z.string().optional(),
  missionNumber: z.number().int().positive().default(1)
});

// Validation schema for liking an image
const likeImageSchema = z.object({
  imageId: z.number().int().positive()
});

export function registerGalleryRoutes(router: Router) {
  const galleryRoutes = Router();

  // Ensure all routes have a gallery session ID
  galleryRoutes.use((req: RequestWithGallery, res: Response, next) => {
    // Generate a session ID if not already present
    if (!req.session.gallerySessionId) {
      req.session.gallerySessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    next();
  });

  // Upload an image to the gallery
  galleryRoutes.post("/upload", async (req: RequestWithGallery, res: Response) => {
    try {
      const { imageUrl, studentName, missionNumber, firebaseUid, deviceId } = req.body;
      
      // Validate required fields
      if (!imageUrl || !studentName || missionNumber === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Create a new gallery image
      const sessionId = req.session.gallerySessionId || `anonymous_${Date.now()}`;
      const galleryImage = await storage.createGalleryImage({
        imageUrl,
        studentName,
        missionNumber,
        sessionId,
        firebaseUid: firebaseUid || null // Include Firebase UID if available
      });

      // Log successful upload
      logEvent('gallery_image_upload', 'Image uploaded to gallery', {
        student_name: studentName,
        mission_number: missionNumber,
        session_id: sessionId,
        firebase_uid: firebaseUid || null,
        device_id: deviceId || null
      });
      
      return res.status(201).json(galleryImage);
    } catch (error) {
      logError('gallery_upload', error instanceof Error ? error : 'Unknown error');
      return res.status(500).json({ error: 'Failed to upload image to gallery' });
    }
  });

  // Like an image in the gallery
  galleryRoutes.post("/like", async (req: RequestWithGallery, res: Response) => {
    try {
      // Validate request with Zod
      const validation = likeImageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid request data',
          details: validation.error.format()
        });
      }
      
      const { imageId, firebaseUid } = req.body;

      // Check if user already liked this image
      const sessionId = req.session.gallerySessionId || `anonymous_${Date.now()}`;
      const hasLiked = await storage.hasLiked(imageId, sessionId, firebaseUid);
      
      // If already liked, return the current image without incrementing
      if (hasLiked) {
        const image = await storage.getGalleryImage(imageId);
        return res.json(image);
      }

      // Increment the like count using the session ID and Firebase UID
      const updatedImage = await storage.incrementLike(imageId, sessionId, firebaseUid);
      
      if (!updatedImage) {
        return res.status(404).json({ error: 'Image not found' });
      }

      // Log the like
      logEvent('gallery_image_liked', `Image ${imageId} liked`, {
        image_id: imageId,
        session_id: sessionId,
        firebase_uid: firebaseUid || null
      });
      
      return res.json(updatedImage);
    } catch (error) {
      logError('gallery_like', error instanceof Error ? error : 'Unknown error');
      return res.status(500).json({ error: 'Failed to like image' });
    }
  });

  // Share an image to the gallery from the image generator
  galleryRoutes.post("/share", async (req: RequestWithGallery, res: Response) => {
    try {
      // Validate request with Zod
      const validation = shareImageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid request data',
          details: validation.error.format()
        });
      }
      
      const { imageUrl, studentName, prompt, missionNumber } = validation.data;
      const { firebaseUid } = req.body;

      // Use the provided student name or a default if not available
      const finalStudentName = studentName && studentName.trim() !== '' 
        ? studentName 
        : "طالب مبدع"; // Default name "Creative Student" in Arabic
      
      const sessionId = req.session.gallerySessionId || `anonymous_${Date.now()}`;
      
      // Step 1: Upload the image to Firebase Storage first to get a permanent URL
      try {
        // Upload to Firebase Storage
        logEvent('firebase_upload_start', 'Beginning Firebase upload process', {
          original_url_length: imageUrl.length,
          student_name: finalStudentName,
        });
        
        const permanentImageUrl = await uploadImageFromUrl(imageUrl, {
          studentName: finalStudentName,
          missionNumber: missionNumber || 1,
          sessionId,
          prompt
        });
        
        // Step 2: Create a gallery image record with the permanent Firebase URL
        const galleryImage = await storage.createGalleryImage({
          imageUrl: permanentImageUrl, // Use the permanent Firebase URL
          studentName: finalStudentName,
          missionNumber: missionNumber || 1,
          sessionId,
          firebaseUid: firebaseUid || null // Include Firebase UID if available
        });

        // Log successful sharing
        logEvent('gallery_image_shared', 'Image shared to gallery from generator', {
          student_name: finalStudentName,
          mission_number: missionNumber || 1,
          session_id: sessionId,
          prompt_length: prompt ? prompt.length : 0,
          permanent_url: true,
          firebase_uid: firebaseUid || null
        });
        
        return res.status(201).json(galleryImage);
      } catch (firebaseError) {
        // If Firebase upload fails, fall back to the original URL
        logError('firebase_upload', firebaseError instanceof Error ? firebaseError : 'Unknown error');
        
        // Just create gallery image with original URL as fallback
        const galleryImage = await storage.createGalleryImage({
          imageUrl, // Use the original URL as fallback
          studentName: finalStudentName,
          missionNumber: missionNumber || 1,
          sessionId,
          firebaseUid: firebaseUid || null // Include Firebase UID if available
        });
        
        logEvent('gallery_image_shared', 'Image shared to gallery with original URL (Firebase failed)', {
          student_name: finalStudentName,
          session_id: sessionId,
          permanent_url: false
        });
        
        return res.status(201).json(galleryImage);
      }
    } catch (error) {
      logError('gallery_share', error instanceof Error ? error : 'Unknown error');
      return res.status(500).json({ error: 'Failed to share image to gallery' });
    }
  });

  // Get all images from the gallery with pagination and filtering
  galleryRoutes.get("/all", async (req: Request, res: Response) => {
    try {
      // Parse query parameters for pagination and filtering
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const nameFilter = req.query.name as string || '';
      const pageToken = req.query.pageToken as string || undefined;
      
      // First, try to get images from Firebase Storage
      try {
        const firebaseImages = await listGalleryImages(limit, pageToken);
        
        // Filter images by student name if filter is provided
        const filteredImages = nameFilter 
          ? firebaseImages.files.filter(img => {
              const studentName = typeof img.metadata?.studentName === 'string' ? img.metadata.studentName.toLowerCase() : '';
              return studentName.includes(nameFilter.toLowerCase());
            })
          : firebaseImages.files;
            
        // Log the successful Firebase fetch
        logEvent('gallery_images_fetch_firebase', 'Fetched gallery images from Firebase', {
          image_count: filteredImages.length,
          filter: nameFilter ? true : false,
          total_files: firebaseImages.files.length
        });
        
        // Return the images with pagination info
        return res.json({
          images: filteredImages,
          pagination: {
            nextPageToken: firebaseImages.nextPageToken,
            currentPage: page,
            limit
          }
        });
      } catch (firebaseError) {
        // If Firebase fetch fails, fall back to database
        logError('gallery_fetch_firebase', firebaseError instanceof Error ? firebaseError : 'Unknown error');
        
        // Fetch images from the database as fallback
        const dbImages = await storage.getAllGalleryImages();
        
        // Apply filtering
        const filteredImages = nameFilter
          ? dbImages.filter(img => {
              return (img.studentName || '').toLowerCase().includes(nameFilter.toLowerCase());
            })
          : dbImages;
          
        // Apply pagination manually (simple offset-based pagination)
        const startIndex = (page - 1) * limit;
        const paginatedImages = filteredImages.slice(startIndex, startIndex + limit);
        
        // Log the database fallback fetch
        logEvent('gallery_images_fetch_db', 'Fetched gallery images from database (fallback)', {
          image_count: paginatedImages.length,
          total_count: dbImages.length,
          filter: nameFilter ? true : false
        });
        
        // Return the images with pagination info
        return res.json({
          images: paginatedImages,
          pagination: {
            totalCount: filteredImages.length,
            currentPage: page,
            totalPages: Math.ceil(filteredImages.length / limit),
            limit
          }
        });
      }
    } catch (error) {
      logError('gallery_fetch', error instanceof Error ? error : 'Unknown error');
      return res.status(500).json({ error: 'Failed to fetch gallery images' });
    }
  });
  
  // Add a new endpoint to filter gallery images by student name
  galleryRoutes.get("/search", async (req: Request, res: Response) => {
    try {
      const nameFilter = req.query.name as string;
      
      if (!nameFilter) {
        return res.status(400).json({ error: 'Name filter is required' });
      }
      
      // Get all images
      const images = await storage.getAllGalleryImages();
      
      // Filter images by student name
      const filteredImages = images.filter(img => {
        return (img.studentName || '').toLowerCase().includes(nameFilter.toLowerCase());
      });
      
      logEvent('gallery_images_search', 'Searched gallery images by name', {
        filter: nameFilter,
        results_count: filteredImages.length,
        total_count: images.length
      });
      
      return res.json(filteredImages);
    } catch (error) {
      logError('gallery_search', error instanceof Error ? error : 'Unknown error');
      return res.status(500).json({ error: 'Failed to search gallery images' });
    }
  });
  
  // Unlike an image in the gallery
  galleryRoutes.post("/unlike", async (req: RequestWithGallery, res: Response) => {
    try {
      // Validate request with Zod
      const validation = likeImageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid request data',
          details: validation.error.format()
        });
      }
      
      const { imageId, firebaseUid } = req.body;

      // Get session ID
      const sessionId = req.session.gallerySessionId || `anonymous_${Date.now()}`;
      
      // Check if user has liked this image
      const hasLiked = await storage.hasLiked(imageId, sessionId, firebaseUid);
      
      // If not liked, return an error
      if (!hasLiked) {
        return res.status(400).json({ error: 'You have not liked this image' });
      }

      // Decrement the like count
      const updatedImage = await storage.decrementLike(imageId, sessionId, firebaseUid);
      
      if (!updatedImage) {
        return res.status(404).json({ error: 'Image not found' });
      }

      // Log the unlike
      logEvent('gallery_image_unliked', `Image ${imageId} unliked`, {
        image_id: imageId,
        session_id: sessionId,
        firebase_uid: firebaseUid || null
      });
      
      return res.json(updatedImage);
    } catch (error) {
      logError('gallery_unlike', error instanceof Error ? error : 'Unknown error');
      return res.status(500).json({ error: 'Failed to unlike image' });
    }
  });

  // Admin endpoint to delete all gallery data (DEVELOPMENT ONLY)
  galleryRoutes.delete("/all", async (_req: Request, res: Response) => {
    try {
      // Delete all gallery likes first (due to foreign key constraints)
      await db.delete(galleryLikes);
      
      // Then delete all gallery images
      await db.delete(galleryImages);
      
      logEvent('gallery_data_deleted', 'All gallery data has been deleted', {
        timestamp: new Date().toISOString()
      });
      
      return res.status(200).json({ 
        success: true, 
        message: 'All gallery data has been deleted successfully' 
      });
    } catch (error) {
      logError('gallery_data_delete', error instanceof Error ? error : 'Unknown error');
      return res.status(500).json({ error: 'Failed to delete gallery data' });
    }
  });

  // Mount gallery routes
  router.use('/gallery', galleryRoutes);
}