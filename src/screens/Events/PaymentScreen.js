import React, { useState, useEffect, useCallback } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

// Stripe hooks
import { useStripe } from "@stripe/stripe-react-native";

// Your helper and API imports
import { API_BASE_URL, API_BASE_URL_UPLOADS } from "@env";
import { formatEventDateTime } from "../../helper/helper_Function";
import { CheckAccessToken } from "../../api/token_api";
import { ExentRegister } from "../../api/event_api";
import { sendEventTicketByOrderId } from "../../api/ticket_api";
import { createPaymentIntent, updatePaymentStatus } from "../../api/payment_api";

// FontAwesomeIcon for Stripe icon
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faStripe } from "@fortawesome/free-brands-svg-icons";

const { width } = Dimensions.get("window");

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

  const [titleReadMore, setTitleReadMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Deserialize registrations so that dateOfBirth is a Date object again
  const deserializedRegistrations = registrations.map((reg) => ({
    ...reg,
    dateOfBirth: reg.dateOfBirth ? new Date(reg.dateOfBirth) : null,
  }));

  const [ticketList, setTicketList] = useState(deserializedRegistrations);
  const [paymentTotal, setPaymentTotal] = useState(grandTotal);
  // Set default payment method to Stripe
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("Stripe");

  const [payment_id, setPayment_id] = useState("")

  useEffect(() => {
    recalcTotal();
  }, [ticketList]);

  // Deep Linking: Handle URLs (e.g., after 3D Secure redirects)
  const handleDeepLink = useCallback(
    async (url) => {
      if (url) {
        const stripeHandled = await handleURLCallback(url);
        if (stripeHandled) {
          // Stripe handled the redirect
        } else {
          // Handle non-Stripe URLs if needed
        }
      }
    },
    [handleURLCallback]
  );

  useEffect(() => {
    const getInitialUrl = async () => {
      const initialUrl = await Linking.getInitialURL();
      handleDeepLink(initialUrl);
    };

    getInitialUrl();

    const urlListener = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    return () => urlListener.remove();
  }, [handleDeepLink]);

  const recalcTotal = () => {
    let newTotal = 0;
    ticketList.forEach((t) => {
      if (t.ticketPrice) {
        newTotal += t.ticketPrice;
      }
    });
    setPaymentTotal(newTotal);
  };

  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method);
  };

  const handleMakePayment = async () => {
    const res = await CheckAccessToken();
    if (res) {
      try {
        setIsLoading(true);

        // const amountInCents = Math.round(grandTotal * 100);
        // const currency = eventDetail?.countryDetail?.[0]?.CurrencyCode || "usd";
        // const registrationIds=await AsyncStorage.getItem("role");
        // Create PaymentIntent
        const  clientSecret  = await handleRegister();
        console.log("lllllllllll",clientSecret)
        if (!clientSecret) {
          const res = await updatePaymentStatus(clientSecret, "Failed to create PaymentIntent" , false);
          Toast.show({
            type: "error",
            text1: "Failed to create PaymentIntent",
          });
          setIsLoading(false);
          return;
        }

        const { error: initError } = await initPaymentSheet({
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName: eventDetail?.EventName || "HiIndia",
          returnURL: "hiindiaapp://stripe-redirect",
        });
        if (initError) {

          const res = await updatePaymentStatus(clientSecret, initError.message , false);

          Toast.show({
            type: "error",
            text1: "PaymentSheet init failed",
            text2: initError.message,
          });
          setIsLoading(false);
          return;
        }

        const { error: paymentError } = await presentPaymentSheet();
        if (paymentError) {
          const res = await updatePaymentStatus(clientSecret,  paymentError.message , false);

          Toast.show({
            type: "error",
            text1: "Payment error",
            text2: paymentError.message,
          });
          setIsLoading(false);
          return;
        }

        Toast.show({
          type: "success",
          text1: "Payment successful!",
        });
        const res = await updatePaymentStatus(clientSecret, "success" , true);
        console.log("------------pppppppppppppp-------------",res)
        console.log(res.data.isOk)
        if(res.isOk) await handlesendMial(res.orderId);
        // await handleRegister();
        setIsLoading(false);
      } catch (error) {
        console.error("Error making payment:", error);
        Toast.show({
          type: "error",
          text1: "Payment error",
          text2: error.message,
        });
        setIsLoading(false);
      }
    } else {
      Toast.show({
        type: "error",
        text1: "Login Again Session Expired",
        position: "top",
        visibilityTime: 2000,
      });
      setTimeout(() => {
        navigation.navigate("Auth");
      }, 100);
    }
  };

  const handleRegister = async () => {
    try {
      const res = await CheckAccessToken();
      if (res) {
        const userId = await AsyncStorage.getItem("role");
        const amountInCents = Math.round(grandTotal * 100);
        // const currency = eventDetail?.countryDetail?.[0]?.CurrencyCode || "usd";
        // const registrationIds=await AsyncStorage.getItem("role");
        setIsLoading(true);
        // console.log("aaaaaaaaaaaa", ticketList)
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
            TicketType: participant.TicketType._id, // Extract the correct value
            isActive: true,
            registrationCharge: participant.registrationCharge,
          };
        });
        const payload = {
          couponCode: appliedCoupon ? appliedCoupon.couponCode : "",
          byParticipant: userId,
          eventName: eventDetail._id, // Replace with actual event ID
          country: eventDetail.countryDetail[0]._id, // Replace with actual country ID
          participants: formattedParticipants,
          afterDiscountTotal: grandTotal,
          currency: eventDetail.countryDetail[0].CurrencyCode,
          amountInCents:amountInCents|| "usd"
        };

        const response = await ExentRegister(payload);
        console.log("-----------------------------", response);
        if (response.isOk) {
          // setPayment_id(response.payment_id)
          return response.clientSecret
          // await handlesendMial(response.data[0].orderId);
        } else {
          setIsLoading(false);
          Toast.show({
            type: "error",
            text2: response.message || "Someting Went Wrong",
            text1: response.status === 401 ? "Login Again Session Expired" : "",
            position: "top",
            visibilityTime: 3000,
          });
          if (response.status === 401) {
            setTimeout(() => {
              navigation.navigate("Auth");
            }, 2000);
          }
        }
      } else {
        Toast.show({
          type: "error",
          text1: "Login Again Session Expired",
          position: "top",
          visibilityTime: 2000,
        });
        setTimeout(() => {
          navigation.navigate("Auth");
        }, 100);
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
      console.log(orderId)
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
  // const handleRegister = async () => {
  //   try {
  //     const tokenCheck = await CheckAccessToken();
  //     if (!tokenCheck) {
  //       Toast.show({
  //         type: "error",
  //         text1: "Login Again Session Expired",
  //         position: "top",
  //         visibilityTime: 2000,
  //       });
  //       navigation.navigate("Auth");
  //       return;
  //     }

  //     const userId = await AsyncStorage.getItem("role");

  //     const formattedParticipants = ticketList.map((participant) => {
  //       let ticketCategory = "Participant";
  //       return {
  //         byParticipant: userId || null,
  //         name: participant.name,
  //         dob: participant.dateOfBirth,
  //         eventName: eventDetail._id,
  //         age: participant.age,
  //         sessionName: (participant.sessionName || []).map((s) => s.value),
  //         ticketCategory,
  //         country: eventDetail.countryDetail[0]._id,
  //         TicketType: participant.TicketType._id,
  //         isActive: true,
  //         registrationCharge: participant.registrationCharge,
  //       };
  //     });

  //     const payload = {
  //       couponCode: appliedCoupon ? appliedCoupon.couponCode : "",
  //       byParticipant: userId,
  //       eventName: eventDetail._id,
  //       country: eventDetail.countryDetail[0]._id,
  //       participants: formattedParticipants,
  //       afterDiscountTotal: grandTotal,
  //       currency: eventDetail.countryDetail[0].CurrencyCode,
  //     };

  //     const response = await ExentRegister(payload);
  //     console.log("Registration response:", response);

  //     if (response.isOk) {
  //       await handlesendMail(response.data[0].orderId);
  //     } else {
  //       Toast.show({
  //         type: "error",
  //         text2: response.message || "Something Went Wrong",
  //         text1: response.status === 401 ? "Login Again Session Expired" : "",
  //         position: "top",
  //         visibilityTime: 3000,
  //       });
  //       if (response.status === 401) {
  //         setTimeout(() => {
  //           navigation.navigate("Auth");
  //         }, 2000);
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error during registration:", error);
  //     Toast.show({
  //       type: "error",
  //       text1: "Registration Error",
  //       text2: "Something went wrong. Please try again.",
  //     });
  //     throw new Error(error);
  //   }
  // };

  // /**
  //  * Sends an email with the tickets after successful registration.
  //  */
  // const handlesendMail = async (orderId) => {
  //   try {
  //     const response = await sendEventTicketByOrderId(orderId);
  //     console.log("sendEventTicketByOrderId response:", response);

  //     if (response.isOk || response.status === 200) {
  //       Toast.show({
  //         type: "success",
  //         text1: response.message,
  //         position: "top",
  //         visibilityTime: 2000,
  //       });
  //       setTimeout(() => {
  //         navigation.navigate("Tab");
  //       }, 2000);
  //     } else {
  //       Toast.show({
  //         type: "error",
  //         text1: "Something went wrong sending the mail",
  //         position: "top",
  //         visibilityTime: 2000,
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Error during sending mail:", error);
  //     Toast.show({
  //       type: "error",
  //       text1: "Mail Error",
  //       text2: "Something went wrong. Please try again.",
  //     });
  //     throw new Error(error);
  //   }
  // };

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

        {/* BOTTOM BAR */}
        <View style={styles.bottomBar}>
          <View style={styles.totalSection}>
            <Text style={styles.grandTotalText}>
              Grand Total: {eventDetail.countryDetail[0].Currency} {grandTotal}
            </Text>
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
      <Toast />
    </View>
  );
}

// -------------------- STYLES --------------------
const styles = StyleSheet.create({
  rootContainer: { flex: 1, backgroundColor: "#fff" },
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
  topImage: { width: "100%", height: "100%" },
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
  headerCardSubtitle: { fontSize: 12, color: "#666", marginLeft: 6 },
  whiteContainer: {
    flex: 1,
    backgroundColor: "#FFF",
    marginTop: -80,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollContent: { paddingTop: 90, paddingHorizontal: 20 },
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
  paymentOptionSelected: { borderColor: "#E3000F", borderWidth: 1 },
  paymentOptionRow: { flexDirection: "row", alignItems: "center" },
  paymentOptionText: { fontSize: 15, color: "#000" },
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
  ticketItem: { borderRadius: 16, overflow: "hidden", flexDirection: "row" },
  ticketAccent: { width: 4, backgroundColor: "#E3000F" },
  ticketContent: { flex: 1, padding: 16 },
  ticketRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  leftSection: { flexDirection: "row", alignItems: "center", flex: 1 },
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
  ticketDetails: { flexDirection: "column" },
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
  priceTagText: { fontSize: 12, fontWeight: "700", color: "#E3000F" },
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
  totalSection: { flex: 1 },
  grandTotalText: { fontSize: 16, fontWeight: "700", color: "#222" },
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
  makePaymentButtonText: { fontSize: 15, fontWeight: "600", color: "#FFF" },
});
