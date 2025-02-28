import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Dimensions,
  Modal,
  Share,
  ActivityIndicator,
  Pressable,
  Animated,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import { getTicketsByOrderId } from "../api/ticket_api";
import { API_BASE_URL_UPLOADS } from "@env";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");

// --- Skeleton Loader Component (for the event banner) ---
const SkeletonLoader = ({ style }) => {
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.timing(animation, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      })
    ).start();
  }, [animation]);

  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <View style={[style, { backgroundColor: "#E0E0E0", overflow: "hidden" }]}>
      <Animated.View
        style={{
          width: "100%",
          height: "100%",
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={[
            "rgba(255, 255, 255, 0)",
            "rgba(255, 255, 255, 0.5)",
            "rgba(255, 255, 255, 0)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: "100%", height: "100%" }}
        />
      </Animated.View>
    </View>
  );
};

// --- EventImage with dark overlay ---
const EventImage = ({ uri, style }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <View style={style}>
      {!loaded && <SkeletonLoader style={StyleSheet.absoluteFill} />}
      <Image
        source={
          uri && !error ? { uri } : require("../../assets/placeholder.jpg")
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
};

export default function TicketDetailsScreen({ route, navigation }) {
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [eventDetails, setEventDetail] = useState({});
  const [ticketDetails, setTicketDetail] = useState([]);
  const [loading, setLoading] = useState(true);
  // Control collapse/expand of the payment summary
  const [paymentSummaryExpanded, setPaymentSummaryExpanded] = useState(true);

  // Grab data passed from the previous screen
  const { orderId, orderDetails = {} } = route.params || {};
  const {
    totalRate = 0,
    couponDiscount = 0,
    total = 0,
    paymentMethod,
    purchaseDate,
    tax = 0,
  } = orderDetails;

  useEffect(() => {
    handleViewTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Fetch ticket details by orderId
  const handleViewTicket = async () => {
    try {
      setLoading(true);
      const response = await getTicketsByOrderId(orderId);
      if (response.isOk && response.data && response.data.length > 0) {
        setEventDetail(response.data[0].eventName || {});
        setTicketDetail(response.data);
      } else {
        alert("No ticket details found.");
      }
    } catch (error) {
      console.error("Error fetching ticket details:", error);
      alert("Error fetching ticket details.");
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Toggle QR modal
  const toggleQrModal = (ticket = null) => {
    if (qrModalVisible) {
      setQrModalVisible(false);
      setActiveTicket(null);
    } else {
      setActiveTicket(ticket);
      setQrModalVisible(true);
    }
  };

  // Share all tickets info
  const handleHeaderShare = async () => {
    if (!eventDetails) return;
    const shareUrlBase = "https://participanthiindia.barodaweb.org/ticket/";
    const ticketsInfo = ticketDetails
      .map(
        (ticket) =>
          `Attendee: ${ticket.name || "Guest"} - Ticket Type: ${
            ticket.TicketType?.TicketType || ticket.type || "Standard"
          } (View: ${shareUrlBase}${ticket._id})`
      )
      .join("\n");

    const shareMessage = `
Event: ${eventDetails.EventName}
Date: ${formatDate(eventDetails.StartDate)} - ${formatDate(
      eventDetails.EndDate
    )}

Tickets:
${ticketsInfo}
    `;

    try {
      await Share.share({
        message: shareMessage,
        title: `Tickets for ${eventDetails.EventName}`,
      });
    } catch (error) {
      console.error("Error sharing tickets:", error);
    }
  };

  // Share a single ticket's info
  const shareTicketDetails = async (ticket) => {
    if (!ticket) return;
    const shareUrl = `https://participanthiindia.barodaweb.org/ticket/${ticket._id}`;
    const shareMessage = `
Attendee: ${ticket.name || "Guest"}
Ticket Type: ${ticket.TicketType?.TicketType || ticket.type || "Standard"}

Event: ${eventDetails.EventName}
Date: ${formatDate(eventDetails.StartDate)} - ${formatDate(
      eventDetails.EndDate
    )}

View Ticket: ${shareUrl}
    `;
    try {
      await Share.share({
        message: shareMessage,
        title: `Ticket for ${eventDetails.EventName}`,
      });
    } catch (error) {
      console.error("Error sharing ticket:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E3000F" />
        <Text style={styles.loadingText}>Loading your tickets...</Text>
      </View>
    );
  }

  const eventImageUri = eventDetails?.EventImage
    ? `${API_BASE_URL_UPLOADS}/${eventDetails.EventImage}`
    : null;

  return (
    <View style={styles.rootContainer}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
        animated={true}
      />
      {/* Top Banner Section */}
      <View style={styles.topSection}>
        <EventImage uri={eventImageUri} style={styles.eventImage} />
        {/* Back Button */}
        <View style={styles.backButton}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        {/* Share Button */}
        <View style={styles.shareTopButton}>
          <TouchableOpacity onPress={handleHeaderShare}>
            <MaterialCommunityIcons
              name="share-variant"
              size={24}
              color="#FFF"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Event Details */}
          <View style={styles.eventDetailsContainer}>
            <Text style={styles.eventTitle}>
              {eventDetails?.EventName || ""}
            </Text>
            <View style={styles.eventMetaRow}>
              <Ionicons name="calendar-outline" size={18} color="#555" />
              <Text style={styles.eventMetaText}>
                {formatDate(eventDetails.StartDate)} -{" "}
                {formatDate(eventDetails.EndDate)}
              </Text>
            </View>
          </View>

          {/* Tickets List */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { marginBottom: 24 }]}>
              Your Tickets
            </Text>
            {ticketDetails.length === 0 ? (
              <View style={styles.noTicketsContainer}>
                <Ionicons name="ticket-outline" size={48} color="#CCCCCC" />
                <Text style={styles.noTicketsText}>No tickets found</Text>
              </View>
            ) : (
              ticketDetails.map((ticket, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.ticketCardContainer}
                  onPress={() => toggleQrModal(ticket)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={["#E3000F", "#B0000C"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ticketGradient}
                  >
                    <View style={styles.ticketHeader}>
                      <Text style={styles.ticketName}>
                        {ticket.name || "Guest"}
                      </Text>
                      <View style={styles.ticketTypeBadge}>
                        <Text style={styles.ticketTypeText}>
                          {ticket.TicketType?.TicketType ||
                            ticket.type ||
                            "Standard"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.ticketDivider} />
                    <View style={styles.ticketBottom}>
                      <View style={styles.ticketQrContainer}>
                        <View style={styles.qrCodeWrapper}>
                          <QRCode
                            value={`${API_BASE_URL_UPLOADS}/uploads/QR/${ticket._id}`}
                            size={42}
                            color="#000"
                            backgroundColor="#FFF"
                          />
                        </View>
                        <Text style={styles.ticketQrText}>
                          Tap to view QR code
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#FFF" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Payment Summary Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.paymentSummaryHeader}>
              <Text style={styles.sectionTitle}>Payment Summary</Text>
              <TouchableOpacity
                onPress={() => setPaymentSummaryExpanded((prev) => !prev)}
                style={styles.expandButton}
              >
                <Ionicons
                  name={paymentSummaryExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#E3000F"
                />
              </TouchableOpacity>
            </View>

            {paymentSummaryExpanded && (
              <View style={styles.paymentSummaryContainer}>
                {ticketDetails.map((ticket, index) => {
                  return (
                    <View key={index} style={styles.attendeeRow}>
                      <Text style={styles.attendeeName}>
                        {ticket.name || "Guest"}
                      </Text>
                      <View style={styles.priceTypeContainer}>
                        <LinearGradient
                          colors={["#EFEAFF", "#E5E0FF"]}
                          style={styles.purplePriceBox}
                        >
                          <Text style={styles.purplePriceText}>
                            {ticket.countryCurrency || "$"}{" "}
                            {Number(ticket.price || ticket.total || 0).toFixed(
                              2
                            )}
                          </Text>
                        </LinearGradient>
                        <Text style={styles.purplePriceType}>
                          <Text style={styles.italic}>
                            {ticket.TicketType?.TicketType ||
                              ticket.type ||
                              "Standard"}
                          </Text>
                        </Text>
                      </View>
                    </View>
                  );
                })}

                <View style={styles.paymentDivider} />

                {/* Totals Container */}
                <View style={styles.totalsContainer}>
                  <View style={styles.totalsRow}>
                    <Text style={styles.totalsLabel}>Total Rate</Text>
                    <Text style={styles.totalsValue}>
                      ${Number(totalRate).toFixed(2)}
                    </Text>
                  </View>
                  {couponDiscount !== 0 && (
                    <View style={styles.totalsRow}>
                      <View style={styles.totalsLabelWithIcon}>
                        <Ionicons
                          name="pricetag-outline"
                          size={16}
                          color="#10B981"
                        />
                        <Text style={styles.couponLabel}>Coupon applied</Text>
                      </View>
                      <Text style={styles.couponValue}>
                        -${Math.abs(couponDiscount).toFixed(2)}
                      </Text>
                    </View>
                  )}

                  {tax > 0 && (
                    <View style={styles.totalsRow}>
                      <Text style={styles.totalsLabel}>Tax</Text>
                      <Text style={styles.totalsValue}>${tax}</Text>
                    </View>
                  )}
                  <View style={styles.grandTotalRow}>
                    <Text style={styles.grandTotalLabel}>Total</Text>
                    <Text style={styles.finalTotal}>
                      ${Number(total).toFixed(2)}
                    </Text>
                  </View>
                </View>

                {(paymentMethod || purchaseDate) && (
                  <View style={styles.paymentMetaContainer}>
                    {paymentMethod && (
                      <View style={styles.paymentMetaItem}>
                        <View style={styles.paymentMetaIcon}>
                          <Ionicons
                            name="card-outline"
                            size={18}
                            color="#FFF"
                          />
                        </View>
                        <View>
                          <Text style={styles.paymentMetaTitle}>
                            Payment Method
                          </Text>
                          <Text style={styles.paymentMetaValue}>
                            {paymentMethod}
                          </Text>
                        </View>
                      </View>
                    )}
                    {purchaseDate && (
                      <View style={styles.paymentMetaItem}>
                        <View style={styles.paymentMetaIcon}>
                          <Ionicons
                            name="time-outline"
                            size={18}
                            color="#FFF"
                          />
                        </View>
                        <View>
                          <Text style={styles.paymentMetaTitle}>
                            Purchase Date
                          </Text>
                          <Text style={styles.paymentMetaValue}>
                            {formatDate(purchaseDate)}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.orderIdContainer}>
                  <Text style={styles.orderIdLabel}>Order ID:</Text>
                  <Text style={styles.orderIdValue}>{orderId}</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* QR Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={qrModalVisible}
        onRequestClose={() => toggleQrModal()}
      >
        <BlurView intensity={80} style={styles.modalBlurContainer}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => toggleQrModal()}
          />
          <View style={styles.modalContent}>
            <LinearGradient
              colors={["#E3000F", "#B0000C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>
                {activeTicket?.TicketType?.TicketType ||
                  activeTicket?.type ||
                  "Standard"}{" "}
                Ticket
              </Text>
              <TouchableOpacity
                onPress={() => shareTicketDetails(activeTicket)}
                style={styles.modalShareButton}
              >
                <MaterialCommunityIcons
                  name="share-variant"
                  size={22}
                  color="#FFF"
                />
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                {eventDetails?.EventName}
              </Text>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={`${API_BASE_URL_UPLOADS}/uploads/QR/${activeTicket?._id}`}
                  size={220}
                  color="#000"
                  backgroundColor="#FFF"
                />
              </View>
              <View style={styles.modalInfoContainer}>
                <View style={styles.modalInfoItem}>
                  <Ionicons name="person-outline" size={18} color="#666" />
                  <Text style={styles.modalInfoText}>
                    {activeTicket?.name || "Guest"}
                  </Text>
                </View>
                <View style={styles.modalInfoDivider} />
                <View style={styles.modalInfoItem}>
                  <Ionicons name="calendar-outline" size={18} color="#666" />
                  <Text style={styles.modalInfoText}>
                    {formatDate(eventDetails?.StartDate)}
                  </Text>
                </View>
              </View>
              <Text style={styles.modalInstruction}>
                Show this QR code to event staff for entry
              </Text>
              <TouchableOpacity
                onPress={() => toggleQrModal()}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  // Top Banner
  topSection: {
    position: "relative",
    height: 350,
    backgroundColor: "#000",
  },
  eventImage: {
    width: "100%",
    height: "100%",
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 55 : 40,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  shareTopButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 55 : 40,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  // Main Content
  contentContainer: {
    flex: 1,
    backgroundColor: "#F7F9FC",
    marginTop: -70,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    minHeight: 600,
    paddingTop: 20,
  },
  // Event Details
  eventDetailsContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222",
    marginBottom: 12,
  },
  eventMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventMetaText: {
    fontSize: 16,
    color: "#555",
    marginLeft: 8,
  },
  // Sections
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
  },
  // Payment Summary Header
  paymentSummaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 4,
  },
  expandButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(227, 0, 15, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  // Tickets
  noTicketsContainer: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#FFF",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  noTicketsText: {
    color: "#999",
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  ticketCardContainer: {
    marginBottom: 20,
    borderRadius: 24,
    shadowColor: "rgba(227, 0, 15, 0.4)",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },
  ticketGradient: {
    borderRadius: 24,
    padding: 20,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  ticketName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
  },
  ticketTypeBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
  },
  ticketTypeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
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
    padding: 6,
  },
  ticketQrText: {
    fontSize: 14,
    color: "#FFF",
    marginLeft: 12,
    fontWeight: "500",
  },
  // Payment Summary
  paymentSummaryContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 0,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },
  attendeeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  attendeeName: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },

  priceTypeContainer: {
    alignItems: "center",
  },
  purplePriceBox: {
    width: 70,
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 5,
    marginBottom: 2,
  },
  purplePriceText: {
    fontSize: 15,
    color: "#000",
    fontFamily: "Poppins-Medium",
  },
  purplePriceType: {
    fontSize: 12,
    color: "#666",
    fontFamily: "Poppins-Medium",
  },
  italic: {
    fontStyle: "italic",
  },
  paymentDivider: {
    height: 2,
    backgroundColor: "#F7F9FC",
  },
  totalsContainer: {
    padding: 20,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  totalsLabel: {
    fontSize: 15,
    color: "#555",
  },
  totalsLabelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  couponLabel: {
    fontSize: 15,
    color: "#10B981",
  },
  totalsValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
  },
  couponValue: {
    fontSize: 15,
    color: "#10B981",
    fontWeight: "600",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },
  finalTotal: {
    fontSize: 18,
    color: "#E3000F",
    fontWeight: "700",
  },
  paymentMetaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    padding: 20,
    backgroundColor: "#F7F9FC",
  },
  paymentMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    flexGrow: 1,
    minWidth: 150,
    gap: 10,
  },
  paymentMetaIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E3000F",
    justifyContent: "center",
    alignItems: "center",
  },
  paymentMetaTitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  paymentMetaValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  orderIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  orderIdLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 6,
  },
  orderIdValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  // QR Modal
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
    width: width * 0.85,
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
  modalShareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
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
  modalInfoDivider: {
    height: 24,
    width: 1,
    backgroundColor: "#E0E0E0",
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
});
