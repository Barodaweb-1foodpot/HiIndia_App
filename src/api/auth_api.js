import axios from "axios";
import Toast from "react-native-toast-message";
import { API_BASE_URL } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const handleLogin = async (values) => {
  try {
    console.log("[handleLogin] Logging in with:", values);
    console.log("[handleLogin] API_BASE_URL:", API_BASE_URL);
    const res = await axios.post(`${API_BASE_URL}/participantLogin`, values, {
      validateStatus: () => true,
    });
    console.log("[handleLogin] Response received:", res.data);

    if (res.data.isOk) {
      console.log("[handleLogin] Login successful:", res.data.data);
      await AsyncStorage.setItem("role", res.data.data._id);
      await AsyncStorage.setItem("Token", res.data.token);
      await AsyncStorage.setItem("RefreshToken", res.data.refreshtoken);

      Toast.show({
        type: "success",
        text1: "Login Successful",
        text2: "Welcome back!",
      });
      return res.data;
    } else {
      console.log("[handleLogin] Login failed:", res.data);
      return res.data;
    }
  } catch (error) {
    console.error("[handleLogin] Error during login:", error);
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
    console.log("[requestOTP] Requesting OTP for email:", values);
    const response = await axios.post(
      `${API_BASE_URL}/auth/participant/otp-Forget-password-request`,
      { email: values },
      { validateStatus: () => true }
    );
    console.log("[requestOTP] Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("[requestOTP] Error during OTP request:", error);
    Toast.show({
      type: "error",
      text1: "OTP Request Error",
      text2: "Something went wrong. Please try again.",
    });
    throw new Error(error);
  }
};

export const verifyOTP = async (values) => {
  try {
    console.log("[verifyOTP] Verifying OTP with payload:", values);
    const response = await axios.post(
      `${API_BASE_URL}/auth/participant/verify-otp-login`,
      values
    );
    console.log("[verifyOTP] Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("[verifyOTP] Error during OTP verification:", error);
    Toast.show({
      type: "error",
      text1: "OTP Verification Error",
      text2: "Something went wrong. Please try again.",
    });
    throw new Error(error);
  }
};

export const handleSetPassword = async (id, password) => {
  try {
    console.log(`[handleSetPassword] Setting new password for id: ${id}`);
    const response = await axios.post(
      `${API_BASE_URL}/auth/participant/set-password/${id}`,
      { password }
    );
    console.log("[handleSetPassword] Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("[handleSetPassword] Error during set password:", error);
    Toast.show({
      type: "error",
      text1: "Set Password Error",
      text2: "Something went wrong. Please try again.",
    });
    throw new Error(error);
  }
};

export const handleSignup = async (values) => {
  try {
    console.log("[handleSignup] Signing up with:", values);
    const res = await axios.post(
      `${API_BASE_URL}/auth/create/participant`,
      values,
      { validateStatus: () => true }
    );
    console.log("[handleSignup] Signup response:", res.data);

    if (res.data.isOk) {
      Toast.show({
        type: "success",
        text1: "Signup Successful",
        text2: "Account created successfully",
      });
    } else {
      console.log("[handleSignup] Signup failed:", res.data);
    }
    return res.data;
  } catch (error) {
    console.error("[handleSignup] Error during signup:", error);
    Toast.show({
      type: "error",
      text1: "Signup Error",
      text2: "Something went wrong. Please try again.",
    });
    throw error;
  }
};

export const fetchActiveCountries = async () => {
  try {
    console.log("[fetchActiveCountries] Fetching active countries...");
    const res = await axios.get(
      `${API_BASE_URL}/auth/location/activeCountries`
    );
    console.log("[fetchActiveCountries] Fetched data:", res.data);
    return res.data;
  } catch (error) {
    console.error("[fetchActiveCountries] Error fetching active countries:", error);
    Toast.show({
      type: "error",
      text1: "Country Codes Error",
      text2: "Unable to fetch country codes.",
    });
    throw error;
  }
};

export const fetchProfile = async (participantId) => {
  try {
    console.log("[fetchProfile] Fetching profile for participantId:", participantId);
    const token = await AsyncStorage.getItem("Token");
    const res = await axios.get(
      `${API_BASE_URL}/auth/get/participant/${participantId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        validateStatus: () => true,
      }
    );
    console.log("[fetchProfile] Profile data:", res.data);
    return res.data;
  } catch (error) {
    console.error("[fetchProfile] Error fetching profile:", error);
    Toast.show({
      type: "error",
      text1: "Profile Error",
      text2: "Unable to fetch profile data.",
    });
    throw error;
  }
};

export const updateProfileByApp = async (participantId, formData) => {
  try {
    console.log(`[updateProfileByApp] Updating profile for participantId: ${participantId}`);
    const token = await AsyncStorage.getItem("Token");
    const res = await axios.patch(
      `${API_BASE_URL}/auth/updateProfileByApp/${participantId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        validateStatus: () => true,        
      }
    );
    console.log("[updateProfileByApp] Response:", res.data);
    return res.data;
  } catch (error) {
    console.error("[updateProfileByApp] Error updating profile by app:", error);
    Toast.show({
      type: "error",
      text1: "Update Error",
      text2: "Something went wrong while updating profile.",
    });
    throw error;
  }
};

export const handleGoogleLogin = async (email) => {
  try {
    console.log("[handleGoogleLogin] Handling Google login for email:", email);
    const res = await axios.post(
      `${API_BASE_URL}/participant/participantHandleGoogleLogin`,
      { email: email },
      { validateStatus: () => true }
    );
    console.log("[handleGoogleLogin] Response:", res.data);
    return res.data;
  } catch (error) {
    console.error("[handleGoogleLogin] Error during Google login:", error);
    Toast.show({
      type: "error",
      text1: "Google Login Error",
      text2: "Something went wrong during Google login.",
    });
    throw error;
  }
};

export const verifyGoogleToken = async (token) => {
  try {
    console.log("[verifyGoogleToken] Verifying Google token:", token);
    const res = await axios.post(`${API_BASE_URL}/verify/googleToken`, { token });
    console.log("[verifyGoogleToken] Token verification response:", res.data);

    if (res.data.isOk) {
      const response = await handleGoogleLogin(res.data.email);
      console.log("[verifyGoogleToken] handleGoogleLogin response:", response);

      if (response.status === 200) {
        console.log("[verifyGoogleToken] Setting AsyncStorage items for Google login");
        await AsyncStorage.setItem("role", response.data._id);
        await AsyncStorage.setItem("Token", response.token);
        await AsyncStorage.setItem("RefreshToken", response.refreshToken);

        Toast.show({
          type: "success",
          text1: "Login Successful",
          text2: "Welcome back!",
        });
        return true;
      } else {
        console.log("[verifyGoogleToken] Google login failed with response:", response);
        Toast.show({
          type: "success",
          text1: response.message,
        });
        return false;
      }
    }
  } catch (error) {
    console.error("[verifyGoogleToken] Error during Google token verification:", error);
    Toast.show({
      type: "error",
      text1: "Google Token Verification Error",
      text2: "Something went wrong during token verification.",
    });
    throw new Error(error);
  }
};

export const deleteUserAccount = async (participantId) => {
  try {
    const token = await AsyncStorage.getItem("Token");
    console.log("[deleteUserAccount] Deleting account for participantId:", participantId);
    const res = await axios.delete(
      `${API_BASE_URL}/auth/remove/participant/${participantId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        validateStatus: () => true,
      }
    );
    console.log("[deleteUserAccount] Response:", res.data);
    return res.data;
  } catch (error) {
    console.error("[deleteUserAccount] Error deleting account:", error);
    Toast.show({
      type: "error",
      text1: "Delete Account Error",
      text2: "Something went wrong while deleting your account.",
    });
    throw error;
  }
};
