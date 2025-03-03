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
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE_URL, API_BASE_URL_UPLOADS } from "@env";
import { formatEventDateTime } from "../../helper/helper_Function";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ExentRegister } from "../../api/event_api";
const { width } = Dimensions.get("window");
import Toast from "react-native-toast-message";
import { sendEventTicketByOrderId } from "../../api/ticket_api";

// Import FontAwesomeIcon and the Stripe icon
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faStripe } from "@fortawesome/free-brands-svg-icons";

// --- Skeleton Loader Components ---
const SkeletonLoader = React.memo(({ style }) => {
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
});

const EventImage = React.memo(({ uri, style, defaultSource }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <View style={style}>
      {!loaded && (
        <SkeletonLoader
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: style?.borderRadius || 0 },
          ]}
        />
      )}
      <Image
        source={
          uri && !error
            ? { uri }
            : defaultSource || require("../../../assets/placeholder.jpg")
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
// --- End Skeleton Loader Components ---

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
              </View>
            </View>

            <LinearGradient
              colors={["#FFE5E5", "#FFF5F5"]}
              style={styles.priceTag}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.priceTagText}>
                {registration.TicketType.TicketType || "Free Event ticket"}
              </Text>
            </LinearGradient>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

export default function PaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [titleReadMore, setTitleReadMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { registrations = [], grandTotal, eventDetail, appliedCoupon } =
    route.params || {};

  // Deserialize registrations so that dateOfBirth is a Date object again
  const deserializedRegistrations = registrations.map((reg) => ({
    ...reg,
    dateOfBirth: reg.dateOfBirth ? new Date(reg.dateOfBirth) : null,
  }));

  const [ticketList, setTicketList] = useState(deserializedRegistrations);
  const [paymentTotal, setPaymentTotal] = useState(grandTotal);
  // Set default payment method to Stripe
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("Stripe");

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
    handleRegister();
  };

  const handleRegister = async () => {
    try {
      const userId = await AsyncStorage.getItem("role");
      setIsLoading(true);
      const formattedParticipants = ticketList.map((participant) => {
        const sessionTotal = (participant.sessionName || []).reduce(
          (sum, session) => sum + Number(session.rate || 0),
          0
        );
        let ticketCategory = "Participant";
        return {
          byParticipant: userId || null,
          name: participant.name,
          dob: participant.dateOfBirth,
          eventName: eventDetail._id,
          age: participant.age,
          sessionName: (participant.sessionName || []).map(
            (session) => session.value
          ),
          ticketCategory,
          country: eventDetail.countryDetail[0]._id,
          TicketType: participant.TicketType._id,
          isActive: true,
          registrationCharge: participant.registrationCharge,
        };
      });
      const payload = {
        couponCode: appliedCoupon ? appliedCoupon.couponCode : "",
        byParticipant: userId,
        eventName: eventDetail._id,
        country: eventDetail.countryDetail[0]._id,
        participants: formattedParticipants,
        afterDiscountTotal: grandTotal,
      };

      const response = await ExentRegister(payload);
      console.log("-----------------------------", response);
      if (response.isOk) {
        await handlesendMial(response.data[0].orderId);
      } else {
        setIsLoading(false);
        Toast.show({
          type: "error",
          text1: response.message || "Something Went Wrong",
          position: "top",
          visibilityTime: 2000,
        });
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Error during registration:", error);
      Toast.show({
        type: "error",
        text1: "Registration Error",
        text2: "Something went wrong. Please try again.",
      });
      throw new Error(error);
    }
  };

  const handlesendMial = async (orderId) => {
    try {
      const response = await sendEventTicketByOrderId(orderId);
      console.log("-----------------------------", response);
      if (response.isOk || response.status === 200) {
        setIsLoading(false);
        Toast.show({
          type: "success",
          text1: response.message,
          position: "top",
          visibilityTime: 2000,
        });
        setTimeout(() => {
          navigation.navigate("Tab");
        }, 2000);
      } else {
        setIsLoading(false);
        Toast.show({
          type: "error",
          text1: "Something went wrong sending the mail",
          position: "top",
          visibilityTime: 2000,
        });
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Error during sending mail:", error);
      Toast.show({
        type: "error",
        text1: "Mail Error",
        text2: "Something went wrong. Please try again.",
      });
      throw new Error(error);
    }
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar style="auto" />

      {/* TOP SECTION */}
      <View style={styles.topSection}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={20} color="#FFF" />
        </TouchableOpacity>
        {/* Use EventImage with skeleton loader for the top image */}
        <EventImage
          uri={
            eventDetail?.EventImage
              ? `${API_BASE_URL_UPLOADS}/${eventDetail?.EventImage}`
              : undefined
          }
          style={styles.topImage}
          defaultSource={require("../../../assets/placeholder.jpg")}
        />

        <View style={styles.headerCard}>
          <Text
            style={styles.headerCardTitle}
            numberOfLines={titleReadMore ? undefined : 2}
          >
            Register for {eventDetail?.EventName}
          </Text>
          <View style={styles.headerCardRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.headerCardSubtitle}>
              {eventDetail?.EventLocation}
            </Text>
          </View>
          <View style={styles.headerCardRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.headerCardSubtitle}>
              {formatEventDateTime(
                eventDetail?.StartDate,
                eventDetail?.EndDate
              ) || "Date/Time not available"}
            </Text>
          </View>
        </View>
      </View>

      {/* WHITE SECTION */}
      <View style={styles.whiteContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>
            Complete Event Registration
          </Text>

          {/* Payment Methods */}
          {grandTotal > 0 && (
            <>
              <Text style={styles.paymentMethodTitle}>
                Select Payment Method
              </Text>
              <View style={styles.paymentMethodContainer}>
                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    selectedPaymentMethod === "Stripe" &&
                      styles.paymentOptionSelected,
                  ]}
                  onPress={() => handlePaymentMethodChange("Stripe")}
                >
                  <View style={styles.paymentOptionRow}>
                    <FontAwesomeIcon
                      icon={faStripe}
                      size={24}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.paymentOptionText}>Stripe</Text>
                  </View>
                  <Ionicons
                    name={
                      selectedPaymentMethod === "Stripe"
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={24}
                    color={
                      selectedPaymentMethod === "Stripe" ? "#E3000F" : "#999"
                    }
                  />
                </TouchableOpacity>

                {/* <TouchableOpacity
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
                    color={
                      selectedPaymentMethod === "PayPal" ? "#E3000F" : "#999"
                    }
                  />
                </TouchableOpacity> */}
              </View>
            </>
          )}

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
            <Text style={styles.grandTotalText}>Grand Total: ${grandTotal}</Text>
          </View>
          <TouchableOpacity
            disabled={isLoading}
            style={styles.makePaymentButton}
            onPress={handleMakePayment}
          >
            <Text style={styles.makePaymentButtonText}>
              {isLoading
                ? "Processing..."
                : grandTotal > 0
                ? "Make Payment"
                : "Proceed"}
            </Text>
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
    top: Platform.OS === "ios" ? 50 : 25,
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
  ticketDetails: {
    flexDirection: "column",
  },
  ticketName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 4,
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
