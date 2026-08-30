---
description: Set up Pinecone vector database for 3WM SONIK
auto_execution_mode: 3
---

# Pinecone Quickstart for 3WM SONIK

This workflow sets up Pinecone vector database for storing audio embeddings, agent memory, and musical intelligence.

## Prerequisites

- Pinecone API key already configured in `.env`
- Node.js environment ready

## Steps

1. **Install Pinecone SDK**

   ```bash
   npm install @pinecone-database/pinecone
   ```

2. **Create Pinecone configuration file**
   - Create `src/lib/pinecone.ts` with client initialization
   - Use environment variable `PINECONE_API_KEY`

3. **Set up Pinecone index**
   - Create index for audio embeddings (dimension: 1536 for OpenAI embeddings)
   - Create index for agent memory (dimension: 768 for smaller embeddings)
   - Configure metric: cosine similarity for musical similarity

4. **Create vector storage service**
   - Create `src/services/vectorStore.ts`
   - Implement functions for:
     - Storing audio embeddings
     - Retrieving similar audio
     - Storing agent conversations
     - Retrieving agent memory

5. **Integrate with agent system**
   - Update agent classes to use vector storage
   - Enable Kappachino Emar to store analysis results
   - Enable Kappachino Ricky to store sound design patterns
   - Enable Kingpin to store vocal arrangements

6. **Test the integration**
   - Run a simple vector upsert test
   - Verify similarity search works
   - Check agent memory persistence

## Usage

After setup, agents can store and retrieve vector embeddings for:

- Audio similarity search
- Pattern recognition
- Agent memory and learning
- Musical intelligence persistence
