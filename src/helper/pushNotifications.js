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
  const sendTokenToBackend = async (token, retryCount = 0) => {
    try {
      let deviceId = await AsyncStorage.getItem("deviceId");
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        await AsyncStorage.setItem("deviceId", deviceId);
      }

      const userId = await AsyncStorage.getItem("role");
      if (!userId) {
        console.log("No user ID found, skipping token registration");
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Token registration successful:", data);
      
      // Store the token locally for verification
      await AsyncStorage.setItem('fcmToken', token);
      
    } catch (error) {
      console.error("Error sending token:", error);
      
      // Retry logic
      if (retryCount < 3) {
        console.log(`Retrying token registration (attempt ${retryCount + 1}/3)...`);
        setTimeout(() => {
          sendTokenToBackend(token, retryCount + 1);
        }, 5000 * (retryCount + 1)); // Exponential backoff
      }
    }
  };

  // Request Expo notification permissions and get token
  async function registerForExpoPushNotifications() {
    let token;

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      console.log("Initial notification permission status:", existingStatus);

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: true,
            allowCriticalAlerts: true,
            allowProvisional: true,
          },
        });
        finalStatus = status;
        console.log("New notification permission status:", status);
      }

      if (finalStatus !== "granted") {
        console.log("Failed to get push token for Expo notifications!");
        return null;
      }

      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })
      ).data;

      console.log("Expo Push Token obtained:", token);
    } else {
      console.log("Running on simulator - Push notifications will be limited");
      // For simulator testing, we'll still try to get a token
      try {
        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId,
          })
        ).data;
        console.log("Simulator Expo Push Token:", token);
      } catch (error) {
        console.error("Error getting simulator token:", error);
      }
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
    } else if (Platform.OS === "ios") {
      // Configure iOS notification categories with more actions
      await Notifications.setNotificationCategoryAsync("default", [
        {
          identifier: "default",
          buttons: [
            {
              title: "View",
              action: "view",
            },
            {
              title: "Reply",
              action: "reply",
            },
            {
              title: "Dismiss",
              action: "dismiss",
            },
          ],
        },
      ]);
    }
  }

  // Handle notification response actions
  const handleNotificationResponse = (response) => {
    const { actionIdentifier, notification } = response;
    console.log("Notification action:", actionIdentifier);

    switch (actionIdentifier) {
      case "view":
        // Handle view action - navigate to relevant screen
        console.log("View action triggered for notification:", notification);
        break;
      case "reply":
        // Handle reply action
        console.log("Reply action triggered for notification:", notification);
        break;
      case "dismiss":
        // Handle dismiss action
        console.log("Dismiss action triggered for notification:", notification);
        break;
      default:
        // Handle default tap action
        console.log("Default tap action for notification:", notification);
    }
  };

  // Update badge count
  const updateBadgeCount = async (count) => {
    if (Platform.OS === "ios") {
      await Notifications.setBadgeCountAsync(count);
    }
  };

  const verifyAndRefreshToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('fcmToken');
      const currentToken = await messaging().getToken();
      
      if (storedToken !== currentToken) {
        console.log('Token mismatch detected, updating...');
        await sendTokenToBackend(currentToken);
      }
    } catch (error) {
      console.error('Error verifying token:', error);
    }
  };

  // Set up Firebase Cloud Messaging
  async function setupFirebaseMessaging() {
    try {
      // Debug initial state
      const initialNotification = await messaging().getInitialNotification();
      console.log('FCM Initial notification state:', initialNotification ? 'Has notification' : 'No notification');

      // Verify permissions
      const authStatus = await messaging().requestPermission();
      const enabled = 
        authStatus === messaging.AuthorizationStatus.AUTHORIZED || 
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        
      if (enabled) {
        // Get and store FCM token
        const token = await messaging().getToken();
        console.log("FCM Token obtained:", token);
        setFcmToken(token);
        
        // Verify and send token to backend
        await verifyAndRefreshToken();
        
        // Set up token refresh handler
        const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
          console.log("FCM token refreshed:", newToken);
          setFcmToken(newToken);
          await sendTokenToBackend(newToken);
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
              sound: Platform.OS === "ios" ? "default" : true,
              badge: 1,
              categoryIdentifier: "default",
              attachments: remoteMessage.notification?.imageUrl
                ? [
                    {
                      url: remoteMessage.notification.imageUrl,
                      identifier: "image",
                    },
                  ]
                : undefined,
            },
            trigger: null,
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
              sound: Platform.OS === "ios" ? "default" : true,
              badge: 1,
              categoryIdentifier: "default",
              attachments: remoteMessage.notification?.imageUrl
                ? [
                    {
                      url: remoteMessage.notification.imageUrl,
                      identifier: "image",
                    },
                  ]
                : undefined,
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
    } catch (error) {
      console.error('Error in setupFirebaseMessaging:', error);
    }
    
    return () => {};
  }

  // Monitor app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        console.log("App has come to the foreground!");
        // Verify token when app comes to foreground
        await verifyAndRefreshToken();
        
        // Check for any pending notifications
        const initialNotification = await messaging().getInitialNotification();
        if (initialNotification) {
          console.log("Handling initial notification:", initialNotification);
          await Notifications.scheduleNotificationAsync({
            content: {
              title: initialNotification.notification?.title || "New Notification",
              body: initialNotification.notification?.body || "You have a new message",
              data: initialNotification.data || {},
              sound: Platform.OS === "ios" ? "default" : true,
              badge: 1,
              categoryIdentifier: "default",
            },
            trigger: null,
          });
        }
      } else if (appState.current === "active" && nextAppState.match(/inactive|background/)) {
        console.log("App has gone to the background!");
        // Clean up any pending notifications
        await Notifications.dismissAllNotificationsAsync();
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
      // Reset badge count on app launch
      if (Platform.OS === "ios") {
        await Notifications.setBadgeCountAsync(0);
      }

      // Set up notification channels first
      await setupNotificationChannels();

      // Set up Expo notifications
      const expoToken = await registerForExpoPushNotifications();
      if (expoToken) {
        setExpoPushToken(expoToken);
        console.log("Expo Push Token:", expoToken);
      }

      // Set up Expo notification listeners with enhanced response handling
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notif) => {
          console.log("Notification received:", notif);
          setNotification(notif);
        });

      responseListener.current =
        Notifications.addNotificationResponseReceivedListener(
          handleNotificationResponse
        );

      // Set up Firebase messaging
      const firebaseCleanup = await setupFirebaseMessaging();
      cleanup = firebaseCleanup;
    };

    setup();

    // Cleanup all listeners
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
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
