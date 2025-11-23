import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';
import { THEME } from '../theme/Theme';

// Heading Component
interface HeadingProps extends TextProps {
    level?: 1 | 2 | 3;
    children: React.ReactNode;
}

export const Heading: React.FC<HeadingProps> = ({
    level = 1,
    children,
    style,
    ...props
}) => {
    return (
        <Text
            style={[styles.heading, styles[`h${level}`], style]}
            {...props}>
            {children}
        </Text>
    );
};

// Body Component
interface BodyProps extends TextProps {
    size?: 'base' | 'sm';
    children: React.ReactNode;
}

export const Body: React.FC<BodyProps> = ({
    size = 'base',
    children,
    style,
    ...props
}) => {
    const sizeStyle = size === 'sm' ? styles.bodySm : styles.bodyBase;

    return (
        <Text
            style={[styles.body, sizeStyle, style]}
            {...props}>
            {children}
        </Text>
    );
};

// Caption Component
interface CaptionProps extends TextProps {
    children: React.ReactNode;
}

export const Caption: React.FC<CaptionProps> = ({
    children,
    style,
    ...props
}) => {
    return (
        <Text style={[styles.caption, style]} {...props}>
            {children}
        </Text>
    );
};

const styles = StyleSheet.create({
    // Headings
    heading: {
        fontWeight: THEME.typography.fontWeight.bold,
        color: THEME.colors.text,
        lineHeight: THEME.typography.fontSize['3xl'] * THEME.typography.lineHeight.tight,
    },
    h1: {
        fontSize: THEME.typography.fontSize['3xl'],
    },
    h2: {
        fontSize: THEME.typography.fontSize['2xl'],
    },
    h3: {
        fontSize: THEME.typography.fontSize.xl,
    },

    // Body
    body: {
        color: THEME.colors.text,
        lineHeight: THEME.typography.fontSize.base * THEME.typography.lineHeight.normal,
    },
    bodyBase: {
        fontSize: THEME.typography.fontSize.base,
    },
    bodySm: {
        fontSize: THEME.typography.fontSize.sm,
    },

    // Caption
    caption: {
        fontSize: THEME.typography.fontSize.xs,
        color: THEME.colors.textSecondary,
        lineHeight: THEME.typography.fontSize.xs * THEME.typography.lineHeight.normal,
    },
});
