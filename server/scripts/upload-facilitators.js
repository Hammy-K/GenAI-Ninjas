#!/usr/bin/env node

/**
 * SYSTEMATIC FACILITATOR CREDENTIALS UPLOAD SCRIPT
 * 
 * This script validates, normalizes, and uploads facilitator credentials
 * from the attached JSON file in a systematic, batched approach with
 * proper error handling and verification.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  BATCH_SIZE: 10,
  API_BASE_URL: 'https://noongenai.replit.app/api/video-flow/admin',
  INPUT_FILE: path.join(__dirname, '..', '..', 'attached_assets', 'Upload Facilitator Credentials_1758638329864.json'),
  DRY_RUN: process.argv.includes('--dry-run'),
  VERBOSE: process.argv.includes('--verbose'),
};

console.log('🔧 SYSTEMATIC FACILITATOR UPLOAD TOOL');
console.log(`📁 Input file: ${CONFIG.INPUT_FILE}`);
console.log(`🔄 Mode: ${CONFIG.DRY_RUN ? 'DRY RUN' : 'LIVE UPLOAD'}`);
console.log(`📦 Batch size: ${CONFIG.BATCH_SIZE}`);
console.log('─'.repeat(60));

/**
 * Validate facilitator structure and credentials
 */
function validateFacilitator(facilitator, index) {
  const errors = [];
  
  // Required fields validation
  if (!facilitator.name || typeof facilitator.name !== 'string' || facilitator.name.trim() === '') {
    errors.push(`Missing or invalid name`);
  }
  
  if (!facilitator.projectId || typeof facilitator.projectId !== 'string') {
    errors.push(`Missing or invalid projectId`);
  }
  
  if (!facilitator.location || typeof facilitator.location !== 'string') {
    errors.push(`Missing or invalid location`);
  }
  
  // Service account validation
  if (!facilitator.serviceAccountJson) {
    errors.push(`Missing serviceAccountJson`);
  } else {
    const serviceAccount = facilitator.serviceAccountJson;
    
    // Required service account fields
    const requiredFields = ['type', 'project_id', 'private_key', 'client_email', 'token_uri'];
    for (const field of requiredFields) {
      if (!serviceAccount[field]) {
        errors.push(`Missing serviceAccountJson.${field}`);
      }
    }
    
    // Validate project_id matches projectId
    if (serviceAccount.project_id && serviceAccount.project_id !== facilitator.projectId) {
      errors.push(`serviceAccountJson.project_id doesn't match projectId`);
    }
    
    // Validate private key format
    if (serviceAccount.private_key && !serviceAccount.private_key.includes('BEGIN PRIVATE KEY')) {
      errors.push(`Invalid private_key format`);
    }
  }
  
  return errors.length > 0 ? errors : null;
}

/**
 * Normalize facilitator data for upload
 */
function normalizeFacilitator(facilitator) {
  return {
    name: facilitator.name.trim(),
    projectId: facilitator.projectId.trim(),
    location: facilitator.location.trim() || 'us-central1',
    serviceAccountJson: facilitator.serviceAccountJson, // Keep as object - API will handle
  };
}

/**
 * Load and validate JSON file
 */
function loadFacilitators() {
  console.log('📖 Loading facilitator credentials file...');
  
  if (!fs.existsSync(CONFIG.INPUT_FILE)) {
    throw new Error(`❌ Input file not found: ${CONFIG.INPUT_FILE}`);
  }
  
  let rawData;
  try {
    rawData = fs.readFileSync(CONFIG.INPUT_FILE, 'utf-8');
  } catch (error) {
    throw new Error(`❌ Failed to read input file: ${error.message}`);
  }
  
  // Parse JSON - handle both array and individual objects
  let facilitators;
  try {
    // Remove any trailing commas and fix JSON format
    const cleanData = rawData.trim().replace(/,\s*$/, '').replace(/^\s*{\s*"name"/, '[{"name"').replace(/}\s*$/, '}]');
    facilitators = JSON.parse(cleanData);
    
    if (!Array.isArray(facilitators)) {
      facilitators = [facilitators];
    }
  } catch (error) {
    throw new Error(`❌ Failed to parse JSON: ${error.message}`);
  }
  
  console.log(`✅ Loaded ${facilitators.length} facilitators from file`);
  
  // Validate all facilitators
  const validationErrors = [];
  const validFacilitators = [];
  
  facilitators.forEach((facilitator, index) => {
    const errors = validateFacilitator(facilitator, index);
    if (errors) {
      validationErrors.push({
        index: index + 1,
        name: facilitator.name || 'Unknown',
        errors,
      });
    } else {
      validFacilitators.push(normalizeFacilitator(facilitator));
    }
  });
  
  if (validationErrors.length > 0) {
    console.log('\n❌ VALIDATION ERRORS:');
    validationErrors.forEach(({ index, name, errors }) => {
      console.log(`   [${index}] ${name}:`);
      errors.forEach(error => console.log(`      • ${error}`));
    });
    throw new Error(`❌ ${validationErrors.length} facilitators failed validation`);
  }
  
  console.log(`✅ All ${validFacilitators.length} facilitators passed validation`);
  return validFacilitators;
}

/**
 * Upload batch of facilitators
 */
async function uploadBatch(facilitators, batchIndex) {
  const batchSize = facilitators.length;
  console.log(`📤 Uploading batch ${batchIndex + 1} (${batchSize} facilitators)...`);
  
  if (CONFIG.DRY_RUN) {
    console.log(`   🔍 DRY RUN: Would upload ${batchSize} facilitators`);
    if (CONFIG.VERBOSE) {
      facilitators.forEach(f => console.log(`      • ${f.name}`));
    }
    return { success: facilitators.length, failed: 0 };
  }
  
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/facilitators`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ facilitators }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`   ✅ Batch completed: ${result.message}`);
    
    if (CONFIG.VERBOSE && result.results) {
      result.results.forEach(r => {
        if (r.success) {
          console.log(`      ✅ ${r.name}`);
        } else {
          console.log(`      ❌ ${r.name}: ${r.error}`);
        }
      });
    }
    
    return {
      success: result.results?.filter(r => r.success).length || 0,
      failed: result.results?.filter(r => !r.success).length || 0,
    };
    
  } catch (error) {
    console.log(`   ❌ Batch failed: ${error.message}`);
    return { success: 0, failed: facilitators.length };
  }
}

/**
 * Split array into chunks
 */
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Verify uploaded facilitators
 */
async function verifyUpload() {
  console.log('🔍 VERIFYING UPLOADED FACILITATORS:');
  
  try {
    // Get facilitator count from database
    const countResponse = await fetch(`${CONFIG.API_BASE_URL}/facilitators/count`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (countResponse.ok) {
      const countResult = await countResponse.json();
      console.log(`   📊 Database count: ${countResult.count} facilitators`);
      
      if (countResult.count === 55) {
        console.log('   ✅ Count verification: PASSED');
      } else {
        console.log(`   ❌ Count verification: FAILED (expected 55, got ${countResult.count})`);
        return false;
      }
    }
    
    // Sample test 5 random facilitators for credential validation
    console.log('   🧪 Testing sample credentials...');
    const testResponse = await fetch(`${CONFIG.API_BASE_URL}/facilitators/test-sample?count=5`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (testResponse.ok) {
      const testResult = await testResponse.json();
      console.log(`   🔬 Tested ${testResult.tested} credentials`);
      console.log(`   ✅ Successful: ${testResult.successful}`);
      console.log(`   ❌ Failed: ${testResult.failed}`);
      
      if (testResult.failed === 0) {
        console.log('   ✅ Credential validation: PASSED');
        return true;
      } else {
        console.log('   ❌ Credential validation: FAILED');
        console.log('   📝 Failed facilitators:', testResult.failedFacilitators);
        return false;
      }
    }
    
  } catch (error) {
    console.log(`   ❌ Verification failed: ${error.message}`);
    return false;
  }
  
  return false;
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Load and validate facilitators
    const facilitators = loadFacilitators();
    
    // Split into batches
    const batches = chunkArray(facilitators, CONFIG.BATCH_SIZE);
    console.log(`📦 Split into ${batches.length} batches of ${CONFIG.BATCH_SIZE} facilitators each`);
    
    // Process batches
    let totalSuccess = 0;
    let totalFailed = 0;
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const result = await uploadBatch(batch, i);
      
      totalSuccess += result.success;
      totalFailed += result.failed;
      
      // Brief pause between batches to avoid overwhelming the server
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('🎯 UPLOAD SUMMARY:');
    console.log(`   ✅ Successful: ${totalSuccess}`);
    console.log(`   ❌ Failed: ${totalFailed}`);
    console.log(`   📊 Total: ${totalSuccess + totalFailed}`);
    
    if (CONFIG.DRY_RUN) {
      console.log('\n💡 This was a DRY RUN. Run without --dry-run to perform actual upload.');
    }
    
    if (totalFailed > 0) {
      console.log('\n⚠️  Some uploads failed. Check the logs above for details.');
      process.exit(1);
    }
    
    console.log('\n🎉 All facilitators uploaded successfully!');
    
    // Run post-upload verification if this was a live upload
    if (!CONFIG.DRY_RUN && totalFailed === 0) {
      console.log('\n' + '═'.repeat(60));
      const verificationPassed = await verifyUpload();
      
      if (verificationPassed) {
        console.log('\n🎯 VERIFICATION: ALL SYSTEMS OPERATIONAL ✅');
      } else {
        console.log('\n⚠️  VERIFICATION: ISSUES DETECTED - CHECK LOGS ❌');
        process.exit(1);
      }
    }
    
  } catch (error) {
    console.error('\n💥 FATAL ERROR:', error.message);
    process.exit(1);
  }
}

// Execute main function directly (ES modules)
main();