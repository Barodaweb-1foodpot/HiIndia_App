import axios from "axios";
import jwtDecode from "jwt-decode";
import Toast from "react-native-toast-message";
import { API_BASE_URL } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";


export const CheckAccessToken = async () => {
    try {
        console.log("object")
        // await AsyncStorage.getItem("role");
        const token = await AsyncStorage.getItem("Token");
        const refreshToken = await AsyncStorage.getItem("RefreshToken")
        console.log(token)
        if (token === null) {
            return false
        }
        else {
            const res = await axios.post(`${API_BASE_URL}/participants/verifyAndGenerateAccessToken`,
                { token, refreshToken }, {
                validateStatus: () => true,
            })

            console.log("mmmmmmmmmm", res.data)
            console.log("llllllllllllllll",res.status)
            if (res.status === 201) {
                await AsyncStorage.setItem("Token" , res.data.token)
                await AsyncStorage.setItem("RefreshToken" , res.data.refreshToken)
                return true
                
            }
            else if(res.status===200) return true
            else{
                return false
            }
        }

    }
    catch (error) {
        console.error("Error during login:", error);
        Toast.show({
            type: "error",
            text1: "Login Error",
            text2: "Something went wrong. Please try again.",
        });
        throw new Error(error);
    }
}