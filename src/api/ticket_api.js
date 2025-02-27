import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@env";
import Toast from "react-native-toast-message";


export const getTickets = async () => {
  try {
    console.log("Attempting to retrieve role ID from AsyncStorage...");
    const id = await AsyncStorage.getItem("role");
    console.log("Retrieved role ID:", id);

    const url = `${API_BASE_URL}/auth/get/eventRegisterTicket/${id}`;
    console.log("Making GET request to:", url);

    const response = await axios.get(url);
    console.log("Response data received:", response.data);

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
    console.log("Sending ticket for orderId:", orderId);

    const url = `${API_BASE_URL}/auth/send/sendEventTicketByOrderId`;
    console.log("sendEventTicketByOrderId: Making POST request to:", url);

    const response = await axios.post(url, { orderId });
    console.log("Response data received:", response.data);

    return response.data;
  } catch (error) {
    console.error("Error sending event ticket:", error);
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
    console.log("Received orderId:", orderId);

    const url = `${API_BASE_URL}/auth/get/getTicketsByOrderId`;
    console.log("getTicketsByOrderId: Making POST request to:", url);

    const response = await axios.post(url, { orderId });
    console.log("Number of tickets found:", response.data?.data?.length);

    return response.data;
  } catch (error) {
    console.error("Error fetching tickets by order ID:", error);
    Toast.show({
      type: "error",
      text1: "Ticket Details Fetch Error",
      text2: "Something went wrong while fetching ticket details. Please try again.",
    });
    throw error; 
  }
};