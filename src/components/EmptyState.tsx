import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Heading, Body, Button, Icon } from './index';
import { THEME } from '../theme/Theme';

interface EmptyStateProps {
    icon?: string;
    title: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
    style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon = 'clipboard-text-outline',
    title,
    message,
    actionLabel,
    onAction,
    style,
}) => {
    return (
        <View style={[styles.container, style]}>
            <View style={styles.iconContainer}>
                <Icon name={icon} size="xl" color={THEME.colors.textTertiary} />
            </View>
            <Heading level={3} style={styles.title}>
                {title}
            </Heading>
            {message && (
                <Body style={styles.message}>
                    {message}
                </Body>
            )}
            {actionLabel && onAction && (
                <Button
                    title={actionLabel}
                    onPress={onAction}
                    variant="primary"
                    style={styles.button}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: THEME.spacing.xl,
        flex: 1,
    },
    iconContainer: {
        marginBottom: THEME.spacing.m,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: THEME.colors.surfaceVariant,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        textAlign: 'center',
        marginBottom: THEME.spacing.s,
        color: THEME.colors.text,
    },
    message: {
        textAlign: 'center',
        color: THEME.colors.textSecondary,
        marginBottom: THEME.spacing.l,
        maxWidth: 300,
    },
    button: {
        minWidth: 150,
    },
});
