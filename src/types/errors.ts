/**
 * API Error Types and Classes
 * Standardizes error handling across the application
 */

// Error codes from API documentation
export enum APIErrorCode {
    // General
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
    NETWORK_ERROR = 'NETWORK_ERROR',
    TIMEOUT_ERROR = 'TIMEOUT_ERROR',

    // Validation
    VALIDATION_FAILED = 'VALIDATION_FAILED',
    REQUIRED_FIELD = 'REQUIRED_FIELD',
    INVALID_FORMAT = 'INVALID_FORMAT',
    FIELD_TOO_LONG = 'FIELD_TOO_LONG',

    // Authentication
    UNAUTHORIZED = 'UNAUTHORIZED',
    INVALID_TOKEN = 'INVALID_TOKEN',
    TOKEN_EXPIRED = 'TOKEN_EXPIRED',
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

    // Authorization
    FORBIDDEN = 'FORBIDDEN',
    INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

    // Resources
    NOT_FOUND = 'NOT_FOUND',
    RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',

    // Conflicts
    CONFLICT = 'CONFLICT',
    DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
    CONCURRENT_MODIFICATION = 'CONCURRENT_MODIFICATION',

    // Rate Limiting
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

    // File Upload
    FILE_TOO_LARGE = 'FILE_TOO_LARGE',
    INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
    PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE',

    // Server Errors
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
    BAD_GATEWAY = 'BAD_GATEWAY',
}

// Field-level validation error
export interface FieldError {
    field: string;
    message: string;
    code?: string;
    rejectedValue?: any;
}

// Standardized API error response
export interface APIErrorResponse {
    status: number;
    code: APIErrorCode;
    message: string;
    errors?: FieldError[];
    timestamp?: string;
    path?: string;
    requestId?: string;
}

/**
 * Custom API Error class
 */
export class APIError extends Error {
    public readonly status: number;
    public readonly code: APIErrorCode;
    public readonly errors?: FieldError[];
    public readonly timestamp?: string;
    public readonly path?: string;
    public readonly requestId?: string;
    public readonly isAPIError = true;

    constructor(response: APIErrorResponse) {
        super(response.message);
        this.name = 'APIError';
        this.status = response.status;
        this.code = response.code;
        this.errors = response.errors;
        this.timestamp = response.timestamp;
        this.path = response.path;
        this.requestId = response.requestId;

        // Maintains proper stack trace for where error was thrown (only available on V8)
        if (typeof (Error as any).captureStackTrace === 'function') {
            (Error as any).captureStackTrace(this, APIError);
        }
    }

    /**
     * Check if error is a specific type
     */
    is(code: APIErrorCode): boolean {
        return this.code === code;
    }

    /**
     * Get field-specific error message
     */
    getFieldError(fieldName: string): string | null {
        if (!this.errors) return null;
        const error = this.errors.find(e => e.field === fieldName);
        return error?.message || null;
    }

    /**
     * Get all field error messages
     */
    getAllFieldErrors(): Record<string, string> {
        if (!this.errors) return {};

        const result: Record<string, string> = {};
        this.errors.forEach(error => {
            result[error.field] = error.message;
        });
        return result;
    }

    /**
     * Check if error is retryable
     */
    isRetryable(): boolean {
        return [
            APIErrorCode.RATE_LIMIT_EXCEEDED,
            APIErrorCode.TOO_MANY_REQUESTS,
            APIErrorCode.INTERNAL_ERROR,
            APIErrorCode.SERVICE_UNAVAILABLE,
            APIErrorCode.BAD_GATEWAY,
            APIErrorCode.TIMEOUT_ERROR,
            APIErrorCode.NETWORK_ERROR,
        ].includes(this.code);
    }

    /**
     * Check if error is authentication-related
     */
    isAuthError(): boolean {
        return [
            APIErrorCode.UNAUTHORIZED,
            APIErrorCode.INVALID_TOKEN,
            APIErrorCode.TOKEN_EXPIRED,
            APIErrorCode.INVALID_CREDENTIALS,
        ].includes(this.code);
    }

    /**
     * Check if error is permission-related
     */
    isPermissionError(): boolean {
        return [
            APIErrorCode.FORBIDDEN,
            APIErrorCode.INSUFFICIENT_PERMISSIONS,
        ].includes(this.code);
    }

    /**
     * Get user-friendly error message
     */
    getUserMessage(): string {
        // Return custom message for common errors
        switch (this.code) {
            case APIErrorCode.NETWORK_ERROR:
                return 'Network connection failed. Please check your internet connection.';
            case APIErrorCode.TIMEOUT_ERROR:
                return 'Request timed out. Please try again.';
            case APIErrorCode.UNAUTHORIZED:
            case APIErrorCode.TOKEN_EXPIRED:
                return 'Your session has expired. Please log in again.';
            case APIErrorCode.FORBIDDEN:
                return 'You do not have permission to perform this action.';
            case APIErrorCode.NOT_FOUND:
                return 'The requested resource was not found.';
            case APIErrorCode.RATE_LIMIT_EXCEEDED:
                return 'Too many requests. Please wait a moment and try again.';
            case APIErrorCode.INTERNAL_ERROR:
                return 'An unexpected error occurred. Please try again later.';
            default:
                return this.message || 'An error occurred. Please try again.';
        }
    }

    /**
     * Convert to JSON for logging
     */
    toJSON(): object {
        return {
            name: this.name,
            message: this.message,
            status: this.status,
            code: this.code,
            errors: this.errors,
            timestamp: this.timestamp,
            path: this.path,
            requestId: this.requestId,
            stack: this.stack,
        };
    }
}

/**
 * Parse backend error response into APIError
 */
export function parseAPIError(error: any): APIError {
    // Network error
    if (!error.response) {
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            return new APIError({
                status: 0,
                code: APIErrorCode.TIMEOUT_ERROR,
                message: 'Request timed out',
            });
        }
        return new APIError({
            status: 0,
            code: APIErrorCode.NETWORK_ERROR,
            message: error.message || 'Network error occurred',
        });
    }

    const { status, data } = error.response;

    // Map HTTP status codes to error codes
    const codeFromStatus = (statusCode: number): APIErrorCode => {
        switch (statusCode) {
            case 400:
                return APIErrorCode.VALIDATION_FAILED;
            case 401:
                return APIErrorCode.UNAUTHORIZED;
            case 403:
                return APIErrorCode.FORBIDDEN;
            case 404:
                return APIErrorCode.NOT_FOUND;
            case 409:
                return APIErrorCode.CONFLICT;
            case 413:
                return APIErrorCode.PAYLOAD_TOO_LARGE;
            case 429:
                return APIErrorCode.RATE_LIMIT_EXCEEDED;
            case 500:
                return APIErrorCode.INTERNAL_ERROR;
            case 502:
                return APIErrorCode.BAD_GATEWAY;
            case 503:
                return APIErrorCode.SERVICE_UNAVAILABLE;
            default:
                return APIErrorCode.UNKNOWN_ERROR;
        }
    };

    // Parse backend response (format: {error, message, timestamp})
    const message = data?.message || data?.error || error.message || 'An error occurred';
    const code = data?.code || codeFromStatus(status);

    // Parse field errors if present
    let errors: FieldError[] | undefined;
    if (data?.errors && Array.isArray(data.errors)) {
        errors = data.errors.map((e: any) => ({
            field: e.field || '',
            message: e.message || '',
            code: e.code,
            rejectedValue: e.rejectedValue,
        }));
    }

    return new APIError({
        status,
        code,
        message,
        errors,
        timestamp: data?.timestamp,
        path: data?.path,
        requestId: error.response?.headers?.['x-request-id'],
    });
}

/**
 * Type guard to check if error is APIError
 */
export function isAPIError(error: any): error is APIError {
    return error?.isAPIError === true;
}
