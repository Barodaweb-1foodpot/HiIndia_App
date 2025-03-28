import axios from "axios";
import Toast from "react-native-toast-message";
import { API_BASE_URL } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const fetchTermsAndConditions = async (id) => {
  try {
    console.log("[fetchTermsAndConditions] Fetching terms for id:", id);
    const token = await AsyncStorage.getItem("Token");
    const response = await axios.get(
      `${API_BASE_URL}/auth/get/Terms_and_condition/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        validateStatus: () => true,
      }
    );
    console.log("[fetchTermsAndConditions] Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("[fetchTermsAndConditions] Error:", error);
    Toast.show({
      type: "error",
      text1: "Error Loading Content",
      text2: "Unable to fetch the requested content.",
    });
    throw error;
  }
};
