/**
 * Standardized Error Classes
 * Provides consistent error handling across all services
 */

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      'NOT_FOUND',
      id ? `${resource} with ID ${id} not found` : `${resource} not found`,
      404,
      { resource, id }
    );
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, fields?: Record<string, any>) {
    super('VALIDATION_ERROR', message, 400, { fields });
    this.name = 'ValidationError';
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string, rule?: string) {
    super('BUSINESS_RULE_ERROR', message, 422, { rule });
    this.name = 'BusinessRuleError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super('UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super('FORBIDDEN', message, 403);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, resource?: string) {
    super('CONFLICT', message, 409, { resource });
    this.name = 'ConflictError';
  }
}

export class WorkflowError extends AppError {
  constructor(
    message: string,
    public step?: string,
    public rollbackRequired: boolean = false
  ) {
    super('WORKFLOW_ERROR', message, 500, { step, rollbackRequired });
    this.name = 'WorkflowError';
  }
}

/**
 * Check if error is an AppError instance
 */
export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

/**
 * Convert any error to AppError
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AppError('UNKNOWN_ERROR', error.message, 500, { originalError: error.name });
  }
  
  return new AppError('UNKNOWN_ERROR', 'An unknown error occurred', 500);
}

