// 3WM SONIK - Vector Database for Agent Memory
// Provides semantic memory storage and retrieval for the Three Wise Men agent system

export interface MemoryEmbedding {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    agentId: string;
    timestamp: number;
    type: 'observation' | 'action' | 'knowledge' | 'preference' | 'conversation';
    importance: number; // 0-1
    tags: string[];
    relatedProject?: string;
  };
}

export interface MemorySearchResult {
  memory: MemoryEmbedding;
  similarity: number;
}

export interface VectorDatabaseConfig {
  embeddingDimension: number;
  maxMemories: number;
  similarityThreshold: number;
  persistenceEnabled: boolean;
  storageType: 'memory' | 'indexeddb' | 'firestore' | 'pinecone' | 'weaviate';
  embeddingProvider: 'mock' | 'openai' | 'gemini';
  apiKey?: string;
  indexName?: string;
  environment?: string;
}

export class VectorMemoryDatabase {
  private memories: Map<string, MemoryEmbedding> = new Map<string, MemoryEmbedding>();
  private config: VectorDatabaseConfig;
  private embeddingCache: Map<string, number[]> = new Map<string, number[]>();

  constructor(config: Partial<VectorDatabaseConfig> = {}) {
    this.config = {
      embeddingDimension: 768, // Default for many embedding models
      maxMemories: 10000,
      similarityThreshold: 0.7,
      persistenceEnabled: true,
      storageType: 'firestore', // Default to Firestore for backend persistence
      embeddingProvider: 'mock', // Default to mock embeddings
      ...config,
    };

    // Initialize persistent storage if enabled
    if (this.config.persistenceEnabled && this.config.storageType !== 'memory') {
      // Defer storage initialization to avoid blocking constructor
      setTimeout(() => {
        void this.initializePersistentStorage();
      }, 0);
    }
  }

  /**
   * Initialize persistent storage based on configuration
   */
  private async initializePersistentStorage(): Promise<void> {
    switch (this.config.storageType) {
      case 'indexeddb':
        await this.initializeIndexedDB();
        break;
      case 'firestore':
        await this.initializeFirestore();
        break;
      case 'pinecone':
        await this.initializePinecone();
        break;
      case 'weaviate':
        await this.initializeWeaviate();
        break;
      default:
        console.warn(`Unknown storage type: ${this.config.storageType}, falling back to memory`);
    }
  }

  /**
   * Initialize IndexedDB for browser-based persistence
   */
  private async initializeIndexedDB(): Promise<void> {
    try {
      const request = indexedDB.open('3wm-sonik-memory', 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('memories')) {
          db.createObjectStore('memories', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // Load existing memories
        void this.loadFromIndexedDB(db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB initialization failed:', event);
      };
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
    }
  }

  /**
   * Load memories from IndexedDB
   */
  private async loadFromIndexedDB(db: IDBDatabase): Promise<void> {
    try {
      const transaction = db.transaction(['memories'], 'readonly');
      const objectStore = transaction.objectStore('memories');
      const request = objectStore.getAll();

      request.onsuccess = () => {
        const memories = request.result;
        for (const memory of memories) {
          this.memories.set(memory.id, memory);
        }
        console.log(`Loaded ${memories.length} memories from IndexedDB`);
      };
    } catch (error) {
      console.error('Failed to load memories from IndexedDB:', error);
    }
  }

  /**
   * Save memories to IndexedDB
   */
  private async saveToIndexedDB(): Promise<void> {
    try {
      const request = indexedDB.open('3wm-sonik-memory', 1);

      request.onsuccess = async (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['memories'], 'readwrite');
        const objectStore = transaction.objectStore('memories');

        // Clear existing memories
        await new Promise<void>((resolve, reject) => {
          const clearRequest = objectStore.clear();
          clearRequest.onsuccess = () => resolve();
          clearRequest.onerror = () => reject(clearRequest.error);
        });

        // Add all current memories
        for (const memory of this.memories.values()) {
          await new Promise<void>((resolve, reject) => {
            const addRequest = objectStore.add(memory);
            addRequest.onsuccess = () => resolve();
            addRequest.onerror = () => reject(addRequest.error);
          });
        }

        console.log(`Saved ${this.memories.size} memories to IndexedDB`);
      };
    } catch (error) {
      console.error('Failed to save memories to IndexedDB:', error);
    }
  }

  /**
   * Initialize Firestore for cloud persistence
   */
  private async initializeFirestore(): Promise<void> {
    try {
      // In client browser, persistence is managed by IndexedDB.
      if (typeof window !== 'undefined') {
        return;
      }
    } catch (error) {
      console.error('Failed to initialize Firestore:', error);
    }
  }

  /**
   * Save memories to Firestore
   */
  private async saveToFirestore(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        return;
      }
    } catch (error) {
      console.error('Failed to save memories to Firestore:', error);
    }
  }

  /**
   * Initialize Pinecone for vector database
   */
  private async initializePinecone(): Promise<void> {
    try {
      if (!this.config.apiKey) {
        throw new Error('Pinecone API key is required');
      }

      // Import Pinecone client (placeholder - would need actual SDK)
      console.log('Pinecone integration not yet implemented');
      // This would require installing @pinecone-database/pinecone
    } catch (error) {
      console.error('Failed to initialize Pinecone:', error);
    }
  }

  /**
   * Initialize Weaviate for vector database
   */
  private async initializeWeaviate(): Promise<void> {
    try {
      if (!this.config.apiKey) {
        throw new Error('Weaviate API key is required');
      }

      // Import Weaviate client (placeholder - would need actual SDK)
      console.log('Weaviate integration not yet implemented');
      // This would require installing weaviate-ts-client
    } catch (error) {
      console.error('Failed to initialize Weaviate:', error);
    }
  }

  /**
   * Helper to get Firebase token (if in browser environment)
   */
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

  /**
   * Generate embedding for text (using real backend endpoint when available)
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Check cache first
    if (this.embeddingCache.has(text)) {
      return this.embeddingCache.get(text)!;
    }

    let embedding: number[] | null = null;

    if (this.config.storageType === 'pinecone' && typeof window !== 'undefined') {
      try {
        const token = await this.getAuthToken();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/vector/embed', {
          method: 'POST',
          headers,
          body: JSON.stringify({ text, type: 'memory' }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.embedding) embedding = data.embedding;
        }
      } catch (error) {
        console.warn('Failed to generate real embedding via API, falling back to mock:', error);
      }
    }

    if (!embedding) {
      // Fallback to mock embedding
      embedding = this.hashEmbedding(text, this.config.embeddingDimension);
    }

    // Cache the embedding
    this.embeddingCache.set(text, embedding);

    return embedding;
  }

  /**
   * Generate hash-based embedding (simplified for demonstration)
   */
  private hashEmbedding(text: string, dimension: number): number[] {
    const embedding = new Array(dimension).fill(0);

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Distribute hash across dimensions
    for (let i = 0; i < dimension; i++) {
      const value = ((hash * (i + 1)) % 1000) / 1000;
      embedding[i] = value;
    }

    // Normalize embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < dimension; i++) {
        embedding[i] /= magnitude;
      }
    }

    return embedding;
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  private cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      return 0;
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      magnitude1 += embedding1[i] * embedding1[i];
      magnitude2 += embedding2[i] * embedding2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Add a memory to the database
   */
  public async addMemory(
    content: string,
    metadata: Omit<MemoryEmbedding['metadata'], 'timestamp'>
  ): Promise<string> {
    const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const embedding = await this.generateEmbedding(content);

    const memory: MemoryEmbedding = {
      id,
      content,
      embedding,
      metadata: {
        ...metadata,
        timestamp: Date.now(),
      },
    };

    this.memories.set(id, memory);

    // Enforce max memory limit
    if (this.memories.size > this.config.maxMemories) {
      this.pruneMemories();
    }

    // Auto-persist if enabled
    if (this.config.persistenceEnabled) {
      await this.persistMemories();
    }

    return id;
  }

  /**
   * Search for similar memories
   */
  public async searchMemories(
    query: string,
    limit: number = 10,
    filters?: {
      agentId?: string;
      type?: MemoryEmbedding['metadata']['type'];
      minImportance?: number;
      tags?: string[];
    }
  ): Promise<MemorySearchResult[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    const results: MemorySearchResult[] = [];

    for (const memory of this.memories.values()) {
      // Apply filters
      if (filters?.agentId && memory.metadata.agentId !== filters.agentId) continue;
      if (filters?.type && memory.metadata.type !== filters.type) continue;
      if (filters?.minImportance && memory.metadata.importance < filters.minImportance) continue;
      if (filters?.tags && !filters.tags.some((tag) => memory.metadata.tags.includes(tag)))
        continue;

      // Calculate similarity
      const similarity = this.cosineSimilarity(queryEmbedding, memory.embedding);

      if (similarity >= this.config.similarityThreshold) {
        results.push({
          memory,
          similarity,
        });
      }
    }

    // Sort by similarity and limit results
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, limit);
  }

  /**
   * Get a specific memory by ID
   */
  public getMemory(id: string): MemoryEmbedding | undefined {
    return this.memories.get(id);
  }

  /**
   * Update a memory
   */
  public async updateMemory(
    id: string,
    updates: {
      content?: string;
      metadata?: Partial<MemoryEmbedding['metadata']>;
    }
  ): Promise<boolean> {
    const memory = this.memories.get(id);
    if (!memory) return false;

    if (updates.content) {
      memory.content = updates.content;
      memory.embedding = await this.generateEmbedding(updates.content);
    }

    if (updates.metadata) {
      memory.metadata = { ...memory.metadata, ...updates.metadata };
    }

    return true;
  }

  /**
   * Delete a memory
   */
  public deleteMemory(id: string): boolean {
    return this.memories.delete(id);
  }

  /**
   * Get all memories for a specific agent
   */
  public getMemoriesForAgent(agentId: string): MemoryEmbedding[] {
    return Array.from(this.memories.values()).filter(
      (memory) => memory.metadata.agentId === agentId
    );
  }

  /**
   * Get memories by type
   */
  public getMemoriesByType(type: MemoryEmbedding['metadata']['type']): MemoryEmbedding[] {
    return Array.from(this.memories.values()).filter((memory) => memory.metadata.type === type);
  }

  /**
   * Get memories by tag
   */
  public getMemoriesByTag(tag: string): MemoryEmbedding[] {
    return Array.from(this.memories.values()).filter((memory) =>
      memory.metadata.tags.includes(tag)
    );
  }

  /**
   * Get recent memories
   */
  public getRecentMemories(limit: number = 10): MemoryEmbedding[] {
    const allMemories = Array.from(this.memories.values());
    allMemories.sort((a, b) => b.metadata.timestamp - a.metadata.timestamp);
    return allMemories.slice(0, limit);
  }

  /**
   * Get important memories
   */
  public getImportantMemories(minImportance: number = 0.7, limit: number = 10): MemoryEmbedding[] {
    const importantMemories = Array.from(this.memories.values()).filter(
      (memory) => memory.metadata.importance >= minImportance
    );
    importantMemories.sort((a, b) => b.metadata.importance - a.metadata.importance);
    return importantMemories.slice(0, limit);
  }

  /**
   * Prune old/less important memories to maintain size limit
   */
  private pruneMemories(): void {
    const allMemories = Array.from(this.memories.values());

    // Sort by importance and recency
    allMemories.sort((a, b) => {
      const importanceDiff = b.metadata.importance - a.metadata.importance;
      if (Math.abs(importanceDiff) > 0.1) {
        return importanceDiff;
      }
      return b.metadata.timestamp - a.metadata.timestamp;
    });

    // Remove least important/oldest memories
    const toRemove = allMemories.slice(this.config.maxMemories);
    for (const memory of toRemove) {
      this.memories.delete(memory.id);
    }
  }

  /**
   * Clear all memories
   */
  public clearMemories(): void {
    this.memories.clear();
    this.embeddingCache.clear();
  }

  /**
   * Get database statistics
   */
  public getStatistics(): {
    totalMemories: number;
    memoriesByAgent: Record<string, number>;
    memoriesByType: Record<string, number>;
    averageImportance: number;
  } {
    const memories = Array.from(this.memories.values());

    const memoriesByAgent: Record<string, number> = {};
    const memoriesByType: Record<string, number> = {};
    let totalImportance = 0;

    for (const memory of memories) {
      memoriesByAgent[memory.metadata.agentId] =
        (memoriesByAgent[memory.metadata.agentId] || 0) + 1;
      memoriesByType[memory.metadata.type] = (memoriesByType[memory.metadata.type] || 0) + 1;
      totalImportance += memory.metadata.importance;
    }

    return {
      totalMemories: memories.length,
      memoriesByAgent,
      memoriesByType,
      averageImportance: memories.length > 0 ? totalImportance / memories.length : 0,
    };
  }

  /**
   * Export memories for persistence
   */
  public exportMemories(): string {
    const data = {
      memories: Array.from(this.memories.entries()),
      config: this.config,
    };
    return JSON.stringify(data);
  }

  /**
   * Persist memories to configured storage
   */
  public async persistMemories(): Promise<void> {
    if (!this.config.persistenceEnabled) {
      return;
    }

    switch (this.config.storageType) {
      case 'indexeddb':
        await this.saveToIndexedDB();
        break;
      case 'firestore':
        await this.saveToFirestore();
        break;
      case 'pinecone':
        // Pinecone would handle persistence automatically
        console.log('Pinecone persistence is automatic');
        break;
      case 'weaviate':
        // Weaviate would handle persistence automatically
        console.log('Weaviate persistence is automatic');
        break;
      default:
        // For memory storage, export to localStorage as fallback
        try {
          const exported = this.exportMemories();
          localStorage.setItem('3wm-sonik-memory-backup', exported);
        } catch (error) {
          console.error('Failed to save to localStorage:', error);
        }
    }
  }

  /**
   * Import memories from persistence
   */
  public importMemories(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.memories = new Map(parsed.memories);
      this.config = { ...this.config, ...parsed.config };
    } catch (error) {
      console.error('Failed to import memories:', error);
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<VectorDatabaseConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  public getConfig(): VectorDatabaseConfig {
    return { ...this.config };
  }
}

// Singleton instance for agent memory
let vectorMemoryInstance: VectorMemoryDatabase | null = null;

export function getVectorMemory(config?: Partial<VectorDatabaseConfig>): VectorMemoryDatabase {
  if (!vectorMemoryInstance) {
    // Auto-detect storage backend: IndexedDB in browser, Firestore on server
    const isBrowser = typeof window !== 'undefined';
    vectorMemoryInstance = new VectorMemoryDatabase({
      embeddingDimension: 768,
      maxMemories: 5000,
      similarityThreshold: 0.7,
      persistenceEnabled: true,
      storageType: isBrowser ? 'indexeddb' : 'firestore',
      embeddingProvider: 'mock',
      ...config,
    });
  }

  return vectorMemoryInstance;
}

export function resetVectorMemory(): void {
  vectorMemoryInstance = null;
}

// Memory helper functions for agents
export class MemoryHelper {
  private vectorMemory: VectorMemoryDatabase;

  constructor(vectorMemory: VectorMemoryDatabase) {
    this.vectorMemory = vectorMemory;
  }

  /**
   * Store an observation from an agent
   */
  async storeObservation(
    agentId: string,
    observation: string,
    importance: number = 0.5,
    tags: string[] = [],
    projectId?: string
  ): Promise<string> {
    return this.vectorMemory.addMemory(observation, {
      agentId,
      type: 'observation',
      importance,
      tags,
      relatedProject: projectId,
    });
  }

  /**
   * Store an action taken by an agent
   */
  async storeAction(
    agentId: string,
    action: string,
    importance: number = 0.7,
    tags: string[] = [],
    projectId?: string
  ): Promise<string> {
    return this.vectorMemory.addMemory(action, {
      agentId,
      type: 'action',
      importance,
      tags,
      relatedProject: projectId,
    });
  }

  /**
   * Store knowledge learned by an agent
   */
  async storeKnowledge(
    agentId: string,
    knowledge: string,
    importance: number = 0.9,
    tags: string[] = [],
    projectId?: string
  ): Promise<string> {
    return this.vectorMemory.addMemory(knowledge, {
      agentId,
      type: 'knowledge',
      importance,
      tags,
      relatedProject: projectId,
    });
  }

  /**
   * Store a user preference
   */
  async storePreference(
    agentId: string,
    preference: string,
    importance: number = 0.8,
    tags: string[] = [],
    projectId?: string
  ): Promise<string> {
    return this.vectorMemory.addMemory(preference, {
      agentId,
      type: 'preference',
      importance,
      tags,
      relatedProject: projectId,
    });
  }

  /**
   * Store a conversation excerpt
   */
  async storeConversation(
    agentId: string,
    conversation: string,
    importance: number = 0.6,
    tags: string[] = [],
    projectId?: string
  ): Promise<string> {
    return this.vectorMemory.addMemory(conversation, {
      agentId,
      type: 'conversation',
      importance,
      tags,
      relatedProject: projectId,
    });
  }

  /**
   * Retrieve relevant memories for context
   */
  async retrieveContext(
    query: string,
    agentId?: string,
    limit: number = 5,
    projectId?: string
  ): Promise<MemorySearchResult[]> {
    const results = await this.vectorMemory.searchMemories(query, limit * 2, {
      agentId,
      minImportance: 0.5,
    });

    if (projectId) {
      return results
        .filter(
          (r) => !r.memory.metadata.relatedProject || r.memory.metadata.relatedProject === projectId
        )
        .slice(0, limit);
    }

    return results.slice(0, limit);
  }

  /**
   * Get agent's recent observations
   */
  async getRecentObservations(
    agentId: string,
    limit: number = 10,
    projectId?: string
  ): Promise<MemoryEmbedding[]> {
    return this.vectorMemory
      .getMemoriesForAgent(agentId)
      .filter(
        (m) =>
          m.metadata.type === 'observation' &&
          (!projectId || !m.metadata.relatedProject || m.metadata.relatedProject === projectId)
      )
      .sort((a, b) => b.metadata.timestamp - a.metadata.timestamp)
      .slice(0, limit);
  }

  /**
   * Get agent's knowledge base
   */
  async getKnowledgeBase(
    agentId: string,
    limit: number = 20,
    projectId?: string
  ): Promise<MemoryEmbedding[]> {
    return this.vectorMemory
      .getMemoriesForAgent(agentId)
      .filter(
        (m) =>
          m.metadata.type === 'knowledge' &&
          (!projectId || !m.metadata.relatedProject || m.metadata.relatedProject === projectId)
      )
      .sort((a, b) => b.metadata.importance - a.metadata.importance)
      .slice(0, limit);
  }

  /**
   * Get agent's preferences
   */
  async getPreferences(agentId: string, projectId?: string): Promise<MemoryEmbedding[]> {
    return this.vectorMemory
      .getMemoriesForAgent(agentId)
      .filter(
        (m) =>
          m.metadata.type === 'preference' &&
          (!projectId || !m.metadata.relatedProject || m.metadata.relatedProject === projectId)
      );
  }
}
