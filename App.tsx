import React, { useEffect, useRef } from "react";
import { StyleSheet, Platform, PermissionsAndroid, View, Text, Image } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { isExpoGo } from "@/utils/expoGo";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { Ionicons } from "@expo/vector-icons";
import Toast, { BaseToastProps } from "react-native-toast-message";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import AuthStackNavigator from "@/navigation/AuthStackNavigator";
import { navigationRef, navigateToMyMaterials } from "@/navigation/navigationRef";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useHRMSStore } from "@/store/hrmsStore";
import { BACKEND_URL } from "@/services/api";

// Custom Premium Toast Components
const PremiumToast = ({ title, body, icon, color }: { title: string; body: string; icon: any; color: string }) => (
  <View style={[styles.toastContainer, { borderLeftColor: color }]}>
    <View style={styles.leftSection}>
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Image 
          source={require('./assets/images/icon.png')} 
          style={styles.logoInToast}
          resizeMode="contain"
        />
    </View>
    <View style={styles.textContainer}>
      <Text style={styles.toastTitle} numberOfLines={1}>{title}</Text>
      <Text style={styles.toastBody} numberOfLines={2}>{body}</Text>
    </View>
  </View>
);

const toastConfig = {
  success: ({ text1, text2 }: BaseToastProps) => (
    <PremiumToast 
      title={text1 || 'Success'} 
      body={text2 || ''} 
      icon="checkmark-circle" 
      color="#10b981" 
    />
  ),
  error: ({ text1, text2 }: BaseToastProps) => (
    <PremiumToast 
      title={text1 || 'Error'} 
      body={text2 || ''} 
      icon="alert-circle" 
      color="#ef4444" 
    />
  ),
  info: ({ text1, text2 }: BaseToastProps) => (
    <PremiumToast 
      title={text1 || 'Information'} 
      body={text2 || ''} 
      icon="information-circle" 
      color="#3b82f6" 
    />
  )
};

// Configure notification behavior for expo-notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const { isAuthenticated, hasSeenOnboarding } = useHRMSStore();
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  // Request Android 13+ permissions and setup channels
  const setupNotifications = async () => {
    if (Platform.OS === 'android') {
      // 1. Create Notification Channel (Required for Android 8+)
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Updates & Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3b82f6',
        showBadge: true,
      });

      // 2. Request Android 13+ permission
      if (Platform.Version >= 33) {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          console.log('📢 Notification permission status:', granted);
        } catch (err) {
          console.warn(err);
        }
      }
    }
  };

  useEffect(() => {
    if (__DEV__) {
      console.warn("🌐 HRMS API backend:", BACKEND_URL);
      if (isExpoGo()) {
        console.warn("📱 Expo Go mode — scan QR from terminal (exp://), not dev build (hrmspro://)");
      }
    }
    console.log('🚀 App component mounted - Setting up notification listeners');
    setupNotifications();

    // 1. Setup Expo Notification Listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Expo Notification received in foreground:', notification);
      showToastFromNotification(notification.request.content);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📬 Expo Notification response (user tapped):', response);
      handleNotificationTap(response.notification.request.content.data);
    });

    // 2. Setup Native Firebase Messaging Listeners
    // Web pe native firebase messaging listeners reliably kaam nahi karte,
    // aur runtime error se blank screen aa sakta hai.
    let unsubscribeMessaging = () => {};
    if (Platform.OS !== 'web' && !isExpoGo()) {
      try {
      const messagingFn = require('@react-native-firebase/messaging').default;

      unsubscribeMessaging = messagingFn().onMessage(async (remoteMessage: any) => {
        console.log('🔥 Native FCM Message received in foreground:', JSON.stringify(remoteMessage, null, 2));
        
        Toast.show({
          type: getToastType(remoteMessage.data?.type),
          text1: remoteMessage.notification?.title || 'Notification',
          text2: remoteMessage.notification?.body || '',
          position: 'top',
          topOffset: 60,
        });
      });

      // Check if the app was opened from a notification (Quit state)
      messagingFn().getInitialNotification().then((remoteMessage: any) => {
        if (remoteMessage) {
          console.log('🔥 Notification caused app to open from quit state:', remoteMessage);
        }
      });
      } catch (e) {
        console.warn('Firebase messaging skipped:', e);
      }
    } else if (isExpoGo()) {
      console.log('💡 Expo Go — Firebase FCM disabled; use expo-notifications only');
    }

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      unsubscribeMessaging();
    };
  }, []);

  // Helper: Show toast from Expo notification content
  const showToastFromNotification = (content: any) => {
    const title = content.title || 'Notification';
    const body = content.body || '';
    const data = content.data || {};
    
    Toast.show({
      type: getToastType(data.type),
      text1: title,
      text2: body,
      position: 'top',
      topOffset: 60,
    });
  };

  // Helper: Determine toast type
  const getToastType = (type: string | any): 'success' | 'error' | 'info' => {
    if (type === 'task_assigned' || type === 'task_completed' || type === 'material_issued') return 'success';
    if (type === 'error' || type === 'task_rejected') return 'error';
    return 'info';
  };

  // Helper: Handle tap navigation
  const handleNotificationTap = (data: any) => {
    console.log('Tapped notification data:', data);
    if (data?.type === 'material_issued' || data?.notification_type === 'material_issued') {
      navigateToMyMaterials();
      return;
    }
    if (data.type === 'task_assigned' && data.task_id) {
      console.log('Navigating to task:', data.task_id);
    }
  };

  const content = (
    <>
      <NavigationContainer ref={navigationRef}>
        {isAuthenticated ? <MainTabNavigator /> : <AuthStackNavigator />}
      </NavigationContainer>
      <StatusBar style="auto" />
      <Toast config={toastConfig} />
    </>
  );

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.root}>
          {isExpoGo() ? (
            <View style={styles.root}>{content}</View>
          ) : (
            <ExpoKeyboardProvider>{content}</ExpoKeyboardProvider>
          )}
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

function ExpoKeyboardProvider({ children }: { children: React.ReactNode }) {
  const { KeyboardProvider } = require("react-native-keyboard-controller");
  return <KeyboardProvider>{children}</KeyboardProvider>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  toastContainer: {
    height: 85,
    width: '92%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderLeftWidth: 6,
    alignSelf: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInToast: {
    width: 35,
    height: 35,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  toastBody: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
    lineHeight: 18,
  },
});
