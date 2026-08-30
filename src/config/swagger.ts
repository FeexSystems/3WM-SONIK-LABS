// Swagger/OpenAPI Configuration for 3WM SONIK API Documentation

import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '3WM SONIK API',
      version: '1.0.0',
      description: 'Cinematic AI Music Production Platform API - Built for the Sound of Africa',
      contact: {
        name: '3WM SONIK Support',
        email: 'support@3wm-sonik.com',
      },
      license: {
        name: 'Proprietary',
        url: 'https://3wm-sonik.com/license',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://3wm-sonik.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'JWT authentication token. Obtain from /api/auth/login or /api/auth/register',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            message: {
              type: 'string',
              description: 'Detailed error message',
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
            },
            data: {
              type: 'object',
            },
          },
        },
        Track: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'track-1234567890',
            },
            title: {
              type: 'string',
              example: 'Afrofusion Session 1',
            },
            artist: {
              type: 'string',
              example: 'Kappachino Emar x Kappachino Ricky',
            },
            genre: {
              type: 'string',
              example: 'Afrofusion',
            },
            bpm: {
              type: 'number',
              example: 112,
            },
            key: {
              type: 'string',
              example: 'F# Minor',
            },
            duration: {
              type: 'number',
              example: 180,
            },
            status: {
              type: 'string',
              enum: ['raw', 'production', 'mastered', 'ARCHIVED'],
              example: 'production',
            },
            settings: {
              type: 'object',
              properties: {
                volume: {
                  type: 'number',
                  example: 0.88,
                },
                pan: {
                  type: 'number',
                  example: 0,
                },
              },
            },
          },
        },
        CreateTrackRequest: {
          type: 'object',
          required: ['title'],
          properties: {
            title: {
              type: 'string',
              example: 'Lagos Nights',
            },
            artist: {
              type: 'string',
              example: 'Kappachino Ricky',
            },
            genre: {
              type: 'string',
              example: 'Afrofusion',
            },
            bpm: {
              type: 'number',
              example: 115,
            },
            key: {
              type: 'string',
              example: 'D Minor',
            },
          },
        },
        AICommandRequest: {
          type: 'object',
          required: ['agent', 'command'],
          properties: {
            agent: {
              type: 'string',
              enum: ['emar', 'ricky', 'kingpin', 'orchestrator'],
              example: 'emar',
            },
            command: {
              type: 'string',
              example: 'Add more warmth to the vocals and boost the low-mids',
            },
            audioBase64: {
              type: 'string',
              description: 'Base64 encoded audio data (optional)',
            },
            audioMimeType: {
              type: 'string',
              example: 'audio/wav',
            },
          },
        },
        ExportJobRequest: {
          type: 'object',
          properties: {
            format: {
              type: 'string',
              enum: ['wav', 'mp3'],
              example: 'wav',
            },
            sampleRate: {
              type: 'integer',
              example: 48000,
            },
            bitDepth: {
              type: 'integer',
              example: 24,
            },
            includeStems: {
              type: 'boolean',
              example: false,
            },
            masterPreset: {
              type: 'string',
              example: 'Lagos Bounce',
            },
            idempotencyKey: {
              type: 'string',
              example: 'export-abc123',
            },
          },
        },
        VocalSynthesizeRequest: {
          type: 'object',
          required: ['text'],
          properties: {
            text: {
              type: 'string',
              example: 'Three Wise Men, one vision, infinite sound.',
            },
            voiceId: {
              type: 'string',
              example: '21m00Tcm4TlvDq8ikWAM',
            },
            model: {
              type: 'string',
              example: 'eleven_multilingual_v2',
            },
            outputFormat: {
              type: 'string',
              example: 'mp3',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check and system status endpoints',
      },
      {
        name: 'Authentication',
        description: 'User authentication and session management',
      },
      {
        name: 'Tracks',
        description: 'Audio track management and operations',
      },
      {
        name: 'Projects',
        description: 'Project management and organization',
      },
      {
        name: 'AI Agents',
        description: 'AI-powered music production agents',
      },
      {
        name: 'Vocal',
        description: 'Voice synthesis and vocal processing',
      },
      {
        name: 'Exports',
        description: 'Audio export and rendering operations',
      },
      {
        name: 'Collaboration',
        description: 'Real-time collaboration features',
      },
      {
        name: 'Memory',
        description: 'Vector memory and knowledge base operations',
      },
    ],
  },
  apis: ['./server.ts'], // Path to the API documentation
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
