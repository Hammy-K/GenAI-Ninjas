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
      // Debug the incoming request
      console.log(`🔍 DEBUG - Gallery Image Share Request received:`, {
        body_keys: Object.keys(req.body),
        has_image_url: !!req.body.imageUrl,
        image_url_length: req.body.imageUrl ? req.body.imageUrl.length : 0,
        session_id: req.session.gallerySessionId || 'none'
      });
      
      // Validate request with Zod
      const validation = shareImageSchema.safeParse(req.body);
      if (!validation.success) {
        console.log('🔍 DEBUG - Gallery Share: Validation failed', validation.error.format());
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
      
      // Verify that the imageUrl is valid
      if (!imageUrl || imageUrl.trim() === '') {
        console.log('🔍 DEBUG - Gallery Share: Empty image URL provided');
        return res.status(400).json({ error: 'Empty image URL provided' });
      }
      
      console.log(`🔍 DEBUG - Gallery Share: Image URL validation passed, starting upload process`);
      
      let galleryImage;
      
      // Step 1: Upload the image to Firebase Storage first to get a permanent URL
      try {
        // Upload to Firebase Storage
        logEvent('firebase_upload_start', 'Beginning Firebase upload process', {
          original_url_length: imageUrl.length,
          student_name: finalStudentName,
        });
        
        console.log(`🔍 DEBUG - Gallery Share: Calling uploadImageFromUrl with imageUrl length=${imageUrl.length}`);
        
        const permanentImageUrl = await uploadImageFromUrl(imageUrl, {
          studentName: finalStudentName,
          missionNumber: missionNumber || 1,
          sessionId,
          prompt
        });
        
        console.log(`🔍 DEBUG - Gallery Share: Firebase upload successful, got permanentImageUrl=${permanentImageUrl.substring(0, 50)}...`);
        
        // Step 2: Create a gallery image record with the permanent Firebase URL
        galleryImage = await storage.createGalleryImage({
          imageUrl: permanentImageUrl, // Use the permanent Firebase URL
          studentName: finalStudentName,
          missionNumber: missionNumber || 1,
          sessionId,
          firebaseUid: firebaseUid || null // Include Firebase UID if available
        });

        console.log(`🔍 DEBUG - Gallery Share: Gallery record created successfully with ID=${galleryImage.id}`);

        // Log successful sharing
        logEvent('gallery_image_shared', 'Image shared to gallery from generator', {
          student_name: finalStudentName,
          mission_number: missionNumber || 1,
          session_id: sessionId,
          prompt_length: prompt ? prompt.length : 0,
          permanent_url: true,
          firebase_uid: firebaseUid || null
        });
      } catch (firebaseError) {
        // If Firebase upload fails, fall back to the original URL
        console.error(`🔍 DEBUG - Gallery Share: Firebase upload failed`, firebaseError);
        logError('firebase_upload', firebaseError instanceof Error ? firebaseError : 'Unknown error');
        
        console.log(`🔍 DEBUG - Gallery Share: Falling back to storing original URL in database`);
        
        // Just create gallery image with original URL as fallback
        galleryImage = await storage.createGalleryImage({
          imageUrl, // Use the original URL as fallback
          studentName: finalStudentName,
          missionNumber: missionNumber || 1,
          sessionId,
          firebaseUid: firebaseUid || null // Include Firebase UID if available
        });
        
        console.log(`🔍 DEBUG - Gallery Share: Fallback gallery record created with ID=${galleryImage.id}`);
        
        logEvent('gallery_image_shared', 'Image shared to gallery with original URL (Firebase failed)', {
          student_name: finalStudentName,
          session_id: sessionId,
          permanent_url: false
        });
      }
      
      // Verify we have a valid gallery image to return
      if (!galleryImage || !galleryImage.id) {
        console.error(`🔍 DEBUG - Gallery Share: Failed to create gallery record`);
        throw new Error('Failed to create gallery image record');
      }
      
      // Return the created gallery image
      console.log(`🔍 DEBUG - Gallery Share: Returning gallery image with ID=${galleryImage.id}`);
      return res.status(201).json(galleryImage);
    } catch (error) {
      console.error('🔍 DEBUG - Gallery Share: Unhandled error', error);
      logError('gallery_share', error instanceof Error ? error : 'Unknown error');
      return res.status(500).json({ 
        error: 'Failed to share image to gallery',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  // Get all images from the gallery with pagination and filtering
  galleryRoutes.get("/all", async (req: Request, res: Response) => {
    try {
      console.log(`🔍 DEBUG - Gallery All: Request received`, {
        query_params: req.query,
        has_session: !!req.session?.gallerySessionId
      });
      
      // Parse query parameters for pagination and filtering
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const nameFilter = req.query.name as string || '';
      const pageToken = req.query.pageToken as string || undefined;
      
      console.log(`🔍 DEBUG - Gallery All: Parsed parameters`, {
        limit, page, nameFilter: nameFilter || 'none', pageToken: pageToken || 'none'
      });
      
      // First, try to get images from Firebase Storage
      try {
        console.log(`🔍 DEBUG - Gallery All: Attempting to fetch from Firebase Storage`);
        const firebaseImages = await listGalleryImages(limit, pageToken);
        
        console.log(`🔍 DEBUG - Gallery All: Firebase returned ${firebaseImages.files.length} images`);
        
        // Filter images by student name if filter is provided
        const filteredImages = nameFilter 
          ? firebaseImages.files.filter(img => {
              const studentName = typeof img.metadata?.studentName === 'string' ? img.metadata.studentName.toLowerCase() : '';
              return studentName.includes(nameFilter.toLowerCase());
            })
          : firebaseImages.files;
        
        console.log(`🔍 DEBUG - Gallery All: After filtering, ${filteredImages.length} images remain`);
            
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
        console.error(`🔍 DEBUG - Gallery All: Firebase fetch failed, falling back to database`, firebaseError);
        logError('gallery_fetch_firebase', firebaseError instanceof Error ? firebaseError : 'Unknown error');
        
        // Fetch images from the database as fallback
        console.log(`🔍 DEBUG - Gallery All: Fetching from database as fallback`);
        const dbImages = await storage.getAllGalleryImages();
        
        console.log(`🔍 DEBUG - Gallery All: Database returned ${dbImages.length} images`);
        
        // Apply filtering
        const filteredImages = nameFilter
          ? dbImages.filter(img => {
              return (img.studentName || '').toLowerCase().includes(nameFilter.toLowerCase());
            })
          : dbImages;
        
        console.log(`🔍 DEBUG - Gallery All: After filtering, ${filteredImages.length} images remain`);
          
        // Apply pagination manually (simple offset-based pagination)
        const startIndex = (page - 1) * limit;
        const paginatedImages = filteredImages.slice(startIndex, startIndex + limit);
        
        console.log(`🔍 DEBUG - Gallery All: After pagination, returning ${paginatedImages.length} images`);
        
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
      console.error('🔍 DEBUG - Gallery All: Unhandled error', error);
      logError('gallery_fetch', error instanceof Error ? error : 'Unknown error');
      
      // Always return some sort of response, even if empty, to avoid client-side errors
      return res.status(500).json({ 
        error: 'Failed to fetch gallery images',
        message: error instanceof Error ? error.message : 'Unknown error',
        images: [],
        pagination: {
          totalCount: 0,
          currentPage: 1,
          totalPages: 0,
          limit: 20
        }
      });
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