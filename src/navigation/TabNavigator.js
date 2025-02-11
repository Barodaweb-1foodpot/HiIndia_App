import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Homepage from "../screens/Homepage";
import EventsScreen from "../screens/EventsScreen";
import TicketsScreen from "../screens/TicketsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import CustomTabBar from "../components/CustomTabBar";

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: "none",
        },
      }}
    >
      <Tab.Screen name="Home" component={Homepage} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Tickets" component={TicketsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigator;
