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
  // State to store tokens and notifications
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [fcmToken, setFcmToken] = useState(null);
  const [notification, setNotification] = useState(null);
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
      
      console.log("Sending FCM token to backend:", token, deviceId);
      const userId = await AsyncStorage.getItem("role");
      // Make your API call here to send token to your backend
      console.log("user id is ", userId);
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

      console.log("response is ", response);

 
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
    
    // Request permission
    const authStatus = await messaging().requestPermission();
    const enabled = 
      authStatus === messaging.AuthorizationStatus.AUTHORIZED || 
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      
    if (enabled) {
      // Get and store FCM token
      const token = await messaging().getToken();
      console.log("HiIndia FCM Token:", token);
      setFcmToken(token);
      sendTokenToBackend(token);
      
      // Set up token refresh handler
      const unsubscribeTokenRefresh = messaging().onTokenRefresh((newToken) => {
        console.log("FCM token refreshed:", newToken);
        setFcmToken(newToken);
        sendTokenToBackend(newToken);
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
        unsubscribeTokenRefresh();
        unsubscribeOpenedApp && unsubscribeOpenedApp();
      };
    }
    
    return () => {};
  }

  // Monitor app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        console.log("App has come to the foreground!");
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

  // Main setup effect
  useEffect(() => {
    let cleanup = () => {};
    
    const setup = async () => {
      // Set up notification channels first
      await setupNotificationChannels();
      
      // Set up Expo notifications
      const expoToken = await registerForExpoPushNotifications();
      if (expoToken) {
        setExpoPushToken(expoToken);
        console.log("Expo Push Token:", expoToken);
      }
      
      // Set up Expo notification listeners
      notificationListener.current = Notifications.addNotificationReceivedListener((notif) => {
        console.log("Notification received:", notif);
        setNotification(notif);
      });
      
      responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("User tapped notification:", response);
      });
      
      // Set up Firebase messaging
      const firebaseCleanup = await setupFirebaseMessaging();
      cleanup = firebaseCleanup;
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
  }, [user]);

  return {
    expoPushToken,
    fcmToken,
    notification,
  };
};