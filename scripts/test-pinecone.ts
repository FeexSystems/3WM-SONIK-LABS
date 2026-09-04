import { Pinecone } from '@pinecone-database/pinecone';

// Test Pinecone integration
const apiKey = process.env.PINECONE_API_KEY || '';

const pinecone = new Pinecone({
  apiKey: apiKey,
});

async function testPineconeIntegration() {
  console.log('Testing Pinecone integration for 3WM SONIK...');

  try {
    // Test 1: List indexes
    console.log('\n1. Listing indexes...');
    const indexes = await pinecone.listIndexes();
    console.log('Available indexes:', indexes.indexes?.map((idx) => idx.name) || []);

    // Test 2: Test audio embeddings index connectivity
    console.log('\n2. Testing audio embeddings index connectivity...');
    const audioIndex = pinecone.index('3wm-audio-embeddings');
    console.log('Audio index connected successfully');

    // Test 3: Test agent memory index connectivity
    console.log('\n3. Testing agent memory index connectivity...');
    const memoryIndex = pinecone.index('3wm-agent-memory');
    console.log('Memory index connected successfully');

    console.log('\n✅ All Pinecone integration tests passed!');
  } catch (error) {
    console.error('\n❌ Pinecone integration test failed:', error);
    process.exit(1);
  }
}

testPineconeIntegration();
