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
      await AsyncStorage.setItem("RefreshToken", res.data.refreshtoken);


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
    console.log(values);
    const response = await axios.post(
      `${API_BASE_URL}/auth/participant/otp-Forget-password-request`,
      { email: values },
      { validateStatus: () => true }
    );
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error during OTP request:", error);
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
    const response = await axios.post(
      `${API_BASE_URL}/auth/participant/verify-otp-login`,
      values
    );
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error during OTP verification:", error);
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
    const response = await axios.post(
      `${API_BASE_URL}/auth/participant/set-password/${id}`,
      { password }
    );

    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error during set password:", error);
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
    console.log("Signing up with:", values);
    const res = await axios.post(
      `${API_BASE_URL}/auth/create/participant`,
      values, {
        validateStatus: () => true,
      }
       
    );
    if (res.data.isOk) {
      Toast.show({
        type: "success",
        text1: "Signup Successful",
        text2: "Account created successfully",
      });
    }
    return res.data;
  } catch (error) {
    console.error("Error during signup:", error);
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
    const res = await axios.get(
      `${API_BASE_URL}/auth/location/activeCountries`
    );

    return res.data;
  } catch (error) {
    console.error("Error fetching active countries:", error);
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
    console.log("Fetching profile for participantId:", participantId);
    const res = await axios.get(
      `${API_BASE_URL}/auth/get/participant/${participantId}`
    );
    console.log("Profile fetch result:", res.data);
    return res.data; 
  } catch (error) {
    console.error("Error fetching profile:", error);
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
    const token = await AsyncStorage.getItem("Token");
    const res = await axios.patch(
      `${API_BASE_URL}/auth/updateProfileByApp/${participantId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          // Authorization: `Bearer ${token}`, 
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error("Error updating profile by app:", error);
    Toast.show({
      type: "error",
      text1: "Update Error",
      text2: "Something went wrong while updating profile.",
    });
    throw error;
  }
};


export const handleGoogleLogin = async(email)=>{
  try{
    console.log(email)
    const res = await axios.post(`${API_BASE_URL}/participant/participantHandleGoogleLogin`,{email:email}, {
      validateStatus: () => true,
    })
     return res.data
  }
  catch (error) {
    console.error("Error updating profile by app:", error);
    Toast.show({
      type: "error",
      text1: "Update Error",
      text2: "Something went wrong while updating profile.",
    });
    throw error;
  }
}


export const verifyGoogleToken = async(token)=>{
  try{
    const res = await axios.post(`${API_BASE_URL}/verify/googleToken` , {token:token})
    console.log("-------------",res.data)
    if(res.data.isOk)
    {
      const response = await handleGoogleLogin(res.data.email)
      console.log("reeeeeeeeeee",response)
      if(response.status===200)
      {
        console.log(response.refreshToken)
        await AsyncStorage.setItem("role", response.data._id);
        await AsyncStorage.setItem("Token", response.token);
        await AsyncStorage.setItem("RefreshToken", response.refreshToken);
  
  
        Toast.show({
          type: "success",
          text1: "Login Successful",
          text2: "Welcome back!",
        })

        // navigation.navigate("Tab");
        return true
      
      }
      else{
        
        Toast.show({
          type: "success",
          text1: response.message, 
        });
        return false
      }
    }
  }
  catch (error) {
    console.error("Error updating profile by app:", error);
    Toast.show({
      type: "error",
      text1: "Update Error",
      text2: "Something went wrong while updating profile.",
    });
    throw error;
  }
}