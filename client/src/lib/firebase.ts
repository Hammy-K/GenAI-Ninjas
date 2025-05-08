// Firebase configuration using the Firebase SDK
import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc,
  Timestamp,
  DocumentData, 
  Firestore
} from 'firebase/firestore';
import { getAnalytics, logEvent } from 'firebase/analytics';

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
let firebaseAnalytics: any = null;
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
  
  // Initialize Analytics
  try {
    // getAnalytics() will throw in environments where analytics is not supported (like Node.js)
    firebaseAnalytics = getAnalytics(firebaseApp);
  } catch (analyticsError) {
    console.warn("Firebase Analytics initialization failed. Analytics features will be disabled:", analyticsError);
  }
  
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
 * Saves a project to PostgreSQL database using the backend API
 * @param html The HTML content to save
 * @returns A unique project ID that can be used to retrieve the project later
 */
export async function saveProject(html: string): Promise<string> {
  try {
    console.log("Starting to save project to PostgreSQL database...");
    
    // Process any base64 images
    const { processedHTML, images } = extractBase64ImagesFromHTML(html);
    console.log(`Found ${images.length} images in HTML`);
    
    // Get Firebase UID if available
    let firebaseUid = null;
    if (isFirebaseReady() && firestoreDb) {
      // TODO: We could get user UID here if needed
      console.log("Firebase is configured, could include UID if user is authenticated");
    }
    
    // Save to PostgreSQL via the API
    try {
      console.log("Saving project via API...");
      
      // Send raw HTML content with proper content type
      const response = await fetch('/api/save-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          html: processedHTML,
          firebaseUid // Include Firebase UID if available
        })
      });
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Project saved successfully via API!");
      
      if (!data.projectId) {
        throw new Error("No project ID returned from API");
      }
      
      // Store directly in localStorage without JSON wrapping
      try {
        // Store raw HTML directly for faster loading next time
        localStorage.setItem(`project_${data.projectId}`, processedHTML);
        console.log("Also saved raw HTML to localStorage for faster loading");
      } catch (lsError) {
        console.warn("Could not save to localStorage:", lsError);
      }
      
      return data.projectId;
    } 
    catch (apiError) {
      console.error("API call to save project failed:", apiError);
      
      // Try localStorage as a fallback - directly store HTML without JSON wrapper
      try {
        const fallbackId = `project_${Date.now()}_local`;
        localStorage.setItem(`project_${fallbackId}`, processedHTML);
        console.log("Saved raw HTML to localStorage as fallback");
        return fallbackId;
      } catch (storageError) {
        console.error("LocalStorage fallback failed:", storageError);
        return `project_${Date.now()}_error`;
      }
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
 * Loads a project HTML directly from PostgreSQL database via API
 * @param projectId The ID of the project to load
 * @returns The HTML content directly or null if not found
 */
export async function loadProject(projectId: string): Promise<{ html: string } | null> {
  try {
    console.log("Loading project:", projectId);
    
    // Check for localStorage fallback first
    try {
      const localData = localStorage.getItem(`project_${projectId}`);
      if (localData) {
        console.log("Found project in localStorage");
        try {
          // Try to parse as JSON first (for backward compatibility)
          const parsedData = JSON.parse(localData);
          return parsedData;
        } catch (parseError) {
          // If it's not JSON, it might be raw HTML
          console.log("Project in localStorage is not JSON, treating as raw HTML");
          return { html: localData };
        }
      }
    } catch (localStorageError) {
      console.warn("Error checking localStorage:", localStorageError);
    }
    
    // Load from PostgreSQL via API endpoint
    console.log("Fetching project from PostgreSQL via API...");
    
    try {
      // Get raw HTML content directly
      const response = await fetch(`/api/load-project/${projectId}`, {
        headers: {
          'Accept': 'text/html, application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log("Project not found in PostgreSQL");
          return null;
        }
        throw new Error(`API returned status ${response.status}`);
      }
      
      // Check content type to determine how to process the response
      const contentType = response.headers.get('Content-Type') || '';
      
      // If HTML content type, get text directly
      if (contentType.includes('text/html')) {
        const htmlContent = await response.text();
        console.log("HTML content loaded directly (not wrapped in JSON)");
        return { html: htmlContent };
      }
      
      // Otherwise try JSON (for backward compatibility)
      const projectData = await response.json();
      console.log("Project loaded via JSON response");
      
      if (!projectData || !projectData.html) {
        throw new Error("Invalid project data structure from API");
      }
      
      // Log info about the retrieved data
      console.log("Project data retrieved with HTML length:", projectData.html?.length || 0);
      
      return { html: projectData.html };
    } 
    catch (apiError) {
      console.error("API call to load project failed:", apiError);
      
      // Secondary attempt with different content type
      try {
        console.log("Trying alternate API response format...");
        const altResponse = await fetch(`/api/load-project/${projectId}`, {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (altResponse.ok) {
          const jsonData = await altResponse.json();
          if (jsonData && jsonData.html) {
            return { html: jsonData.html };
          }
        }
      } catch (altError) {
        console.error("Alternate API format failed:", altError);
      }
      
      // Return a minimal HTML structure in case of error
      return {
        html: `<html><body><h1>Project ${projectId}</h1><p>Unable to load project data. Database might not be available.</p><p>Error: ${apiError instanceof Error ? apiError.message : 'Unknown error'}</p></body></html>`
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

/**
 * Track student progress by logging completion of a specific step/stage
 * @param stageName The name of the stage completed (e.g., 'discovery', 'html_generator')
 * @param stepName The specific step within the stage (e.g., 'started', 'completed')
 * @param additionalData Optional additional data to log with the event
 */
export function trackStageProgress(
  stageName: string, 
  stepName: string, 
  additionalData: Record<string, any> = {}
): void {
  try {
    if (!isFirebaseReady() || !firebaseApp || !firebaseAnalytics) {
      console.log(`[Analytics Tracking Disabled] Stage Progress: ${stageName}/${stepName}`);
      return;
    }

    // Log the event to Firebase Analytics
    const eventName = `stage_${stageName}_${stepName}`;
    logEvent(firebaseAnalytics, eventName, {
      stage_name: stageName,
      step_name: stepName,
      timestamp: new Date().toISOString(),
      ...additionalData
    });

    console.log(`[Analytics] Tracked stage progress: ${eventName}`);
  } catch (error) {
    console.warn('[Analytics] Failed to track stage progress:', error);
  }
}

/**
 * Log a prompt sent to OpenAI for analytics purposes
 * @param promptType The type of prompt (e.g., 'html_generation', 'image_generation')
 * @param promptContent The actual prompt content sent to OpenAI
 * @param additionalData Optional additional context data
 * @returns The logId if successful
 */
export async function logPromptToFirestore(
  promptType: string,
  promptContent: string,
  additionalData: Record<string, any> = {}
): Promise<string | null> {
  try {
    if (!isFirebaseReady() || !firestoreDb) {
      console.log(`[Prompt Logging Disabled] ${promptType}`);
      return null;
    }

    // Track in analytics
    if (firebaseAnalytics) {
      logEvent(firebaseAnalytics, 'prompt_sent', {
        prompt_type: promptType,
        content_length: promptContent.length,
        timestamp: new Date().toISOString()
      });
    }

    // Log to Firestore
    const promptsCollection = collection(firestoreDb, 'prompts');
    
    const promptData = {
      type: promptType,
      content: promptContent,
      timestamp: Timestamp.now(),
      metadata: {
        ...additionalData,
        userAgent: navigator.userAgent,
      }
    };
    
    const docRef = await addDoc(promptsCollection, promptData);
    console.log(`[Prompt Logged] ${promptType} with ID: ${docRef.id}`);
    
    return docRef.id;
  } catch (error) {
    console.warn('[Prompt Logging] Failed to log prompt:', error);
    return null;
  }
}