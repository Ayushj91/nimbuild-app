import { Platform } from 'react-native';

// Use 10.0.2.2 for Android Emulator to access localhost
// Use localhost for iOS Simulator
const DEV_API_URL = Platform.select({
    android: 'http://13.200.224.49:8080/api',
    ios: 'http://13.200.224.49:8080/api',
});

export const API_CONFIG = {
    BASE_URL: DEV_API_URL,
    WS_URL: Platform.select({
        android: 'http://13.200.224.49:8080/api',
        ios: 'http://13.200.224.49:8080/api',
    }),
    TIMEOUT: 10000,
};
