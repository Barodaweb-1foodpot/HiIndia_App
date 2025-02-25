import React, { useEffect, useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import * as Font from "expo-font";
import SplashScreen from "../screens/SplashScreen";
import Onboarding from "../screens/Onboarding";
import AuthNavigator from "./AuthNavigator";
import ScreenNavigator from "./ScreenNavigator";
import TabNavigator from "./TabNavigator";
import { CheckAccessToken } from "../api/token_api";

const Stack = createStackNavigator();

const MainNavigator = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(null); // Null indicates loading

  useEffect(() => {
    const loadAssets = async () => {
      try {
        console.log("Loading fonts...");
        await Font.loadAsync({
          "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
          "Poppins-Medium": require("../../assets/fonts/Poppins-Medium.ttf"),
          "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
        });
        console.log("Fonts loaded.");

        console.log("[MainNavigator] Checking authentication status...");
        const res = await CheckAccessToken();
        console.log("Authentication check result:", res);
        setIsAuthenticated(res);
        setFontsLoaded(true);
      } catch (error) {
        console.error("[MainNavigator] Error loading assets:", error);
      }
    };

    loadAssets();

    console.log("Starting splash timer for 2 seconds.");
    const splashTimer = setTimeout(() => {
      
      setShowSplash(false);
    }, 2000);

    return () => {
      clearTimeout(splashTimer);
    };
  }, []);

  if (!fontsLoaded || showSplash) {
    console.log("Displaying SplashScreen.");
    return <SplashScreen />;
  }

  console.log("Rendering Main Navigator. isAuthenticated:", isAuthenticated);
  return (
    <Stack.Navigator
      initialRouteName={!isAuthenticated ? "Onboarding" : "Tab"}
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="Onboarding" component={Onboarding} />
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen name="Tab" component={TabNavigator} />
      <Stack.Screen name="App" component={ScreenNavigator} />
    </Stack.Navigator>
  );
};

export default MainNavigator;
