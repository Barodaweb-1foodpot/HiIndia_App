import React, { useEffect, useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import * as Font from "expo-font";
import SplashScreen from "../screens/SplashScreen";
import Onboarding from "../screens/Onboarding";
import AuthNavigator from "./AuthNavigator";
import ScreenNavigator from "./ScreenNavigator";
import Homepage from "../screens/Homepage";
import TabNavigator from "./TabNavigator";

const Stack = createStackNavigator();

const MainNavigator = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        await Font.loadAsync({
          "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
          "Poppins-Medium": require("../../assets/fonts/Poppins-Medium.ttf"),
          "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error("Error loading fonts:", error);
      }
    };

    loadAssets();

    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(splashTimer);
  }, []);

  if (!fontsLoaded || showSplash) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      // initialRouteName="Onboarding"
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      {/* <Stack.Screen name="Onboarding" component={Onboarding} /> */}
      {/* <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen name="App" component={ScreenNavigator} /> */}
      <Stack.Screen name="App" component={TabNavigator} />
      {/* <Stack.Screen name="Homepage" component={Homepage} /> */}
    </Stack.Navigator>
  );
};

export default MainNavigator;
