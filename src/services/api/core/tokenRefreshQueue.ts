/**
 * Token Refresh Queue
 * 
 * Implements single-flight pattern for token refresh:
 * - Only one refresh request at a time
 * - Queues other requests during refresh
 * - Retries all queued requests after successful refresh
 */

type TokenRefreshCallback = (token: string | null) => void;

class TokenRefreshQueue {
    private isRefreshing = false;
    private subscribers: TokenRefreshCallback[] = [];

    /**
     * Check if a refresh is currently in progress
     */
    isRefreshInProgress(): boolean {
        return this.isRefreshing;
    }

    /**
     * Mark refresh as started
     */
    startRefresh(): void {
        this.isRefreshing = true;
        this.subscribers = [];
    }

    /**
     * Subscribe to refresh completion
     * @param callback Called with new token (or null if refresh failed)
     */
    subscribeToRefresh(callback: TokenRefreshCallback): void {
        this.subscribers.push(callback);
    }

    /**
     * Notify all subscribers that refresh completed
     * @param token New access token (null if refresh failed)
     */
    onRefreshComplete(token: string | null): void {
        this.isRefreshing = false;
        this.subscribers.forEach(callback => callback(token));
        this.subscribers = [];
    }
}

export const tokenRefreshQueue = new TokenRefreshQueue();
