/**
 * File Upload Validation Utilities
 * Validates file size and content type before upload to prevent server rejections
 */

// Constants from API documentation
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export const ALLOWED_CONTENT_TYPES = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Spreadsheets
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-zip-compressed',
    // Other common types
    'text/plain',
    'application/json',
];

export interface FileValidationError {
    code: 'FILE_TOO_LARGE' | 'INVALID_FILE_TYPE' | 'UNKNOWN_ERROR';
    message: string;
    maxSize?: number;
    actualSize?: number;
    allowedTypes?: string[];
}

/**
 * Validate file size and content type before upload
 */
export function validateFile(
    file: { size?: number; type?: string; name?: string },
    options?: {
        maxSize?: number;
        allowedTypes?: string[];
    }
): { valid: true } | { valid: false; error: FileValidationError } {
    const maxSize = options?.maxSize || MAX_FILE_SIZE;
    const allowedTypes = options?.allowedTypes || ALLOWED_CONTENT_TYPES;

    // Check file size
    if (file.size && file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
        const actualSizeMB = (file.size / (1024 * 1024)).toFixed(1);

        return {
            valid: false,
            error: {
                code: 'FILE_TOO_LARGE',
                message: `File size (${actualSizeMB}MB) exceeds maximum allowed size of ${maxSizeMB}MB`,
                maxSize,
                actualSize: file.size,
            },
        };
    }

    // Check content type (if provided)
    if (file.type && !allowedTypes.includes(file.type)) {
        // Try to infer from filename extension if type is missing/invalid
        const extension = file.name?.split('.').pop()?.toLowerCase();
        const typeFromExt = getTypeFromExtension(extension);

        if (typeFromExt && allowedTypes.includes(typeFromExt)) {
            // Extension is valid even if type isn't
            return { valid: true };
        }

        return {
            valid: false,
            error: {
                code: 'INVALID_FILE_TYPE',
                message: `File type "${file.type}" is not allowed. Allowed types: images, PDFs, documents, spreadsheets, and archives.`,
                allowedTypes,
            },
        };
    }

    return { valid: true };
}

/**
 * Helper: Get MIME type from file extension
 */
function getTypeFromExtension(extension?: string): string | null {
    if (!extension) return null;

    const extensionMap: Record<string, string> = {
        // Images
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        // Documents
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        // Spreadsheets
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        // Archives
        zip: 'application/zip',
        rar: 'application/x-rar-compressed',
        // Other
        txt: 'text/plain',
        json: 'application/json',
    };

    return extensionMap[extension] || null;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/**
 * Check if content type is an image
 */
export function isImageType(contentType?: string): boolean {
    return !!contentType && contentType.startsWith('image/');
}

/**
 * Check if content type is a document
 */
export function isDocumentType(contentType?: string): boolean {
    if (!contentType) return false;
    return (
        contentType === 'application/pdf' ||
        contentType.includes('word') ||
        contentType.includes('document') ||
        contentType === 'text/plain'
    );
}
