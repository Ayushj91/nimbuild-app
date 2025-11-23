import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Button, Input, Heading, Body, Icon, Card } from '../../components';
import { THEME } from '../../theme/Theme';
import { LoginScreenProps } from '../../navigation/types';
import { useRequest } from '../../hooks/useRequest';
import { authService } from '../../services/api/authService';

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    const [phoneOrEmail, setPhoneOrEmail] = useState('');

    const { request: sendOtp, loading } = useRequest(authService.requestOtp, {
        onSuccess: () => {
            const isEmail = phoneOrEmail.includes('@');
            let phone = isEmail ? undefined : phoneOrEmail.trim();

            if (phone && !phone.startsWith('+')) {
                phone = `+91${phone}`;
            }

            navigation.navigate('OtpVerification', {
                phone: phone,
                email: isEmail ? phoneOrEmail : undefined,
            });
        },
        successMessage: 'OTP sent successfully',
    });

    const handleSendOTP = () => {
        if (phoneOrEmail.trim()) {
            const isEmail = phoneOrEmail.includes('@');
            let phone = isEmail ? undefined : phoneOrEmail.trim();

            // Prepend +91 if it's a phone number and doesn't start with +
            if (phone && !phone.startsWith('+')) {
                phone = `+91${phone}`;
            }

            sendOtp(
                phone,
                isEmail ? phoneOrEmail : undefined
            );
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Image
                        source={require('../../assets/images/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Heading level={1}>Welcome to Nimbuild</Heading>
                    <Body style={styles.subtitle}>
                        Sign in to manage your projects and tasks
                    </Body>
                </View>

                <Card style={styles.card}>
                    <Input
                        label="Phone or Email"
                        placeholder="Enter phone number or email"
                        value={phoneOrEmail}
                        onChangeText={setPhoneOrEmail}
                        leftIcon={
                            <Icon name="account" size="sm" color={THEME.colors.textSecondary} />
                        }
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <Button
                        title="Send OTP"
                        onPress={handleSendOTP}
                        loading={loading}
                        fullWidth
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
        alignItems: 'center',
    },
    logo: {
        width: 200,
        height: 60,
        marginBottom: THEME.spacing.l,
    },
    subtitle: {
        marginTop: THEME.spacing.s,
        color: THEME.colors.textSecondary,
    },
    card: {
        padding: THEME.spacing.xl,
    },
});
