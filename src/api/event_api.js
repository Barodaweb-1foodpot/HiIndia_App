import axios from "axios";
import Toast from "react-native-toast-message";
import { API_BASE_URL } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const listActiveEvents = async () => {
  try {
    console.log(
      "Fetching active events from:",
      `${API_BASE_URL}/auth/listActive/event`
    );
    const response = await axios.get(`${API_BASE_URL}/auth/listActive/event`);
    console.log("[Response received:", response.data);
    return response;
  } catch (error) {
    console.error("Error fetching active events:", error);
    Toast.show({
      type: "error",
      text1: "Active Events Error",
      text2: "Something went wrong. Please try again.",
    });
    throw new Error(error);
  }
};

export const fetchEvents = async (query, categoryFilter, filterDate) => {
  try {
    console.log(
      "Requesting events with query:",
      query,
      "filterDate:",
      filterDate,
      "categoryFilter:",
      categoryFilter
    );
    const response = await axios.post(
      `${API_BASE_URL}/auth/list-by-params/eventforApp`,
      {
        match: query,
        IsActive: true,
        filterDate,
        categoryFilter,
      }
    );
    console.log("Response received:", response.data);
    if (!response.data[0]) {
      console.log("No events found. Data:", response.data);
    }
    return response?.data[0];
  } catch (error) {
    console.error("Error fetching events:", error);
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
    console.log(
      "Fetching event categories from:",
      `${API_BASE_URL}/auth/get/getEventCategoriesByPartner`
    );
    const response = await axios.get(
      `${API_BASE_URL}/auth/get/getEventCategoriesByPartner`
    );
    console.log("Response received:", response.data);
    return response;
  } catch (error) {
    console.error("Error fetching categories:", error);
    Toast.show({
      type: "error",
      text1: "Categories Error",
      text2: "Something went wrong. Please try again.",
    });
    throw new Error(error);
  }
};

export const SaveEvent = async (values) => {
  try {
    console.log("Saving event with values:", values);
    const token = await AsyncStorage.getItem("Token");
    const id = await AsyncStorage.getItem("role");
    console.log("Retrieved token:", token, "and role id:", id);
    const response = await axios.patch(
      `${API_BASE_URL}/auth/patch/saveParticipantEvent/${id}`,
      values,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      
      }
    );
    console.log("Response received:", response.data);
    return response;
  } catch (error) {
    console.error("Error saving event:", error);
    Toast.show({
      type: "error",
      text1: "Save Event Error",
      text2: "Something went wrong. Please try again.",
    });
    throw new Error(error);
  }
};

export const ExentRegister = async (payload) => {
  try {
    console.log("Registering event with payload:", payload);
    const token = await AsyncStorage.getItem("Token");
    console.log(token)
    const response = await axios.post(
      `${API_BASE_URL}/auth/create/EventRegister`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        validateStatus: () => true
      }, 
    );
    console.log("Response received:", response.data);
    return response.data || false;
  } catch (error) {
    console.error("Error registering event:", error);
    Toast.show({
      type: "error",
      text1: "Event Registration Error",
      text2: "Something went wrong. Please try again.",
    });
    throw new Error(error);
  }
};

export const EventTicket = async () => {
  try {
    console.log("Fetching event ticket...");
    const id = await AsyncStorage.getItem("role");
    console.log("Retrieved role id:", id);
    const response = await axios.get(
      `${API_BASE_URL}/auth/get/eventRegisterTicket/${id}`
    );
    console.log("Response received:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching event ticket:", error);
    Toast.show({
      type: "error",
      text1: "Event Ticket Error",
      text2: "Something went wrong. Please try again.",
    });
    throw new Error(error);
  }
};
