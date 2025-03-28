import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  Share,
  Platform,
  Dimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL, API_BASE_URL_UPLOADS } from "@env";
import Toast from "react-native-toast-message";

import SkeletonLoader from "../../components/SkeletonLoader";
import { formatEventDateTime } from "../../helper/helper_Function";

const { width } = Dimensions.get("window");

// --- TicketImage Component ---
const TicketImage = React.memo(({ source, style }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <View style={style}>
      {!loaded && <SkeletonLoader style={StyleSheet.absoluteFill} />}
      <Image
        source={
          source && !error
            ? source
            : require("../../../assets/placeholder.jpg")
        }
        style={[style, loaded ? {} : { opacity: 0 }]}
        resizeMode="cover"
        onLoadEnd={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(true);
        }}
      />
    </View>
  );
});

// --- MyOrdersScreen Component ---
export default function MyOrdersScreen({ navigation }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("past"); // Default tab is "past"

  useFocusEffect(
    useCallback(() => {
      StatusBar.setHidden(false);
      StatusBar.setBarStyle("light-content");
      return () => {};
    }, [])
  );

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const id = await AsyncStorage.getItem("role");
      if (!id) {
        throw new Error("User role ID not found");
      }

      const url = `${API_BASE_URL}/auth/get/allEventRegisterTicket/${id}`;
      console.log("Fetching orders from:", url);

      const response = await axios.post(url, { dateFilter: activeTab });
      const allOrders = response.data.data || [];

      // Filter orders based on active tab
      const currentDate = new Date();
      let filteredOrders = [];

      if (activeTab === "upcoming") {
        // Show events that haven't ended yet
        filteredOrders = allOrders.filter((order) => {
          const endDate = new Date(order.event?.EndDate);
          return endDate >= currentDate;
        });
      } else {
        // Show events that have already ended
        filteredOrders = allOrders.filter((order) => {
          const endDate = new Date(order.event?.EndDate);
          return endDate < currentDate;
        });
      }

      // Transform orders data
      const transformedOrders = filteredOrders.map((order) => ({
        id: order._id,
        isActive: order.isActive,
        countryCurrency: order.event?.countryDetail?.Currency || "$",
        title: order.event?.EventName || "Untitled Event",
        date: formatEventDateTime(order.event?.StartDate, order.event?.EndDate),
        eventStart: order.event?.StartDate,
        eventEnd: order.event?.EndDate,
        image: order.event?.EventImage
          ? { uri: `${API_BASE_URL_UPLOADS}/${order.event.EventImage}` }
          : require("../../../assets/placeholder.jpg"),
        tickets: order.registrations || [],
        ticketCount: order.registrations?.length || 0,
        totalRate: order.subTotal,
        total: order.totalRate,
        coupon: order.couponDiscount || 0,
        status:
          new Date(order.event?.EndDate) < currentDate ? "past" : "upcoming",
        location: order.event?.EventLocation || "No location specified",
      }));

      console.log(`Loaded ${transformedOrders.length} ${activeTab} orders`);
      setTickets(transformedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      Toast.show({
        type: "error",
        text1: "Error Loading Orders",
        text2: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleViewTicket = (ticket) => {
    try {
      const orderDetails = {
        totalRate: ticket.totalRate,
        couponDiscount: ticket.coupon,
        total: ticket.total,
      };

      navigation.navigate("App", {
        screen: "TicketDetails",
        params: { orderId: ticket.id, orderDetails },
      });
    } catch (error) {
      console.error("Error navigating to ticket details:", error);
      Toast.show({
        type: "error",
        text1: "Navigation Error",
        text2: "Could not open ticket details.",
      });
    }
  };

  const handleViewInvoice = (ticket) => {
    try {
      const orderDetails = {
        totalRate: ticket.totalRate,
        couponDiscount: ticket.coupon,
        total: ticket.total,
      };

      navigation.navigate("App", {
        screen: "Invoice",
        params: { orderId: ticket.id, orderDetails },
      });
    } catch (error) {
      console.error("Error navigating to invoice:", error);
      Toast.show({
        type: "error",
        text1: "Navigation Error",
        text2: "Could not open invoice.",
      });
    }
  };

  const shareOrderDetails = async (order) => {
    const shareUrlBase = "https://participanthiindia.barodaweb.org/ticket/";
    const ticketsInfo = order.tickets
      .map(
        (ticket) =>
          `🎟️ Attendee: ${ticket.name || "Guest"}\n📄 Ticket Type: ${
            ticket.TicketType?.name || "Standard"
          }\n🔗 View Ticket: ${shareUrlBase}${ticket._id}\n`
      )
      .join("\n");

    const shareMessage = `
📅 Event: ${order.title}
🕒 Date: ${order.date}
📍 Location: ${order.location}

🎫 Tickets:
${ticketsInfo}
    `;

    try {
      await Share.share({
        message: shareMessage,
        title: `🎟️ Tickets for ${order.title}`,
      });
    } catch (error) {
      console.error("Error sharing order details", error);
      Toast.show({
        type: "error",
        text1: "Sharing Failed",
        text2: "Could not share ticket information.",
      });
    }
  };

  const renderTicket = ({ item: ticket }) => (
    <View style={styles.ticketCard}>
      <LinearGradient 
        colors={["#FFFFFF", "#F8F9FA"]} 
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Ticket Header */}
        <View style={styles.ticketHeader}>
          <View style={styles.imageContainer}>
            <TicketImage source={ticket.image} style={styles.eventImage} />
            {ticket.status === "past" && (
              <View style={styles.pastEventBadge}>
                <Text style={styles.pastEventText}>Past</Text>
              </View>
            )}
          </View>
          <View style={styles.eventInfo}>
            <View style={styles.titleContainer}>
              <View style={styles.ticketIconContainer}>
                <LinearGradient
                  colors={["#FF1A1A", "#E3000F"]}
                  style={styles.ticketIconBg}
                >
                  <Ionicons name="ticket" size={16} color="#FFF" />
                </LinearGradient>
              </View>
              <Text style={styles.eventTitle} numberOfLines={2}>
                {ticket.title}
              </Text>
            </View>
            <Text style={styles.eventDate}>
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />{" "}
              {ticket.date}
            </Text>
            <Text style={styles.eventLocation} numberOfLines={1}>
              <Ionicons name="location-outline" size={14} color="#6B7280" />{" "}
              {ticket.location}
            </Text>
            <View style={styles.ticketCountContainer}>
              <Text style={styles.ticketCount}>
                {ticket.ticketCount}{" "}
                {ticket.ticketCount === 1 ? "Ticket" : "Tickets"}
              </Text>
            </View>
          </View>
        </View>

        {/* Ticket Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <View style={styles.leftCircle} />
          <View style={styles.rightCircle} />
        </View>

        {/* Actions Footer */}
        <View style={styles.ticketActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleViewTicket(ticket)}
          >
            <Ionicons name="eye-outline" size={18} color="#FFF" />
            <Text style={styles.actionButtonText}>View Tickets</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.invoiceButton]}
            onPress={() => handleViewInvoice(ticket)}
          >
            <Ionicons name="receipt-outline" size={18} color="#FFF" />
            <Text style={styles.actionButtonText}>View Invoice</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => shareOrderDetails(ticket)}
          >
            <MaterialCommunityIcons name="share-variant" size={22} color="#E3000F" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent animated />

      {/* Header */}
      <LinearGradient
        colors={["#000000", "#1A1A1A"]}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={styles.headerRight} />
      </LinearGradient>

      <View style={styles.whiteSection}>
        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "upcoming" && styles.activeTabButton]}
            onPress={() => setActiveTab("upcoming")}
          >
            <Text
              style={[styles.tabButtonText, activeTab === "upcoming" && styles.activeTabButtonText]}
            >
              Upcoming
            </Text>
            {activeTab === "upcoming" && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "past" && styles.activeTabButton]}
            onPress={() => setActiveTab("past")}
          >
            <Text style={[styles.tabButtonText, activeTab === "past" && styles.activeTabButtonText]}>
              Past
            </Text>
            {activeTab === "past" && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#E3000F" />
          </View>
        ) : (
          <FlatList
            data={tickets}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshing={refreshing}
            onRefresh={() => fetchOrders(true)}
            renderItem={renderTicket}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="ticket-outline" size={80} color="#E0E0E0" />
                <Text style={styles.noTicketsText}>No {activeTab} orders found</Text>
                <Text style={styles.emptySubtitle}>
                  {activeTab === "upcoming"
                    ? "You don't have any upcoming event tickets"
                    : "You haven't attended any events yet"}
                </Text>
                <TouchableOpacity 
                  style={styles.browseEventsButton}
                  onPress={() => navigation.navigate("Tab", { screen: "Events" })}
                >
                  <Text style={styles.browseEventsText}>Browse Events</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 26,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  headerRight: {
    width: 40,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  whiteSection: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F2F2F2",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 8,
    position: 'relative',
  },
  activeTabButton: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 6,
    height: 3,
    width: 20,
    backgroundColor: '#E3000F',
    borderRadius: 1.5,
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#777",
  },
  activeTabButtonText: {
    color: "#E3000F",
  },
  listContainer: {
    paddingBottom: 110,
    paddingTop: 8,
  },
  ticketCard: {
    marginBottom: 24,
    borderRadius: 20,
    borderColor: "rgba(67, 56, 56, 0.2)",
    borderWidth: 1.5,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 3 },
    // shadowOpacity: 0.1,
    // shadowRadius: 8,
    // elevation: Platform.OS === "android" ? 1 : 4,
  },
  cardGradient: {
    borderRadius: 20,
    overflow: "hidden",
  },
  ticketHeader: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  imageContainer: {
    width: 110,
    height: 110,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  eventImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  pastEventBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pastEventText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },
  eventInfo: {
    flex: 1,
    marginLeft: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  ticketIconContainer: {
    marginRight: 10,
    marginTop: 2,
  },
  ticketIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  eventTitle: {
    width: "85%",
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    letterSpacing: 0.2,
  },
  eventDate: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
    fontWeight: "500",
  },
  eventLocation: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 8,
  },
  ticketCountContainer: {
    marginTop: 4,
    backgroundColor: 'rgba(227, 0, 15, 0.08)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ticketCount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E3000F",
  },
  dividerContainer: {
    position: 'relative',
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  dividerLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#E8E8E8',
  },
  leftCircle: {
    position: 'absolute',
    left: -10,
    top: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
  },
  rightCircle: {
    position: 'absolute',
    right: -10,
    top: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
  },
  ticketActions: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#E3000F",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 8,
    // shadowColor: "#E3000F",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.3,
    // shadowRadius: 4,
    // elevation: 4,
  },
  invoiceButton: {
    backgroundColor: "#454545",
    shadowColor: "#000",
  },
  actionButtonText: {
    color: "#FFF",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 14,
  },
  shareButton: {
    width: 46,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEE",
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.05,
    // shadowRadius: 2,
    // elevation: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  noTicketsText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#777",
    textAlign: "center",
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  browseEventsButton: {
    backgroundColor: "#E3000F",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#E3000F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  browseEventsText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
