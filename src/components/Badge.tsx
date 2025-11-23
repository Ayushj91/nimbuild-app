import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { THEME } from '../theme/Theme';

interface BadgeProps {
    value?: string | number;
    variant?: 'primary' | 'success' | 'error' | 'warning' | 'info';
    style?: ViewStyle;
    maxCount?: number;
}

export const Badge: React.FC<BadgeProps> = ({
    value,
    variant = 'primary',
    style,
    maxCount = 99,
}) => {
    const displayValue = typeof value === 'number' && value > maxCount
        ? `${maxCount}+`
        : value?.toString();

    if (!displayValue && value !== 0) return null;

    return (
        <View style={[styles.badge, styles[variant], style]}>
            <Text style={[styles.text, styles[`${variant}Text`]]} numberOfLines={1}>
                {displayValue}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        minWidth: 20,
        height: 20,
        borderRadius: THEME.radius.full,
        paddingHorizontal: THEME.spacing.xs,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Variants
    primary: {
        backgroundColor: THEME.colors.primary,
    },
    success: {
        backgroundColor: THEME.colors.success,
    },
    error: {
        backgroundColor: THEME.colors.error,
    },
    warning: {
        backgroundColor: THEME.colors.warning,
    },
    info: {
        backgroundColor: THEME.colors.info,
    },

    // Text Styles
    text: {
        fontSize: THEME.typography.fontSize.xs,
        fontWeight: THEME.typography.fontWeight.semiBold,
    },
    primaryText: {
        color: THEME.colors.text,
    },
    successText: {
        color: THEME.colors.white,
    },
    errorText: {
        color: THEME.colors.white,
    },
    warningText: {
        color: THEME.colors.text,
    },
    infoText: {
        color: THEME.colors.white,
    },
});
