// screens/ProfileScreen.js
import React, { useState, useCallback, useMemo, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Linking,
  StatusBar,
  Platform,
  Share,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { API_BASE_URL_UPLOADS } from "@env";
import { deleteUserAccount } from "../api/auth_api";
import { AuthContext } from "../context/AuthContext";
import { useProfile } from "../hooks/useProfile";
import SkeletonLoader from "../components/SkeletonLoader";

import ShareModal from "../components/ShareModal";
import LogoutModal from "../components/LogoutModal";
import DeleteAccountModal from "../components/DeleteAccountModal";
import ImagePreviewModal from "../components/ImagePreviewModal";

// Define modal types for consolidated state
const MODALS = {
  SHARE: "share",
  LOGOUT: "logout",
  DELETE: "delete",
  IMAGE_PREVIEW: "image_preview",
};

const ProfileImage = React.memo(({ source, style }) => {
  const [loaded, setLoaded] = useState(false);
  const isRemote = source && source.uri;

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
        onLoad={() => setLoaded(true)}
      />
    </View>
  );
});

export default function ProfileScreen() {
  const { profileData, reloadProfile } = useProfile();
  const navigation = useNavigation();
  const { setUser, user } = useContext(AuthContext);

  // Consolidated modal state
  const [activeModal, setActiveModal] = useState(null);

  const profileImageSource = useMemo(() => {
    if (!profileData || !profileData.profileImage || !profileData.profileImage.trim()) {
      return require("../../assets/placeholder.jpg");
    }
    return { uri: `${API_BASE_URL_UPLOADS}/${profileData.profileImage}` };
  }, [profileData]);

  const shareMessage = useMemo(
    () => "Hey, check out this amazing event on HiIndia! https://hiindia.com/",
    []
  );

  const handleShareOption = useCallback(async (option) => {
    try {
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
          Linking.openURL(`mailto:?subject=HiIndia%20Event&body=${encodeURIComponent(shareMessage)}`);
          break;
        case "linkedin":
          await Share.share({ message: shareMessage });
          break;
        case "twitter":
          Linking.openURL(`twitter://post?message=${encodeURIComponent(shareMessage)}`);
          break;
        default:
          break;
      }
      setActiveModal(null);
    } catch (error) {
      console.error("Error sharing event:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong with sharing.",
      });
    }
  }, [shareMessage]);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle("dark-content");
      reloadProfile();
      return () => {};
    }, [reloadProfile])
  );

  useEffect(() => {
    if (__DEV__) {
      console.log("User:", user);
    }
  }, [user]);

  const handleLogout = useCallback(async () => {
    try {
      setActiveModal(null);
      await AsyncStorage.removeItem("role");
      await AsyncStorage.removeItem("Token");
      await AsyncStorage.removeItem("RefreshToken");
      setUser(null);
      Toast.show({
        type: "info",
        text1: "Logged Out",
        text2: "You have been logged out successfully!",
      });
      navigation.navigate("Auth", { screen: "Login" });
    } catch (error) {
      console.error("Error during logout:", error);
      Toast.show({
        type: "error",
        text1: "Logout Error",
        text2: "Something went wrong during logout.",
      });
    }
  }, [navigation, setUser]);

  const handleDeleteAccount = useCallback(async () => {
    try {
      setActiveModal(null);
      const userId = profileData?._id;
      if (userId) {
        const response = await deleteUserAccount(userId);
        if (response && response.status === 200) {
          await AsyncStorage.removeItem("role");
          await AsyncStorage.removeItem("Token");
          await AsyncStorage.removeItem("RefreshToken");
          setUser(null);
          Toast.show({
            type: "info",
            text1: "Account Deleted",
            text2: "Your account has been deleted successfully!",
          });
          navigation.navigate("Auth", { screen: "Login" });
        } else {
          throw new Error("Failed to delete account");
        }
      } else {
        Toast.show({
          type: "error",
          text1: "Delete Account Error",
          text2: "User ID not found.",
        });
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      Toast.show({
        type: "error",
        text1: "Delete Account Error",
        text2: "Something went wrong while deleting your account.",
      });
    }
  }, [navigation, profileData, setUser]);

  const handleProfileImagePress = useCallback(() => {
    if (profileData?.profileImage) {
      setActiveModal(MODALS.IMAGE_PREVIEW);
    } else {
      navigation.navigate("App", { screen: "EditProfile" });
    }
  }, [profileData, navigation]);

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent animated />
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      {/* Profile section is now fixed (not scrollable) */}
      <View style={styles.profileSection}>
        <TouchableOpacity onPress={handleProfileImagePress}>
          <ProfileImage source={profileImageSource} style={styles.profileImage} />
        </TouchableOpacity>
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>
            {profileData ? `${profileData.firstName} ${profileData.lastName}` : "Your Name"}
          </Text>
          <Text style={styles.userEmail}>
            {profileData ? profileData.emailId : "Your Email"}
          </Text>
        </View>
      </View>

      {/* Scrollable menu items */}
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 130 }}>
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
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: "rgba(255,248,249,1)" }]}
          onPress={() => setActiveModal(MODALS.SHARE)}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconContainer, { backgroundColor: "#fff" }]}>
              <Ionicons name="people-outline" size={20} color="#1F2937" />
            </View>
            <Text style={styles.menuText}>Invite Friends</Text>
          </View>
          <Ionicons name="share-social-outline" size={20} color="#9CA3AF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("App", { screen: "ViewTickets" })}
        >
          <View style={styles.menuLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="ticket-outline" size={20} color="#1F2937" />
            </View>
            <Text style={styles.menuText}>My Orders</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </TouchableOpacity>
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
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setActiveModal(MODALS.LOGOUT)}
        >
          <View style={styles.menuLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="log-out-outline" size={20} color="#1F2937" />
            </View>
            <Text style={styles.menuText}>Logout</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.menuItem, styles.deleteAccountItem]}
          onPress={() => setActiveModal(MODALS.DELETE)}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconContainer, styles.deleteIconContainer]}>
              <Ionicons name="trash-outline" size={20} color="#E3000F" />
            </View>
            <Text style={styles.deleteAccountText}>Delete Account</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </ScrollView>

      {/* Render Modals */}
      <ShareModal
        visible={activeModal === MODALS.SHARE}
        onClose={() => setActiveModal(null)}
        onShareOption={handleShareOption}
      />
      <LogoutModal
        visible={activeModal === MODALS.LOGOUT}
        onClose={() => setActiveModal(null)}
        onConfirm={handleLogout}
      />
      <DeleteAccountModal
        visible={activeModal === MODALS.DELETE}
        onClose={() => setActiveModal(null)}
        onConfirm={handleDeleteAccount}
      />
      <ImagePreviewModal
        visible={activeModal === MODALS.IMAGE_PREVIEW}
        imageSource={profileImageSource}
        onClose={() => setActiveModal(null)}
      />
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
    paddingTop: Platform.OS === "ios" ? 55 : 40,
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
    margin: 20,
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
    backgroundColor: "rgba(255,248,249,1)",
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
  },
  deleteAccountItem: {
    marginTop: 8,
    borderColor: "#FECACA",
  },
  deleteIconContainer: {
    backgroundColor: "#FEE2E2",
  },
  deleteAccountText: {
    fontSize: 14,
    color: "#E3000F",
    fontWeight: "500",
    fontFamily: "Poppins-Regular",
  },
});
