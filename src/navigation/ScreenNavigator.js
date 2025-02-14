import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import EventsDetail from "../screens/Events/EventsDetail";
import BuyTicketScreen from "../screens/Events/BuyTicketScreen";

const ScreenStack = createStackNavigator();

const ScreenNavigator = () => {
  return (
    <ScreenStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      <ScreenStack.Screen name="EventsDetail" component={EventsDetail} />
      <ScreenStack.Screen name="BuyTicket" component={BuyTicketScreen} />
    </ScreenStack.Navigator>
  );
};

export default ScreenNavigator;
