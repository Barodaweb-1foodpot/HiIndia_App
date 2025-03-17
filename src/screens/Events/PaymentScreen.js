import React, { useEffect, useState, useCallback } from "react";
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
  Linking,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

// Stripe hooks
import { useStripe } from "@stripe/stripe-react-native";

// API and helper imports
import { API_BASE_URL, API_BASE_URL_UPLOADS } from "@env";
import { formatEventDateTime } from "../../helper/helper_Function";
import { CheckAccessToken } from "../../api/token_api";
import { ExentRegister } from "../../api/event_api";
import { sendEventTicketByOrderId } from "../../api/ticket_api";
import {
  createPaymentIntent,
  updatePaymentStatus,
} from "../../api/payment_api";

// FontAwesomeIcon for Stripe icon
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faStripe } from "@fortawesome/free-brands-svg-icons";

const { width } = Dimensions.get("window");

/*
  SkeletonLoader Component:
  Displays a shimmering placeholder while images are loading.
  The animation is stopped on component unmount.
*/
const SkeletonLoader = React.memo(({ style }) => {
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    console.log("SkeletonLoader: starting animation loop");
    const animationLoop = Animated.loop(
      Animated.timing(animation, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      })
    );
    animationLoop.start();
    return () => {
      console.log("SkeletonLoader: stopping animation loop");
      animationLoop.stop();
    };
  }, [animation]);

  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <View
      style={[
        style,
        {
          backgroundColor: "#E0E0E0",
          overflow: "hidden",
        },
      ]}
    >
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
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      </Animated.View>
    </View>
  );
});

/*
  EventImage Component:
  Renders an image with a skeleton loader until the image loads.
*/
const EventImage = React.memo(({ uri, style, defaultSource }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <View style={style}>
      {/* Show skeleton loader while image is loading */}
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
        onLoadEnd={() => {
          console.log("EventImage: Image loaded successfully");
          setLoaded(true);
        }}
        onError={() => {
          console.log("EventImage: Error loading image, using placeholder");
          setError(true);
          setLoaded(true);
        }}
      />
    </View>
  );
});

/*
  TicketItem Component:
  Displays a single ticket’s details with gradient styling.
*/
const TicketItem = ({ registration }) => {
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
                {registration.TicketType?.TicketType || "Free Event ticket"}
              </Text>
            </LinearGradient>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

/*
  PaymentScreen Component:
  Manages the event registration and payment flow using Stripe’s PaymentSheet.
*/
export default function PaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    registrations = [],
    grandTotal,
    eventDetail,
    appliedCoupon,
  } = route.params || {};

  // Stripe PaymentSheet hooks
  const { initPaymentSheet, presentPaymentSheet, handleURLCallback } =
    useStripe();

  // State for toggling Read More in the header card
  const [titleReadMore, setTitleReadMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Deserialize registrations so that dateOfBirth strings become Date objects
  const deserializedRegistrations = registrations.map((reg) => ({
    ...reg,
    dateOfBirth: reg.dateOfBirth ? new Date(reg.dateOfBirth) : null,
  }));
  const [ticketList, setTicketList] = useState(deserializedRegistrations);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("Stripe");
  const [payment_id, setPayment_id] = useState("");

  // Debug: Log recalculated total from ticketList
  const recalcTotal = () => {
    const newTotal = ticketList.reduce(
      (sum, t) => sum + (t.ticketPrice || 0),
      0
    );
    console.log("Recalculated total from ticketList:", newTotal);
  };

  useEffect(() => {
    recalcTotal();
  }, [ticketList]);

  // Change the selected payment method
  const handlePaymentMethodChange = (method) => {
    console.log("Changing payment method to:", method);
    setSelectedPaymentMethod(method);
  };

  // Toggle the Read More state for the header card
  const toggleTitleReadMore = useCallback(() => {
    console.log("Toggling title read more state");
    setTitleReadMore((prev) => !prev);
  }, []);

  // Handle deep linking (e.g., for 3D Secure redirects)
  const handleDeepLink = useCallback(
    async (url) => {
      if (url) {
        console.log("Deep link received:", url);
        const stripeHandled = await handleURLCallback(url);
        if (stripeHandled) {
          console.log("Stripe handled the deep link");
        } else {
          console.log("Non-Stripe URL received:", url);
        }
      }
    },
    [handleURLCallback]
  );

  useEffect(() => {
    const getInitialUrl = async () => {
      const initialUrl = await Linking.getInitialURL();
      console.log("Initial URL:", initialUrl);
      handleDeepLink(initialUrl);
    };

    getInitialUrl();

    const urlListener = Linking.addEventListener("url", (event) => {
      console.log("URL event detected:", event.url);
      handleDeepLink(event.url);
    });

    return () => {
      urlListener.remove();
    };
  }, [handleDeepLink]);

  // Handle the complete payment process
  const handleMakePayment = async () => {
    console.log("Starting payment process...");
    const tokenValid = await CheckAccessToken();
    if (!tokenValid) {
      console.log("Access token invalid – redirecting to login");
      Toast.show({
        type: "error",
        text1: "Login Again Session Expired",
        position: "top",
        visibilityTime: 2000,
      });
      setTimeout(() => navigation.navigate("Auth"), 100);
      return;
    }
    try {
      setIsLoading(true);
      // Register the event and get the client secret for payment
      const registerResponse = await handleRegister();
      // Handle free event case
      if (registerResponse === "Free") {
        console.log("Event is free – no payment required");
        Toast.show({ type: "success", text1: "Registration successful!" });
        // Keep loader active until redirect
        setTimeout(() => {
          console.log(
            "Redirecting to Tickets tab after free event registration"
          );
          navigation.navigate("Tab", { screen: "Tickets" });
        }, 1000);
        return;
      }
      const { clientSecret, orderId } = registerResponse;
      if (clientSecret === "Free") {
        console.log("Event is free – no payment required");
        Toast.show({ type: "success", text1: "Registration successful!" });
        setTimeout(() => {
          console.log(
            "Redirecting to Tickets tab after free event registration"
          );
          navigation.navigate("Tab", { screen: "Tickets" });
        }, 1000);
        return;
      }
      if (!clientSecret) {
        console.log("No client secret received");
        await updatePaymentStatus(
          clientSecret,
          "Failed to create PaymentIntent",
          false
        );
        Toast.show({ type: "error", text1: "Failed to create PaymentIntent" });
        setIsLoading(false);
        return;
      }
      console.log("Client secret received:", clientSecret);

      // Initialize the Stripe PaymentSheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: eventDetail?.EventName || "HiIndia",
        returnURL: "hiindiaapp://stripe-redirect",
      });
      if (initError) {
        console.log("Error initializing PaymentSheet:", initError.message);
        await updatePaymentStatus(clientSecret, initError.message, false);
        Toast.show({
          type: "error",
          text1: "PaymentSheet init failed",
          text2: initError.message,
        });
        setIsLoading(false);
        return;
      }
      // Present the PaymentSheet to the user
      const { error: paymentError } = await presentPaymentSheet();
      if (paymentError) {
        console.log("Error during payment:", paymentError.message);
        await updatePaymentStatus(clientSecret, paymentError.message, false);
        Toast.show({
          type: "error",
          text1: "Payment error",
          text2: paymentError.message,
        });
        setIsLoading(false);
        return;
      }
      console.log("Payment successful!");
      Toast.show({ type: "success", text1: "Payment successful!" });
      const updateRes = await updatePaymentStatus(
        clientSecret,
        "success",
        true
      );
      console.log("Payment status updated:", updateRes);
      if (updateRes.isOk) {
        await handleSendMail(updateRes.orderId);
        // Keep loader active until redirect
        setTimeout(() => {
          console.log("Redirecting to Tickets tab after payment");
          navigation.navigate("Tab", { screen: "Tickets" });
        }, 1000);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error during payment process:", error);
      Toast.show({
        type: "error",
        text1: "Payment error",
        text2: error.message,
      });
      setIsLoading(false);
    }
  };

  // Register the event and create a PaymentIntent if needed
  const handleRegister = async () => {
    try {
      console.log("Registering event...");
      const tokenValid = await CheckAccessToken();
      if (!tokenValid) {
        console.log("Token check failed during registration");
        Toast.show({
          type: "error",
          text1: "Login Again Session Expired",
          position: "top",
          visibilityTime: 2000,
        });
        setTimeout(() => navigation.navigate("Auth"), 100);
        return;
      }
      const userId = await AsyncStorage.getItem("role");
      const amountInCents = Math.round(grandTotal * 100);
      // Format participants data from ticketList
      const formattedParticipants = ticketList.map((participant) => {
        console.log("Formatting participant:", participant.name);
        return {
          byParticipant: userId || null,
          name: participant.name,
          dob: participant.dateOfBirth,
          eventName: eventDetail._id,
          age: participant.age,
          sessionName: (participant.sessionName || []).map(
            (session) => session.value
          ),
          ticketCategory: "Participant",
          country: eventDetail.countryDetail[0]._id,
          TicketType: participant.TicketType,
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
        currency: eventDetail.countryDetail[0].CurrencyCode,
        amountInCents: amountInCents || "usd",
      };
      console.log("Registration payload:", payload);
      const response = await ExentRegister(payload);
      console.log("Registration response:", response);
      if (response.isOk) {
        if (response.clientSecret) {
          console.log(
            "Got clientSecret from server:",
            response.data[0].orderId
          );
          return {
            clientSecret: response.clientSecret,
            orderId: response.data[0].orderId,
          };
        } else if (eventDetail.IsPaid === false) {
          console.log("Event is free; returning 'Free'");
          return "Free";
        }
      } else {
        Toast.show({
          type: "error",
          text1: response.status === 401 ? "Login Again Session Expired" : "",
          text2: response.message || "Something Went Wrong",
          position: "top",
          visibilityTime: 3000,
        });
        if (response.status === 401) {
          setTimeout(() => navigation.navigate("Auth"), 2000);
        }
      }
    } catch (error) {
      console.error("Error during event registration:", error);
      Toast.show({
        type: "error",
        text1: "Registration Error",
        text2: "Something went wrong. Please try again.",
      });
      throw new Error(error);
    }
  };

  // Send email with the event ticket based on orderId
  const handleSendMail = async (orderId) => {
    try {
      console.log("Sending email for order ID:", orderId);
      const response = await sendEventTicketByOrderId(orderId);
      console.log("Email send response:", response);
      if (response.isOk || response.status === 200) {
        Toast.show({
          type: "success",
          text1: response.message,
          position: "top",
          visibilityTime: 2000,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Something went wrong sending the mail",
          position: "top",
          visibilityTime: 2000,
        });
      }
    } catch (error) {
      console.error("Error sending mail:", error);
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

      {/* TOP SECTION: Event image with back button and updated header card */}
      <View style={styles.topSection}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            console.log("Navigating back from PaymentScreen");
            navigation.goBack();
          }}
        >
          <Ionicons name="chevron-back" size={20} color="#FFF" />
        </TouchableOpacity>
        <EventImage
          uri={
            eventDetail?.EventImage
              ? `${API_BASE_URL_UPLOADS}/${eventDetail?.EventImage}`
              : undefined
          }
          style={styles.topImage}
          defaultSource={require("../../../assets/placeholder.jpg")}
        />
        {/* Updated header card: display only the event name with a Read More button */}
        <View style={styles.headerCard}>
          <View>
            <Text
              style={styles.headerCardTitle}
              numberOfLines={titleReadMore ? undefined : 2}
            >
              {eventDetail?.EventName || "Event Name Unavailable"}
            </Text>
            {eventDetail?.EventName?.length > 50 && (
              <TouchableOpacity onPress={toggleTitleReadMore}>
                <Text style={styles.readMoreText}>
                  {titleReadMore ? "Read Less" : "Read More"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* WHITE SECTION: Registration details and payment options */}
      <View style={styles.whiteContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Complete Event Registration</Text>
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
              </View>
            </>
          )}
          {ticketList.length > 0 && (
            <>
              <Text style={styles.ticketsBookedTitle}>Tickets Booked</Text>
              {ticketList.map((reg, index) => (
                <TicketItem key={index} registration={reg} />
              ))}
            </>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* BOTTOM BAR: Grand total and payment button */}
        <View style={styles.bottomBar}>
          <View style={styles.totalSection}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalText}>
              {eventDetail.countryDetail[0].Currency} {grandTotal}
            </Text>
          </View>
          <TouchableOpacity
            disabled={isLoading}
            style={styles.makePaymentButton}
            onPress={handleMakePayment}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Text style={styles.makePaymentButtonText}>
                  {grandTotal > 0 ? "Make Payment" : "Proceed"}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color="#FFF"
                  style={{ marginLeft: 8 }}
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <Toast />
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
    backgroundColor: "rgba(0,0,0,0.4)",
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
    zIndex: 1111,
  },
  headerCardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E3000F",
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: "#FFF",
    marginTop: -80,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 0,
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
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: "800",
    fontStyle: "italic",
    color: "#222",
    marginBottom: 4,
  },
  grandTotalText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#E3000F",
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

export { PaymentScreen };
