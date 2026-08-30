// @ts-nocheck — legacy Jest setup, now Vitest uses src/test/setup.ts
// 3WM SONIK - Jest Test Setup (deprecated, kept for reference)
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

Object.assign(global, { TextDecoder, TextEncoder });
global.setImmediate =
  global.setImmediate ||
  ((fn: (...args: any[]) => void, ...args: any[]) => global.setTimeout(fn, 0, ...args));

// Mock Web Audio API for testing using standardized-audio-context-mock
const mockAudioContext = require('standardized-audio-context-mock');

Object.assign(global, mockAudioContext);
global.window.AudioContext = mockAudioContext.AudioContext as any;

global.AudioParam = class MockAudioParam {
  value = 1;
  linearRampToValueAtTime = jest.fn();
} as any;
global.window.AudioParam = global.AudioParam;

// Mock Firebase
jest.mock('./lib/firebase', () => ({
  app: null,
  auth: null,
  db: null,
  googleAuthProvider: null,
}));

jest.mock('./lib/firebase-admin', () => ({
  adminAuth: null,
  adminDb: null,
}));

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only';
process.env.PORT = '3001';
process.env.VITE_ELEVENLABS_API_KEY = 'test-elevenlabs-api-key';

// Suppress console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
