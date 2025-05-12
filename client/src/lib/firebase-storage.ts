import { initializeApp } from "firebase/app";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  StorageReference,
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

/**
 * Upload an image to Firebase Storage from a URL
 * @param imageUrl URL of the image to download and upload
 * @param studentName Name of the student who created the image
 * @param missionNumber Mission number where image was created
 * @returns Promise resolving to the Firebase Storage URL
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  studentName: string,
  missionNumber: number
): Promise<string> {
  try {
    // First, fetch the image from the OpenAI URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
    }
    
    // Convert the image to blob
    const imageBlob = await response.blob();
    
    // Create a unique filename with timestamp and mission info
    const timestamp = new Date().getTime();
    const uniqueId = uuidv4().substring(0, 8);
    const safeStudentName = studentName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `gallery/${safeStudentName}_mission${missionNumber}_${timestamp}_${uniqueId}.jpg`;
    
    // Create a storage reference
    const storageRef = ref(storage, filename);
    
    // Upload the image blob to Firebase Storage
    const uploadResult = await uploadBytes(storageRef, imageBlob, {
      contentType: imageBlob.type,
      customMetadata: {
        studentName,
        missionNumber: missionNumber.toString(),
        uploadedAt: new Date().toISOString(),
      },
    });
    
    // Get the public URL
    const publicUrl = await getDownloadURL(uploadResult.ref);
    console.log(`Image uploaded to Firebase Storage: ${publicUrl}`);
    
    return publicUrl;
  } catch (error) {
    console.error("Error uploading image to Firebase Storage:", error);
    throw error;
  }
}

/**
 * Upload a project screenshot to Firebase Storage
 * @param imageBlob The image blob to upload
 * @param projectId The project ID to use as the filename
 * @returns Promise resolving to the Firebase Storage URL
 */
export async function uploadProjectScreenshot(
  imageBlob: Blob,
  projectId: string
): Promise<string> {
  try {
    // Create a filename based on the project ID
    const filename = `screenshots/${projectId}.png`;
    
    // Create a storage reference
    const storageRef = ref(storage, filename);
    
    // Upload the image blob to Firebase Storage
    const uploadResult = await uploadBytes(storageRef, imageBlob, {
      contentType: 'image/png',
      customMetadata: {
        projectId,
        uploadedAt: new Date().toISOString(),
      },
    });
    
    // Get the public URL
    const publicUrl = await getDownloadURL(uploadResult.ref);
    console.log(`Project screenshot uploaded to Firebase Storage: ${publicUrl}`);
    
    return publicUrl;
  } catch (error) {
    console.error("Error uploading project screenshot to Firebase Storage:", error);
    throw error;
  }
}

/**
 * List all images in the gallery folder
 * @param limit Maximum number of images to return
 * @param startAfter Reference to start after for pagination
 * @returns Promise resolving to an array of image references and download URLs
 */
export async function listGalleryImages(
  limit: number = 20,
  startAfter?: StorageReference
): Promise<{ ref: StorageReference; url: string }[]> {
  try {
    const galleryRef = ref(storage, "gallery");
    // Note: Firebase Storage doesn't support limit/pagination via the JS SDK
    // We'll need to handle pagination client-side
    const result = await listAll(galleryRef);
    
    // Get download URLs for each image
    const imagePromises = result.items.map(async (itemRef) => {
      const url = await getDownloadURL(itemRef);
      return { ref: itemRef, url };
    });
    
    const images = await Promise.all(imagePromises);
    
    // Sort by name (which includes timestamp) in descending order
    const sortedImages = images.sort((a, b) => 
      b.ref.name.localeCompare(a.ref.name)
    );
    
    // If we have a startAfter reference, find its index and slice
    let startIndex = 0;
    if (startAfter) {
      const startAfterIndex = sortedImages.findIndex(
        (img) => img.ref.fullPath === startAfter.fullPath
      );
      if (startAfterIndex !== -1) {
        startIndex = startAfterIndex + 1;
      }
    }
    
    // Return the requested "page" of results
    return sortedImages.slice(startIndex, startIndex + limit);
  } catch (error) {
    console.error("Error listing gallery images:", error);
    throw error;
  }
}