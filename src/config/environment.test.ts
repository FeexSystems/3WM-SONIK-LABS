// 3WM SONIK - Environment Configuration Tests
import { envConfig, EnvironmentValidationError } from './environment';

describe('Environment Configuration', () => {
  beforeEach(() => {
    // Reset environment before each test
    jest.resetModules();
  });

  describe('Configuration Loading', () => {
    it('should load configuration with required variables', () => {
      process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters';
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3001';
      process.env.HOST = 'localhost';
      process.env.LOG_LEVEL = 'info';

      const config = envConfig.getConfig();

      expect(config.jwtSecret).toBe('test-secret-key-minimum-32-characters');
      expect(config.nodeEnv).toBe('test');
      expect(config.port).toBe(3001);
      expect(config.host).toBe('localhost');
      expect(config.logLevel).toBe('info');
    });

    it('should use default values for optional variables', () => {
      process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters';
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3001';
      process.env.HOST = 'localhost';
      process.env.LOG_LEVEL = 'info';

      const config = envConfig.getConfig();

      expect(config.audioBufferSize).toBe(16384);
      expect(config.audioSampleRate).toBe(48000);
      expect(config.audioBitDepth).toBe(24);
      expect(config.jwtExpiration).toBe('7d');
    });
  });

  describe('Environment Detection', () => {
    it('should detect development environment', () => {
      process.env.NODE_ENV = 'development';
      process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters';
      process.env.PORT = '3001';
      process.env.HOST = 'localhost';
      process.env.LOG_LEVEL = 'info';

      expect(envConfig.isDevelopment()).toBe(true);
      expect(envConfig.isProduction()).toBe(false);
      expect(envConfig.isTest()).toBe(false);
    });

    it('should detect production environment', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters';
      process.env.PORT = '3001';
      process.env.HOST = 'localhost';
      process.env.LOG_LEVEL = 'info';

      expect(envConfig.isDevelopment()).toBe(false);
      expect(envConfig.isProduction()).toBe(true);
      expect(envConfig.isTest()).toBe(false);
    });

    it('should detect test environment', () => {
      process.env.NODE_ENV = 'test';
      process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters';
      process.env.PORT = '3001';
      process.env.HOST = 'localhost';
      process.env.LOG_LEVEL = 'info';

      expect(envConfig.isDevelopment()).toBe(false);
      expect(envConfig.isProduction()).toBe(false);
      expect(envConfig.isTest()).toBe(true);
    });
  });

  describe('Configuration Validation', () => {
    it('should throw error for missing required variables', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3001';
      process.env.HOST = 'localhost';
      process.env.LOG_LEVEL = 'info';
      // Missing JWT_SECRET

      expect(() => {
        envConfig.getConfig();
      }).toThrow(EnvironmentValidationError);
    });

    it('should reject invalid NODE_ENV', () => {
      process.env.NODE_ENV = 'invalid';
      process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters';
      process.env.PORT = '3001';
      process.env.HOST = 'localhost';
      process.env.LOG_LEVEL = 'info';

      expect(() => {
        envConfig.getConfig();
      }).toThrow('Invalid NODE_ENV');
    });

    it('should reject invalid PORT', () => {
      process.env.NODE_ENV = 'test';
      process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters';
      process.env.PORT = 'invalid';
      process.env.HOST = 'localhost';
      process.env.LOG_LEVEL = 'info';

      expect(() => {
        envConfig.getConfig();
      }).toThrow('Invalid PORT value');
    });
  });

  describe('Firebase Configuration', () => {
    it('should return null when Firebase configuration is incomplete', () => {
      process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters';
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3001';
      process.env.HOST = 'localhost';
      process.env.LOG_LEVEL = 'info';

      const firebaseConfig = envConfig.getFirebaseConfig();
      expect(firebaseConfig).toBeNull();
    });

    it('should return Firebase config when all variables are set', () => {
      process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters';
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3001';
      process.env.HOST = 'localhost';
      process.env.LOG_LEVEL = 'info';
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_APP_ID = 'test-app-id';
      process.env.FIREBASE_API_KEY = 'test-api-key';

      const firebaseConfig = envConfig.getFirebaseConfig();
      expect(firebaseConfig).not.toBeNull();
      expect(firebaseConfig?.projectId).toBe('test-project');
      expect(firebaseConfig?.appId).toBe('test-app-id');
      expect(firebaseConfig?.apiKey).toBe('test-api-key');
    });
  });

  describe('Audio Engine Configuration', () => {
    it('should parse audio configuration correctly', () => {
      process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters';
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3001';
      process.env.HOST = 'localhost';
      process.env.LOG_LEVEL = 'info';
      process.env.AUDIO_BUFFER_SIZE = '8192';
      process.env.AUDIO_SAMPLE_RATE = '44100';
      process.env.AUDIO_BIT_DEPTH = '16';

      const config = envConfig.getConfig();
      expect(config.audioBufferSize).toBe(8192);
      expect(config.audioSampleRate).toBe(44100);
      expect(config.audioBitDepth).toBe(16);
    });
  });
});
