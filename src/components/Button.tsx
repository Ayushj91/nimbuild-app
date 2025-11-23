import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    View,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { THEME } from '../theme/Theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'text';
    size?: 'sm' | 'base' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
    fullWidth?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'base',
    loading = false,
    disabled = false,
    icon,
    fullWidth = false,
    style,
    textStyle,
}) => {
    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            style={[
                styles.base,
                styles[variant],
                size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : styles.baseHeight,
                fullWidth && styles.fullWidth,
                isDisabled && styles.disabled,
                style,
            ]}
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.7}>
            {loading ? (
                <ActivityIndicator
                    color={
                        variant === 'primary'
                            ? THEME.colors.text
                            : THEME.colors.primary
                    }
                />
            ) : (
                <View style={styles.content}>
                    {icon && <View style={styles.icon}>{icon}</View>}
                    <Text
                        style={[
                            styles.textLabel,
                            styles[`${variant}Text`],
                            styles[`${size}Text`],
                            textStyle,
                        ]}>
                        {title}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: THEME.radius.base,
        paddingHorizontal: THEME.spacing.l,
    },

    // Variants
    primary: {
        backgroundColor: THEME.colors.primary,
    },
    secondary: {
        backgroundColor: THEME.colors.transparent,
        borderWidth: 1.5,
        borderColor: THEME.colors.primary,
    },
    text: {
        backgroundColor: THEME.colors.transparent,
    },

    // Sizes
    sm: {
        height: THEME.sizes.button.sm,
        paddingHorizontal: THEME.spacing.m,
    },
    baseHeight: {
        height: THEME.sizes.button.base,
    },
    lg: {
        height: THEME.sizes.button.lg,
        paddingHorizontal: THEME.spacing.xl,
    },

    // States
    disabled: {
        opacity: 0.5,
    },
    fullWidth: {
        width: '100%',
    },

    // Content
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: THEME.spacing.s,
    },

    // Text Styles
    textLabel: {
        fontWeight: THEME.typography.fontWeight.semiBold,
    },
    primaryText: {
        color: THEME.colors.text,
    },
    secondaryText: {
        color: THEME.colors.primary,
    },
    textText: {
        color: THEME.colors.primary,
    },
    smText: {
        fontSize: THEME.typography.fontSize.sm,
    },
    baseText: {
        fontSize: THEME.typography.fontSize.base,
    },
    lgText: {
        fontSize: THEME.typography.fontSize.lg,
    },
});
