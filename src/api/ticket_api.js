import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@env";
import Toast from "react-native-toast-message";

export const getTickets = async () => {
  try {
    console.log("Fetching role ID from AsyncStorage...");
    const id = await AsyncStorage.getItem("role");
    console.log("Retrieved role ID:", id);
    console.log(
      "Making GET request to:",
      `${API_BASE_URL}/auth/get/eventRegisterTicket/${id}`
    );
    const response = await axios.get(
      `${API_BASE_URL}/auth/get/eventRegisterTicket/${id}`
    );
    console.log("Response received:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching tickets:", error);
    Toast.show({
      type: "error",
      text1: "Ticket Fetch Error",
      text2: "Something went wrong while fetching tickets. Please try again.",
    });
    throw error;
  }
};
