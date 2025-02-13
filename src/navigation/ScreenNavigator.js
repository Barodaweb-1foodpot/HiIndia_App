import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import EventsDetail from "../screens/EventsDetail";

const ScreenStack = createStackNavigator();

const ScreenNavigator = () => {
  return (
    <ScreenStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      <ScreenStack.Screen name="Home" component={EventsDetail} />
    </ScreenStack.Navigator>
  );
};

export default ScreenNavigator;
