import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const TicketItem = ({ registration, onRemove, index }) => {
  return (
    <View style={styles.ticketItemContainer}>
      <LinearGradient
        colors={["#FFF5F5", "#FFFFFF"]}
        style={styles.ticketItem}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.ticketAccent} />

        <View style={styles.ticketContent}>
          <View style={styles.ticketRow}>
            <View style={styles.leftSection}>
              <View style={styles.ticketIconContainer}>
                <LinearGradient
                  colors={["#FF1A1A", "#E3000F"]}
                  style={styles.ticketIconBg}
                >
                  <Ionicons name="ticket" size={16} color="#FFF" />
                </LinearGradient>
              </View>

              <View style={styles.ticketDetails}>
                <Text style={styles.ticketName}>
                  {registration.name || "Unnamed"}
                </Text>
                <Text style={styles.ticketNumber}>
                  #{Math.random().toString(36).substr(2, 6).toUpperCase()}
                </Text>
              </View>
            </View>

            <LinearGradient
              colors={["#FFE5E5", "#FFF5F5"]}
              style={styles.priceTag}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.priceTagText}>{registration.ticketType}</Text>
            </LinearGradient>

            <TouchableOpacity
              style={styles.removeTicketButton}
              onPress={() => onRemove(index)}
            >
              <Ionicons name="close-circle" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

export default function PaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const { registrations = [], finalTotal = 0 } = route.params || {};

  const [ticketList, setTicketList] = useState(registrations);
  const [paymentTotal, setPaymentTotal] = useState(finalTotal);

  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState("Razorpay");

  useEffect(() => {
    recalcTotal();
  }, [ticketList]);

  const recalcTotal = () => {
    let newTotal = 0;
    ticketList.forEach((t) => {
      if (t.ticketPrice) {
        newTotal += t.ticketPrice;
      }
    });
    setPaymentTotal(newTotal);
  };

  const removeTicket = (index) => {
    const updatedList = [...ticketList];
    updatedList.splice(index, 1);
    setTicketList(updatedList);
  };

  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method);
  };

  const handleMakePayment = () => {
    console.log("Making Payment with:", selectedPaymentMethod);
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" />

      {/* TOP SECTION */}
      <View style={styles.topSection}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={20} color="#FFF" />
        </TouchableOpacity>

        <Image
          source={require("../../../assets/Atul_bhai.png")}
          style={styles.topImage}
          resizeMode="cover"
        />

        <View style={styles.headerCard}>
          <Text style={styles.headerCardTitle}>
            Register for Atul Purohit Graba
          </Text>
          <View style={styles.headerCardRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.headerCardSubtitle}>
              Gelora Bung Karno Stadium, Ahmedabad
            </Text>
          </View>
          <View style={styles.headerCardRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.headerCardSubtitle}>
              August 30 - September 2, 2024
            </Text>
          </View>
          <View style={styles.headerCardRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.headerCardSubtitle}>09:00 AM - 07:00 PM</Text>
          </View>
        </View>
      </View>

      {/* WHITE SECTION */}
      <View style={styles.whiteContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Complete Event Registration</Text>

          {/* Payment Methods */}
          <Text style={styles.paymentMethodTitle}>Select Payment Method</Text>
          <View style={styles.paymentMethodContainer}>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedPaymentMethod === "Razorpay" &&
                  styles.paymentOptionSelected,
              ]}
              onPress={() => handlePaymentMethodChange("Razorpay")}
            >
              <View style={styles.paymentOptionRow}>
                <Ionicons
                  name="card-outline"
                  size={24}
                  color="#000"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.paymentOptionText}>Razorpay</Text>
              </View>
              <Ionicons
                name={
                  selectedPaymentMethod === "Razorpay"
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={24}
                color={
                  selectedPaymentMethod === "Razorpay" ? "#E3000F" : "#999"
                }
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedPaymentMethod === "PayPal" &&
                  styles.paymentOptionSelected,
              ]}
              onPress={() => handlePaymentMethodChange("PayPal")}
            >
              <View style={styles.paymentOptionRow}>
                <Ionicons
                  name="logo-paypal"
                  size={24}
                  color="#003087"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.paymentOptionText}>PayPal</Text>
              </View>
              <Ionicons
                name={
                  selectedPaymentMethod === "PayPal"
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={24}
                color={selectedPaymentMethod === "PayPal" ? "#E3000F" : "#999"}
              />
            </TouchableOpacity>
          </View>

          {/* Tickets Booked */}
          {ticketList.length > 0 && (
            <>
              <Text style={styles.ticketsBookedTitle}>Tickets Booked</Text>
              {ticketList.map((reg, index) => (
                <TicketItem
                  key={index}
                  registration={reg}
                  onRemove={removeTicket}
                  index={index}
                />
              ))}
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* BOTTOM BAR */}
        <View style={styles.bottomBar}>
          <View style={styles.totalSection}>
            <Text style={styles.grandTotalText}>
              Grand Total: ${paymentTotal}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.makePaymentButton}
            onPress={handleMakePayment}
          >
            <Text style={styles.makePaymentButtonText}>Make Payment</Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color="#FFF"
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },

  topSection: {
    position: "relative",
    paddingTop: Platform.OS === "ios" ? 40 : 0,
    backgroundColor: "#000",
    height: 360,
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 15,
    left: 16,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  topImage: {
    width: "100%",
    height: "100%",
  },
  headerCard: {
    position: "absolute",
    bottom: 25,
    alignSelf: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 11,
  },
  headerCardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  headerCardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    marginLeft: 2,
  },
  headerCardSubtitle: {
    fontSize: 12,
    color: "#666",
    marginLeft: 6,
  },

  whiteContainer: {
    flex: 1,
    backgroundColor: "#FFF",
    marginTop: -80,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollContent: {
    paddingTop: 90,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    marginBottom: 16,
  },

  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    marginBottom: 12,
  },
  paymentMethodContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginBottom: 24,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  paymentOptionSelected: {
    borderColor: "#E3000F",
    borderWidth: 1,
  },
  paymentOptionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentOptionText: {
    fontSize: 15,
    color: "#000",
  },

  ticketsBookedTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    marginBottom: 12,
  },

  ticketItemContainer: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  ticketItem: {
    borderRadius: 16,
    overflow: "hidden",
    flexDirection: "row",
  },
  ticketAccent: {
    width: 4,
    backgroundColor: "#E3000F",
  },
  ticketContent: {
    flex: 1,
    padding: 16,
  },

  ticketRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  ticketIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFC0C0",
    backgroundColor: "#FFE5E5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  ticketIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  iconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  ticketDetails: {
    flexDirection: "column",
  },
  ticketName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 4,
  },
  ticketNumber: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  removeTicketButton: {
    padding: 4,
    marginLeft: 8,
  },

  priceTag: {
    paddingHorizontal: 7,
    paddingVertical: 8,
    borderRadius: 30,
    marginLeft: 4,
    marginRight: 4,
    marginTop: 4,
  },
  priceTagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#E3000F",
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
  },
  totalSection: {
    flex: 1,
  },
  grandTotalText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },
  makePaymentButton: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    backgroundColor: "#E3000F",
    borderRadius: 24,
    paddingHorizontal: 24,
    marginLeft: 20,
    shadowColor: "#E3000F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  makePaymentButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
  },
});
