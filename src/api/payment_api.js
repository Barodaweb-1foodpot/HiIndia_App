import axios from "axios";
import { API_BASE_URL } from "@env";

export const createPaymentIntent = async (amount, currency = "usd") => {
  try {
    const response = await axios.post(`${API_BASE_URL}/paymentIntent`, {
      amount,
      currency,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating PaymentIntent:", error);
    throw error;
  }
};

export const updatePaymentStatus = async (clientSecret, status , isPaid) => {
  try {
    const val = { clientSecret, status ,isPaid};
    const response = await axios.patch(
      `${API_BASE_URL}/auth/patch/PaymentStatus`,
      val
    );
    return response.data;
  } catch (error) {
    console.error("Error updating PaymentIntent:", error);
    throw error;
  }
};
