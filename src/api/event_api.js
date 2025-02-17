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

export const fetchEvents = async (pageNo, perPage, query, categoryFilter, filterDate) => {
    let skip = (pageNo - 1) * perPage;
    if (skip < 0) {
        skip = 0;
    } 
    try {
        const response = await axios.post(
            `${API_BASE_URL}/auth/list-by-params/eventforparticipant`,
            {
                skip: skip,
                per_page: perPage,
                match: query,
                IsActive: true,
                filterDate,
                categoryFilter
            }
        );

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


export const SaveEvent = async (values) => {
    try {
        const token = await AsyncStorage.getItem("Token")
        const id = await AsyncStorage.getItem("role")
        console.log(token)
        return await axios.patch(
            `${API_BASE_URL}/auth/patch/saveParticipantEvent/${id}`,
            values,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
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


