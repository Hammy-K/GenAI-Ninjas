const fs = require('fs');
const path = require('path');

// Read the file content
const filePath = 'server/services/assistant.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Find all logAssistantInteraction calls that don't have firebaseUid
const regex = /logAssistantInteraction\(\{[^}]*?sessionId[^}]*?threadId[^}]*?\}\)/gs;
const matches = content.match(regex);

if (matches) {
  // Replace each match by adding firebaseUid
  matches.forEach(match => {
    // Check if it already has firebaseUid
    if (!match.includes('firebaseUid:')) {
      // Insert firebaseUid at the end, before the closing parenthesis
      const replacement = match.replace(/}\)$/, ', firebaseUid: firebaseUid || null})');
      content = content.replace(match, replacement);
    }
  });

  // Write the updated content back to the file
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated logAssistantInteraction calls with firebaseUid');
} else {
  console.log('No matches found');
}
