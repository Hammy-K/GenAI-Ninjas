const fs = require('fs');
const axios = require('axios');
const csv = require('csv-parser');

// Configuration - EDIT THESE VALUES
const API_URL = 'http://localhost:5000/api/projects/save-project';
const CSV_FILE_PATH = 'projects.csv';
const DEFAULT_USER_ID = '123'; // Used if userId not in CSV

// Create output file for URLs
const outputFile = 'project_urls.txt';
fs.writeFileSync(outputFile, '# Project URLs\n\n');

// Process the CSV file
console.log('Starting bulk upload...');
fs.createReadStream(CSV_FILE_PATH)
  .pipe(csv())
  .on('data', async (row) => {
    try {
      // Extract data (HTML content and userId)
      const html = row.html;
      const userId = row.userId || DEFAULT_USER_ID;
      
      // Skip if no HTML content
      if (!html) {
        console.log('Skipping row - no HTML content');
        return;
      }
      
      // Call the API to save project
      console.log(`Uploading project with userId: ${userId}`);
      const response = await axios.post(API_URL, {
        html,
        userId
      });
      
      // Get the project ID from response
      const projectId = response.data.projectId;
      
      // Create the URL
      const url = `${process.env.WEBSITE_URL || 'https://yourdomain.com'}/project/${projectId}`;
      
      // Log success
      console.log(`✅ Project uploaded! URL: ${url}`);
      
      // Save to output file
      fs.appendFileSync(outputFile, `${url}\n`);
      
    } catch (error) {
      console.error(`❌ Error uploading project: ${error.message}`);
    }
  })
  .on('end', () => {
    console.log(`Bulk upload complete! URLs saved to ${outputFile}`);
  });