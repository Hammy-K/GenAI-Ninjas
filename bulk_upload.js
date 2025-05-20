const fs = require('fs');
const path = require('path');
const axios = require('axios');
const csv = require('csv-parser');

// Configuration
const API_URL = 'http://localhost:5000/api/projects/save-project';
const CSV_FILE_PATH = 'projects.csv';
const USER_ID = '123'; // Default user ID if not in CSV

// Results tracking
const results = {
  success: 0,
  failed: 0,
  projectIds: []
};

// Function to save a project
async function saveProject(html, userId = USER_ID) {
  try {
    const response = await axios.post(API_URL, {
      html,
      userId,
      firebaseUid: userId // Using same ID for both fields
    });
    
    console.log(`✅ Project saved with ID: ${response.data.projectId}`);
    results.success++;
    results.projectIds.push(response.data.projectId);
    return response.data.projectId;
  } catch (error) {
    console.error(`❌ Failed to save project: ${error.message}`);
    results.failed++;
    return null;
  }
}

// Main function to process the CSV
async function processCSV() {
  console.log(`Starting bulk upload from ${CSV_FILE_PATH}...`);
  
  const rows = [];
  
  // Read the CSV file
  fs.createReadStream(CSV_FILE_PATH)
    .pipe(csv())
    .on('data', (row) => rows.push(row))
    .on('end', async () => {
      console.log(`Found ${rows.length} projects to upload.`);
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        console.log(`Processing project ${i+1}/${rows.length}`);
        
        // Extract data from CSV row
        const html = row.html || '';
        const userId = row.userId || USER_ID;
        
        if (!html) {
          console.warn(`⚠️ Skipping row ${i+1} - no HTML content.`);
          results.failed++;
          continue;
        }
        
        // Upload the project
        await saveProject(html, userId);
      }
      
      // Print summary
      console.log('\n===== UPLOAD SUMMARY =====');
      console.log(`Total projects: ${rows.length}`);
      console.log(`Successfully uploaded: ${results.success}`);
      console.log(`Failed: ${results.failed}`);
      
      // Save project IDs to a file for reference
      fs.writeFileSync('uploaded_projects.json', JSON.stringify(results, null, 2));
      console.log('Project IDs saved to uploaded_projects.json');
    });
}

// Run the script
processCSV();