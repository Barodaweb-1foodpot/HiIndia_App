import { useState, useEffect, useRef } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform, AppState } from "react-native";
import messaging from "@react-native-firebase/messaging";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@env";
import { useAuthContext } from "../context/AuthContext";

// Configure notification handler for all notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldShowAlert: true,
    shouldSetBadge: true,
  }),
});

export const usePushNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [fcmToken, setFcmToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const user = useAuthContext();
  
  // Refs for listeners
  const notificationListener = useRef();
  const responseListener = useRef();
  const appState = useRef(AppState.currentState);

  // Send FCM token to backend
  const sendTokenToBackend = async (token) => {
    try {
      let deviceId = await AsyncStorage.getItem("deviceId");
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        await AsyncStorage.setItem("deviceId", deviceId);
      }
      
      const userId = await AsyncStorage.getItem("role");
      if (!userId) {
        console.log("No user ID found, skipping token update");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/update-fcm-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          deviceId,
          token,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update FCM token: ${response.status}`);
      }

      await AsyncStorage.setItem("fcmToken", token);
      console.log("FCM token successfully updated");
    } catch (error) {
      console.error("Error sending token:", error);
    }
  };

  // Request Expo notification permissions and get token
  async function registerForExpoPushNotifications() {
    let token;
    
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: true,
          },
        });
        finalStatus = status;
      }
      
      if (finalStatus !== "granted") {
        console.log("Failed to get push token for Expo notifications!");
        return null;
      }
      
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data;
    } else {
      console.log("Must use physical device for Push Notifications");
      return null;
    }
    
    return token;
  }

  // Set up notification channels for Android
  async function setupNotificationChannels() {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }
  }

  // Initialize FCM token immediately
  const initializeFCM = async () => {
    try {
      // Check if we already have a token
      const storedToken = await AsyncStorage.getItem("fcmToken");
      if (storedToken) {
        setFcmToken(storedToken);
        console.log("Using stored FCM token:", storedToken);
      }

      // Request permission and get new token
      const authStatus = await messaging().requestPermission();
      const enabled = 
        authStatus === messaging.AuthorizationStatus.AUTHORIZED || 
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      
      if (enabled) {
        const token = await messaging().getToken();
        console.log("New FCM Token obtained:", token);
        
        if (token !== storedToken) {
          setFcmToken(token);
          await sendTokenToBackend(token);
        }
        
        // Set up token refresh handler
        messaging().onTokenRefresh(async (newToken) => {
          console.log("FCM token refreshed:", newToken);
          setFcmToken(newToken);
          await sendTokenToBackend(newToken);
        });
      }
    } catch (error) {
      console.error("Error initializing FCM:", error);
    }
  };

  // Set up Firebase Cloud Messaging
  async function setupFirebaseMessaging() {
    // Debug initial state
    messaging().getInitialNotification().then(remoteMessage => {
      console.log('FCM Initial notification state:', remoteMessage ? 'Has notification' : 'No notification');
    });

    // Verify permissions
    messaging().hasPermission().then(authStatus => {
      console.log('FCM Permission status:', authStatus);
    });
    
    // Handle foreground messages
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log("FCM message received in foreground:", remoteMessage);
      
      // Display notification using Expo's API
      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification?.title || "New Notification",
          body: remoteMessage.notification?.body || "You have a new message",
          data: remoteMessage.data || {},
        },
        trigger: null, // Show immediately
      });
    });
    
    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log("Message handled in the background:", remoteMessage);
      
      // Schedule a local notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification?.title || "Background Notification",
          body: remoteMessage.notification?.body || "You have a new message",
          data: remoteMessage.data || {},
        },
        trigger: null,
      });
    });
    
    // Handle notification opening app from background
    const unsubscribeOpenedApp = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log("Notification caused app to open from background:", remoteMessage.notification);
    });
    
    // Check if app was opened from a notification
    messaging().getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        console.log("App opened from quit state due to notification:", remoteMessage.notification);
      }
    });
    
    return () => {
      unsubscribeForeground();
      unsubscribeOpenedApp && unsubscribeOpenedApp();
    };
  }

  // Main setup effect
  useEffect(() => {
    let cleanup = () => {};
    
    const setup = async () => {
      try {
        // Set up notification channels first
        await setupNotificationChannels();
        
        // Initialize FCM immediately
        await initializeFCM();
        
        // Set up Expo notifications
        const expoToken = await registerForExpoPushNotifications();
        if (expoToken) {
          setExpoPushToken(expoToken);
          console.log("Expo Push Token:", expoToken);
        }
        
        // Set up notification listeners
        notificationListener.current = Notifications.addNotificationReceivedListener((notif) => {
          console.log("Notification received:", notif);
          setNotification(notif);
        });
        
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
          console.log("User tapped notification:", response);
        });
        
        // Set up Firebase messaging handlers
        const firebaseCleanup = await setupFirebaseMessaging();
        cleanup = firebaseCleanup;
        
        setIsInitialized(true);
      } catch (error) {
        console.error("Error in setup:", error);
      }
    };
    
    setup();
    
    // Cleanup all listeners
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      cleanup();
    };
  }, []);

  // Monitor app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        console.log("App has come to the foreground!");
        // Re-initialize FCM when app comes to foreground
        await initializeFCM();
      } else if (appState.current === "active" && nextAppState.match(/inactive|background/)) {
        console.log("App has gone to the background!");
      }
      appState.current = nextAppState;
    });
    
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    console.log("user inside context is ", user);
  }, [user]);

  return {
    expoPushToken,
    fcmToken,
    notification,
    isInitialized,
  };
};