/**
 * Bulk Upload Script for HTML Projects
 * 
 * This script reads from projects.csv and uploads each project to the database
 * Preserves existing document IDs, creation dates, and user IDs from the CSV
 */
import fs from 'fs';
import path from 'path';
import { createReadStream } from 'fs';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import axios from 'axios';

// Get current directory with ESM support
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// For Replit environment - ignore SSL certificate issues
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Configuration
const API_URL = 'http://localhost:5000/api/projects/save-project';
const CSV_FILE_PATH = path.join(__dirname, 'projects.csv');
const OUTPUT_FILE = path.join(__dirname, 'upload_results.txt');
const WEBSITE_URL = 'https://noongenai.replit.app'; // Update with your actual domain

// Initialize output file
fs.writeFileSync(OUTPUT_FILE, '# HTML Project Upload Results\n\n');
fs.appendFileSync(OUTPUT_FILE, `Started upload at: ${new Date().toISOString()}\n\n`);
fs.appendFileSync(OUTPUT_FILE, 'ProjectID | Status | URL\n');
fs.appendFileSync(OUTPUT_FILE, '--------- | ------ | ---\n');

// Counter for tracking upload progress
let totalProjects = 0;
let successCount = 0;
let errorCount = 0;

// Function to save a project to the database
async function saveProject(projectData) {
  try {
    // Ensure we have the minimum required data
    if (!projectData.html || !projectData['Document ID']) {
      throw new Error('Missing required fields: html or Document ID');
    }

    // Prepare the request payload
    const payload = {
      html: projectData.html,
      projectId: projectData['Document ID'], // Use existing Document ID as projectId
      studentId: projectData.user_id || '9999999',  // Use user_id from CSV or default to a valid student ID
    };

    // Optional: Add Firebase UID if available
    if (projectData.firebase_uid) {
      payload.firebaseUid = projectData.firebase_uid;
    }

    // Optional: Add timestamps if available (these might be handled by the server)
    if (projectData.createdAt) {
      payload.createdAt = projectData.createdAt;
    }
    if (projectData.updatedAt) {
      payload.updatedAt = projectData.updatedAt;
    }

    // Call the API to save the project with the complete payload
    console.log(`📤 Uploading project ${projectData['Document ID']}...`);
    const response = await axios.post(API_URL, payload);

    // Get the project ID from the response
    const projectId = response.data.projectId || projectData['Document ID'];
    
    // Create the URL for this project
    const projectUrl = `${WEBSITE_URL}/project/${projectId}`;
    
    // Log success
    console.log(`✅ Project uploaded with ID: ${projectId}`);
    fs.appendFileSync(OUTPUT_FILE, `${projectId} | Success | ${projectUrl}\n`);
    
    return { success: true, projectId, url: projectUrl };
  } catch (error) {
    // Handle and log errors
    const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
    console.error(`❌ Error uploading project: ${errorMessage}`);
    
    // Add error entry to output file
    fs.appendFileSync(OUTPUT_FILE, `${projectData.document_id || 'unknown'} | Error | ${errorMessage}\n`);
    
    return { success: false, error: errorMessage };
  }
}

// Main function to process the CSV
async function processCSV() {
  console.log(`🔍 Reading CSV file from ${CSV_FILE_PATH}...`);
  
  // Check if CSV file exists
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`❌ Error: CSV file not found at ${CSV_FILE_PATH}`);
    process.exit(1);
  }

  const projects = [];
  
  // Parse the CSV file
  createReadStream(CSV_FILE_PATH)
    .pipe(csv())
    .on('data', (row) => {
      projects.push(row);
      totalProjects++;
    })
    .on('end', async () => {
      console.log(`📊 Found ${totalProjects} projects in CSV file`);
      
      // Process each project sequentially
      for (const [index, project] of projects.entries()) {
        console.log(`\n[${index + 1}/${totalProjects}] Processing project ${project.document_id || index}`);
        
        try {
          const result = await saveProject(project);
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Unexpected error processing project: ${error.message}`);
          errorCount++;
        }
        
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Log final summary
      console.log(`\n✅ Upload complete! Successfully uploaded ${successCount} of ${totalProjects} projects.`);
      if (errorCount > 0) {
        console.log(`❌ ${errorCount} projects had errors. Check ${OUTPUT_FILE} for details.`);
      }
      
      // Add summary to output file
      fs.appendFileSync(OUTPUT_FILE, `\n## Summary\n`);
      fs.appendFileSync(OUTPUT_FILE, `- Total projects: ${totalProjects}\n`);
      fs.appendFileSync(OUTPUT_FILE, `- Successfully uploaded: ${successCount}\n`);
      fs.appendFileSync(OUTPUT_FILE, `- Failed uploads: ${errorCount}\n`);
      fs.appendFileSync(OUTPUT_FILE, `\nCompleted at: ${new Date().toISOString()}\n`);
    });
}

// Run the script
processCSV().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});