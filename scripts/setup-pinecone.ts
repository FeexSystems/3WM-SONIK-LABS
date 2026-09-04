import { Pinecone } from '@pinecone-database/pinecone';

// Temporarily use the API key directly for setup
const apiKey = process.env.PINECONE_API_KEY || '';

if (!apiKey) {
  console.error('PINECONE_API_KEY not found in environment variables');
  process.exit(1);
}

const pinecone = new Pinecone({
  apiKey: apiKey,
});

async function setupPineconeIndexes() {
  console.log('Setting up Pinecone indexes for 3WM SONIK...');

  try {
    // Check existing indexes
    const indexes = await pinecone.listIndexes();
    const existingIndexNames = indexes.indexes?.map((idx) => idx.name) || [];
    console.log('Existing indexes:', existingIndexNames);

    // Create audio embeddings index (1536 dimensions for OpenAI)
    const audioIndexName = '3wm-audio-embeddings';
    if (!existingIndexNames.includes(audioIndexName)) {
      console.log(`Creating index: ${audioIndexName}`);
      await pinecone.createIndex({
        name: audioIndexName,
        dimension: 1536,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
      });
      console.log(`Index ${audioIndexName} created successfully`);
    } else {
      console.log(`Index ${audioIndexName} already exists`);
    }

    // Create agent memory index (768 dimensions for smaller embeddings)
    const memoryIndexName = '3wm-agent-memory';
    if (!existingIndexNames.includes(memoryIndexName)) {
      console.log(`Creating index: ${memoryIndexName}`);
      await pinecone.createIndex({
        name: memoryIndexName,
        dimension: 768,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
      });
      console.log(`Index ${memoryIndexName} created successfully`);
    } else {
      console.log(`Index ${memoryIndexName} already exists`);
    }

    console.log('Pinecone setup complete!');
    console.log('Indexes created:');
    console.log(`  - ${audioIndexName} (1536 dimensions, cosine) - Audio embeddings`);
    console.log(`  - ${memoryIndexName} (768 dimensions, cosine) - Agent memory`);
  } catch (error) {
    console.error('Error setting up Pinecone indexes:', error);
    process.exit(1);
  }
}

setupPineconeIndexes();
