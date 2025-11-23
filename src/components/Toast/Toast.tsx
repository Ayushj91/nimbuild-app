import React, { useEffect, useRef, useCallback } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { THEME } from '../../theme/Theme';
import { Body, Icon } from '../index';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
    message: string;
    type: ToastType;
    onHide: () => void;
    duration?: number;
}

const TOAST_CONFIG = {
    success: {
        icon: 'check-circle',
        color: THEME.colors.success,
        backgroundColor: '#E8F5E9',
    },
    error: {
        icon: 'alert-circle',
        color: THEME.colors.error,
        backgroundColor: '#FFEBEE',
    },
    warning: {
        icon: 'alert',
        color: THEME.colors.warning,
        backgroundColor: '#FFF3E0',
    },
    info: {
        icon: 'information',
        color: THEME.colors.info,
        backgroundColor: '#E3F2FD',
    },
};

export const Toast: React.FC<ToastProps> = ({
    message,
    type,
    onHide,
    duration = 3000,
}) => {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    const hide = useCallback(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onHide();
        });
    }, [onHide, opacity, translateY]);

    useEffect(() => {
        // Animate in
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                speed: 12,
                bounciness: 8,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();

        // Auto hide
        const timer = setTimeout(() => {
            hide();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, hide, opacity, translateY]);

    const config = TOAST_CONFIG[type];

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY }],
                    opacity,
                },
            ]}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={hide}
                style={[styles.content, { backgroundColor: config.backgroundColor }]}>
                <Icon name={config.icon} size="base" color={config.color} />
                <View style={styles.textContainer}>
                    <Body style={[styles.text, { color: config.color }]}>{message}</Body>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60, // Below status bar
        left: THEME.spacing.l,
        right: THEME.spacing.l,
        zIndex: 9999,
        alignItems: 'center',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: THEME.spacing.m,
        borderRadius: THEME.radius.lg,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 5,
        width: '100%',
    },
    textContainer: {
        flex: 1,
        marginLeft: THEME.spacing.m,
    },
    text: {
        fontWeight: '500',
    },
});
