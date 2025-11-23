import React from 'react';
import { PermissionProvider } from './contexts/PermissionContext';
import { SafeAreaView, StatusBar, Text, View, StyleSheet } from 'react-native';
import { THEME } from './theme/Theme';

const App = () => {
    return (
        <PermissionProvider>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.background} />
                <View style={styles.content}>
                    <Text style={styles.title}>Welcome to Nimbuild</Text>
                    <Text style={styles.subtitle}>Project Initialization Complete</Text>
                </View>
            </SafeAreaView>
        </PermissionProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: THEME.spacing.m,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: THEME.colors.primary,
        marginBottom: THEME.spacing.s,
    },
    subtitle: {
        fontSize: 16,
        color: THEME.colors.textSecondary,
    },
});

export default App;
