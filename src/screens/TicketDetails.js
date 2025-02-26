import React, { useEffect, useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import { getTicketsByOrderId } from "../api/ticket_api";
import { API_BASE_URL_UPLOADS } from "@env";

const { width } = Dimensions.get("window");

export default function TicketDetailsScreen({ route, navigation }) {
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const { orderId , orderDetails} = route.params;
  const [eventDetails, setEventDetail] = useState("");
  const [ticketDetails, setTicketDetail] = useState("");
  const toggleQrModal = (ticket = null) => {
    setActiveTicket(ticket);
    console.log("kkkkkkkkkkkkkkkkk",ticket)
    setQrModalVisible(!qrModalVisible);
  };

  useEffect(() => {
    handleViewTicket();
  }, [orderId]);

  const handleViewTicket = async () => {
    try {
      const response = await getTicketsByOrderId(orderId);
      console.log("---------", response.data);
      if (response.isOk && response.data && response.data.length > 0) {
        setEventDetail(response.data[0].eventName)
        setTicketDetail(response.data)
        // const registrations = response.data;
        // const eventData = registrations[0];

        // const eventDetails = {
        //   image: eventData.eventName?.EventImage
        //     ? {
        //         uri: `${API_BASE_URL_UPLOADS}/${eventData.eventName.EventImage}`,
        //       }
        //     : ticket.image,
        //   name: eventData.eventName?.EventName || ticket.title,
        //   date: ticket.date,
        //   time: eventData.eventName?.Time || "",
        //   location: eventData.eventName?.Location || "",
        // };

        // // Even if there's only one registration, map returns an array with one element.
        // const ticketDetails = registrations.map((reg) => ({
        //   type: reg.TicketType?.name || "Standard",
        //   quantity: reg.quantity || 1,
        //   qrData: reg.qrData || reg._id,
        //   name: reg.name,
        // }));

        // const orderDetails = {
        //   totalRate: ticket.totalRate,
        //   couponDiscount: ticket.coupon,
        //   total: ticket.total,
        // };

        // navigation.navigate("App", {
        //   screen: "TicketDetails",
        //   params: { eventDetails, ticketDetails, orderDetails },
        // });
      } else {
        alert("No ticket details found.");
      }
    } catch (error) {
      console.error("Error fetching ticket details:", error);
      alert("Error fetching ticket details.");
    }
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Tickets</Text>
        <TouchableOpacity
          onPress={() => {
            /* share functionality */
          }}
          style={styles.headerButton}
        >
          <Ionicons name="share-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Event Image with overlay */}
        <View style={styles.imageWrapper}>
          <Image
            source={{uri:eventDetails?.EventImage ? `${API_BASE_URL_UPLOADS}/${eventDetails?.EventImage}` : '' }}
            style={styles.eventImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.imageOverlay}
          >
            <Text style={styles.eventTitleOverlay}>{eventDetails.EventName}</Text>
            <Text style={styles.eventMetaOverlay}>
              {eventDetails.StartDate} • {eventDetails.EndDate}
            </Text>
            <Text style={styles.eventLocationOverlay}>
              {eventDetails.EventLocation}
            </Text>
          </LinearGradient>
        </View>

        {/* Ticket Cards - Simplified */}
        <Text style={styles.sectionTitle}>Your Tickets</Text>
        {ticketDetails && ticketDetails?.map((ticket, index) => (
          <TouchableOpacity
            key={index}
            style={styles.ticketCardContainer}
            onPress={() => toggleQrModal(ticket)}
          >
            <LinearGradient
              colors={["#FFFFFF", "#F8F8F8"]}
              style={styles.ticketCard}
            >
              <View style={styles.ticketLeftBorder} />
              <View style={styles.ticketContent}>
                <View style={styles.ticketHeader}>
                  <Text style={styles.ticketType}>{ticket.type}</Text>
                </View>
                <View style={styles.ticketInfoRow}>
                  <Text style={styles.ticketLabel}>Name:</Text>
                  <Text style={styles.ticketValue}>{ticket.name}</Text>
                  {/* <Text>Link : "https://participanthiindia.barodaweb.org/ticket/${ticket._id}"</Text> */}
                </View>
                
                <View style={styles.ticketFooter}>
                  <View style={styles.ticketQrPreview}>
                    <QRCode
                      value={ticket.qrData}
                      size={40}
                      color="#000"
                      backgroundColor="#FFF"
                    />
                  </View>
                  <Text style={styles.ticketInstruction}>
                    Tap to view QR code
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#999" />
                </View>
              </View> 
              <View style={[styles.ticketCircle, styles.ticketCircleTop]} />
              <View style={[styles.ticketCircle, styles.ticketCircleBottom]} />
            </LinearGradient>
          </TouchableOpacity>
        ))}

        {/* Order Summary Card */}
        <Text style={styles.sectionTitle}>Payment Summary</Text>
        <View style={styles.orderCard}>
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Subtotal</Text>
            <Text style={styles.orderValue}>${orderDetails.totalRate}</Text>
          </View>
          {console.log("ooooooooooooooooooooooo",orderDetails)}
          {orderDetails.couponDiscount !=0 && (
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Discount</Text>
              <Text style={styles.discountValue}>
                -${orderDetails.couponDiscount}
              </Text>
            </View>
          )}
          <View style={styles.orderRow}>
            {/* <Text style={styles.orderLabel}>Service Fee</Text>
            <Text style={styles.orderValue}>
              ${orderDetails.serviceFee || "2.50"}
            </Text> */}
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>${orderDetails.total}</Text>
          </View>
          <View style={styles.paymentMethod}>
            <Ionicons name="card-outline" size={18} color="#777" />
            <Text style={styles.paymentMethodText}>Visa •••• 4242</Text>
          </View>
        </View>
      </ScrollView>

      {/* QR Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={qrModalVisible}
        onRequestClose={() => toggleQrModal()}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeTicket?.TicketType?.TicketType || ticketDetails[0]?.type} Ticket
              </Text>
              <Text style={styles.modalSubtitle}>{eventDetails?.EventName}</Text>
            </View>
            <View style={styles.qrWrapper}>
              <QRCode
                value={`${API_BASE_URL_UPLOADS}/uploads/QR/${activeTicket?._id}`}
                size={220}
                color="#000"
                backgroundColor="#FFF"
              />
            </View>
            <Text style={styles.modalInstruction}>
              Show this code to the event staff
            </Text>
            <TouchableOpacity
              onPress={() => toggleQrModal()}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  header: {
    flexDirection: "row",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 15,
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  eventTitleOverlay: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
  },
  eventMetaOverlay: {
    fontSize: 14,
    color: "#FFF",
    marginBottom: 4,
  },
  eventLocationOverlay: {
    fontSize: 14,
    color: "#FFF",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 12,
    color: "#333",
  },
  ticketCardContainer: {
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  ticketCard: {
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  ticketLeftBorder: {
    position: "absolute",
    left: 0,
    top: 15,
    bottom: 15,
    width: 4,
    backgroundColor: "#E3000F",
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  ticketContent: {
    padding: 16,
  },
  ticketHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  ticketType: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  ticketInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  ticketLabel: {
    fontSize: 14,
    color: "#777",
    marginRight: 8,
  },
  ticketValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  ticketFooter: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingTop: 12,
  },
  ticketQrPreview: {
    borderWidth: 1,
    borderColor: "#EEEEEE",
    padding: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  ticketInstruction: {
    flex: 1,
    fontSize: 14,
    color: "#777",
  },
  ticketCircle: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F7F7F7",
  },
  ticketCircleTop: {
    top: -10,
    right: "50%",
    marginRight: -10,
  },
  ticketCircleBottom: {
    bottom: -10,
    right: "50%",
    marginRight: -10,
  },
  orderCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  orderLabel: {
    fontSize: 15,
    color: "#777",
  },
  orderValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  discountValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4CAF50",
  },
  divider: {
    height: 1,
    backgroundColor: "#EEE",
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E3000F",
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentMethodText: {
    fontSize: 13,
    color: "#777",
    marginLeft: 6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    width: "85%",
    maxWidth: 340,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
  },
  qrWrapper: {
    padding: 15,
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  modalInstruction: {
    fontSize: 14,
    color: "#777",
    marginBottom: 24,
    textAlign: "center",
  },
  modalCloseButton: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    backgroundColor: "#E3000F",
    borderRadius: 12,
    shadowColor: "#E3000F",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  modalCloseText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
