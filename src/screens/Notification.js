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
      const participantId = await AsyncStorage.getItem("role");
      if (!participantId) {
        console.log("No participantId found in AsyncStorage");
        setRefreshing(false);
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/auth/get/appEventNotification/${participantId}`
      );

      if (response.data?.notifications) {
        setNotifications(response.data.notifications);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.log("Error fetching notifications:", error.message);
      if (error.response && error.response.status === 404) {
        setNotifications([]);
      }
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Mark individual notification as read and remove from UI
  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/auth/patch/NotificationRead/${notificationId}`
      );
      setNotifications((prev) =>
        prev.filter((notif) => notif._id !== notificationId)
      );
    } catch (error) {
      console.log("Error marking notification as read:", error.message);
      Alert.alert(
        "Error",
        "Could not mark notification as read. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  // Mark all notifications as read using the same logic as individual read
  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications.map((notif) =>
          axios.patch(`${API_BASE_URL}/auth/patch/NotificationRead/${notif._id}`)
        )
      );
      setNotifications([]);
    } catch (error) {
      console.log("Error marking all notifications as read:", error.message);
      Alert.alert(
        "Error",
        "Could not mark all notifications as read. Please try again.",
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

  // Get notification icon based on type
  const getNotificationIcon = (notification) => {
    return "notifications";
  };

  // Format date to be more readable
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
          <Ionicons name="checkmark-circle" size={22} color="#fff" />
          <Text style={styles.deleteText}>Read</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // Render each notification item
  const renderItem = ({ item, index }) => {
    const iconName = getNotificationIcon(item);
    
    const getIconBgColor = () => {
      const colors = [
        '#4F46E5',
        '#10B981',
        '#F59E0B',
        '#EC4899',
        '#8B5CF6',
        '#06B6D4',
      ];
      return colors[index % colors.length];
    };

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
            <View style={[styles.notificationIconBg, { backgroundColor: getIconBgColor() }]}>
              <Ionicons name={iconName} size={18} color="#fff" />
            </View>
            <View style={styles.notificationTextContainer}>
              <Text style={styles.notificationTitle}>{item.title}</Text>
              <Text style={styles.notificationMessage}>{item.message}</Text>
              <Text style={styles.notificationDate}>
                {formatDate(item.createdAt)}
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
      <BlurView intensity={90} tint="light" style={styles.header}>
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
            <Animated.View style={styles.loadingIndicator}>
              <Ionicons name="notifications" size={24} color="#4F46E5" />
            </Animated.View>
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.noNotificationsContainer}>
            <View style={styles.emptyStateImageContainer}>
              <View style={styles.notificationIconContainer}>
                <Ionicons name="notifications-off-outline" size={40} color="#fff" />
              </View>
              <View style={styles.emptyStateRing1} />
              <View style={styles.emptyStateRing2} />
            </View>
            <Text style={styles.noNotificationsText}>No notifications yet</Text>
            <Text style={styles.subText}>
              All notifications on your events,
              {"\n"}transactions will appear here
            </Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={onRefresh}
            >
              <Ionicons name="refresh" size={16} color="#fff" style={styles.refreshIcon} />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationCount}>
                {notifications.length} {notifications.length === 1 ? 'Notification' : 'Notifications'}
              </Text>
              <TouchableOpacity 
                style={styles.markAllReadButton}
                onPress={() => {
                  Alert.alert(
                    "Mark All as Read",
                    "Are you sure you want to mark all notifications as read?",
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Mark All", onPress: markAllAsRead }
                    ]
                  );
                }}
              >
                <Text style={styles.markAllReadText}>Mark all as read</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.swipeHint}>
              <Ionicons name="swap-horizontal" size={14} color="#6B7280" /> Swipe left to mark as read
            </Text>
            
            <FlatList
              data={notifications}
              keyExtractor={(item) => item._id}
              renderItem={renderItem}
              refreshControl={
                <RefreshControl 
                  refreshing={refreshing} 
                  onRefresh={onRefresh}
                  colors={["#4F46E5"]}
                  tintColor="#4F46E5"
                />
              }
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 15,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  backButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  headerTitle: {
    fontSize: 20,
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
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  notificationCount: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#1F2937",
  },
  markAllReadButton: {
    padding: 8,
  },
  markAllReadText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#4F46E5",
  },
  listContent: {
    paddingBottom: 20,
  },
  noNotificationsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 50,
  },
  emptyStateImageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyStateRing1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
    borderStyle: 'dashed',
  },
  emptyStateRing2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.1)',
    borderStyle: 'dashed',
  },
  notificationIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  noNotificationsText: {
    fontSize: 22,
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
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  refreshIcon: {
    marginRight: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  swipeHint: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(243, 244, 246, 0.7)',
    borderRadius: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingIndicator: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#6B7280",
  },
  notificationItem: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginVertical: 6,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  notificationIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
  separator: {
    height: 1,
    backgroundColor: 'rgba(229, 231, 235, 0.5)',
    marginVertical: 2,
    marginHorizontal: 8,
  },
  deleteButton: {
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "flex-end",
    width: 100,
    height: "100%",
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
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
    fontSize: 14,
    marginLeft: 4,
  },
});
