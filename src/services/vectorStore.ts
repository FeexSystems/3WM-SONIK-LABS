import { pineconeClient } from '../lib/pinecone';

export interface VectorMetadata {
  type: 'audio' | 'agent_memory' | 'pattern' | 'arrangement';
  agent?: 'emar' | 'ricky' | 'kingpin' | 'orchestrator';
  projectId?: string;
  timestamp?: number;
  [key: string]: any;
}

export interface VectorRecord {
  id: string;
  values: number[];
  metadata: VectorMetadata;
}

// In-memory cosine similarity calculator for offline fallback
function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export class VectorStoreService {
  private audioIndexName = '3wm-audio-embeddings';
  private memoryIndexName = '3wm-agent-memory';
  private audioIndex: any = null;
  private memoryIndex: any = null;

  // Base URL for API requests
  private apiBaseUrl = '/api/v1/vector';

  // Browser In-Memory Vector Cache
  private inMemoryVectors: Map<string, VectorRecord> = new Map();

  constructor() {
    if (!pineconeClient) {
      // In browser, this is expected. We'll use the API.
      return;
    }

    try {
      this.audioIndex = pineconeClient.index(this.audioIndexName);
      this.memoryIndex = pineconeClient.index(this.memoryIndexName);
    } catch (error) {
      console.warn('VectorStoreService fallback to in-memory/API mode:', error);
    }
  }

  // Helper to get Firebase token (if in browser environment)
  private async getAuthToken(): Promise<string | null> {
    if (typeof window !== 'undefined') {
      try {
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        if (auth.currentUser) {
          return await auth.currentUser.getIdToken();
        }
      } catch (error) {
        console.warn('Could not get Firebase Auth token:', error);
      }
    }
    return null;
  }

  // Helper for API calls
  private async apiCall(endpoint: string, body: any): Promise<any> {
    if (typeof window === 'undefined') {
      // If we're on the server but somehow using API, just throw to fallback
      throw new Error('API calls should be used from the client');
    }

    const token = await this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Vector API error: ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Store audio embedding for similarity search
   */
  async storeAudioEmbedding(
    id: string,
    embedding: number[],
    metadata: VectorMetadata
  ): Promise<void> {
    const record: VectorRecord = {
      id,
      values: embedding,
      metadata: {
        ...metadata,
        type: 'audio',
        timestamp: Date.now(),
      },
    };

    this.inMemoryVectors.set(id, record);

    if (this.audioIndex) {
      // Server-side
      try {
        await this.audioIndex.upsert([record]);
      } catch (error) {
        console.warn('Failed to upsert to Pinecone audio index:', error);
      }
    } else {
      // Client-side API proxy
      try {
        await this.apiCall('/upsert', {
          id,
          values: embedding,
          metadata: record.metadata,
          indexType: 'audio',
        });
      } catch (error) {
        console.warn('Failed to proxy upsert to backend, stored in memory only:', error);
      }
    }
  }

  /**
   * Retrieve similar audio based on embedding
   */
  async findSimilarAudio(
    embedding: number[],
    topK: number = 5,
    filter?: Record<string, any>
  ): Promise<VectorRecord[]> {
    if (this.audioIndex) {
      // Server-side
      try {
        const queryResponse = await this.audioIndex.query({
          vector: embedding,
          topK,
          includeMetadata: true,
          filter,
        });

        return (queryResponse.matches || []).map((match: any) => ({
          id: match.id,
          values: match.values || [],
          metadata: match.metadata || {},
        }));
      } catch (error) {
        console.warn('Server query failed:', error);
      }
    } else if (typeof window !== 'undefined') {
      // Client-side API proxy
      try {
        const response = await this.apiCall('/query', {
          values: embedding,
          topK,
          filter,
          indexType: 'audio',
        });
        if (response.matches && response.matches.length > 0) {
          return response.matches;
        }
      } catch (error) {
        console.warn('Backend proxy query failed:', error);
      }
    }

    // Fallback to in-memory similarity search
    const candidates = Array.from(this.inMemoryVectors.values()).filter(
      (v) => v.metadata.type === 'audio'
    );

    return candidates
      .map((record) => ({
        record,
        score: cosineSimilarity(embedding, record.values),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((item) => item.record);
  }

  /**
   * Store agent memory/conversation
   */
  async storeAgentMemory(id: string, embedding: number[], metadata: VectorMetadata): Promise<void> {
    const record: VectorRecord = {
      id,
      values: embedding,
      metadata: {
        ...metadata,
        type: 'agent_memory',
        timestamp: Date.now(),
      },
    };

    this.inMemoryVectors.set(id, record);

    if (this.memoryIndex) {
      // Server-side
      try {
        await this.memoryIndex.upsert([record]);
      } catch (error) {
        console.warn('Failed to store in Pinecone memory index:', error);
      }
    } else {
      // Client-side API proxy
      try {
        await this.apiCall('/upsert', {
          id,
          values: embedding,
          metadata: record.metadata,
          indexType: 'memory',
        });
      } catch (error) {
        console.warn('Failed to proxy upsert to backend, stored in memory only:', error);
      }
    }
  }

  /**
   * Retrieve agent memory for context
   */
  async retrieveAgentMemory(
    embedding: number[],
    agent?: 'emar' | 'ricky' | 'kingpin' | 'orchestrator',
    topK: number = 10
  ): Promise<VectorRecord[]> {
    const filter = agent ? { agent } : undefined;

    if (this.memoryIndex) {
      // Server-side
      try {
        const queryResponse = await this.memoryIndex.query({
          vector: embedding,
          topK,
          includeMetadata: true,
          filter,
        });

        return (queryResponse.matches || []).map((match: any) => ({
          id: match.id,
          values: match.values || [],
          metadata: match.metadata || {},
        }));
      } catch (error) {
        console.warn('Server memory query failed:', error);
      }
    } else if (typeof window !== 'undefined') {
      // Client-side API proxy
      try {
        const response = await this.apiCall('/query', {
          values: embedding,
          topK,
          filter,
          indexType: 'memory',
        });
        if (response.matches && response.matches.length > 0) {
          return response.matches;
        }
      } catch (error) {
        console.warn('Backend proxy memory query failed:', error);
      }
    }

    // Fallback to in-memory search
    const candidates = Array.from(this.inMemoryVectors.values()).filter(
      (v) => !agent || v.metadata.agent === agent
    );

    return candidates
      .map((record) => ({
        record,
        score: cosineSimilarity(embedding, record.values),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((item) => item.record);
  }

  /**
   * Store sound design pattern (Ricky)
   */
  async storeSoundPattern(
    id: string,
    embedding: number[],
    metadata: VectorMetadata
  ): Promise<void> {
    return this.storeAgentMemory(id, embedding, {
      ...metadata,
      type: 'pattern',
      agent: 'ricky',
    });
  }

  /**
   * Store vocal arrangement (Kingpin)
   */
  async storeVocalArrangement(
    id: string,
    embedding: number[],
    metadata: VectorMetadata
  ): Promise<void> {
    return this.storeAgentMemory(id, embedding, {
      ...metadata,
      type: 'arrangement',
      agent: 'kingpin',
    });
  }

  /**
   * Store analysis result (Emar)
   */
  async storeAnalysisResult(
    id: string,
    embedding: number[],
    metadata: VectorMetadata
  ): Promise<void> {
    return this.storeAgentMemory(id, embedding, {
      ...metadata,
      type: 'agent_memory',
      agent: 'emar',
    });
  }

  /**
   * Delete a vector record
   */
  async deleteVector(id: string, type: 'audio' | 'memory'): Promise<void> {
    this.inMemoryVectors.delete(id);

    if (type === 'audio' && this.audioIndex) {
      try {
        await this.audioIndex.deleteOne(id);
      } catch (e) {}
    } else if (type === 'memory' && this.memoryIndex) {
      try {
        await this.memoryIndex.deleteOne(id);
      } catch (e) {}
    } else if (typeof window !== 'undefined') {
      try {
        await this.apiCall('/delete', { id, indexType: type });
      } catch (error) {
        console.warn(`Failed to proxy delete to backend:`, error);
      }
    }
  }
}

// Singleton instance
export const vectorStore = new VectorStoreService();
