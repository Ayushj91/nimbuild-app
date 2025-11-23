import axios from 'axios';
import { API_CONFIG } from '../config';
import { tokenStorage } from '../../auth/tokenStorage';
import { parseAPIError } from '../../../types/errors';

const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        // 'Content-Type': 'application/json', // Let Axios handle this automatically based on data type
    },
});

// Request Interceptor
apiClient.interceptors.request.use(
    async (config) => {
        const token = await tokenStorage.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Log API Request
        console.log('\n🌐 API REQUEST:', {
            method: config.method?.toUpperCase(),
            url: `${config.baseURL}${config.url}`,
            params: config.params,
            data: config.data,
            headers: {
                ...config.headers,
                Authorization: config.headers.Authorization, // Show full token for debugging
            },
        });

        return config;
    },
    (error) => {
        console.error('❌ API REQUEST ERROR:', error);
        return Promise.reject(error);
    }
);

// Response Interceptor
apiClient.interceptors.response.use(
    (response) => {
        // Log API Response
        console.log('✅ API RESPONSE:', {
            status: response.status,
            url: response.config.url,
            data: response.data,
        });
        return response.data;
    },
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        // Log API Error
        console.error('❌ API ERROR:', {
            status,
            url: error.config?.url,
            message: error.message,
            data: error.response?.data,
        });

        // Retry logic for transient errors (429, 500, 502, 503, 504)
        const isRetryableError = [429, 500, 502, 503, 504].includes(status);

        if (isRetryableError && !originalRequest._retryCount) {
            originalRequest._retryCount = 0;
        }

        if (isRetryableError && originalRequest._retryCount < 3) {
            originalRequest._retryCount++;

            // Calculate delay with exponential backoff (1s, 2s, 4s)
            const baseDelay = 1000;
            const exponentialDelay = baseDelay * Math.pow(2, originalRequest._retryCount - 1);

            // Respect Retry-After header if provided
            const retryAfterHeader = error.response?.headers['retry-after'];
            const retryAfter = retryAfterHeader
                ? parseInt(retryAfterHeader, 10) * 1000
                : null;

            const delay = retryAfter || exponentialDelay;

            console.log(
                `⏳ Retrying request (attempt ${originalRequest._retryCount}/3) after ${delay}ms...`
            );

            await new Promise<void>((resolve) => setTimeout(resolve, delay));
            return apiClient(originalRequest);
        }

        // Handle 401 Unauthorized - Try to refresh token
        if (status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                console.log('🔄 Token expired, attempting refresh...');

                const refreshToken = await tokenStorage.getRefreshToken();
                if (!refreshToken) {
                    console.error('❌ No refresh token available');
                    await tokenStorage.clearAll();
                    return Promise.reject(parseAPIError(error));
                }

                // Import authService dynamically to avoid circular dependency
                const { authService } = await import('../authService');
                const response = await authService.refreshToken(refreshToken);

                // Update token and retry original request
                originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                console.error('❌ Token refresh failed:', refreshError);
                await tokenStorage.clearAll();
                return Promise.reject(parseAPIError(error));
            }
        }

        // Normalize error and reject
        const apiError = parseAPIError(error);

        console.error('❌ Normalized API Error:', {
            code: apiError.code,
            message: apiError.message,
            userMessage: apiError.getUserMessage(),
            status: apiError.status,
            errors: apiError.errors,
        });

        return Promise.reject(apiError);
    }
);

export default apiClient;
