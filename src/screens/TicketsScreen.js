import React, { useEffect, useState, useCallback, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  Animated,
  ActivityIndicator,
  Modal,
  Share,
  Pressable,
  Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import { useFocusEffect } from "@react-navigation/native";

import { getTickets } from "../api/ticket_api";
import { formatEventDateTime } from "../helper/helper_Function";
import { API_BASE_URL_UPLOADS } from "@env";

// Import reusable components
import Header from "../components/Header";
import SkeletonLoader from "../components/SkeletonLoader";
import BlurWrapper from "../components/BlurWrapper";

// --- TicketImage Component ---
const TicketImage = memo(({ source, style }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <View style={style}>
      {!loaded && <SkeletonLoader style={StyleSheet.absoluteFill} />}
      <Image
        source={
          source && !error ? source : require("../../assets/placeholder.jpg")
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

// --- TicketScreen Component ---
export default function TicketScreen({ navigation }) {
  const [expandedOrders, setExpandedOrders] = useState({});
  const [tickets, setTickets] = useState([]);
  // Start animation at 1 so it's in the "expanded" state by default.
  const [animation] = useState(new Animated.Value(1));
  const [readMoreMap, setReadMoreMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setHidden(false);
      StatusBar.setBarStyle("light-content");
      return () => {};
    }, [])
  );

  // Removed the "blur" listener that reset expandedOrders to {}.

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const res = await getTickets(true);
      console.log("Tickets data:", res.data);
      if (res.isOk && res.data && res.data.length > 0) {
        const transformedTickets = res.data.map((order) => ({
          id: order._id,
          isActive: order.isActive,
          countryCurrency: order.event?.countryDetail?.Currency || "$",
          title: order.event?.EventName || "Untitled Event",
          date: formatEventDateTime(order.event?.StartDate, order.event?.EndDate),
          eventStart: order.event?.StartDate,
          eventEnd: order.event?.EndDate,
          endDate: order.event?.EndDate,
          image: order.event?.EventImage
            ? { uri: `${API_BASE_URL_UPLOADS}/${order.event.EventImage}` }
            : require("../../assets/placeholder.jpg"),
          tickets: order.registrations.map((reg) => ({
            _id: reg._id,
            name: reg.name,
            type: reg.TicketType?.name || "Standard",
            TicketType: {
              TicketType: reg.TicketType?.name || "Standard",
            },
            price: reg.total || 0,
            ticketId: reg.ticketId,
          })),
          totalRate: order.subTotal,
          total: order.totalRate,
          coupon: order.couponDiscount || 0,
          // For potential use in ticket display
          EventCategoryDetail: order.event?.EventCategoryDetail || [],
          EventLocation: order.event?.EventLocation || "",
          StartDate: order.event?.StartDate,
          EndDate: order.event?.EndDate,
        }));
        console.log("Transformed Tickets:", transformedTickets);

        setTickets(transformedTickets);

        // Make each ticket expanded by default:
        const initialExpanded = {};
        transformedTickets.forEach((ticket) => {
          initialExpanded[ticket.id] = true; // open by default
        });
        setExpandedOrders(initialExpanded);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error("Error fetching tickets: ", error);
    } finally {
      if (!isRefresh) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  const toggleOrderDetails = (id) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));

    Animated.spring(animation, {
      toValue: expandedOrders[id] ? 0 : 1,
      useNativeDriver: true,
    }).start();
  };

  const handleViewTicket = async (ticket) => {
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
      console.error("Error fetching ticket details:", error);
      alert("Error fetching ticket details.");
    }
  };

  const handleViewInvoice = (ticket) => {
    try {
      // Navigate to the Invoice screen with the ticket/order ID
      navigation.navigate("App", {
        screen: "Invoice",
        params: { orderId: ticket.id },
      });
    } catch (error) {
      console.error("Error navigating to invoice:", error);
      alert("Error viewing invoice.");
    }
  };

  const shareOrderDetails = async (order) => {
    const shareUrlBase = "https://participanthiindia.barodaweb.org/ticket/";
    const ticketsInfo = order.tickets
      .map(
        (ticket) =>
          `🎟️ Attendee: ${ticket.name || "Guest"}\n📄 Ticket Type: ${
            ticket.TicketType?.TicketType || ticket.type || "Standard"
          }\n🔗 View Ticket: ${shareUrlBase}${ticket._id}\n`
      )
      .join("\n");

    const shareMessage = `
📅 Event: ${order.title}
🕒 Date: ${order.date}

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
    }
  };

  const shareTicketDetails = async (ticket, parentEventDetails) => {
    const eventDetails = ticket.eventDetails || parentEventDetails;
    if (!ticket || !eventDetails) return;

    const shareUrl = `https://participanthiindia.barodaweb.org/ticket/${ticket._id}`;

    const shareMessage = `
🎟️ Attendee: ${ticket.name || "Guest"}
📄 Ticket Type: ${ticket.TicketType?.TicketType || ticket.type || "Standard"}

📅 Event: ${eventDetails.EventName}
🕒 Date: ${formatEventDateTime(eventDetails.StartDate, eventDetails.EndDate)}

🔗 View Ticket: ${shareUrl}
    `;

    try {
      await Share.share({
        message: shareMessage,
        title: `🎫 Ticket for ${eventDetails.EventName}`,
      });
    } catch (error) {
      console.error("Error sharing ticket:", error);
    }
  };

  const toggleQrModal = (ticket, order) => {
    setSelectedTicket({
      ...ticket,
      eventDetails: {
        EventName: order.title,
        StartDate: order.eventStart,
        EndDate: order.eventEnd,
      },
    });
    setQrModalVisible(true);
  };

  const displayedTickets = tickets;

  const renderTicket = ({ item: ticket }) => (
    <Animated.View
      style={[
        styles.ticketCard,
        {
          transform: [
            {
              scale: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.02],
              }),
            },
          ],
        },
      ]}
    >
      <LinearGradient colors={["#FFFFFF", "#F8F9FA"]} style={styles.cardGradient}>
        {/* Ticket Header */}
        <View style={styles.ticketHeader}>
          <View style={styles.imageContainer}>
            <TicketImage source={ticket.image} style={styles.eventImage} />
          </View>
          <View style={styles.eventInfo}>
            <View style={styles.titleContainer}>
              <View style={styles.ticketIconContainer}>
                <LinearGradient colors={["#FF1A1A", "#E3000F"]} style={styles.ticketIconBg}>
                  <Ionicons name="ticket" size={16} color="#FFF" />
                </LinearGradient>
              </View>
              <View style={{ width: "80%" }}>
                <TouchableOpacity onPress={() => handleViewTicket(ticket)}>
                  <Text
                    style={styles.eventTitle}
                    numberOfLines={readMoreMap[ticket.id] ? undefined : 2}
                  >
                    {ticket.title}
                  </Text>
                </TouchableOpacity>
                {ticket.title?.length > 10 && (
                  <TouchableOpacity
                    onPress={() =>
                      setReadMoreMap((prev) => ({
                        ...prev,
                        [ticket.id]: !prev[ticket.id],
                      }))
                    }
                  >
                    <Text style={styles.readMoreText}>
                      {readMoreMap[ticket.id] ? "Read Less" : "Read More"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <Text style={styles.eventDate}>{ticket.date}</Text>
            <Text style={styles.ticketCount}>{ticket.tickets.length} Ticket's</Text>
          </View>
          <TouchableOpacity style={styles.floatingButtonShare} onPress={() => shareOrderDetails(ticket)}>
            <MaterialCommunityIcons name="share-variant" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        {/* View Details Button */}
        <TouchableOpacity style={styles.floatingButtonRight} onPress={() => handleViewTicket(ticket)}>
          <Ionicons name="eye-outline" size={18} color="#fff" />
        </TouchableOpacity>

        {/* Order Details Container */}
        <TouchableOpacity
          style={[
            styles.orderDetailsContainer,
            expandedOrders[ticket.id] && styles.expandedContainer,
          ]}
          onPress={() => toggleOrderDetails(ticket.id)}
        >
          {!expandedOrders[ticket.id] ? (
            <View style={styles.viewDetailsRow}>
              <Text style={styles.viewDetailsText}>View Order Details</Text>
              <Ionicons name="chevron-down" size={20} color="#1F2937" />
            </View>
          ) : (
            <View style={styles.orderDetails}>
              <View style={styles.yourTicketsHeader}>
                <Text style={styles.yourTicketsText}>Your Tickets</Text>
                <TouchableOpacity
                  style={styles.invoiceButton}
                  // onPress={() => handleViewInvoice(ticket)}
                >
                  <Text style={styles.invoiceButtonText}>Invoice</Text>
                  <Ionicons name="receipt-outline" size={16} color="#E3000F" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
              {ticket.tickets.map((t, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.ticketCardContainer}
                  onPress={() => toggleQrModal(t, ticket)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={["#E3000F", "#B0000C"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ticketGradient}
                  >
                    <View style={styles.ticketCardHeader}>
                      <Text style={styles.ticketCardName}>
                        {t.name || "Guest"}
                      </Text>
                      <View style={styles.ticketTypeContainer}>
                        <View style={styles.ticketTypeBadge}>
                          <Text style={styles.ticketTypeText}>
                            {t.TicketType?.TicketType || t.type || "Standard"}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() =>
                            shareTicketDetails(t, {
                              EventName: ticket.title,
                              StartDate: ticket.eventStart,
                              EndDate: ticket.eventEnd,
                            })
                          }
                          style={styles.ticketShareButton}
                        >
                          <MaterialCommunityIcons name="share-variant" size={18} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.ticketDivider} />
                    <View style={styles.ticketBottom}>
                      <View style={styles.ticketQrContainer}>
                        <View style={styles.qrCodeWrapper}>
                          <QRCode
                            value={`${API_BASE_URL_UPLOADS}/uploads/QR/${t._id}`}
                            size={42}
                            color="#000"
                            backgroundColor="#FFF"
                          />
                        </View>
                        <View style={styles.ticketIdContainer}>
                          <Text style={styles.ticketIdText}>
                            Ticket ID: {t.ticketId}
                          </Text>
                          <Text style={styles.ticketQrText}>
                            Tap to view QR code
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#FFF" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
              <View style={styles.hideDetailsButtonRow}>
                <TouchableOpacity
                  style={styles.hideDetailsButton}
                  onPress={() => toggleOrderDetails(ticket.id)}
                >
                  <Text style={styles.hideDetailsText}>Hide Order Details</Text>
                  <Ionicons
                    name="chevron-up"
                    size={20}
                    color="#1F2937"
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent animated />
      <Header
        onNotificationPress={() => navigation.navigate("App", { screen: "Notification" })}
        onCalendarPress={() => navigation.navigate("App", { screen: "Calender" })}
      />

      <View style={styles.whiteSection}>
        <Text style={styles.title}>Tickets</Text>
        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : (
          <FlatList
            data={displayedTickets}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 110, paddingTop: 8 }}
            refreshing={refreshing}
            onRefresh={() => fetchTickets(true)}
            renderItem={renderTicket}
            ListEmptyComponent={<Text style={styles.noTicketsText}>No tickets found</Text>}
          />
        )}
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={qrModalVisible}
        onRequestClose={() => setQrModalVisible(false)}
      >
        <BlurWrapper style={styles.modalBlurContainer}>
          <Pressable style={styles.modalBackdrop} onPress={() => setQrModalVisible(false)} />
          <View style={styles.modalContent}>
            <LinearGradient
              colors={["#E3000F", "#B0000C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>
                {selectedTicket?.TicketType?.TicketType ||
                  selectedTicket?.type ||
                  "Standard"} Ticket
              </Text>
              <Text style={styles.modalTicketId}>
                ID: {selectedTicket?.ticketId}
              </Text>
            </LinearGradient>

            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                {selectedTicket?.eventDetails?.EventName || ""}
              </Text>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={`${API_BASE_URL_UPLOADS}/uploads/QR/${selectedTicket?._id}`}
                  size={220}
                  color="#000"
                  backgroundColor="#FFF"
                />
              </View>
              <View style={styles.modalInfoContainer}>
                <View style={styles.modalInfoItem}>
                  <Ionicons name="person-outline" size={18} color="#666" />
                  <Text style={styles.modalInfoText}>
                    {selectedTicket?.name || "Guest"}
                  </Text>
                </View>
              </View>
              <Text style={styles.modalInstruction}>
                Show this QR code to the event staff for entry
              </Text>
              <TouchableOpacity
                onPress={() => setQrModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurWrapper>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  whiteSection: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  eventImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  ticketCard: {
    marginBottom: 30,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: Platform.OS === "android" ? 0 : 6,
  },
  cardGradient: {
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  ticketHeader: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventInfo: {
    flex: 1,
    marginLeft: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ticketIconContainer: {
    marginRight: 8,
  },
  ticketIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    letterSpacing: 0.5,
  },
  readMoreText: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
    marginTop: 4,
  },
  eventDate: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
    fontWeight: "600",
  },
  ticketCount: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  floatingButtonRight: {
    position: "absolute",
    top: 5,
    left: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  floatingButtonShare: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 30,
    height: 30,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  orderDetailsContainer: {
    backgroundColor: "#FFF5F5",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  expandedContainer: {
    backgroundColor: "#FFF5F5",
  },
  viewDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewDetailsText: {
    color: "#1F2937",
    fontSize: 14,
    fontWeight: "600",
  },
  orderDetails: {
    paddingTop: 2,
  },
  yourTicketsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  yourTicketsText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  invoiceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E3000F",
    shadowColor: "rgba(227, 0, 15, 0.3)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 2,
  },
  invoiceButtonText: {
    color: "#E3000F",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  ticketCardContainer: {
    marginBottom: 16,
    borderRadius: 24,
    shadowColor: "rgba(227, 0, 15, 0.4)",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },
  ticketGradient: {
    borderRadius: 24,
    padding: 16,
  },
  ticketCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  ticketCardName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  ticketTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ticketTypeBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
  },
  ticketTypeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFF",
  },
  ticketShareButton: {
    marginLeft: 8,
    padding: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 12,
  },
  ticketDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: 16,
  },
  ticketBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketQrContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  qrCodeWrapper: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 4,
  },
  ticketIdContainer: {
    marginLeft: 12,
  },
  ticketQrText: {
    fontSize: 12,
    color: "#FFF",
    fontWeight: "500",
    marginTop: 2,
  },
  ticketIdText: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "700",
    marginTop: 4,
  },
  hideDetailsButtonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  hideDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  hideDetailsText: {
    color: "#1F2937",
    fontSize: 14,
    marginRight: 2,
  },
  modalBlurContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#FFF",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
  },
  modalTicketId: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "600",
  },
  modalBody: {
    padding: 24,
    alignItems: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#222",
    marginBottom: 24,
    textAlign: "center",
  },
  qrWrapper: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 24,
  },
  modalInfoContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    padding: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
  },
  modalInfoItem: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  modalInfoText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    marginLeft: 8,
  },
  modalInstruction: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  modalCloseButton: {
    backgroundColor: "#F2F2F2",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 100,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  noTicketsText: {
    textAlign: "center",
    color: "#777",
    marginTop: 50,
    fontSize: 16,
  },
});