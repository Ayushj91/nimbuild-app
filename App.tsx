import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ToastProvider } from './src/contexts/ToastContext';
import { PermissionProvider } from './src/contexts/PermissionContext';
import { useAuthStore } from './src/store/authStore';
import { THEME } from './src/theme/Theme';

const App = () => {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  return (
    <PermissionProvider>
      <ToastProvider>
        <RootNavigator />
      </ToastProvider>
    </PermissionProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
  },
});

export default App;
