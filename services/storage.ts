// Token Storage Service using AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  ACCESS_TOKEN: '@hrms_access_token',
  REFRESH_TOKEN: '@hrms_refresh_token',
  USER_ID: '@hrms_user_id',
  USER_ROLE: '@hrms_user_role',
  IS_AUTHENTICATED: '@hrms_is_authenticated',
} as const;

export const storageService = {
  // Save tokens and user info
  async saveAuthData(data: {
    access_token: string;
    refresh_token: string;
    user_id: string;
    role: string;
  }): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token),
        AsyncStorage.setItem(STORAGE_KEYS.USER_ID, data.user_id),
        AsyncStorage.setItem(STORAGE_KEYS.USER_ROLE, data.role),
        AsyncStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true'),
      ]);
    } catch (error) {
      console.error('Error saving auth data:', error);
      throw error;
    }
  },

  // Get access token
  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  // Get refresh token
  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },

  // Get user ID
  async getUserId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  },

  // Get user role
  async getUserRole(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.USER_ROLE);
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  },

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED);
      return value === 'true';
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  },

  // Clear all auth data
  async clearAuthData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_ID),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_ROLE),
        AsyncStorage.removeItem(STORAGE_KEYS.IS_AUTHENTICATED),
      ]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  },
};

