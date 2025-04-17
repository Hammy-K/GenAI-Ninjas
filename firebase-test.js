// Firebase Test Script
// Run with: node firebase-test.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDoc } = require('firebase/firestore');

// Make sure to set these environment variables before running the script
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
};

async function testFirebase() {
  console.log('Starting Firebase test...');
  
  try {
    console.log('Firebase configuration:', {
      apiKey: firebaseConfig.apiKey ? 'API_KEY_PROVIDED' : 'API_KEY_MISSING',
      projectId: firebaseConfig.projectId,
      appId: firebaseConfig.appId ? 'APP_ID_PROVIDED' : 'APP_ID_MISSING',
    });
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    console.log('Firebase app initialized');
    
    // Initialize Firestore
    const db = getFirestore(app);
    console.log('Firestore initialized');
    
    // Create a test document ID
    const testDocId = `test_${Date.now()}`;
    console.log(`Creating test document with ID: ${testDocId}`);
    
    // Create a document reference
    const testDocRef = doc(db, 'projects', testDocId);
    
    // Create a test document
    await setDoc(testDocRef, {
      html: '<html><body><h1>Test Project</h1><p>This is a test project created by the Firebase test script.</p></body></html>',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log('Test document created successfully');
    
    // Retrieve the document
    const docSnap = await getDoc(testDocRef);
    
    if (docSnap.exists()) {
      console.log('Test document retrieved successfully');
      console.log('Document data:', docSnap.data());
    } else {
      console.error('Failed to retrieve test document');
    }
    
    console.log('Firebase test completed successfully');
  } catch (error) {
    console.error('Firebase test failed:', error);
  }
}

testFirebase();