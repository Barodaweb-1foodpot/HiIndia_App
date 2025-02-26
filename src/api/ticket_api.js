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



export const sendEventTicketByOrderId = async (orderId) => {
  try {
    
    const response = await axios.post(
      `${API_BASE_URL}/auth/send/sendEventTicketByOrderId`,{orderId:orderId}
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



 

export const getTicketsByOrderId = async (orderId) => {
  try {
    console.log("orderId,orderId",orderId)
    const response = await axios.post(
      `${API_BASE_URL}/auth/get/getTicketsByOrderId`,
      {orderId}
    );
    console.log("xxxxxxxxxxxxxxxxxxxxxxxxx",response.data.data.length)
    return response.data;
  } catch (error) {
    console.error("Error fetching tickets by order id:", error);
    Toast.show({
      type: "error",
      text1: "Ticket Details Fetch Error",
      text2:
        "Something went wrong while fetching ticket details. Please try again.",
    });
    throw error;
  }
};