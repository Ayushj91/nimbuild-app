import React from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { THEME } from '../theme/Theme';

interface IconProps {
    name: string;
    size?: keyof typeof THEME.sizes.icon;
    color?: string;
}

export const Icon: React.FC<IconProps> = ({
    name,
    size = 'base',
    color = THEME.colors.text,
}) => {
    return (
        <MaterialCommunityIcons
            name={name}
            size={THEME.sizes.icon[size]}
            color={color}
        />
    );
};
