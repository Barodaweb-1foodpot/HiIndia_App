// import { GoogleSignin } from "@react-native-google-signin/google-signin";
import axios from "axios";
import jwtDecode from "jwt-decode";
import Toast from "react-native-toast-message";
import { API_BASE_URL } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const handleLogin = async (values) => {

    try {
        console.log("Logging in with:", values);
        const res = await axios.post(`${API_BASE_URL}/participantLogin`, values, {
            validateStatus: () => true,
        });

        if (res.data.isOk) {
            console.log("Login successful:", res.data.data);
            await AsyncStorage.setItem("role", res.data.data._id);
            await AsyncStorage.setItem("Token", res.data.token);

            Toast.show({
                type: "success",
                text1: "Login Successful",
                text2: "Welcome back!",
            });

            return res.data;
        } else {
            console.log("Login failed:", res.data);
            return res.data;
        }
    } catch (error) {
        console.error("Error during login:", error);
        Toast.show({
            type: "error",
            text1: "Login Error",
            text2: "Something went wrong. Please try again.",
        });
        throw new Error(error);
    }
};

export const requestOTP = async (values) => {
    try {
        console.log(values)
        const response = await axios.post(`${API_BASE_URL}/auth/participant/otp-Forget-password-request`, { email: values }, {
            validateStatus: () => true,
        });
        console.log(response.data)
        return response.data
    } catch (error) {
        console.error("Error during login:", error);
        Toast.show({
            type: "error",
            text1: "Login Error",
            text2: "Something went wrong. Please try again.",
        });
        throw new Error(error);
    }
};


export const verifyOTP = async (values) => {

    try {
        const response = await axios.post(`${API_BASE_URL}/auth/participant/verify-otp-login`, values);
        console.log(response.data)
        return response.data
    } catch (error) {
        console.error("Error during login:", error);
        Toast.show({
            type: "error",
            text1: "Login Error",
            text2: "Something went wrong. Please try again.",
        });
        throw new Error(error);
    }
};


export const handleSetPassword = async (id , password) => {
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/participant/set-password/${id}`,
        { password }
      );

      console.log(response.data)
      return response.data
    } catch (error) {
        console.error("Error during login:", error);
        Toast.show({
            type: "error",
            text1: "Login Error",
            text2: "Something went wrong. Please try again.",
        });
        throw new Error(error);
    }
  };