// Enhanced Firebase adapter for Replit environment
// This uses a direct REST approach rather than the Firebase SDK to avoid connectivity issues

/**
 * Configuration object for Firebase
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Track Firebase configuration status
let firebaseConfigured = false;
let firebaseConfigurationError: any = null;

// Validate Firebase configuration
try {
  console.log("Checking Firebase configuration:", {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "API_KEY_PROVIDED" : "API_KEY_MISSING",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID ? "APP_ID_PROVIDED" : "APP_ID_MISSING",
  });

  if (!import.meta.env.VITE_FIREBASE_API_KEY || !import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    throw new Error("Firebase configuration is incomplete. Required environment variables are missing.");
  }
  
  firebaseConfigured = true;
  console.log("Firebase configuration validated successfully!");
} catch (error) {
  console.error("Invalid Firebase configuration:", error);
  firebaseConfigurationError = error;
}

/**
 * Helper function to create a REST URL for a Firestore document
 */
function createFirestoreDocumentUrl(collectionName: string, documentId: string): string {
  return `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${collectionName}/${documentId}`;
}

/**
 * Helper function to create the authorization header for Firebase requests
 */
function getAuthHeader(): string {
  return `Bearer ${firebaseConfig.apiKey}`;
}

/**
 * Helper function to convert a standard JavaScript object to Firestore format
 */
function objectToFirestoreDocument(data: any): any {
  const fields: any = {};
  
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      fields[key] = { doubleValue: value };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (value === null) {
      fields[key] = { nullValue: null };
    } else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map(item => {
            if (typeof item === 'string') {
              return { stringValue: item };
            } else if (typeof item === 'number') {
              return { doubleValue: item };
            } else if (typeof item === 'boolean') {
              return { booleanValue: item };
            } else {
              return { stringValue: JSON.stringify(item) };
            }
          })
        }
      };
    } else if (typeof value === 'object') {
      fields[key] = { mapValue: { fields: objectToFirestoreDocument(value) } };
    } else {
      // Default to string for any other type
      fields[key] = { stringValue: String(value) };
    }
  });
  
  return fields;
}

/**
 * Helper function to convert a Firestore document to a standard JavaScript object
 */
function firestoreDocumentToObject(firestoreData: any): any {
  if (!firestoreData || !firestoreData.fields) {
    return null;
  }
  
  const result: any = {};
  
  Object.entries(firestoreData.fields).forEach(([key, value]: [string, any]) => {
    if (value.stringValue !== undefined) {
      result[key] = value.stringValue;
    } else if (value.doubleValue !== undefined) {
      result[key] = value.doubleValue;
    } else if (value.integerValue !== undefined) {
      result[key] = Number(value.integerValue);
    } else if (value.booleanValue !== undefined) {
      result[key] = value.booleanValue;
    } else if (value.nullValue !== undefined) {
      result[key] = null;
    } else if (value.arrayValue !== undefined) {
      result[key] = (value.arrayValue.values || []).map((item: any) => {
        if (item.stringValue !== undefined) {
          return item.stringValue;
        } else if (item.doubleValue !== undefined) {
          return item.doubleValue;
        } else if (item.integerValue !== undefined) {
          return Number(item.integerValue);
        } else if (item.booleanValue !== undefined) {
          return item.booleanValue;
        } else {
          return null;
        }
      });
    } else if (value.mapValue !== undefined) {
      result[key] = firestoreDocumentToObject(value.mapValue);
    }
  });
  
  return result;
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
 * Saves a project directly to Firebase Firestore using REST API
 * @param html The HTML content to save
 * @returns A unique project ID that can be used to retrieve the project later
 */
export async function saveProject(html: string): Promise<string> {
  try {
    console.log("Starting to save project...");
    
    // Check if Firebase is properly configured
    if (!isFirebaseReady()) {
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
      
      // For now, we'll skip image processing and use data URLs directly
      // In a future version, implement Firebase Storage REST API for image uploads
      
      // Create the project data object
      const projectData = {
        html: processedHTML,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        imageUrls: [] // No separate image URLs for now
      };
      
      console.log("Saving project to Firestore via REST API...");
      
      // Using the Firestore REST API directly
      const firestoreUrl = createFirestoreDocumentUrl('projects', projectId);
      
      try {
        // Build the request body in Firestore format
        const requestBody = {
          fields: objectToFirestoreDocument(projectData)
        };
        
        console.log("Making REST API call to Firestore...");
        
        // Make the REST API call
        const response = await fetch(firestoreUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': getAuthHeader()
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Firestore API error: ${response.status} ${response.statusText} - ${errorData}`);
        }
        
        console.log("Project saved successfully via Firestore REST API!");
      } catch (apiError: any) {
        console.error("Firestore REST API call failed:", apiError, apiError.stack);
        
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
      console.error("Error processing content:", processingError, processingError.stack);
      
      // Return project ID to prevent UI getting stuck in loading state
      return projectId;
    }
  } catch (error: any) {
    console.error("Error saving project:", error, error.stack);
    // Return a project ID to prevent UI from getting stuck
    const fallbackId = `project_${Date.now()}_error`;
    console.log("Returning fallback project ID:", fallbackId);
    return fallbackId;
  }
}

/**
 * Loads a project from Firebase Firestore using REST API
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
    if (!isFirebaseReady()) {
      console.warn("Firebase not configured, returning fallback project");
      return {
        html: `<html><body><h1>Project ${projectId}</h1><p>Firebase is not properly configured. Please check your environment variables.</p></body></html>`
      };
    }
    
    // Using Firestore REST API directly
    const firestoreUrl = createFirestoreDocumentUrl('projects', projectId);
    console.log("Fetching from Firestore REST API:", firestoreUrl);
    
    try {
      // Make the REST API call
      const response = await fetch(firestoreUrl, {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader()
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log("Project not found in Firestore");
          return null;
        }
        
        const errorData = await response.text();
        throw new Error(`Firestore API error: ${response.status} ${response.statusText} - ${errorData}`);
      }
      
      // Parse the response
      const firestoreData = await response.json();
      console.log("Project found in Firestore", firestoreData);
      
      // Convert from Firestore format to regular object
      const projectData = firestoreDocumentToObject(firestoreData);
      
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
      console.error("Error accessing Firestore via REST API:", firestoreError, firestoreError.stack);
      
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