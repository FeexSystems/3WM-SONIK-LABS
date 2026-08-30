/**
 * Input Validation Middleware using Zod
 * Part of Phase 6.2.3: Implement input validation middleware using Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import {
  CreateTrackSchema,
  UpdateTrackSettingsSchema,
  GenerateStemSchema,
  CreateProjectSchema,
  UpdateProjectSchema,
  AddVocalLibrarySchema,
  VocalSynthesisSchema,
  AgentCommandSchema,
  ExportTrackSchema,
  TrackQuerySchema,
} from './validationSchemas';

// Validation error response format
interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Validation middleware factory
export const validate = (schema: ZodSchema, source: 'body' | 'params' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = source === 'body' ? req.body : source === 'params' ? req.params : req.query;
      schema.parse(data);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: ValidationError[] = error.issues.map((err: any) => ({
          field: err.path.map(String).join('.'),
          message: err.message,
          code: err.code,
        }));

        res.status(400).json({
          error: 'Validation failed',
          details: errors,
        });
      } else {
        res.status(500).json({
          error: 'Internal server error during validation',
        });
      }
    }
  };
};

// ==========================================
// Specific Validation Middleware Functions
// ==========================================

// Track validation middleware
export const validateCreateTrack = validate(CreateTrackSchema, 'body');
export const validateUpdateTrackSettings = validate(UpdateTrackSettingsSchema, 'body');
export const validateGenerateStem = validate(GenerateStemSchema, 'body');
export const validateTrackQuery = validate(TrackQuerySchema, 'query');

// Project validation middleware
export const validateCreateProject = validate(CreateProjectSchema, 'body');
export const validateUpdateProject = validate(UpdateProjectSchema, 'body');

// Vocal validation middleware
export const validateAddVocalLibrary = validate(AddVocalLibrarySchema, 'body');
export const validateVocalSynthesis = validate(VocalSynthesisSchema, 'body');

// Agent validation middleware
export const validateAgentCommand = validate(AgentCommandSchema, 'body');

// Export validation middleware
export const validateExportTrack = validate(ExportTrackSchema, 'body');

// ==========================================
// Async Validation Middleware for Complex Validation
// ==========================================

// Async validation middleware for scenarios requiring additional checks
export const validateAsync = async (
  schema: ZodSchema,
  data: any,
  additionalChecks?: (data: any) => Promise<boolean>
): Promise<{ success: boolean; errors?: ValidationError[] }> => {
  try {
    schema.parse(data);

    if (additionalChecks) {
      const additionalValid = await additionalChecks(data);
      if (!additionalValid) {
        return {
          success: false,
          errors: [{ field: 'custom', message: 'Additional validation failed' }],
        };
      }
    }

    return { success: true };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: ValidationError[] = error.issues.map((err: any) => ({
        field: err.path.map(String).join('.'),
        message: err.message,
        code: err.code,
      }));
      return { success: false, errors };
    }
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Unknown validation error' }],
    };
  }
};

// ==========================================
// Sanitization Middleware
// ==========================================

// Sanitize input to prevent XSS and injection attacks
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    sanitizeObject(req.body);
  }
  if (req.query) {
    sanitizeObject(req.query);
  }
  if (req.params) {
    sanitizeObject(req.params);
  }
  next();
};

function sanitizeObject(obj: any): void {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Use DOMPurify for robust HTML sanitization
      obj[key] = DOMPurify.sanitize(obj[key]).trim();
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

// ==========================================
// Type Guards
// ==========================================

// Check if error is a Zod validation error
export function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}

// Format Zod error for API response
export function formatZodError(error: ZodError): ValidationError[] {
  return error.issues.map((err: any) => ({
    field: err.path.map(String).join('.'),
    message: err.message,
    code: err.code,
  }));
}
