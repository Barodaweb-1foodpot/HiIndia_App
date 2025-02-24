import React, { useEffect, useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import * as Font from "expo-font";
import SplashScreen from "../screens/SplashScreen";
import Onboarding from "../screens/Onboarding";
import AuthNavigator from "./AuthNavigator";
import ScreenNavigator from "./ScreenNavigator";
import Homepage from "../screens/HomeScreen";
import TabNavigator from "./TabNavigator";
import { CheckAccessToken } from "../api/token_api";

const Stack = createStackNavigator();

const MainNavigator = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(null); // Null to indicate loading

  useEffect(() => {
    const loadAssets = async () => {
      try {
        await Font.loadAsync({
          "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
          "Poppins-Medium": require("../../assets/fonts/Poppins-Medium.ttf"),
          "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
        });

        const res = await CheckAccessToken();
        console.log("mmmmmmmmmmmm",res)
        setIsAuthenticated(res); // Set auth status


        setFontsLoaded(true);
      } catch (error) {
        console.error("Error loading fonts:", error);
      }
    };

    loadAssets();

    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(splashTimer);
  }, []);

  if (!fontsLoaded || showSplash) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      initialRouteName={!isAuthenticated ?"Onboarding" :"Tab" }
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
