import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  TextInput,
  Platform,
  Modal,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { API_BASE_URL_UPLOADS } from "@env";
import { formatEventDateTime } from "../../helper/helper_Function";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchProfile } from "../../api/auth_api";

const { width } = Dimensions.get("window");

/**
 * SkeletonLoader Component
 * Displays a shimmering effect while an image is loading.
 */
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
  }, []);

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

/**
 * EventImage Component
 * Displays the event image with a skeleton loader until the image is fully loaded.
 */
const EventImage = ({ uri, style }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <View style={style}>
      {!loaded && <SkeletonLoader style={StyleSheet.absoluteFill} />}
      <Image
        source={uri && !error ? { uri } : require("../../../assets/placeholder.jpg")}
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

/**
 * BuyTicketScreen Component
 * Main screen for ticket purchase which handles registrations, ticket type selection, coupon application,
 * order summary, and proceeding to payment.
 */
export default function BuyTicketScreen({ route }) {
  const { eventDetail } = route.params || {};
  const navigation = useNavigation();
  const [grandTotal, setGrandTotal] = useState(0);
  const [sameTicketInfo, setsameTicketInfo] = useState(false);
  const [numRegistrationsInput, setNumRegistrationsInput] = useState("1");
  const [hasClickedNext, setHasClickedNext] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [activeRegIndexDOB, setActiveRegIndexDOB] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [activeRegIndexTicket, setActiveRegIndexTicket] = useState(null);
  const [showCouponsModal, setShowCouponsModal] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [showValidation, setShowValidation] = useState(false);

  // State to hold the logged in user's full name
  const [loggedInUserName, setLoggedInUserName] = useState("");

  // Fetch logged in user's profile on mount
  useEffect(() => {
    const getProfile = async () => {
      try {
        const userId = await AsyncStorage.getItem("role");
        if (userId) {
          const res = await fetchProfile(userId);
          if (res && res.firstName && res.lastName) {
            setLoggedInUserName(`${res.firstName} ${res.lastName}`);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    getProfile();
  }, []);

  // Update the grand total whenever the registrations change
  useEffect(() => {
    calculateGrandTotal();
  }, [registrations]);

  /**
   * Helper function to calculate age from a given date.
   */
  const calculateAgeFromDate = (date) => {
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    return age;
  };

  /**
   * Handle proceeding after entering number of registrations.
   * Validates the number and initializes the registrations state.
   */
  const handleNext = () => {
    const count = parseInt(numRegistrationsInput, 10);
    if (!count || count < 1 || count > 10) {
      alert("Please enter a valid number (1–10).");
      return;
    }
    const newRegs = Array.from({ length: count }, (_, index) => ({
      name: index === 0 ? loggedInUserName : "",
      age: "",
      TicketType: "",
      registrationCharge: 0,
      copyDetails: false,
    }));
    setRegistrations(newRegs);
    setHasClickedNext(true);
  };

  /**
   * Adds a new registration.
   * If sameTicketInfo is enabled, copies the details from the first registration.
   */
  const handleAddRegistration = () => {
    const lastReg = registrations[registrations.length - 1];
    if (sameTicketInfo === true) {
      let newReg = {
        ...lastReg,
        name: registrations[0]?.name,
        age: registrations[0]?.age,
        TicketType: registrations[0]?.TicketType,
        registrationCharge: Number(registrations[0].registrationCharge) || 0,
      };
      setRegistrations((prev) => [...prev, newReg]);
    } else {
      let newReg = {
        name: "",
        age: "",
        TicketType: "",
        registrationCharge: 0,
      };
      setRegistrations((prev) => [...prev, newReg]);
    }
  };

  /**
   * Removes a registration at a given index.
   * Also removes applied coupon if minimum participant requirement is no longer met.
   */
  const handleCancelRegistration = (index) => {
    const newRegs = [...registrations];
    newRegs.splice(index, 1);
    setRegistrations(newRegs);
    if (appliedCoupon && newRegs.length < appliedCoupon.minParticipant) {
      setAppliedCoupon(null);
      calculateGrandTotal(true);
    }
  };

  /**
   * Opens the date picker modal for the selected registration.
   */
  const showDatePicker = (regIndex) => {
    setActiveRegIndexDOB(regIndex);
    setDatePickerVisible(true);
  };

  /**
   * Hides the date picker modal.
   */
  const hideDatePicker = () => {
    setDatePickerVisible(false);
    setActiveRegIndexDOB(null);
  };

  /**
   * Handles the confirmation of the selected date of birth.
   * Updates the corresponding registration with formatted DOB and calculated age.
   */
  const handleConfirmDOB = (date) => {
    const newRegs = [...registrations];
    newRegs[activeRegIndexDOB].dateOfBirth = date;

    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    newRegs[activeRegIndexDOB].dobString = `${dd}/${mm}/${yyyy}`;

    newRegs[activeRegIndexDOB].age = calculateAgeFromDate(date);
    setRegistrations(newRegs);
    hideDatePicker();
  };

  /**
   * Handles the ticket type selection.
   * Updates the registration with the selected ticket details.
   */
  const handleTicketTypeSelect = (type) => {
    const newRegs = [...registrations];
    newRegs[activeRegIndexTicket].TicketType = type.TicketTypeDetail;
    newRegs[activeRegIndexTicket].registrationCharge = type.ratesForParticipant;

    setRegistrations(newRegs);
    setShowTicketModal(false);
    setActiveRegIndexTicket(null);
  };

  /**
   * When sameTicketInfo is toggled, copies the details from the first registration to all others.
   */
  useEffect(() => {
    if (sameTicketInfo) {
      setRegistrations((prevParticipants) => {
        const firstParticipantName = prevParticipants[0]?.name;
        const firstParticipantTicketType = prevParticipants[0]?.TicketType;
        const firstAge = prevParticipants[0]?.age;
        return prevParticipants.map((registration, index) => {
          if (index === 0) return registration;
          return {
            ...registration,
            age: firstAge,
            registrationCharge: Number(prevParticipants[0].registrationCharge) || 0,
            TicketType: firstParticipantTicketType,
            name: firstParticipantName,
          };
        });
      });
      calculateGrandTotal();
    }
  }, [sameTicketInfo]);

  /**
   * Applies a coupon to the order.
   * Calculates the discount and updates the grand total.
   */
  const handleApplyCoupon = async (coupon, grandTotal) => {
    const discount = Math.min(
      (grandTotal * coupon.dicountPercentage) / 100,
      coupon.maxDiscountAmount
    );
    const newTotal = grandTotal - discount;
    setAppliedCoupon(coupon);
    setGrandTotal(newTotal);
    setShowCouponsModal(false);
  };

  /**
   * Removes the applied coupon and recalculates the grand total.
   */
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    calculateGrandTotal(true);
  };

  /**
   * Calculates the grand total based on all registration charges.
   * If a coupon is applied, it recalculates the discount.
   */
  let finalTotal = 0;
  const calculateGrandTotal = (code) => {
    const rawTotal = registrations.reduce(
      (acc, reg) => acc + reg.registrationCharge,
      0
    );
    finalTotal = rawTotal;
    setGrandTotal(finalTotal);
    if (!code || code === undefined) {
      if (appliedCoupon) {
        handleApplyCoupon(appliedCoupon, finalTotal);
      }
    }
  };

  /**
   * Validates the registration details and proceeds to the payment screen.
   */
  const handleProceed = () => {
    let hasError = false;
    registrations.forEach((reg) => {
      if (!reg.name.trim() || !reg.age.toString().trim()) {
        hasError = true;
      }
    });
    if (hasError) {
      setShowValidation(true);
      return;
    }
    const serializedRegistrations = registrations.map((reg) => ({
      ...reg,
      dateOfBirth: reg.dateOfBirth ? reg.dateOfBirth.toISOString() : null,
    }));
    navigation.navigate("PaymentScreen", {
      registrations: serializedRegistrations,
      grandTotal,
      eventDetail,
      appliedCoupon,
    });
  };

  // Calculate subtotal and coupon discount for the order summary
  const subtotal = registrations.reduce(
    (acc, reg) => acc + reg.registrationCharge,
    0
  );
  const couponDiscount = appliedCoupon ? subtotal - grandTotal : 0;

  return (
    <View style={styles.rootContainer}>
      <StatusBar style="auto" />

      {/* TOP SECTION with event image and back button */}
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
              : null
          }
          style={styles.topImage}
        />
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.7)"]}
          style={styles.imageGradient}
        />
      </View>

      {/* WHITE SECTION with registration details */}
      <View style={styles.whiteContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Event Details */}
          <View style={styles.eventDetails}>
            <Text style={styles.eventName}>
              {eventDetail?.EventName || "Event Name Unavailable"}
            </Text>
            <View style={styles.eventInfoRow}>
              <Ionicons
                name="location-outline"
                size={16}
                color="#666666"
                style={styles.eventInfoIcon}
              />
              <Text style={styles.eventInfoText}>
                {eventDetail?.EventLocation || "Location Unavailable"}
              </Text>
            </View>
            <View style={styles.eventInfoRow}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color="#666666"
                style={styles.eventInfoIcon}
              />
              <Text style={styles.eventInfoText}>
                {formatEventDateTime(
                  eventDetail?.StartDate,
                  eventDetail?.EndDate
                ) || "Date/Time not available"}
              </Text>
            </View>
          </View>

          {/* Number of Registrations Input */}
          {!hasClickedNext && (
            <View style={styles.registrationNumberSection}>
              <Text style={styles.sectionLabel}>Number of Registration</Text>
              <View style={styles.numberRegContainer}>
                <TextInput
                  style={styles.numberRegInput}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={numRegistrationsInput}
                  onChangeText={setNumRegistrationsInput}
                  placeholder="Enter number (1-10)"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={handleNext}
                >
                  <Text style={styles.generateButtonText}>Next</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="#FFF"
                    style={{ marginLeft: 8 }}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Registration Cards */}
          {hasClickedNext &&
            registrations?.map((reg, index) => {
              const nameInvalid = showValidation && !reg.name.trim();
              const ageInvalid = showValidation && !reg.age.toString().trim();
              const ticketTypeInvalid = showValidation && !reg.TicketType;

              return (
                <View key={index} style={styles.registrationCard}>
                  <View style={styles.registrationHeader}>
                    <View style={styles.registrationTitleContainer}>
                      <Text style={styles.registrationTitle}>
                        Registration #{index + 1}
                      </Text>
                    </View>
                    {registrations.length > 1 && (
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => handleCancelRegistration(index)}
                      >
                        <Ionicons
                          name="close-circle"
                          size={24}
                          color="#E3000F"
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Full Name Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <View
                      style={[
                        styles.boxInputContainer,
                        nameInvalid && styles.inputError,
                      ]}
                    >
                      <Ionicons name="person-outline" size={20} color="#666" />
                      <TextInput
                        style={styles.boxInput}
                        placeholder="Enter your full name"
                        placeholderTextColor="#999"
                        value={reg.name}
                        onChangeText={(val) => {
                          setRegistrations((prevRegistrations) =>
                            prevRegistrations.map((item, i) =>
                              i === index ? { ...item, name: val } : item
                            )
                          );
                        }}
                      />
                    </View>
                    {nameInvalid && (
                      <Text style={styles.errorText}>
                        Please enter your name
                      </Text>
                    )}
                  </View>

                  {/* Age Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Age</Text>
                    <View
                      style={[
                        styles.boxInputContainer,
                        ageInvalid && styles.inputError,
                      ]}
                    >
                      <Ionicons
                        name="hourglass-outline"
                        size={20}
                        color="#666"
                      />
                      <TextInput
                        style={styles.boxInput}
                        placeholder="Enter your age"
                        placeholderTextColor="#999"
                        value={reg.age}
                        onChangeText={(val) => {
                          setRegistrations((prevRegistrations) =>
                            prevRegistrations.map((item, i) =>
                              i === index ? { ...item, age: val } : item
                            )
                          );
                        }}
                        keyboardType="number-pad"
                      />
                    </View>
                    {ageInvalid && (
                      <Text style={styles.errorText}>
                        Please enter your age
                      </Text>
                    )}
                  </View>

                  {/* Ticket Selection if Event is Paid */}
                  {eventDetail.IsPaid && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Select Ticket Type</Text>
                      <TouchableOpacity
                        style={[
                          styles.dropdownContainer,
                          ticketTypeInvalid && styles.inputError,
                        ]}
                        onPress={() => {
                          setActiveRegIndexTicket(index);
                          setShowTicketModal(true);
                        }}
                      >
                        <View style={styles.ticketOption}>
                          <View style={styles.ticketIconContainer}>
                            <Ionicons
                              name="ticket-outline"
                              size={20}
                              color="#E3000F"
                            />
                          </View>
                          <View style={styles.ticketContent}>
                            <Text
                              style={[
                                styles.ticketLabel,
                                !reg?.TicketType?.TicketType &&
                                  styles.placeholderText,
                              ]}
                            >
                              {reg?.TicketType?.TicketType
                                ? reg.TicketType.TicketType
                                : "Select a ticket type"}
                            </Text>
                            {reg?.TicketType?.TicketType && (
                              <Text style={styles.ticketPrice}>
                                {eventDetail.countryDetail[0]?.Currency}{" "}
                                {reg.registrationCharge}
                              </Text>
                            )}
                          </View>
                        </View>
                        <Ionicons name="chevron-down" size={22} color="#666" />
                      </TouchableOpacity>
                      {ticketTypeInvalid && (
                        <Text style={styles.errorText}>
                          Please select a ticket type
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Option to Copy Details for Other Registrations */}
                  {index === 0 && registrations.length > 1 && (
                    <TouchableOpacity
                      style={styles.copyDetailsButton}
                      onPress={() => setsameTicketInfo(!sameTicketInfo)}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          sameTicketInfo && styles.checkboxChecked,
                        ]}
                      >
                        {sameTicketInfo && (
                          <Ionicons name="checkmark" size={16} color="#FFF" />
                        )}
                      </View>
                      <Text style={styles.copyDetailsText}>
                        Copy these details for other tickets
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

          {/* Button to add another registration (max 10) */}
          {hasClickedNext && registrations.length < 10 && (
            <TouchableOpacity
              style={styles.addRegistrationButton}
              onPress={handleAddRegistration}
            >
              <Ionicons name="add-circle-outline" size={24} color="#E3000F" />
              <Text style={styles.addRegistrationButtonText}>
                Add Another Registration
              </Text>
            </TouchableOpacity>
          )}

          {/* Coupons Section */}
          {eventDetail?.couponCode?.length > 0 && hasClickedNext && (
            <View style={styles.couponsSection}>
              <Text style={styles.sectionLabel}>Discount Coupon</Text>
              {appliedCoupon ? (
                <View style={styles.appliedCouponContainer}>
                  <View style={styles.appliedCouponInfo}>
                    <View style={styles.couponIconContainer}>
                      <Ionicons name="pricetag" size={24} color="#28A745" />
                    </View>
                    <View style={styles.appliedCouponTexts}>
                      <Text style={styles.appliedCouponTitle}>
                        {appliedCoupon.couponCode}
                      </Text>
                      <Text style={styles.appliedCouponDiscount}>
                        {appliedCoupon.dicountPercentage}% off (max{" "}
                        {eventDetail.countryDetail[0]?.Currency}{" "}
                        {appliedCoupon.maxDiscountAmount})
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.removeCouponButton}
                    onPress={handleRemoveCoupon}
                  >
                    <Ionicons name="close-circle" size={24} color="#E3000F" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.viewCouponsButton}
                  onPress={() => setShowCouponsModal(true)}
                >
                  <View style={styles.viewCouponsContent}>
                    <View style={styles.couponIconContainer}>
                      <Ionicons
                        name="pricetags-outline"
                        size={22}
                        color="#E3000F"
                      />
                    </View>
                    <Text style={styles.viewCouponsText}>
                      View Available Coupons
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Order Summary Section */}
          {hasClickedNext && registrations.length > 0 && (
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              <View style={styles.summaryCard}>
                {registrations.map((reg, index) => (
                  <View key={index} style={styles.summaryItem}>
                    <Text style={styles.summaryText}>
                      Ticket #{index + 1}:{" "}
                      {reg?.TicketType?.TicketType || "No ticket selected"}
                    </Text>
                    <Text style={styles.summaryPrice}>
                      {eventDetail.countryDetail[0]?.Currency}{" "}
                      {reg.registrationCharge || 0}
                    </Text>
                  </View>
                ))}
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryText}>Subtotal</Text>
                  <Text style={styles.summaryPrice}>
                    {eventDetail.countryDetail[0]?.Currency} {subtotal}
                  </Text>
                </View>
                {appliedCoupon && (
                  <View style={styles.summaryDiscountContainer}>
                    <Text style={styles.discountText}>
                      Discount ({appliedCoupon.couponCode})
                    </Text>
                    <Text style={styles.discountPrice}>
                      - {eventDetail.countryDetail[0]?.Currency}{" "}
                      {Math.abs(couponDiscount).toFixed(2)}
                    </Text>
                  </View>
                )}
                <View style={styles.totalRow}>
                  <Text style={styles.totalText}>Total Amount</Text>
                  <Text style={styles.totalPrice}>
                    {eventDetail.countryDetail[0]?.Currency} {grandTotal}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom Bar with Grand Total and Proceed to Payment */}
        {hasClickedNext && (
          <View style={styles.bottomBar}>
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalText}>
                {eventDetail.countryDetail[0]?.Currency} {grandTotal}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.proceedButton}
              onPress={handleProceed}
            >
              <Text style={styles.proceedButtonText}>
                Proceed to Payment
              </Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color="#FFF"
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Ticket Type Modal */}
        <Modal visible={showTicketModal} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowTicketModal(false)}
          >
            <View
              style={styles.ticketModalContainer}
              onStartShouldSetResponder={() => true}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Ticket Type</Text>
                <TouchableOpacity
                  onPress={() => setShowTicketModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.ticketTypesList}>
                {eventDetail.IsPaid &&
                  eventDetail.eventRates?.map((item, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.ticketTypeOption}
                      onPress={() => handleTicketTypeSelect(item)}
                    >
                      <View style={styles.ticketTypeContent}>
                        <View style={styles.ticketDetailsContainer}>
                          <Text style={styles.ticketTypeTitle}>
                            {item.TicketTypeDetail.TicketType}
                          </Text>
                          <Text style={styles.ticketTypeDescription}>
                            {item.TicketTypeDetail.Description ||
                              "Standard admission ticket"}
                          </Text>
                        </View>
                        <View style={styles.ticketPriceContainer}>
                          <Text style={styles.ticketTypePrice}>
                            {eventDetail.countryDetail[0]?.Currency}{" "}
                            {item.ratesForParticipant}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Coupons Modal */}
        <Modal visible={showCouponsModal} transparent animationType="fade">
          <View style={styles.couponModalOverlay}>
            <View style={styles.couponModalContainer}>
              <View style={styles.couponModalHeader}>
                <Text style={styles.couponModalTitle}>Available Coupons</Text>
                <TouchableOpacity
                  onPress={() => setShowCouponsModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {eventDetail?.couponCode?.map((coupon) => {
                  const isCouponAvailable =
                    coupon && registrations.length >= coupon?.minParticipant;
                  return (
                    <View key={coupon.couponCode} style={styles.couponCard}>
                      <View style={styles.couponContent}>
                        <View style={styles.couponHeader}>
                          <View style={styles.couponBadge}>
                            <Ionicons name="pricetag" size={20} color="#FFF" />
                          </View>
                          <View style={styles.couponDetails}>
                            <Text style={styles.couponCode}>
                              {coupon.couponCode}
                            </Text>
                            <View style={styles.discountBadge}>
                              <Text style={styles.discountText}>
                                {coupon.dicountPercentage}% OFF
                              </Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.couponInfo}>
                          <Text style={styles.couponDescription}>
                            Get discount up to {eventDetail.countryDetail[0]?.Currency}{" "}
                            {coupon.maxDiscountAmount}
                          </Text>
                          {coupon.minParticipant > 1 && (
                            <Text style={styles.couponRequirement}>
                              Requires minimum {coupon.minParticipant} participants
                            </Text>
                          )}
                        </View>
                      </View>
                      {isCouponAvailable ? (
                        <TouchableOpacity
                          style={styles.couponApplyButton}
                          onPress={() => {
                            handleApplyCoupon(coupon, grandTotal);
                          }}
                        >
                          <Text style={styles.couponApplyText}>Apply</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.couponUnavailableOverlay}>
                          <Text style={styles.couponUnavailableText}>
                            Not Available
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Date Picker Modal */}
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirmDOB}
          onCancel={hideDatePicker}
          maximumDate={new Date()}
          textColor="#000"
        />
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
  imageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginTop: -50,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  eventDetails: {
    marginBottom: 24,
  },
  eventName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 12,
  },
  eventInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  eventInfoIcon: {
    marginRight: 8,
  },
  eventInfoText: {
    fontSize: 14,
    color: "#666666",
  },
  registrationNumberSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
  },
  numberRegContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  numberRegInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    backgroundColor: "#E3000F",
    borderRadius: 24,
    paddingHorizontal: 14,
    marginLeft: 10,
    shadowColor: "#E3000F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  registrationCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  registrationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  registrationTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  registrationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },
  cancelButton: {
    padding: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
    marginBottom: 8,
  },
  boxInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
    backgroundColor: "#F8F9FA",
  },
  boxInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#333333",
  },
  inputError: {
    borderColor: "#E3000F",
  },
  errorText: {
    color: "#E3000F",
    fontSize: 12,
    marginTop: 4,
  },
  dropdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  ticketOption: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  ticketIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(227, 0, 15, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  ticketContent: {
    flex: 1,
  },
  ticketLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333333",
  },
  placeholderText: {
    color: "#999999",
  },
  ticketPrice: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
  },
  copyDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#DDDDDD",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#E3000F",
    borderColor: "#E3000F",
  },
  copyDetailsText: {
    fontSize: 14,
    color: "#333333",
  },
  addRegistrationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E3000F",
    marginBottom: 24,
  },
  addRegistrationButtonText: {
    color: "#E3000F",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
  couponsSection: {
    marginBottom: 24,
  },
  viewCouponsButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  viewCouponsContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  couponIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(227, 0, 15, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  viewCouponsText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333333",
  },
  appliedCouponContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#28A745",
    borderRadius: 8,
    padding: 16,
    backgroundColor: "rgba(40, 167, 69, 0.05)",
  },
  appliedCouponInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  appliedCouponTexts: {
    marginLeft: 12,
  },
  appliedCouponTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#28A745",
  },
  appliedCouponDiscount: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
  },
  removeCouponButton: {
    padding: 4,
  },
  summarySection: {
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: "#EEEEEE",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: "#666666",
  },
  summaryPrice: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 12,
  },
  summaryDiscountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(40, 167, 69, 0.1)",
    padding: 8,
    borderRadius: 8,
    marginVertical: 8,
  },
  discountText: {
    fontSize: 14,
    color: "#28A745",
    fontWeight: "600",
  },
  discountPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#28A745",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  totalText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  totalPrice: {
    fontSize: 16,
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
  totalLabel: {
    fontSize: 14,
    color: "#666666",
  },
  grandTotalText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },
  proceedButton: {
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
  proceedButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  ticketModalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  modalCloseButton: {
    padding: 4,
  },
  ticketTypesList: {
    maxHeight: 300,
  },
  ticketTypeOption: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  ticketTypeContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketDetailsContainer: {
    flex: 1,
    marginRight: 12,
  },
  ticketTypeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  ticketTypeDescription: {
    fontSize: 14,
    color: "#666666",
  },
  ticketPriceContainer: {
    alignItems: "flex-end",
  },
  ticketTypePrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#E3000F",
  },
  couponModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  couponModalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    maxHeight: "70%",
  },
  couponModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  couponModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  couponCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  couponContent: {
    marginBottom: 8,
  },
  couponHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  couponBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E3000F",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  couponDetails: {
    flex: 1,
  },
  couponCode: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  discountBadge: {
    backgroundColor: "rgba(227, 0, 15, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  couponInfo: {
    marginBottom: 8,
  },
  couponDescription: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },
  couponRequirement: {
    fontSize: 13,
    color: "#E3000F",
  },
  couponApplyButton: {
    backgroundColor: "#E3000F",
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  couponApplyText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  couponUnavailableOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  couponUnavailableText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
