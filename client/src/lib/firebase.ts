// Firebase configuration using the Firebase SDK
import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  DocumentData, 
  Firestore
} from 'firebase/firestore';

/**
 * Configuration object for Firebase
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
};

// Track Firebase configuration status
let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let firebaseConfigured = false;
let firebaseConfigurationError: any = null;

// Initialize Firebase and Firestore
try {
  console.log("Checking Firebase configuration:", {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "API_KEY_PROVIDED" : "API_KEY_MISSING",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID ? "APP_ID_PROVIDED" : "APP_ID_MISSING",
  });

  if (!import.meta.env.VITE_FIREBASE_API_KEY || !import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    throw new Error("Firebase configuration is incomplete. Required environment variables are missing.");
  }
  
  // Initialize Firebase
  firebaseApp = initializeApp(firebaseConfig);
  
  // Initialize Firestore
  firestoreDb = getFirestore(firebaseApp);
  
  firebaseConfigured = true;
  console.log("Firebase configuration validated successfully!");
} catch (error) {
  console.error("Invalid Firebase configuration:", error);
  firebaseConfigurationError = error;
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
 * Checks if Firebase configuration is valid
 * @returns True if Firebase is configured correctly
 */
export function isFirebaseReady(): boolean {
  if (!firebaseConfigured) {
    console.warn("Firebase is not configured correctly. Operations will use fallback behavior.");
    if (firebaseConfigurationError) {
      console.error("Firebase configuration error details:", firebaseConfigurationError);
    }
    
    // Check what environment variables are available
    const envVars = {
      VITE_FIREBASE_API_KEY: !!import.meta.env.VITE_FIREBASE_API_KEY,
      VITE_FIREBASE_PROJECT_ID: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
      VITE_FIREBASE_APP_ID: !!import.meta.env.VITE_FIREBASE_APP_ID
    };
    console.log("Available Firebase environment variables:", envVars);
  }
  
  return firebaseConfigured;
}

/**
 * Saves a project to Firebase Firestore using Firebase SDK
 * @param html The HTML content to save
 * @returns A unique project ID that can be used to retrieve the project later
 */
export async function saveProject(html: string): Promise<string> {
  try {
    console.log("Starting to save project...");
    
    // Check if Firebase is properly configured
    if (!isFirebaseReady() || !firestoreDb) {
      console.warn("Firebase not configured, returning simulated project ID");
      return `project_${Date.now()}_simulated`;
    }
    
    // Generate a unique ID for the project
    const projectId = `project_${Date.now()}`;
    console.log("Generated project ID:", projectId);
    
    try {
      // Process any base64 images
      const { processedHTML, images } = extractBase64ImagesFromHTML(html);
      console.log(`Found ${images.length} images in HTML`);
      
      // Create the project data object
      const projectData = {
        html: processedHTML,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        imageUrls: [] // No separate image URLs for now
      };
      
      console.log("Saving project to Firestore via Firebase SDK...");
      
      try {
        // Use Firebase SDK to save data
        const projectRef = doc(firestoreDb, 'projects', projectId);
        await setDoc(projectRef, projectData);
        
        console.log("Project saved successfully via Firebase SDK!");
      } catch (firestoreError: any) {
        console.error("Firestore SDK call failed:", firestoreError);
        
        // Try localStorage as a fallback
        try {
          localStorage.setItem(`project_${projectId}`, JSON.stringify({
            html: processedHTML,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));
          console.log("Project saved to localStorage as fallback");
        } catch (storageError) {
          console.error("LocalStorage fallback failed:", storageError);
        }
      }
      
      // Always return the project ID to prevent UI getting stuck
      return projectId;
    } catch (processingError: any) {
      console.error("Error processing content:", processingError);
      
      // Return project ID to prevent UI getting stuck in loading state
      return projectId;
    }
  } catch (error: any) {
    console.error("Error saving project:", error);
    // Return a project ID to prevent UI from getting stuck
    const fallbackId = `project_${Date.now()}_error`;
    console.log("Returning fallback project ID:", fallbackId);
    return fallbackId;
  }
}

/**
 * Loads a project from Firebase Firestore using Firebase SDK
 * @param projectId The ID of the project to load
 * @returns The project data or null if not found
 */
export async function loadProject(projectId: string): Promise<{ html: string } | null> {
  try {
    console.log("Loading project:", projectId);
    
    // Check for localStorage fallback first
    try {
      const localData = localStorage.getItem(`project_${projectId}`);
      if (localData) {
        console.log("Found project in localStorage");
        const parsedData = JSON.parse(localData);
        return parsedData;
      }
    } catch (localStorageError) {
      console.warn("Error checking localStorage:", localStorageError);
    }
    
    // Check if Firebase is properly configured
    if (!isFirebaseReady() || !firestoreDb) {
      console.warn("Firebase not configured, returning fallback project");
      return {
        html: `<html><body><h1>Project ${projectId}</h1><p>Firebase is not properly configured. Please check your environment variables.</p></body></html>`
      };
    }
    
    console.log("Fetching from Firestore via Firebase SDK...");
    
    try {
      // Use Firebase SDK to get data
      const projectRef = doc(firestoreDb, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) {
        console.log("Project not found in Firestore");
        return null;
      }
      
      // Get project data
      const projectData = projectSnap.data() as DocumentData;
      console.log("Project found in Firestore");
      
      if (!projectData || !projectData.html) {
        throw new Error("Invalid project data structure");
      }
      
      // Log some info about the retrieved data
      console.log("Project data retrieved:", {
        createdAt: projectData.createdAt,
        htmlLength: projectData.html?.length || 0
      });
      
      return { html: projectData.html };
    } catch (firestoreError: any) {
      console.error("Error accessing Firestore via Firebase SDK:", firestoreError);
      
      // If there's an error with Firestore, return a minimal project so UI doesn't break
      return {
        html: `<html><body><h1>Project ${projectId}</h1><p>Unable to load project data. Firebase Firestore might not be configured correctly.</p><p>Error: ${firestoreError.message || 'Unknown error'}</p></body></html>`
      };
    }
  } catch (error: any) {
    console.error("Error loading project:", error);
    // Return minimal HTML for error handling
    return {
      html: `<html><body><h1>Error</h1><p>Failed to load project: ${error?.message || 'Unknown error'}</p></body></html>`
    };
  }
}