/**
 * Gallery Routes
 * Handles all gallery-related operations including image sharing, retrieval, and likes
 */
import express, { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { logEvent, logError } from '../services/logging';
import { uploadImageFromUrl, listGalleryImages } from '../services/firebase';
import { z } from 'zod';
import { insertGalleryImageSchema } from '@shared/schema';
import { SessionData } from 'express-session';

// Extended request type with gallery session
interface RequestWithGallery extends Request {
  session: Request['session'] & {
    gallerySessionId?: string;
  };
}

// Validation schema for gallery image sharing
const shareImageSchema = z.object({
  imageUrl: z.string().url(),
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
      const { imageUrl, studentName, missionNumber } = req.body;
      
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
        sessionId
      });

      // Log successful upload
      logEvent('gallery_image_upload', 'Image uploaded to gallery', {
        student_name: studentName,
        mission_number: missionNumber,
        session_id: sessionId
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
      
      const { imageId } = validation.data;

      // Check if user already liked this image
      const sessionId = req.session.gallerySessionId || `anonymous_${Date.now()}`;
      const hasLiked = await storage.hasLiked(imageId, sessionId);
      
      // If already liked, return the current image without incrementing
      if (hasLiked) {
        const image = await storage.getGalleryImage(imageId);
        return res.json(image);
      }

      // Increment the like count using the same session ID
      const updatedImage = await storage.incrementLike(imageId, sessionId);
      
      if (!updatedImage) {
        return res.status(404).json({ error: 'Image not found' });
      }

      // Log the like
      logEvent('gallery_image_liked', `Image ${imageId} liked`, {
        image_id: imageId,
        session_id: sessionId
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
          sessionId
        });

        // Log successful sharing
        logEvent('gallery_image_shared', 'Image shared to gallery from generator', {
          student_name: finalStudentName,
          mission_number: missionNumber || 1,
          session_id: sessionId,
          prompt_length: prompt ? prompt.length : 0,
          permanent_url: true
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
          sessionId
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

  // Get all images from the gallery
  galleryRoutes.get("/all", async (req: Request, res: Response) => {
    try {
      const images = await storage.getAllGalleryImages();
      
      // Log the request
      logEvent('gallery_images_fetch', 'Fetched gallery images', {
        image_count: images.length
      });
      
      return res.json(images);
    } catch (error) {
      logError('gallery_fetch', error instanceof Error ? error : 'Unknown error');
      return res.status(500).json({ error: 'Failed to fetch gallery images' });
    }
  });
  
  // Mount gallery routes
  router.use('/gallery', galleryRoutes);
}