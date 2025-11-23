import { useState, useEffect, useCallback, useRef } from 'react';

export interface CursorResponse<T> {
    content: T[];
    nextCursor?: string;
    hasNext: boolean;
}

export interface UseCursorPaginationOptions<T> {
    fetchFunction: (cursor?: string, limit?: number) => Promise<CursorResponse<T>>;
    limit?: number;
    autoLoad?: boolean;
}

export interface UseCursorPaginationReturn<T> {
    items: T[];
    loading: boolean;
    initialLoading: boolean;
    hasMore: boolean;
    error: Error | null;
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
    reset: () => void;
}

export function useCursorPagination<T>(
    options: UseCursorPaginationOptions<T>
): UseCursorPaginationReturn<T> {
    const { fetchFunction, limit = 20, autoLoad = true } = options;

    const [items, setItems] = useState<T[]>([]);
    const [nextCursor, setNextCursor] = useState<string | undefined>();
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(autoLoad);
    const [error, setError] = useState<Error | null>(null);

    const hasInitialized = useRef(false);
    const fetchFunctionRef = useRef(fetchFunction);

    // Keep ref updated
    useEffect(() => {
        fetchFunctionRef.current = fetchFunction;
    }, [fetchFunction]);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetchFunctionRef.current(nextCursor, limit);
            setItems(prev => [...prev, ...response.content]);
            setNextCursor(response.nextCursor);
            setHasMore(response.hasNext);
        } catch (fetchError: any) {
            const errorObj = fetchError instanceof Error ? fetchError : new Error(fetchError.message || 'Failed to load more items');
            setError(errorObj);
            console.error('Error loading more items:', fetchError);
            // Set hasMore to false on error to prevent infinite retries
            setHasMore(false);
        } finally {
            setLoading(false);
            setInitialLoading(false);
        }
    }, [limit, nextCursor, loading, hasMore]);

    const refresh = useCallback(async () => {
        setItems([]);
        setNextCursor(undefined);
        setHasMore(true);
        setError(null);
        setInitialLoading(true);
        hasInitialized.current = false;

        try {
            const response = await fetchFunctionRef.current(undefined, limit);
            setItems(response.content);
            setNextCursor(response.nextCursor);
            setHasMore(response.hasNext);
        } catch (refreshError) {
            const refreshErrorObj = refreshError instanceof Error ? refreshError : new Error('Failed to refresh');
            setError(refreshErrorObj);
            console.error('Error refreshing:', refreshErrorObj);
            // Set hasMore to false on error to prevent infinite retries
            setHasMore(false);
        } finally {
            setInitialLoading(false);
        }
    }, [limit]);

    const reset = useCallback(() => {
        setItems([]);
        setNextCursor(undefined);
        setHasMore(true);
        setLoading(false);
        setInitialLoading(false);
        setError(null);
        hasInitialized.current = false;
    }, []);

    // Auto-load on mount if enabled
    // Only run once - if it fails, don't retry automatically
    useEffect(() => {
        if (autoLoad && !hasInitialized.current && items.length === 0 && hasMore && !error && !loading) {
            hasInitialized.current = true;
            loadMore();
        }
    }, [autoLoad]); // Only depend on autoLoad to run once on mount

    return {
        items,
        loading,
        initialLoading,
        hasMore,
        error,
        loadMore,
        refresh,
        reset,
    };
}