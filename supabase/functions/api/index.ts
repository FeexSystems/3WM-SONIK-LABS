import { Pinecone } from 'npm:@pinecone-database/pinecone@^8.2.0';
import { GoogleGenAI } from 'npm:@google/genai@^2.18.0';
import OpenAI from 'npm:openai@^7.5.0';
import { corsHeadersFor, preflight } from '../_shared/cors.ts';
// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: Deno.env.get('PINECONE_API_KEY') || '',
});

// Lazy initialize OpenAI client
let openaiClient: OpenAI | null = null;
function getOpenAIClient(): OpenAI | null {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// Lazy initialize Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

Deno.serve(async (req) => {
  // Per-request CORS: this endpoint requires an Authorization header, so echoing back a
  // wildcard origin would let any site drive authenticated calls on a visitor's behalf.
  const corsHeaders = corsHeadersFor(req);

  // Handle CORS options request
  if (req.method === 'OPTIONS') {
    return preflight(req);
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    // Auth Check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (path.endsWith('/api/v1/vector/embed') && req.method === 'POST') {
      const { text, type } = await req.json();
      if (!text)
        return new Response(JSON.stringify({ error: 'Text is required' }), {
          status: 400,
          headers: corsHeaders,
        });

      let embedding: number[] = [];
      if (type === 'audio') {
        const openai = getOpenAIClient();
        if (!openai)
          return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
            status: 500,
            headers: corsHeaders,
          });

        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: text,
        });
        embedding = response.data[0].embedding;
      } else {
        const gemini = getGeminiClient();
        if (!gemini)
          return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), {
            status: 500,
            headers: corsHeaders,
          });

        const response = await gemini.models.embedContent({
          model: 'text-embedding-004',
          contents: text,
        });
        embedding = response.embeddings?.[0]?.values || [];
      }
      return new Response(JSON.stringify({ embedding }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (path.endsWith('/api/v1/vector/upsert') && req.method === 'POST') {
      const { id, values, metadata, indexType } = await req.json();
      if (!id || !values)
        return new Response(JSON.stringify({ error: 'ID and values required' }), {
          status: 400,
          headers: corsHeaders,
        });

      const indexName = indexType === 'audio' ? '3wm-audio-embeddings' : '3wm-agent-memory';
      const index = pinecone.index(indexName);

      await index.upsert([{ id, values, metadata }]);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (path.endsWith('/api/v1/vector/query') && req.method === 'POST') {
      const { values, topK = 5, filter, indexType } = await req.json();
      if (!values)
        return new Response(JSON.stringify({ error: 'Vector values required' }), {
          status: 400,
          headers: corsHeaders,
        });

      const indexName = indexType === 'audio' ? '3wm-audio-embeddings' : '3wm-agent-memory';
      const index = pinecone.index(indexName);

      const queryResponse = await index.query({
        vector: values,
        topK,
        includeMetadata: true,
        filter,
      });
      return new Response(JSON.stringify({ matches: queryResponse.matches || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (path.endsWith('/api/v1/vector/delete') && req.method === 'POST') {
      const { id, indexType } = await req.json();
      if (!id)
        return new Response(JSON.stringify({ error: 'ID required' }), {
          status: 400,
          headers: corsHeaders,
        });

      const indexName = indexType === 'audio' ? '3wm-audio-embeddings' : '3wm-agent-memory';
      const index = pinecone.index(indexName);

      await index.deleteOne(id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: corsHeaders,
    });
  } catch (error: any) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
