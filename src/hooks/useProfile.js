import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchProfile } from "../api/auth_api";
import Toast from "react-native-toast-message";

export function useProfile() {
  const [profileData, setProfileData] = useState(null);

  const loadProfile = useCallback(async () => {
    try {
      const participantId = await AsyncStorage.getItem("role");
      const token = await AsyncStorage.getItem("Token");
      
      // If user is not authenticated, don't try to load profile or show error
      if (!participantId || !token) {
        console.log("[useProfile] User not authenticated, skipping profile load");
        return;
      }
      
      const res = await fetchProfile(participantId);
      if (res && res._id) {
        setProfileData(res);
      } else {
        // Only show error toast if we have a token but couldn't load profile
        // This suggests there's a real error, not just that the user isn't logged in
        console.log("[useProfile] Failed to load profile even though user has token");
      }
    } catch (error) {
      console.error("[useProfile] Error loading profile:", error);
      // Check if error is related to authentication before showing toast
      const isAuthError = error.response && (error.response.status === 401 || error.response.status === 403);
      
      if (!isAuthError) {
        // Only show error toast for non-auth errors
        Toast.show({
          type: "error",
          text1: "Profile Error",
          text2: "An unexpected error occurred",
        });
      }
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return { profileData, reloadProfile: loadProfile };
}
