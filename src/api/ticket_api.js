import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@env";
import Toast from "react-native-toast-message";

export const getTickets = async () => {
  try {
    const id = await AsyncStorage.getItem("role");
    const response = await axios.get(
      `${API_BASE_URL}/auth/get/eventRegisterTicket/${id}`
    );
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