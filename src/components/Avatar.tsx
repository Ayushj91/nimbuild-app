import React from 'react';
import { View, Text, Image, StyleSheet, ImageSourcePropType } from 'react-native';
import { THEME } from '../theme/Theme';

interface AvatarProps {
    source?: ImageSourcePropType;
    name?: string;
    size?: 'sm' | 'base' | 'lg' | 'xl';
    backgroundColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
    source,
    name,
    size = 'base',
    backgroundColor,
}) => {
    const avatarSize = THEME.sizes.avatar[size];
    const fontSize = avatarSize / 2.5;

    const getInitials = (fullName?: string): string => {
        if (!fullName) return '?';
        const names = fullName.trim().split(' ');
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    };

    const defaultBgColor = backgroundColor || THEME.colors.primary;

    return (
        <View
            style={[
                styles.container,
                {
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: avatarSize / 2,
                    backgroundColor: source ? THEME.colors.backgroundGray : defaultBgColor,
                },
            ]}>
            {source ? (
                <Image
                    source={source}
                    style={[
                        styles.image,
                        { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
                    ]}
                />
            ) : (
                <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    image: {
        resizeMode: 'cover',
    },
    initials: {
        fontWeight: THEME.typography.fontWeight.semiBold,
        color: THEME.colors.text,
    },
});
