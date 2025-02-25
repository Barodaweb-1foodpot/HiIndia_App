import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "../screens/Login/LoginScreen";
import LoginPinScreen from "../screens/Login/LoginPinScreen";
import ForgotPassword from "../screens/ForgotPassword/ForgotPassword";
import VerifyOtp from "../screens/ForgotPassword/VerifyOtp";
import VerifyCode from "../screens/ForgotPassword/VerifyCode";
import UpdatedPin from "../screens/ForgotPassword/UpdatedPin";
import SignUpPage from "../screens/SignUpPage";


const AuthStack = createStackNavigator();

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
      // initialRouteName="UpdatedPin" 
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpPage} />
      <AuthStack.Screen name="LoginPin" component={LoginPinScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPassword} />
      <AuthStack.Screen name="VerifyOtp" component={VerifyOtp} />
      <AuthStack.Screen name="VerifyCode" component={VerifyCode} />
      <AuthStack.Screen name="UpdatedPin" component={UpdatedPin} />
    </AuthStack.Navigator>
  );
};

export default AuthNavigator;
