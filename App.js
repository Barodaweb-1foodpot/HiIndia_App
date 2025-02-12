import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import MainNavigator from "./src/navigation/MainNavigator";

const App = () => {
  return (
    <NavigationContainer>
      <MainNavigator />
      <Toast />
    </NavigationContainer>
  );
};

export default App;
