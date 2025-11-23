import React, { useState } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    ViewStyle,
    TextInputProps,
} from 'react-native';
import { THEME } from '../theme/Theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    leftIcon,
    rightIcon,
    containerStyle,
    style,
    ...textInputProps
}) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}

            <View
                style={[
                    styles.inputContainer,
                    isFocused && styles.inputContainerFocused,
                    error && styles.inputContainerError,
                ]}>
                {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

                <TextInput
                    style={[styles.input, style]}
                    placeholderTextColor={THEME.colors.textTertiary}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...textInputProps}
                />

                {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
            </View>

            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: THEME.spacing.l,
    },
    label: {
        fontSize: THEME.typography.fontSize.sm,
        fontWeight: THEME.typography.fontWeight.medium,
        color: THEME.colors.text,
        marginBottom: THEME.spacing.s,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: THEME.colors.border,
        borderRadius: THEME.radius.base,
        backgroundColor: THEME.colors.surface,
        paddingHorizontal: THEME.spacing.m,
        minHeight: 48,
        paddingVertical: THEME.spacing.s,
    },
    inputContainerFocused: {
        borderColor: THEME.colors.primary,
        borderWidth: 1.5,
    },
    inputContainerError: {
        borderColor: THEME.colors.error,
    },
    input: {
        flex: 1,
        fontSize: THEME.typography.fontSize.base,
        color: THEME.colors.text,
        paddingVertical: 0,
    },
    leftIcon: {
        marginRight: THEME.spacing.s,
    },
    rightIcon: {
        marginLeft: THEME.spacing.s,
    },
    error: {
        fontSize: THEME.typography.fontSize.xs,
        color: THEME.colors.error,
        marginTop: THEME.spacing.xs,
    },
});
