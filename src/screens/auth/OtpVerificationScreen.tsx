import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Input, Heading, Body, Card } from '../../components';
import { THEME } from '../../theme/Theme';
import { OtpVerificationScreenProps } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useRequest } from '../../hooks/useRequest';
import { authService } from '../../services/api/authService';
import { wsClient } from '../../services/websocket/websocketClient';

export const OtpVerificationScreen: React.FC<OtpVerificationScreenProps> = ({
    route,
}) => {
    const [otp, setOtp] = useState('');
    const { phone, email } = route.params;
    const login = useAuthStore((state) => state.login);

    const { request: verifyOtp, loading: verifying } = useRequest(
        authService.verifyOtp,
        {
            onSuccess: (response) => {
                login(response.user);

                // Connect WebSocket after successful login
                if (response.user?.id) {
                    wsClient.connect(response.user.id).catch(error => {
                        console.error('Failed to connect WebSocket:', error);
                    });
                }
            },
            successMessage: 'Logged in successfully',
        }
    );

    const { request: resendOtp, loading: resending } = useRequest(
        authService.requestOtp,
        {
            successMessage: 'OTP resent successfully',
        }
    );

    const handleVerify = () => {
        if (otp.length === 6) {
            verifyOtp(otp, phone, email);
        }
    };

    const handleResend = () => {
        resendOtp(phone, email);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Heading level={1}>Verify OTP</Heading>
                    <Body style={styles.subtitle}>
                        Enter the 6-digit code sent to {phone || email}
                    </Body>
                </View>

                <Card style={styles.card}>
                    <Input
                        label="OTP Code"
                        placeholder="000000"
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="number-pad"
                        maxLength={6}
                    />

                    <Button
                        title="Verify & Continue"
                        onPress={handleVerify}
                        loading={verifying}
                        fullWidth
                        disabled={otp.length !== 6}
                    />

                    <Button
                        title={resending ? 'Resending...' : 'Resend OTP'}
                        variant="text"
                        onPress={handleResend}
                        disabled={resending}
                        fullWidth
                        style={styles.resendButton}
                    />
                </Card>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    content: {
        flex: 1,
        padding: THEME.spacing.l,
        justifyContent: 'center',
    },
    header: {
        marginBottom: THEME.spacing['2xl'],
    },
    subtitle: {
        marginTop: THEME.spacing.s,
        color: THEME.colors.textSecondary,
    },
    card: {
        padding: THEME.spacing.xl,
    },
    resendButton: {
        marginTop: THEME.spacing.m,
    },
});
