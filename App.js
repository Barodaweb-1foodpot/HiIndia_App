import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import MainNavigator from "./src/navigation/MainNavigator";
import ContextProvider from "./src/context/AuthContext";
import { StripeProvider } from "@stripe/stripe-react-native";
import { STRIPE_PUBLISHABLE_KEY } from "@env";

const App = () => {
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
