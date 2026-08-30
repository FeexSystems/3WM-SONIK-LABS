import { Router } from 'express';
import { pineconeClient } from '../lib/pinecone';
import { envConfig } from '../config/environment';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Lazy initialize OpenAI client
let openaiClient: OpenAI | null = null;
function getOpenAIClient(): OpenAI | null {
  const apiKey = envConfig.getConfig().openaiApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// Lazy initialize Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = envConfig.getConfig().geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

// Generate an embedding for a given text
router.post('/embed', requireAuth, async (req, res) => {
  try {
    const { text, type } = req.body; // type: 'audio' (1536) or 'memory' (768)

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    let embedding: number[] = [];

    if (type === 'audio') {
      // Use OpenAI for 1536-dimensional embeddings
      const openai = getOpenAIClient();
      if (!openai) {
        return res
          .status(500)
          .json({ error: 'OpenAI API key not configured for audio embeddings.' });
      }
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      embedding = response.data[0].embedding;
    } else {
      // Default to 768-dimensional embeddings for memory using Gemini
      const gemini = getGeminiClient();
      if (!gemini) {
        return res
          .status(500)
          .json({ error: 'Gemini API key not configured for memory embeddings.' });
      }
      const response = await gemini.models.embedContent({
        model: 'text-embedding-004',
        contents: text,
      });
      embedding = response.embeddings?.[0]?.values || [];
    }

    res.json({ embedding });
  } catch (error) {
    console.error('Embedding generation failed:', error);
    res.status(500).json({ error: 'Failed to generate embedding' });
  }
});

// Upsert a vector to Pinecone
router.post('/upsert', requireAuth, async (req, res) => {
  try {
    if (!pineconeClient) {
      return res.status(503).json({ error: 'Pinecone client not initialized on server' });
    }

    const { id, values, metadata, indexType } = req.body;

    if (!id || !values) {
      return res.status(400).json({ error: 'ID and values are required' });
    }

    const indexName = indexType === 'audio' ? '3wm-audio-embeddings' : '3wm-agent-memory';
    const index = pineconeClient.index(indexName);

    await index.upsert([{ id, values, metadata }]);
    res.json({ success: true });
  } catch (error) {
    console.error('Pinecone upsert failed:', error);
    res.status(500).json({ error: 'Failed to upsert to Pinecone' });
  }
});

// Query Pinecone for similar vectors
router.post('/query', requireAuth, async (req, res) => {
  try {
    if (!pineconeClient) {
      return res.status(503).json({ error: 'Pinecone client not initialized on server' });
    }

    const { values, topK = 5, filter, indexType } = req.body;

    if (!values) {
      return res.status(400).json({ error: 'Vector values are required' });
    }

    const indexName = indexType === 'audio' ? '3wm-audio-embeddings' : '3wm-agent-memory';
    const index = pineconeClient.index(indexName);

    const queryResponse = await index.query({
      vector: values,
      topK,
      includeMetadata: true,
      filter,
    });

    res.json({ matches: queryResponse.matches || [] });
  } catch (error) {
    console.error('Pinecone query failed:', error);
    res.status(500).json({ error: 'Failed to query Pinecone' });
  }
});

// Delete a vector from Pinecone
router.post('/delete', requireAuth, async (req, res) => {
  try {
    if (!pineconeClient) {
      return res.status(503).json({ error: 'Pinecone client not initialized on server' });
    }

    const { id, indexType } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }

    const indexName = indexType === 'audio' ? '3wm-audio-embeddings' : '3wm-agent-memory';
    const index = pineconeClient.index(indexName);

    await index.deleteOne(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Pinecone delete failed:', error);
    res.status(500).json({ error: 'Failed to delete from Pinecone' });
  }
});

export default router;
