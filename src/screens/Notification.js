import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StatusBar,
  StyleSheet,
  Platform,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Animated,
  Alert,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Ionicons from "react-native-vector-icons/Ionicons";
import { BlurView } from "expo-blur";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@env";
import axios from "axios";

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch notifications from the backend
  const fetchNotifications = async () => {
    setRefreshing(true);
    setLoading(true);
    try {
      // If you stored the participant ID in AsyncStorage (or from context)
      const participantId = await AsyncStorage.getItem("role");
      if (!participantId) {
        console.log("No participantId found in AsyncStorage");
        setRefreshing(false);
        setLoading(false);
        return;
      }

      // Fetch unread notifications
      const response = await axios.get(
        `${API_BASE_URL}/auth/get/appEventNotification/${participantId}`
      );

      if (response.data?.notifications) {
        setNotifications(response.data.notifications);
      } else {
        // If no notifications found, you can clear the list or handle accordingly
        setNotifications([]);
      }
    } catch (error) {
      console.log("Error fetching notifications:", error.message);
      // Handle 404 error gracefully
      if (error.response && error.response.status === 404) {
        // If 404, treat it as no notifications
        setNotifications([]);
      }
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Mark notification as read and remove from UI
  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/auth/patch/NotificationRead/${notificationId}`
      );
      // Remove this notification from local state
      setNotifications((prev) =>
        prev.filter((notif) => notif._id !== notificationId)
      );
    } catch (error) {
      console.log("Error marking notification as read:", error.message);
      // Handle error gracefully
      Alert.alert(
        "Error",
        "Could not mark notification as read. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  // Handler for pull-to-refresh
  const onRefresh = () => {
    fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Render right actions for swipeable
  const renderRightActions = (progress, dragX, notificationId) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });
    
    return (
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => markAsRead(notificationId)}
      >
        <Animated.View
          style={[
            styles.deleteButtonContainer,
            {
              transform: [{ translateX: trans }],
            },
          ]}
        >
          <Ionicons name="checkmark" size={24} color="#fff" />
          <Text style={styles.deleteText}>Mark as read</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // Render each notification item
  const renderItem = ({ item }) => {
    return (
      <Swipeable
        renderRightActions={(progress, dragX) =>
          renderRightActions(progress, dragX, item._id)
        }
        friction={2}
        rightThreshold={40}
      >
        <View style={styles.notificationItem}>
          <View style={styles.notificationContent}>
            <View style={styles.notificationIconBg}>
              <Ionicons name="notifications" size={18} color="#fff" />
            </View>
            <View style={styles.notificationTextContainer}>
              <Text style={styles.notificationTitle}>{item.title}</Text>
              <Text style={styles.notificationMessage}>{item.message}</Text>
              <Text style={styles.notificationDate}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      </Swipeable>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
        animated
      />
      <BlurView intensity={80} tint="light" style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholder} />
      </BlurView>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          // If no notifications, show "No notifications yet"
          <View style={styles.noNotificationsContainer}>
            <View style={styles.notificationIconContainer}>
              <Ionicons name="notifications-outline" size={32} color="#fff" />
            </View>
            <Text style={styles.noNotificationsText}>No notifications yet</Text>
            <Text style={styles.subText}>
              All notifications on your events,
              {"\n"}transactions will appear here
            </Text>
          </View>
        ) : (
          // Otherwise, show a list of notifications
          <>
            <Text style={styles.swipeHint}>
              Swipe left to mark as read
            </Text>
            <FlatList
              data={notifications}
              keyExtractor={(item) => item._id}
              renderItem={renderItem}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </View>
    </View>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 45 : 30,
    paddingBottom: 15,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    zIndex: 10,
  },
  backButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: "#1F2937",
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  noNotificationsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#1F2937",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  noNotificationsText: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#1F2937",
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  swipeHint: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#6B7280",
  },
  // Notification item container
  notificationItem: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  notificationIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#1F2937",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#4B5563",
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationDate: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#9CA3AF",
    textAlign: "left",
  },
  // Swipeable delete button
  deleteButton: {
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "flex-end",
    width: 100,
    height: "100%",
  },
  deleteButtonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: 100,
    flexDirection: "row",
  },
  deleteText: {
    color: "#fff",
    fontFamily: "Poppins-Medium",
    fontSize: 12,
    marginLeft: 4,
  },
});