import axios from "axios";
import Toast from "react-native-toast-message";
import { API_BASE_URL } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const CheckAccessToken = async () => {
  try {
    console.log("[CheckAccessToken] Starting token verification process.");
    // Retrieve stored tokens
    const token = await AsyncStorage.getItem("Token");
    const refreshToken = await AsyncStorage.getItem("RefreshToken");
    console.log("Retrieved Token:", token);
    console.log("Retrieved RefreshToken:", refreshToken);

    if (token === null) {
      console.log("No token found. User is not authenticated.");
      return false;
    } else {
      console.log(
        `Token found. Verifying token with API at ${API_BASE_URL}/participants/verifyAndGenerateAccessToken`
      );
      const res = await axios.post(
        `${API_BASE_URL}/participants/verifyAndGenerateAccessToken`,
        { token, refreshToken },
        {
          validateStatus: () => true,
        }
      );

      console.log("API Response Data:", res.data);
      console.log("API Response Status:", res.status);

      if (res.status === 201) {
        console.log("Token refreshed successfully.");
        await AsyncStorage.setItem("Token", res.data.token);
        await AsyncStorage.setItem("RefreshToken", res.data.refreshToken);
        return true;
      } else if (res.status === 200) {
        console.log("Token is valid.");
        return true;
      } else {
        console.log("Token verification failed. Status:", res.status);
        return false;
      }
    }
  } catch (error) {
    console.error("Error during token verification:", error);
    Toast.show({
      type: "error",
      text1: "Login Error",
      text2: "Something went wrong. Please try again.",
    });
    throw new Error(error);
  }
};
