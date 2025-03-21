import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchProfile } from "../api/auth_api";
import Toast from "react-native-toast-message";

export function useProfile() {
  const [profileData, setProfileData] = useState(null);

  const loadProfile = useCallback(async () => {
    try {
      const participantId = await AsyncStorage.getItem("role");
      if (participantId) {
        const res = await fetchProfile(participantId);
        if (res && res._id) {
          setProfileData(res);
        } else {
          Toast.show({
            type: "error",
            text1: "Profile Error",
            text2: "Failed to load profile",
            position: "bottom",
          });
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      Toast.show({
        type: "error",
        text1: "Profile Error",
        text2: "An unexpected error occurred",
      });
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return { profileData, reloadProfile: loadProfile };
}
