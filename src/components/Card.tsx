import React from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import { THEME } from '../theme/Theme';

interface CardProps {
    children: React.ReactNode;
    onPress?: () => void;
    style?: ViewStyle;
    padding?: keyof typeof THEME.spacing;
    shadow?: 'none' | 'sm' | 'base' | 'lg' | 'xl';
}

export const Card: React.FC<CardProps> = ({
    children,
    onPress,
    style,
    padding = 'l',
    shadow = 'base',
}) => {
    const content = (
        <View
            style={[
                styles.card,
                THEME.shadows[shadow],
                { padding: THEME.spacing[padding] },
                style,
            ]}>
            {children}
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
                {content}
            </TouchableOpacity>
        );
    }

    return content;
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: THEME.colors.surface,
        borderRadius: THEME.radius.lg,
        overflow: 'hidden',
    },
});
