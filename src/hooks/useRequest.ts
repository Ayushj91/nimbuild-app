import { useState, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { AppError } from '../services/api/core/apiError';

interface UseRequestOptions<T> {
    onSuccess?: (data: T) => void;
    onError?: (error: AppError) => void;
    showErrorToast?: boolean;
    showSuccessToast?: boolean;
    successMessage?: string;
}

export const useRequest = <T, P extends any[]>(
    requestFn: (...args: P) => Promise<T>,
    options: UseRequestOptions<T> = {}
) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<AppError | null>(null);
    const { showToast } = useToast();

    const {
        onSuccess,
        onError,
        showErrorToast = true,
        showSuccessToast = false,
        successMessage = 'Operation successful',
    } = options;

    const request = useCallback(
        async (...args: P) => {
            setLoading(true);
            setError(null);

            try {
                const result = await requestFn(...args);
                setData(result);

                if (showSuccessToast) {
                    showToast({
                        type: 'success',
                        message: successMessage,
                    });
                }

                if (onSuccess) {
                    onSuccess(result);
                }

                return result;
            } catch (err: any) {
                const appError = err instanceof AppError ? err : new AppError(err.message || 'An unexpected error occurred');
                setError(appError);

                if (showErrorToast) {
                    showToast({
                        type: 'error',
                        message: appError.message,
                    });
                }

                if (onError) {
                    onError(appError);
                }

                // Do not re-throw, as we handle it via state and toast
                // throw appError;
            } finally {
                setLoading(false);
            }
        },
        [requestFn, onSuccess, onError, showErrorToast, showSuccessToast, successMessage, showToast]
    );

    return {
        request,
        loading,
        data,
        error,
    };
};
