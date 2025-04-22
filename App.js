import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import MainNavigator from "./src/navigation/MainNavigator";
import ContextProvider from "./src/context/AuthContext";
import { StripeProvider } from "@stripe/stripe-react-native";
import { STRIPE_PUBLISHABLE_KEY } from "@env";
import { usePushNotifications } from "./src/helper/pushNotifications";
import {
  checkForUpdate,
  showUpdateAlert,
  initializeRemoteConfig,
} from "./src/utils/versionCheck";

const App = () => {
  const { expoPushToken, fcmToken, notification } = usePushNotifications();

  useEffect(() => {
    if (expoPushToken) {
      console.log("App.js: Expo Push Token =>", expoPushToken);
    }
    if (fcmToken) {
      console.log("App.js: FCM Token =>", fcmToken);
    }
  }, [expoPushToken, fcmToken]);

  // Initialize Remote Config and check version on app start
  useEffect(() => {
    const setupAppAndCheckVersion = async () => {
      try {
        // Initialize Firebase Remote Config
        await initializeRemoteConfig();

        // Check for app updates
        const updateNeeded = await checkForUpdate();
        if (updateNeeded) {
          showUpdateAlert();
        }
      } catch (error) {
        console.error("Error in app initialization:", error);
      }
    };

    setupAppAndCheckVersion();
  }, []);

  return (
    <ContextProvider>
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
        <NavigationContainer>
          <MainNavigator />
          <Toast />
        </NavigationContainer>
      </StripeProvider>
    </ContextProvider>
  );
};

export default App;
