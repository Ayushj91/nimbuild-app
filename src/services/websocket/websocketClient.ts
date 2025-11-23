/**
 * WebSocket Client for Real-Time Communication
 * 
 * Implements STOMP over SockJS protocol for:
 * - Notifications
 * - Task updates
 * - Project updates
 * - Group messages
 * 
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Event deduplication
 * - Subscription management
 * - Token-based authentication
 */

import SockJS from 'sockjs-client';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { API_CONFIG } from '../api/config';
import { tokenStorage } from '../auth/tokenStorage';

export interface WebSocketEvent {
    type: string;
    timestamp: string;
    data: any;
    eventId: string;
}

type EventCallback = (event: WebSocketEvent) => void;

class WebSocketClient {
    private client: Client | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10;
    private subscriptions: Map<string, StompSubscription> = new Map();
    private eventCallbacks: Map<string, EventCallback[]> = new Map();
    private processedEventIds: Set<string> = new Set();
    private isConnecting = false;
    private userId: string | null = null;

    /**
     * Connect to WebSocket server
     */
    async connect(userId: string): Promise<void> {
        if (this.isConnecting || this.client?.active) {
            console.log('🔌 WebSocket already connected or connecting');
            return;
        }

        this.isConnecting = true;
        this.userId = userId;

        try {
            const token = await tokenStorage.getToken();

            if (!token) {
                throw new Error('No access token available');
            }

            // Create SockJS connection with token in query params
            const wsUrl = `${API_CONFIG.WS_URL}/ws?token=${token}`;
            const sock = new SockJS(wsUrl);

            this.client = new Client({
                webSocketFactory: () => sock as any,

                onConnect: () => {
                    console.log('✅ WebSocket connected');
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;
                    this.subscribeToChannels(userId);
                },

                onStompError: (frame) => {
                    console.error('❌ STOMP error:', frame);
                    this.handleDisconnect();
                },

                onWebSocketClose: (event) => {
                    console.warn('⚠️ WebSocket closed:', event.reason);
                    this.handleDisconnect();
                },

                onWebSocketError: (event) => {
                    console.error('❌ WebSocket error:', event);
                    this.handleDisconnect();
                },

                debug: (str) => {
                    // Only log in development
                    if (__DEV__) {
                        console.log('🔌 STOMP:', str);
                    }
                },
            });

            this.client.activate();

        } catch (error) {
            console.error('❌ Failed to connect WebSocket:', error);
            this.isConnecting = false;
            this.scheduleReconnect(userId);
        }
    }

    /**
     * Subscribe to all relevant channels for the user
     */
    private subscribeToChannels(userId: string): void {
        if (!this.client?.connected) {
            console.warn('⚠️ Cannot subscribe - client not connected');
            return;
        }

        // Notifications
        this.subscribe(
            `/user/${userId}/queue/notifications`,
            this.handleNotificationEvent.bind(this)
        );

        // Task updates
        this.subscribe(
            `/user/${userId}/queue/task-updates`,
            this.handleTaskUpdateEvent.bind(this)
        );

        // Project updates
        this.subscribe(
            `/user/${userId}/queue/project-updates`,
            this.handleProjectUpdateEvent.bind(this)
        );

        console.log('✅ Subscribed to all channels');
    }

    /**
     * Subscribe to a specific destination
     */
    private subscribe(destination: string, callback: (event: WebSocketEvent) => void): void {
        if (!this.client) return;

        const subscription = this.client.subscribe(destination, (message: IMessage) => {
            try {
                const event: WebSocketEvent = JSON.parse(message.body);

                // Deduplicate events by eventId
                if (event.eventId && this.processedEventIds.has(event.eventId)) {
                    console.log('⏭️ Skipping duplicate event:', event.eventId);
                    return;
                }

                if (event.eventId) {
                    this.processedEventIds.add(event.eventId);

                    // Clean up old event IDs (keep last 1000)
                    if (this.processedEventIds.size > 1000) {
                        const oldIds = Array.from(this.processedEventIds).slice(0, 500);
                        oldIds.forEach(id => this.processedEventIds.delete(id));
                    }
                }

                callback(event);
            } catch (error) {
                console.error('❌ Error processing WebSocket message:', error);
            }
        });

        this.subscriptions.set(destination, subscription);
    }

    /**
     * Subscribe to group messages
     */
    subscribeToGroup(groupId: string, callback: EventCallback): void {
        const destination = `/topic/groups/${groupId}/messages`;

        if (!this.eventCallbacks.has(destination)) {
            this.eventCallbacks.set(destination, []);
        }

        this.eventCallbacks.get(destination)!.push(callback);

        if (this.client?.connected && !this.subscriptions.has(destination)) {
            this.subscribe(destination, (event) => {
                const callbacks = this.eventCallbacks.get(destination) || [];
                callbacks.forEach(cb => cb(event));
            });
        }
    }

    /**
     * Unsubscribe from group messages
     */
    unsubscribeFromGroup(groupId: string): void {
        const destination = `/topic/groups/${groupId}/messages`;
        const subscription = this.subscriptions.get(destination);

        if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete(destination);
        }

        this.eventCallbacks.delete(destination);
    }

    /**
     * Handle notification events
     */
    private handleNotificationEvent(event: WebSocketEvent): void {
        console.log('🔔 Notification:', event);

        // Emit to app-wide notification handler
        const callbacks = this.eventCallbacks.get('notification') || [];
        callbacks.forEach(cb => cb(event));
    }

    /**
     * Handle task update events
     */
    private handleTaskUpdateEvent(event: WebSocketEvent): void {
        console.log('📋 Task update:', event);

        // Emit to task update handlers
        const callbacks = this.eventCallbacks.get('task-update') || [];
        callbacks.forEach(cb => cb(event));
    }

    /**
     * Handle project update events
     */
    private handleProjectUpdateEvent(event: WebSocketEvent): void {
        console.log('📁 Project update:', event);

        // Emit to project update handlers
        const callbacks = this.eventCallbacks.get('project-update') || [];
        callbacks.forEach(cb => cb(event));
    }

    /**
     * Register callback for specific event type
     */
    on(eventType: 'notification' | 'task-update' | 'project-update', callback: EventCallback): void {
        if (!this.eventCallbacks.has(eventType)) {
            this.eventCallbacks.set(eventType, []);
        }

        this.eventCallbacks.get(eventType)!.push(callback);
    }

    /**
     * Remove callback
     */
    off(eventType: string, callback?: EventCallback): void {
        if (!callback) {
            this.eventCallbacks.delete(eventType);
            return;
        }

        const callbacks = this.eventCallbacks.get(eventType) || [];
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    /**
     * Handle disconnect
     */
    private handleDisconnect(): void {
        this.isConnecting = false;

        if (this.userId) {
            this.scheduleReconnect(this.userId);
        }
    }

    /**
     * Schedule reconnection with exponential backoff
     */
    private scheduleReconnect(userId: string): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached. Please check connection.');
            // TODO: Show "Disconnected" banner to user
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

        console.log(`⏳ Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            this.connect(userId);
        }, delay);
    }

    /**
     * Disconnect from WebSocket
     */
    disconnect(): void {
        console.log('🔌 Disconnecting WebSocket');

        // Unsubscribe from all
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
        this.subscriptions.clear();

        // Deactivate client
        this.client?.deactivate();
        this.client = null;
        this.isConnecting = false;
        this.userId = null;
        this.reconnectAttempts = 0;
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.client?.connected || false;
    }
}

// Singleton instance
export const wsClient = new WebSocketClient();
