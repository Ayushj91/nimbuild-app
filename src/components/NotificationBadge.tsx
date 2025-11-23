import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Caption, Icon } from '../components';
import { THEME } from '../theme/Theme';
import { notificationService } from '../services/api/notificationService';
import { wsClient } from '../services/websocket/websocketClient';

interface NotificationBadgeProps {
    onPress?: () => void;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ onPress }) => {
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch initial unread count
    useEffect(() => {
        fetchUnreadCount();
    }, []);

    // Listen to WebSocket notification events
    useEffect(() => {
        const handleNotification = () => {
            // Increment unread count when new notification arrives
            setUnreadCount(prev => prev + 1);
        };

        wsClient.on('notification', handleNotification);

        return () => {
            wsClient.off('notification', handleNotification);
        };
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const response = await notificationService.getUnreadCount();
            setUnreadCount(response.count);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    return (
        <TouchableOpacity onPress={onPress} style={styles.container}>
            <Icon name="bell-outline" size="lg" color={THEME.colors.text} />
            {unreadCount > 0 && (
                <View style={styles.badge}>
                    <Caption style={styles.badgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </Caption>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        padding: THEME.spacing.s,
    },
    badge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: THEME.colors.danger,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: THEME.colors.white,
        fontSize: 10,
        fontWeight: THEME.typography.fontWeight.bold,
    },
});
