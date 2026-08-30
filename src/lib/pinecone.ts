import { Pinecone } from '@pinecone-database/pinecone';

export interface PineconeClientInstance {
  index: (name: string) => any;
}

let pinecone: PineconeClientInstance | null = null;

export function getPineconeClient(): PineconeClientInstance | null {
  if (pinecone) {
    return pinecone;
  }

  const apiKey = typeof process !== 'undefined' ? process.env?.PINECONE_API_KEY : undefined;
  if (!apiKey) {
    return null;
  }

  try {
    pinecone = new Pinecone({ apiKey });
    return pinecone;
  } catch (error) {
    console.warn('Pinecone client initialization skipped:', error);
    return null;
  }
}

export const pineconeClient = getPineconeClient();
