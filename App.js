import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import MainNavigator from "./src/navigation/MainNavigator";
import ContextProvider from "./src/context/AuthContext";
import { StripeProvider } from "@stripe/stripe-react-native";

const App = () => {
  return (
    <ContextProvider>
      <StripeProvider
        publishableKey="pk_test_51Qyng1FsN0sGP8PLbYXNlyWfmu3VHrkA8yt5GahyJyqzpCW1mbiyZtYwKi4wIsjUmE2Qc9lud4zFyvZ94YS4iDTh00Siqmhzp0"
      >
      <NavigationContainer>
        <MainNavigator />
        <Toast />
      </NavigationContainer>
      </StripeProvider>
    </ContextProvider>
  );
};

export default App;
