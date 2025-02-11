import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import Homepage from "../screens/Homepage";

const ScreenStack = createStackNavigator();

const ScreenNavigator = () => {
  return (
    <ScreenStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      <ScreenStack.Screen name="Home" component={Homepage} />
    </ScreenStack.Navigator>
  );
};

export default ScreenNavigator;
