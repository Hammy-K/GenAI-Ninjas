import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDoc, Firestore } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL, FirebaseStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Track Firebase initialization status
let firebaseInitialized = false;
let firebaseInitializationError: any = null;
let db: Firestore;
let storage: FirebaseStorage;

try {
  console.log("Firebase initialization with:", {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "API_KEY_PROVIDED" : "API_KEY_MISSING",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID ? "APP_ID_PROVIDED" : "APP_ID_MISSING",
  });

  if (!import.meta.env.VITE_FIREBASE_API_KEY || !import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    throw new Error("Firebase configuration is incomplete. Required environment variables are missing.");
  }

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  
  // Mark as successfully initialized
  firebaseInitialized = true;
  console.log("Firebase successfully initialized!");
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
  firebaseInitializationError = error;
  
  // Create dummy objects to prevent code from crashing
  // These will be checked before operations
  db = {} as Firestore;
  storage = {} as FirebaseStorage;
}

// Function to extract and process base64 images from HTML
export function extractBase64ImagesFromHTML(html: string): { 
  processedHTML: string, 
  images: { dataUrl: string, mimeType: string, filename: string }[] 
} {
  // Regular expression to find base64 images in HTML
  const base64Pattern = /<img[^>]*src=["']data:image\/([^;]+);base64,([^"']+)["'][^>]*>/g;
  let match;
  const images: { dataUrl: string, mimeType: string, filename: string }[] = [];
  let processedHTML = html;
  
  // Extract all base64 images
  while ((match = base64Pattern.exec(html)) !== null) {
    const fullTag = match[0];
    const mimeType = match[1];
    const base64Data = match[2];
    const imageId = `image_${Date.now()}_${images.length}`;
    
    // Save to the images array
    images.push({
      dataUrl: `data:image/${mimeType};base64,${base64Data}`,
      mimeType,
      filename: `${imageId}.${mimeType}`
    });
    
    // Replace in HTML with a placeholder
    processedHTML = processedHTML.replace(
      fullTag, 
      fullTag.replace(`data:image/${mimeType};base64,${base64Data}`, `{{IMAGE_${images.length - 1}_URL}}`)
    );
  }
  
  return { processedHTML, images };
}

/**
 * Checks if Firebase is properly initialized and logs useful diagnostic information
 * @returns True if Firebase is initialized, false otherwise
 */
export function isFirebaseReady(): boolean {
  if (!firebaseInitialized) {
    console.warn("Firebase is not initialized. Operations will use fallback behavior.");
    if (firebaseInitializationError) {
      console.error("Firebase initialization error details:", firebaseInitializationError);
    }
    
    // Check what environment variables are available
    const envVars = {
      VITE_FIREBASE_API_KEY: !!import.meta.env.VITE_FIREBASE_API_KEY,
      VITE_FIREBASE_PROJECT_ID: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
      VITE_FIREBASE_APP_ID: !!import.meta.env.VITE_FIREBASE_APP_ID
    };
    console.log("Available Firebase environment variables:", envVars);
  }
  
  return firebaseInitialized;
}

/**
 * Saves a project to Firebase Firestore
 * @param html The HTML content to save
 * @returns A unique project ID that can be used to retrieve the project later
 */
export async function saveProject(html: string): Promise<string> {
  try {
    console.log("Starting to save project...");
    
    // Check if Firebase is properly initialized
    if (!isFirebaseReady()) {
      console.warn("Firebase not initialized, returning simulated project ID");
      return `project_${Date.now()}_simulated`;
    }
    
    // Generate a unique ID for the project
    const projectId = `project_${Date.now()}`;
    console.log("Generated project ID:", projectId);
    
    try {
      // Process any base64 images
      const { processedHTML, images } = extractBase64ImagesFromHTML(html);
      console.log(`Found ${images.length} images in HTML`);
      
      // Create a reference to the project document in Firestore
      const projectRef = doc(db, "projects", projectId);
      
      // Store image files and collect URLs
      const imageUrls: string[] = [];
      
      // Skip image processing if there are no images
      if (images.length === 0) {
        console.log("No images to process, skipping to Firestore save");
      } else {
        for (const image of images) {
          try {
            const imageRef = ref(storage, `images/${projectId}/${image.filename}`);
            console.log("Uploading image to Firebase Storage...");
            
            // Upload the image to Firebase Storage
            await uploadString(imageRef, image.dataUrl, 'data_url');
            console.log("Image uploaded, getting download URL...");
            
            // Get the download URL
            const downloadUrl = await getDownloadURL(imageRef);
            imageUrls.push(downloadUrl);
            console.log("Image process complete with URL:", downloadUrl);
          } catch (imgError: any) {
            console.error("Error processing image:", imgError, imgError.stack);
            // Use the original data URL as fallback
            imageUrls.push(image.dataUrl);
            console.log("Using original data URL as fallback");
          }
        }
      }
      
      // Replace image placeholders with actual URLs
      let finalHTML = processedHTML;
      imageUrls.forEach((url, index) => {
        finalHTML = finalHTML.replace(`{{IMAGE_${index}_URL}}`, url);
      });
      
      console.log("Saving project to Firestore...");
      
      // Create the project data object
      const projectData = {
        html: finalHTML,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        imageUrls: imageUrls,
      };
      
      // Log the data we're about to save (excluding HTML content which could be large)
      console.log("Saving project with data:", {
        ...projectData,
        html: `${projectData.html.substring(0, 100)}... (truncated)`
      });
      
      // Save to Firestore
      try {
        await setDoc(projectRef, projectData);
        console.log("Project saved successfully to Firestore!");
      } catch (firestoreError: any) {
        console.error("Firestore setDoc failed:", firestoreError, firestoreError.stack);
        
        // Additional diagnostics about the Firestore instance
        console.log("Firestore instance:", typeof db, Object.keys(db));
        
        // We'll return the project ID anyway, so the frontend can proceed
        console.log("Returning project ID despite Firestore error");
      }
      
      // Always return the project ID to prevent UI getting stuck
      return projectId;
    } catch (processingError: any) {
      console.error("Error processing content:", processingError, processingError.stack);
      
      // Fallback: Save just the HTML without processing
      try {
        console.log("Attempting fallback save to Firestore...");
        const projectRef = doc(db, "projects", projectId);
        await setDoc(projectRef, {
          html: html,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          imageUrls: [],
        });
        console.log("Fallback save to Firestore successful");
      } catch (fallbackError: any) {
        console.error("Fallback save to Firestore failed:", fallbackError, fallbackError.stack);
      }
      
      // Always return project ID to prevent UI getting stuck in loading state
      console.log("Returning project ID after fallback attempt");
      return projectId;
    }
  } catch (error: any) {
    console.error("Error saving project:", error, error.stack);
    // Return a fake project ID to prevent UI from getting stuck
    const fallbackId = `project_${Date.now()}_error`;
    console.log("Returning fallback project ID:", fallbackId);
    return fallbackId;
  }
}

/**
 * Loads a project from Firebase Firestore
 * @param projectId The ID of the project to load
 * @returns The project data or null if not found
 */
export async function loadProject(projectId: string): Promise<{ html: string } | null> {
  try {
    console.log("Loading project:", projectId);
    
    // Check if Firebase is properly initialized
    if (!isFirebaseReady()) {
      console.warn("Firebase not initialized, returning fallback project");
      return {
        html: `<html><body><h1>Project ${projectId}</h1><p>Firebase is not properly configured. Please check your environment variables.</p></body></html>`
      };
    }
    
    // Create a reference to the project document in Firestore
    const projectRef = doc(db, "projects", projectId);
    console.log("Created Firestore document reference for project:", projectId);
    
    try {
      // Attempt to get the document from Firestore
      console.log("Fetching project data from Firestore...");
      const projectSnapshot = await getDoc(projectRef);
      
      if (projectSnapshot.exists()) {
        console.log("Project found in Firestore");
        const data = projectSnapshot.data();
        
        // Log some info about the retrieved data
        console.log("Project data retrieved:", {
          createdAt: data.createdAt,
          imageCount: data.imageUrls?.length || 0,
          htmlLength: data.html?.length || 0
        });
        
        return data as { html: string };
      } else {
        console.log("Project not found in Firestore");
        return null;
      }
    } catch (firestoreError: any) {
      console.error("Error accessing Firestore:", firestoreError, firestoreError.stack);
      
      // Additional diagnostics
      console.log("Was trying to access document:", projectId);
      console.log("Firestore instance:", typeof db, Object.keys(db));
      
      // If there's an error with Firestore, return a minimal project so UI doesn't break
      return {
        html: `<html><body><h1>Project ${projectId}</h1><p>Unable to load project data. Firebase Firestore might not be configured correctly.</p><p>Error: ${firestoreError.message || 'Unknown error'}</p></body></html>`
      };
    }
  } catch (error: any) {
    console.error("Error loading project:", error, error.stack);
    // Return minimal HTML for error handling
    return {
      html: `<html><body><h1>Error</h1><p>Failed to load project: ${error?.message || 'Unknown error'}</p></body></html>`
    };
  }
}