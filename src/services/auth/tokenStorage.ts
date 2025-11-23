import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@auth_token';
const REFRESH_TOKEN_KEY = '@refresh_token';

export const tokenStorage = {
    getToken: async (): Promise<string | null> => {
        try {
            return await AsyncStorage.getItem(TOKEN_KEY);
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    },

    setToken: async (token: string): Promise<void> => {
        try {
            await AsyncStorage.setItem(TOKEN_KEY, token);
        } catch (error) {
            console.error('Error setting token:', error);
        }
    },

    removeToken: async (): Promise<void> => {
        try {
            await AsyncStorage.removeItem(TOKEN_KEY);
        } catch (error) {
            console.error('Error removing token:', error);
        }
    },

    getRefreshToken: async (): Promise<string | null> => {
        try {
            return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        } catch (error) {
            console.error('Error getting refresh token:', error);
            return null;
        }
    },

    setRefreshToken: async (token: string): Promise<void> => {
        try {
            await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
        } catch (error) {
            console.error('Error setting refresh token:', error);
        }
    },

    removeRefreshToken: async (): Promise<void> => {
        try {
            await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
        } catch (error) {
            console.error('Error removing refresh token:', error);
        }
    },

    clearAll: async (): Promise<void> => {
        try {
            await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
        } catch (error) {
            console.error('Error clearing tokens:', error);
        }
    },

    // Generic getter/setter for other auth-related data
    getItem: async (key: string): Promise<string | null> => {
        try {
            return await AsyncStorage.getItem(`@auth_${key}`);
        } catch (error) {
            console.error(`Error getting ${key}:`, error);
            return null;
        }
    },

    setItem: async (key: string, value: string): Promise<void> => {
        try {
            await AsyncStorage.setItem(`@auth_${key}`, value);
        } catch (error) {
            console.error(`Error setting ${key}:`, error);
        }
    },
};
