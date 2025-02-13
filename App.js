import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import MainNavigator from "./src/navigation/MainNavigator";
import ContextProvider from "./src/context/AuthContext";
import Toast from "react-native-toast-message";

const App = () => {
  return (
    <ContextProvider>
      <NavigationContainer>
        <MainNavigator />
        <Toast />
      </NavigationContainer>
    </ContextProvider>
  );
};

export default App;
