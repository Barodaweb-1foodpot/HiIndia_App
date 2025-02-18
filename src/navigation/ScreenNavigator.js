import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import EventsDetail from "../screens/Events/EventsDetail";
import BuyTicketScreen from "../screens/Events/BuyTicketScreen";
import PaymentScreen from "../screens/Events/PaymentScreen";
import EditProfile from "../screens/Profile/EditProfile";
import ChangePin from "../screens/Profile/ChangePin";
import HelpSupport from "../screens/Profile/HelpSupport";
import PrivacyPolicy from "../screens/Profile/PrivacyPolicy";
import License from "../screens/Profile/License";
import CalendarScreen from "../screens/Calender";

const ScreenStack = createStackNavigator();

const ScreenNavigator = () => {
  return (
    <ScreenStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      <ScreenStack.Screen name="Calender" component={CalendarScreen} />
      <ScreenStack.Screen name="EventsDetail" component={EventsDetail} />
      <ScreenStack.Screen name="BuyTicket" component={BuyTicketScreen} />
      <ScreenStack.Screen name="PaymentScreen" component={PaymentScreen} />
      <ScreenStack.Screen name="EditProfile" component={EditProfile} />
      <ScreenStack.Screen name="HelpSupport" component={HelpSupport} />
      <ScreenStack.Screen name="ChangePin" component={ChangePin} />
      <ScreenStack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
      <ScreenStack.Screen name="License" component={License} />
    </ScreenStack.Navigator>
  );
};

export default ScreenNavigator;
