// 3WM SONIK - Environment Configuration & Validation Service
// This service loads and validates all environment variables

// Try to load dotenv only in Node.js environments.
// We use a dynamic require string to hide it from Vite's static analyzer,
// preventing it from throwing "Module 'path' has been externalized" errors.
if (typeof process !== 'undefined' && process.versions?.node) {
  try {
    const moduleName = 'dotenv';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dotenv = require(moduleName) as { config: () => void };
    dotenv.config();
  } catch {
    // Ignore if not available
  }
}

interface EnvironmentConfig {
  // Database
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceKey?: string;
  postgresUrl?: string;
  postgresUser?: string;
  postgresPassword?: string;
  postgresDatabase?: string;

  // AI Services
  geminiApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  elevenlabsApiKey?: string;
  elevenlabsModel?: string;
  elevenlabsDefaultVoice?: string;
  elevenlabsCacheEnabled?: boolean;
  elevenlabsMaxCacheSize?: number;
  grokApiKey?: string;
  perplexityApiKey?: string;
  trueFoundryApiKey?: string;

  // Firebase
  firebaseProjectId?: string;
  firebaseAppId?: string;
  firebaseApiKey?: string;
  firebaseAuthDomain?: string;
  firebaseDatabaseId?: string;
  firebaseStorageBucket?: string;
  firebaseMessagingSenderId?: string;
  firebaseMeasurementId?: string;
  firebaseOauthClientId?: string;
  firebaseRecaptchaSiteKey?: string;

  // Firebase Admin
  firebaseAdminProjectId?: string;
  firebaseAdminClientEmail?: string;
  firebaseAdminPrivateKey?: string;
  firebaseAdminPrivateKeyId?: string;

  // Authentication
  jwtSecret: string;
  jwtExpiration: string;
  sessionSecret?: string;

  // Redis
  redisUrl?: string;
  redisPassword?: string;
  redisDb?: number;

  // Vector Database
  pineconeApiKey?: string;
  pineconeEnvironment?: string;
  pineconeIndexName?: string;
  weaviateUrl?: string;
  weaviateApiKey?: string;

  // AWS S3 / Supabase S3
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsRegion?: string;
  awsEndpointUrl?: string;
  awsS3Bucket?: string;

  // Application
  nodeEnv: string;
  port: number;
  host: string;

  // Audio Engine
  audioBufferSize: number;
  audioSampleRate: number;
  audioBitDepth: number;

  // Collaboration
  collaborationEnabled: boolean;
  socketIoCorsOrigin?: string;

  // Monitoring
  sentryDsn?: string;
  logLevel: string;
}

export class EnvironmentValidationError extends Error {
  constructor(missingVars: string[]) {
    super(`Missing required environment variables: ${missingVars.join(', ')}`);
    this.name = 'EnvironmentValidationError';
  }
}

/** True when running inside a browser (window + document exist). */
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

function getEnv(key: string, fallback?: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] ?? process.env[`VITE_${key}`] ?? fallback;
  }
  if (isBrowser) {
    try {
      const viteEnv = (globalThis as unknown as { __VITE_ENV__?: Record<string, string> })
        .__VITE_ENV__;
      const viteKey = `VITE_${key}`;
      return viteEnv?.[viteKey] ?? viteEnv?.[key] ?? fallback;
    } catch {
      // Fall through
    }
  }
  return fallback;
}

class EnvironmentConfigService {
  private config: EnvironmentConfig;
  private requiredVars: (keyof EnvironmentConfig)[] = [
    'jwtSecret',
    'nodeEnv',
    'port',
    'host',
    'logLevel',
  ];

  constructor() {
    this.config = this.loadConfig();
    // Only enforce strict validation on the server.
    // In the browser, server-only secrets (jwtSecret, sessionSecret, etc.)
    // will never exist and that's perfectly fine.
    if (!isBrowser) {
      this.validateConfig();
    }
  }

  private loadConfig(): EnvironmentConfig {
    return {
      // Database
      supabaseUrl: getEnv('SUPABASE_URL'),
      supabaseAnonKey: getEnv('SUPABASE_ANON_KEY'),
      supabaseServiceKey: getEnv('SUPABASE_SERVICE_KEY'),
      postgresUrl: getEnv('POSTGRES_URL'),
      postgresUser: getEnv('POSTGRES_USER'),
      postgresPassword: getEnv('POSTGRES_PASSWORD'),
      postgresDatabase: getEnv('POSTGRES_DATABASE'),

      // AI Services
      geminiApiKey: getEnv('GEMINI_API_KEY'),
      openaiApiKey: getEnv('OPENAI_API_KEY'),
      anthropicApiKey: getEnv('ANTHROPIC_API_KEY'),
      elevenlabsApiKey: getEnv('ELEVENLABS_API_KEY'),
      elevenlabsModel: getEnv('ELEVENLABS_MODEL'),
      elevenlabsDefaultVoice: getEnv('ELEVENLABS_DEFAULT_VOICE'),
      elevenlabsCacheEnabled: getEnv('ELEVENLABS_CACHE_ENABLED') === 'true',
      elevenlabsMaxCacheSize: parseInt(getEnv('ELEVENLABS_MAX_CACHE_SIZE', '100')!, 10),
      grokApiKey: getEnv('GROK_API_KEY'),
      perplexityApiKey: getEnv('PERPLEXITY_API_KEY'),
      trueFoundryApiKey: getEnv('TRUEFOUNDRY_API_KEY'),

      // Firebase
      firebaseProjectId: getEnv('FIREBASE_PROJECT_ID'),
      firebaseAppId: getEnv('FIREBASE_APP_ID'),
      firebaseApiKey: getEnv('FIREBASE_API_KEY'),
      firebaseAuthDomain: getEnv('FIREBASE_AUTH_DOMAIN'),
      firebaseDatabaseId: getEnv('FIREBASE_DATABASE_ID'),
      firebaseStorageBucket: getEnv('FIREBASE_STORAGE_BUCKET'),
      firebaseMessagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID'),
      firebaseMeasurementId: getEnv('FIREBASE_MEASUREMENT_ID'),
      firebaseOauthClientId: getEnv('FIREBASE_OAUTH_CLIENT_ID'),
      firebaseRecaptchaSiteKey: getEnv('FIREBASE_RECAPTCHA_SITE_KEY'),

      // Firebase Admin
      firebaseAdminProjectId: getEnv('FIREBASE_ADMIN_PROJECT_ID'),
      firebaseAdminClientEmail: getEnv('FIREBASE_ADMIN_CLIENT_EMAIL'),
      firebaseAdminPrivateKey: getEnv('FIREBASE_ADMIN_PRIVATE_KEY'),
      firebaseAdminPrivateKeyId: getEnv('FIREBASE_ADMIN_PRIVATE_KEY_ID'),

      // Authentication
      jwtSecret: getEnv('JWT_SECRET')!,
      jwtExpiration: getEnv('JWT_EXPIRATION', '7d')!,
      sessionSecret: getEnv('SESSION_SECRET'),

      // Redis
      redisUrl: getEnv('REDIS_URL'),
      redisPassword: getEnv('REDIS_PASSWORD'),
      redisDb: parseInt(getEnv('REDIS_DB', '0')!, 10),

      // Vector Database
      pineconeApiKey: getEnv('PINECONE_API_KEY'),
      pineconeEnvironment: getEnv('PINECONE_ENVIRONMENT'),
      pineconeIndexName: getEnv('PINECONE_INDEX_NAME'),
      weaviateUrl: getEnv('WEAVIATE_URL'),
      weaviateApiKey: getEnv('WEAVIATE_API_KEY'),

      // AWS S3 / Supabase S3
      awsAccessKeyId: getEnv('AWS_ACCESS_KEY_ID'),
      awsSecretAccessKey: getEnv('AWS_SECRET_ACCESS_KEY'),
      awsRegion: getEnv('AWS_REGION'),
      awsEndpointUrl: getEnv('AWS_ENDPOINT_URL'),
      awsS3Bucket: getEnv('AWS_S3_BUCKET'),

      // Application
      nodeEnv: getEnv('NODE_ENV', 'development')!,
      port: parseInt(getEnv('PORT', '3001')!, 10),
      host: getEnv('HOST', '0.0.0.0')!,

      // Audio Engine
      audioBufferSize: parseInt(getEnv('AUDIO_BUFFER_SIZE', '16384')!, 10),
      audioSampleRate: parseInt(getEnv('AUDIO_SAMPLE_RATE', '48000')!, 10),
      audioBitDepth: parseInt(getEnv('AUDIO_BIT_DEPTH', '24')!, 10),

      // Collaboration
      collaborationEnabled: getEnv('COLLABORATION_ENABLED') === 'true',
      socketIoCorsOrigin: getEnv('SOCKET_IO_CORS_ORIGIN'),

      // Monitoring
      sentryDsn: getEnv('SENTRY_DSN'),
      logLevel: getEnv('LOG_LEVEL', 'info')!,
    };
  }

  private validateConfig(): void {
    const missingVars: string[] = [];

    this.requiredVars.forEach((varName) => {
      const value = this.config[varName];
      if (value === undefined || value === null || value === '') {
        missingVars.push(varName);
      }
    });

    // Additional production-specific validation
    if (this.config.nodeEnv === 'production') {
      const productionRequiredVars: (keyof EnvironmentConfig)[] = ['jwtSecret', 'sessionSecret'];

      productionRequiredVars.forEach((varName) => {
        const value = this.config[varName];
        if (!value || value === '') {
          missingVars.push(varName);
        }
      });
    }

    if (missingVars.length > 0) {
      throw new EnvironmentValidationError(missingVars);
    }

    // Validate numeric values
    if (isNaN(this.config.port)) {
      throw new Error('Invalid PORT value: must be a number');
    }
    if (isNaN(this.config.audioBufferSize)) {
      throw new Error('Invalid AUDIO_BUFFER_SIZE value: must be a number');
    }
    if (isNaN(this.config.audioSampleRate)) {
      throw new Error('Invalid AUDIO_SAMPLE_RATE value: must be a number');
    }
    if (isNaN(this.config.audioBitDepth)) {
      throw new Error('Invalid AUDIO_BIT_DEPTH value: must be a number');
    }

    // Validate JWT secret strength
    if (this.config.jwtSecret && this.config.jwtSecret.length < 32) {
      console.warn('JWT_SECRET is too short (minimum 32 characters recommended)');
    }

    // Validate environment
    const validEnvs = ['development', 'production', 'test'];
    if (!validEnvs.includes(this.config.nodeEnv)) {
      throw new Error(`Invalid NODE_ENV: must be one of ${validEnvs.join(', ')}`);
    }
  }

  public getConfig(): EnvironmentConfig {
    return this.config;
  }

  public isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  public isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  public isTest(): boolean {
    return this.config.nodeEnv === 'test';
  }

  public getFirebaseConfig(): Record<string, unknown> | null {
    if (!this.config.firebaseProjectId) {
      console.warn('Firebase configuration incomplete - some features may not work');
      return null;
    }

    return {
      projectId: this.config.firebaseProjectId,
      appId: this.config.firebaseAppId,
      apiKey: this.config.firebaseApiKey,
      authDomain: this.config.firebaseAuthDomain,
      databaseId: this.config.firebaseDatabaseId,
      storageBucket: this.config.firebaseStorageBucket,
      messagingSenderId: this.config.firebaseMessagingSenderId,
      measurementId: this.config.firebaseMeasurementId,
      oAuthClientId: this.config.firebaseOauthClientId,
      recaptchaSiteKey: this.config.firebaseRecaptchaSiteKey,
    };
  }

  public getFirebaseAdminConfig(): {
    projectId: string;
    clientEmail?: string;
    privateKey: string;
    privateKeyId?: string;
  } | null {
    if (!this.config.firebaseAdminProjectId || !this.config.firebaseAdminPrivateKey) {
      console.warn('Firebase Admin configuration incomplete - admin features may not work');
      return null;
    }

    return {
      projectId: this.config.firebaseAdminProjectId,
      clientEmail: this.config.firebaseAdminClientEmail,
      privateKey: this.config.firebaseAdminPrivateKey.replace(/\\n/g, '\n'),
      privateKeyId: this.config.firebaseAdminPrivateKeyId,
    };
  }
}

// Export singleton instance
export const envConfig = new EnvironmentConfigService();
export type { EnvironmentConfig };
