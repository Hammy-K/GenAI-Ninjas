import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

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

// Function to save project to Firebase
export async function saveProject(html: string): Promise<string> {
  try {
    // Process any base64 images
    const { processedHTML, images } = extractBase64ImagesFromHTML(html);
    
    // Generate a unique ID for the project
    const projectId = `project_${Date.now()}`;
    const projectRef = doc(db, "projects", projectId);
    
    // Store image files and collect URLs
    const imageUrls: string[] = [];
    
    for (const image of images) {
      const imageRef = ref(storage, `images/${projectId}/${image.filename}`);
      
      // Upload the image to Firebase Storage
      await uploadString(imageRef, image.dataUrl, 'data_url');
      
      // Get the download URL
      const downloadUrl = await getDownloadURL(imageRef);
      imageUrls.push(downloadUrl);
    }
    
    // Replace image placeholders with actual URLs
    let finalHTML = processedHTML;
    imageUrls.forEach((url, index) => {
      finalHTML = finalHTML.replace(`{{IMAGE_${index}_URL}}`, url);
    });
    
    // Save the project data to Firestore
    await setDoc(projectRef, {
      html: finalHTML,
      createdAt: new Date().toISOString(),
      imageUrls: imageUrls,
    });
    
    return projectId;
  } catch (error) {
    console.error("Error saving project:", error);
    throw error;
  }
}

// Function to load a project from Firebase
export async function loadProject(projectId: string): Promise<{ html: string } | null> {
  try {
    const projectRef = doc(db, "projects", projectId);
    const projectSnapshot = await getDoc(projectRef);
    
    if (projectSnapshot.exists()) {
      return projectSnapshot.data() as { html: string };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error loading project:", error);
    throw error;
  }
}