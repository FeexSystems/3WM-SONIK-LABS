/**
 * Centralized Error Handling Middleware
 * Provides standardized error responses across all API endpoints
 */

import { Request, Response, NextFunction } from 'express';

export interface ApiError {
  statusCode: number;
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  path?: string;
  method?: string;
  requestId?: string;
}

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}

// Predefined error types
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', details);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 503, 'SERVICE_UNAVAILABLE', details);
  }
}

// ==========================================
// Error Response Formatter
// ==========================================

function formatErrorResponse(error: AppError | Error, req: Request): ApiError {
  const isAppError = error instanceof AppError;
  const statusCode = isAppError ? error.statusCode : 500;
  const code = isAppError ? error.code : 'INTERNAL_ERROR';
  const message = error.message;
  const details = isAppError ? error.details : undefined;

  const apiError: ApiError = {
    statusCode,
    code,
    message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    requestId: req.headers['x-request-id'] as string,
  };

  // Include details in development mode
  if (process.env.NODE_ENV === 'development' && details) {
    apiError.details = details;
  }

  // Include stack trace in development mode
  if (process.env.NODE_ENV === 'development' && error.stack) {
    apiError.details = {
      ...apiError.details,
      stack: error.stack,
    };
  }

  return apiError;
}

// ==========================================
// Main Error Handling Middleware
// ==========================================

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  // Log error for monitoring
  console.error(`[Error Handler] ${req.method} ${req.path}:`, err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Format error response
  const apiError = formatErrorResponse(err, req);

  // Send standardized error response
  res.status(apiError.statusCode).json(apiError);
};

// ==========================================
// 404 Not Found Handler
// ==========================================

export const notFoundHandler = (req: Request, res: Response): void => {
  const apiError: ApiError = {
    statusCode: 404,
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    requestId: req.headers['x-request-id'] as string,
  };

  res.status(404).json(apiError);
};

// ==========================================
// Async Error Wrapper
// ==========================================

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ==========================================
// Validation Error Handler
// ==========================================

export const validationErrorHandler = (req: Request, res: Response, next: NextFunction): void => {
  const errors = (req as any).validationErrors;
  if (errors && errors.length > 0) {
    const apiError: ApiError = {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: { errors },
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      requestId: req.headers['x-request-id'] as string,
    };

    res.status(400).json(apiError);
    return;
  }
  next();
};

// ==========================================
// Generic Error Response Builder
// ==========================================

export const sendErrorResponse = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: any
): void => {
  const apiError: ApiError = {
    statusCode,
    code,
    message,
    timestamp: new Date().toISOString(),
  };

  if (details && process.env.NODE_ENV === 'development') {
    apiError.details = details;
  }

  res.status(statusCode).json(apiError);
};

// ==========================================
// Success Response Builder
// ==========================================

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

export const sendSuccessResponse = <T>(res: Response, data: T, message?: string): void => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  if (message) {
    response.message = message;
  }

  res.json(response);
};
