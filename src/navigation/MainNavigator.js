import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import Homepage from "../screens/Homepage";

const Stack = createStackNavigator();

export default function MainNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={Homepage} />
    </Stack.Navigator>
  );
}
