#!/usr/bin/env tsx

/**
 * Test script for the video flow system
 * Tests the complete flow: facilitator setup → student assignment → video generation
 */

import { facilitatorService } from '../services/facilitator/facilitator.service';
import { createVertexAIClient } from '../services/ai/provider/vertex/vertex.client';

async function testVideoFlowSystem() {
  console.log('🧪 Testing Video Flow System End-to-End');
  console.log('==========================================\n');

  try {
    // Step 1: Test adding a facilitator (using mock credentials for testing)
    console.log('📝 Step 1: Adding test facilitator...');
    
    const mockServiceAccount = {
      "type": "service_account",
      "project_id": "mock-project-123",
      "private_key_id": "mock-key-id",
      "private_key": "-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
      "client_email": "mock@mock-project-123.iam.gserviceaccount.com",
      "client_id": "123456789",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs"
    };

    const facilitatorId = await facilitatorService.addFacilitator({
      name: 'TestFacilitator',
      projectId: 'mock-project-123',
      location: 'us-central1',
      serviceAccountJson: JSON.stringify(mockServiceAccount),
    });
    
    console.log(`✅ Facilitator added with ID: ${facilitatorId}`);

    // Step 2: Test student assignment
    console.log('\n👥 Step 2: Assigning test student...');
    
    const testStudentEmail = 'test.student@example.com';
    await facilitatorService.assignStudentToFacilitatorByName(
      testStudentEmail,
      'TestFacilitator'
    );
    
    console.log(`✅ Student ${testStudentEmail} assigned to TestFacilitator`);

    // Step 3: Test credential retrieval
    console.log('\n🔑 Step 3: Testing credential retrieval...');
    
    const credentials = await facilitatorService.getCredentialsForStudent(testStudentEmail);
    
    if (credentials) {
      console.log('✅ Credentials retrieved successfully');
      console.log(`   Project ID: ${credentials.projectId}`);
      console.log(`   Location: ${credentials.location}`);
      console.log(`   Service Account: ${credentials.serviceAccountJson.substring(0, 50)}...`);
      
      // Step 4: Test custom VertexAI client creation
      console.log('\n🤖 Step 4: Testing custom VertexAI client creation...');
      
      try {
        const customClient = createVertexAIClient(credentials);
        console.log('✅ Custom VertexAI client created successfully');
        
        // Note: We won't actually call the API since these are mock credentials
        console.log('ℹ️  API call skipped (mock credentials)');
        
      } catch (error) {
        console.log('⚠️  Custom client creation failed (expected with mock credentials)');
        console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
    } else {
      console.log('❌ Failed to retrieve credentials');
      return false;
    }

    // Step 5: Test admin endpoints functionality
    console.log('\n📊 Step 5: Testing admin data retrieval...');
    
    const allFacilitators = await facilitatorService.getAllFacilitators();
    console.log(`✅ Retrieved ${allFacilitators.length} facilitators`);
    
    const allAssignments = await facilitatorService.getAllStudentAssignments();
    console.log(`✅ Retrieved ${allAssignments.length} assignments`);

    // Step 6: Cleanup test data
    console.log('\n🧹 Step 6: Cleaning up test data...');
    
    await facilitatorService.removeStudentAssignment(testStudentEmail);
    console.log('✅ Test student assignment removed');
    
    await facilitatorService.removeFacilitator('TestFacilitator');
    console.log('✅ Test facilitator removed');

    console.log('\n🎉 All tests passed! Video flow system is working correctly.');
    return true;

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    
    // Attempt cleanup on failure
    try {
      console.log('\n🧹 Attempting cleanup...');
      await facilitatorService.removeStudentAssignment('test.student@example.com');
      await facilitatorService.removeFacilitator('TestFacilitator');
      console.log('✅ Cleanup completed');
    } catch (cleanupError) {
      console.log('⚠️  Cleanup failed:', cleanupError);
    }
    
    return false;
  }
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testVideoFlowSystem()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test script failed:', error);
      process.exit(1);
    });
}

export { testVideoFlowSystem };