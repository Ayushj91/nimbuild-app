import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OtpVerificationScreen } from '../screens/auth/OtpVerificationScreen';
import { THEME } from '../theme/Theme';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: THEME.colors.background },
            }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen
                name="OtpVerification"
                component={OtpVerificationScreen}
                options={{
                    headerShown: true,
                    title: 'Verify OTP',
                    headerBackTitle: 'Back',
                }}
            />
        </Stack.Navigator>
    );
};
