// Script to extract facilitators from the uploaded file and upload them
const fs = require('fs');

// Read the file
const filePath = 'attached_assets/Upload Facilitator Credentials_1758632186000.json';
let fileContent = fs.readFileSync(filePath, 'utf8');

// Extract JSON part (skip curl headers, get data after -d ')
const jsonStart = fileContent.indexOf("'facilitators':");
if (jsonStart === -1) {
    // Try alternative format
    const altStart = fileContent.indexOf('"facilitators": [');
    if (altStart !== -1) {
        const beforeJson = fileContent.substring(0, altStart);
        const openBrace = beforeJson.lastIndexOf('{');
        if (openBrace !== -1) {
            const jsonPart = fileContent.substring(openBrace);
            // Find the closing brace
            let braceCount = 0;
            let endPos = openBrace;
            for (let i = openBrace; i < fileContent.length; i++) {
                if (fileContent[i] === '{') braceCount++;
                if (fileContent[i] === '}') braceCount--;
                if (braceCount === 0) {
                    endPos = i;
                    break;
                }
            }
            const cleanJson = fileContent.substring(openBrace, endPos + 1);
            console.log('Extracted JSON:', cleanJson.substring(0, 200) + '...');
        }
    }
} else {
    console.log('Found facilitators at position:', jsonStart);
}

// For now, let's just get the facilitator count
const nameMatches = fileContent.match(/"name":\s*"/g);
console.log(`Found ${nameMatches ? nameMatches.length : 0} facilitators`);