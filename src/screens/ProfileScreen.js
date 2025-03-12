import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  Platform,
  Share,
  ScrollView,
  Linking,
  StatusBar,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchProfile } from "../api/auth_api";
import { API_BASE_URL_UPLOADS } from "@env";

// Import the provided SkeletonLoader component
import SkeletonLoader from "../components/SkeletonLoader";

// ---------------------------
// ProfileImage Component
// ---------------------------
// Moved outside of ProfileScreen to prevent re-creation and wrapped in React.memo.
const ProfileImage = React.memo(({ source, style }) => {
  const [loaded, setLoaded] = useState(false);
  // Check if source is remote (has a uri)
  const isRemote = source && source.uri;

  // If the image is not remote, mark it as loaded immediately
  useEffect(() => {
    if (!isRemote) {
      setLoaded(true);
    }
  }, [isRemote]);

  return (
    <View style={style}>
      {isRemote && !loaded && (
        <SkeletonLoader
          style={[StyleSheet.absoluteFill, { borderRadius: style?.borderRadius || 0 }]}
        />
      )}
      <Image
        source={source}
        style={[style, { opacity: loaded ? 1 : 0 }]}
        resizeMode="cover"
        onLoad={() => {
          console.log("[ProfileImage] Image loaded successfully");
          setLoaded(true);
        }}
      />
    </View>
  );
});

// ---------------------------
// ProfileScreen Component
// ---------------------------
export default function ProfileScreen() {
  const [profileData, setProfileData] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigation = useNavigation();

  // Load profile data from API and AsyncStorage
  const loadProfile = useCallback(async () => {
    try {
      console.log("[ProfileScreen] Loading profile data...");
      const participantId = await AsyncStorage.getItem("role");
      if (participantId) {
        const res = await fetchProfile(participantId);
        if (res && res._id) {
          console.log("[ProfileScreen] Profile loaded successfully:", res);
          setProfileData(res);
        } else {
          console.log("[ProfileScreen] Profile load failed. Invalid response:", res);
          Toast.show({
            type: "error",
            text1: "Profile Error",
            text2: "Failed to load profile",
            position: "bottom",
          });
        }
      } else {
        console.log("[ProfileScreen] No participantId found in storage.");
      }
    } catch (error) {
      console.error("[ProfileScreen] Error loading profile:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log("[ProfileScreen] Screen focused. Setting StatusBar and loading profile.");
      StatusBar.setBarStyle("dark-content");
      loadProfile();
      return () => {
        console.log("[ProfileScreen] Screen unfocused.");
      };
    }, [loadProfile])
  );

  // Memoize profile image source to avoid recalculations
  const profileImageSource = useMemo(() => {
    if (
      !profileData ||
      !profileData.profileImage ||
      !profileData.profileImage.trim()
    ) {
      console.log("[ProfileScreen] Using default placeholder image.");
      return require("../../assets/placeholder.jpg");
    }
    console.log("[ProfileScreen] Using profile image from API.");
    return { uri: `${API_BASE_URL_UPLOADS}/${profileData.profileImage}` };
  }, [profileData]);

  // Memoize shareMessage so it doesn't get redefined on each render.
  const shareMessage = useMemo(
    () => "Hey, check out this amazing event on HiIndia! https://hiindia.com/",
    []
  );

  // Handle share options with memoized callback
  const handleShareOption = useCallback(async (option) => {
    try {
      console.log("[ProfileScreen] Handling share option:", option);
      switch (option) {
        case "copyLink":
          await Clipboard.setStringAsync(shareMessage);
          Toast.show({
            type: "success",
            text1: "Link copied!",
            text2: "Invite link copied to clipboard.",
          });
          break;
        case "whatsapp":
          Linking.openURL(`whatsapp://send?text=${encodeURIComponent(shareMessage)}`);
          break;
        case "facebook":
          await Share.share({ message: shareMessage });
          break;
        case "email":
          Linking.openURL(
            `mailto:?subject=HiIndia%20Event&body=${encodeURIComponent(shareMessage)}`
          );
          break;
        case "linkedin":
          await Share.share({ message: shareMessage });
          break;
        case "twitter":
          Linking.openURL(`twitter://post?message=${encodeURIComponent(shareMessage)}`);
          break;
        default:
          console.log("[ProfileScreen] Unknown share option:", option);
          break;
      }
      setShowShareModal(false);
    } catch (error) {
      console.error("[ProfileScreen] Error sharing event:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong with sharing.",
      });
    }
  }, [shareMessage]);

  // Logout handler remains unchanged
  const handleLogout = useCallback(async () => {
    try {
      console.log("[ProfileScreen] Logging out...");
      setShowLogoutModal(false);
      await AsyncStorage.removeItem("role");
      await AsyncStorage.removeItem("Token");
      await AsyncStorage.removeItem("RefreshToken");
      Toast.show({
        type: "info",
        text1: "Logged Out",
        text2: "You have been logged out successfully!",
      });
      console.log("[ProfileScreen] Logout successful, navigating to Login.");
      navigation.navigate("Auth", { screen: "Login" });
    } catch (error) {
      console.error("[ProfileScreen] Error during logout:", error);
      Toast.show({
        type: "error",
        text1: "Logout Error",
        text2: "Something went wrong during logout.",
      });
    }
  }, [navigation]);

  return (
    <View style={styles.screenContainer}>
      {/* Fixed Title outside the scroll view */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
        animated
      />
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView style={styles.container}>
        {/* Profile Section with SkeletonLoader for Profile Image */}
        <View style={styles.profileSection}>
          <ProfileImage
            source={profileImageSource}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>
              {profileData
                ? `${profileData.firstName} ${profileData.lastName}`
                : "Your Name"}
            </Text>
            <Text style={styles.userEmail}>
              {profileData ? profileData.emailId : "Your Email"}
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("App", { screen: "EditProfile" })}
        >
          <View style={styles.menuLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="settings-outline" size={20} color="#1F2937" />
            </View>
            <Text style={styles.menuText}>Edit Personal Info</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Others</Text>

        {/* Invite Friends Menu */}
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: "rgba(255, 248, 249, 1)" }]}
          onPress={() => setShowShareModal(true)}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconContainer, { backgroundColor: "#fff" }]}>
              <Ionicons name="people-outline" size={20} color="#1F2937" />
            </View>
            <Text style={styles.menuText}>Invite Friends</Text>
          </View>
          <Ionicons name="share-social-outline" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* New "View Tickets" Menu Item */}
        <TouchableOpacity
          style={styles.menuItem}
          // onPress={() => {
          //   console.log("[ProfileScreen] Navigating to Tickets");
          //   navigation.navigate("App", { screen: "ViewTickets" });
          // }}
        >
          <View style={styles.menuLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="ticket-outline" size={20} color="#1F2937" />
            </View>
            <Text style={styles.menuText}>My Orders</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Help and Support Menu */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("App", { screen: "HelpSupport" })}
        >
          <View style={styles.menuLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="chatbubble-outline" size={20} color="#1F2937" />
            </View>
            <Text style={styles.menuText}>Help and support</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Logout Menu */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowLogoutModal(true)}
        >
          <View style={styles.menuLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="log-out-outline" size={20} color="#1F2937" />
            </View>
            <Text style={styles.menuText}>Logout</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </ScrollView>

      {/* Share Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={showShareModal}
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.shareModalContent]}>
            <View style={styles.shareHeader}>
              <Text style={styles.shareTitle}>Share Event</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowShareModal(false)}
              >
                <Ionicons name="close" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <View style={styles.shareOptionsContainer}>
              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => handleShareOption("copyLink")}
              >
                <Ionicons name="copy-outline" size={24} color="#1F2937" />
                <Text style={styles.shareOptionText}>Copy Link</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => handleShareOption("whatsapp")}
              >
                <Ionicons name="logo-whatsapp" size={24} color="#1F2937" />
                <Text style={styles.shareOptionText}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => handleShareOption("facebook")}
              >
                <Ionicons name="logo-facebook" size={24} color="#1F2937" />
                <Text style={styles.shareOptionText}>Facebook</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => handleShareOption("email")}
              >
                <Ionicons name="mail-outline" size={24} color="#1F2937" />
                <Text style={styles.shareOptionText}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => handleShareOption("linkedin")}
              >
                <Ionicons name="logo-linkedin" size={24} color="#1F2937" />
                <Text style={styles.shareOptionText}>LinkedIn</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => handleShareOption("twitter")}
              >
                <Ionicons name="logo-twitter" size={24} color="#1F2937" />
                <Text style={styles.shareOptionText}>Twitter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={showLogoutModal}
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.logoutModalContent]}>
            <View style={styles.warningIcon}>
              <Ionicons name="warning" size={24} color="#E3000F" />
            </View>
            <Text style={styles.logoutTitle}>Log out</Text>
            <Text style={styles.logoutMessage}>
              Are you sure you want to log out from HiIndia?
            </Text>
            <View style={styles.logoutButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Log out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 55 : 25,
    paddingBottom: 10,
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    fontFamily: "Poppins-Bold",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  profileImage: {
    width: 58,
    height: 58,
    borderRadius: 24,
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
    fontFamily: "Poppins-Regular",
  },
  userEmail: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 248, 249, 1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuText: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
    fontFamily: "Poppins-Regular",
  },
  sectionTitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 16,
    fontFamily: "Poppins-Regular",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
  shareModalContent: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 16,
  },
  shareHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 12,
  },
  shareTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    fontFamily: "Poppins-SemiBold",
  },
  shareOptionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 8,
  },
  shareOption: {
    width: "30%",
    alignItems: "center",
    marginVertical: 12,
  },
  shareOptionText: {
    marginTop: 6,
    fontSize: 12,
    color: "#1F2937",
    fontFamily: "Poppins-Medium",
  },
  closeButton: {
    padding: 4,
  },
  logoutModalContent: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 24,
  },
  warningIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoutTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  logoutMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  logoutButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    paddingHorizontal: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#000",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  logoutButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  logoutButtonText: {
    color: "#1F2937",
    fontSize: 14,
    fontWeight: "600",
  },
});

export { ProfileScreen };
