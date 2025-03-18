import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import MainNavigator from "./src/navigation/MainNavigator";
import ContextProvider from "./src/context/AuthContext";
import { StripeProvider } from "@stripe/stripe-react-native";
import { STRIPE_PUBLISHABLE_KEY } from "@env";
import { usePushNotifications } from "./src/helper/pushNotifications";

const App = () => {

  // 2) Call the hook so it runs when your app mounts
  const { expoPushToken, notification } = usePushNotifications();

  // 3) Log the token (or handle it in some other way)
  useEffect(() => {
    if (expoPushToken) {
      console.log("Expo Push Token =>", expoPushToken);
      // TODO: Optionally, send the token to your backend here
    }
  }, [expoPushToken]);

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
