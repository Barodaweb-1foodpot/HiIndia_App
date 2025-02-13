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

export const handleGoogleSuccess = async (Email) => {
    console.log("Google response object:", response); // Check the response structure
    try {
    //   const token = response.credential; // JWT token provided by Google
    //   const decoded = jwtDecode(token); // Use jwt-decode library to decode the JWT
    //   console.log(decoded)
    //   const Email = decoded.email; // Get Email from decoded token

    //   console.log("Decoded Email:", Email); // Log the Email

      const serverResponse = await axios.post(
        `${API_BASE_URL}/api/eventPartner/eventPartnerHandleGoogleLogin`,
        { Email: Email } // Send Email to your backend
      );
      console.log("API response:", serverResponse); // Log the response from your API
      if (serverResponse.success === true) {
        console.log(serverResponse.data)
        // await AsyncStorage.setItem("role", res.data.data._id);
        //     await AsyncStorage.setItem("Token", res.data.token);

        // localStorage.setItem("AdminUser", serverResponse.data._id)
        // localStorage.setItem("LoggedinUser", serverResponse.data.FirstName        )
        // console.log("Google login successful!", serverResponse);
        // Navigate("/dashboard");
        // console.log("Redirecting to dashboard...");
        // localStorage.setItem("Token", serverResponse.token)
      }

      else {
       return "Unregistered Speaker. Please register first."

        // setError(serverResponse.message || "Failed to authenticate with Google.");
      }
    } catch (error) {
        throw new Error(error);

    }
  };