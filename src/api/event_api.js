import axios from "axios";
import jwtDecode from "jwt-decode";
import Toast from "react-native-toast-message";
import { API_BASE_URL } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";




export const listActiveEvents = async () => {
    try {
        return await axios.get(
            `${API_BASE_URL}/auth/listActive/event`
        );
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

};

export const fetchEvents = async (pageNo, perPage, query  , filterDate) => {
    let skip = (pageNo - 1) * perPage;
    if (skip < 0) {
        skip = 0;
    } 
    console.log("xxxxxxxxxxxx",filterDate)
    try {
        const response = await axios.post(
            `${API_BASE_URL}/auth/list-by-params/eventforparticipant`,
            {
                skip: skip,
                per_page: perPage,
                match: query,
                IsActive: true, 
                filterDate
            }
        );

        // console.log("------", response.data[0].data); // ✅ This logs correctly
        return response?.data[0]; // ✅ Now correctly returns the data
    } catch (error) {
        console.error("Error during fetching events:", error);
        Toast.show({
            type: "error",
            text1: "Fetch Error",
            text2: "Something went wrong. Please try again.",
        });
        throw new Error(error);
    }
};
export const getEventCategoriesByPartner = async () => {
    try {
        return await axios.get(
            `${API_BASE_URL}/auth/get/getEventCategoriesByPartner`
        );
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

};
