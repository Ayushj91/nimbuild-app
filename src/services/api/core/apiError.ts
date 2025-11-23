export class AppError extends Error {
    constructor(public message: string, public code?: string, public status?: number) {
        super(message);
        this.name = 'AppError';
    }
}

export const parseApiError = (error: any): string => {
    console.log('Parsing API Error:', JSON.stringify(error, null, 2));
    if (error.response) {
        // Server responded with a status code outside 2xx range
        const data = error.response.data;

        // Check if backend sends error message in specific format
        if (typeof data === 'string' && data.trim()) {
            return data;
        }

        if (data?.message) {
            return data.message;
        }

        if (data?.error) {
            return data.error;
        }

        // Fallback for common status codes
        switch (error.response.status) {
            case 400:
                return 'Invalid request. Please check your input.';
            case 401:
                return 'Session expired. Please login again.';
            case 403:
                return 'You do not have permission to perform this action.';
            case 404:
                return 'Resource not found.';
            case 500:
                return 'Something went wrong on the server. Please try again later.';
            default:
                return `Error ${error.response.status}: An unexpected error occurred.`;
        }
    } else if (error.request) {
        // Request was made but no response received
        return 'Network error. Please check your internet connection.';
    } else {
        // Something happened in setting up the request
        return error.message || 'An unexpected error occurred.';
    }
};
