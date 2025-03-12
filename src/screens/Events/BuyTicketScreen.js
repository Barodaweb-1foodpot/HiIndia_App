import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { API_BASE_URL_UPLOADS } from "@env";
import { formatEventDateTime } from "../../helper/helper_Function";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchProfile } from "../../api/auth_api";

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
 * Displays the event image with a skeleton loader until fully loaded.
 */
const EventImage = ({ uri, style }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <View style={style}>
      {!loaded && <SkeletonLoader style={StyleSheet.absoluteFill} />}
      <Image
        source={
          uri && !error ? { uri } : require("../../../assets/placeholder.jpg")
        }
        style={[style, loaded ? {} : { opacity: 0 }]}
        resizeMode="cover"
        onLoadEnd={() => {
          setLoaded(true);
          console.log("Image loaded:", uri);
        }}
        onError={() => {
          setError(true);
          setLoaded(true);
          console.error("Error loading image:", uri);
        }}
      />
    </View>
  );
};

/**
 * BuyTicketScreen Component
 * Handles ticket purchasing logic: registrations, ticket types, coupons, order summary, etc.
 */
export default function BuyTicketScreen({ route }) {
  const navigation = useNavigation();
  const { eventDetail } = route.params || {};

  // State for the number of registrations
  const [numRegistrationsInput, setNumRegistrationsInput] = useState("1");
  const [hasClickedNext, setHasClickedNext] = useState(false);

  // Registrations array storing each participant's data
  const [registrations, setRegistrations] = useState([]);

  // State for copying details from the first registration to all others
  const [sameTicketInfo, setsameTicketInfo] = useState(false);

  // State for total cost calculations
  const [grandTotal, setGrandTotal] = useState(0);

  // Downloading states for PDF or other resources (not used here, but kept for reference)
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // State for coupon application
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Validation state
  const [showValidation, setShowValidation] = useState(false);

  // Modals
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [activeRegIndexTicket, setActiveRegIndexTicket] = useState(null);
  const [showCouponsModal, setShowCouponsModal] = useState(false);
  const [titleReadMore, setTitleReadMore] = useState(false);

  // State to hold the logged-in user's full name
  const [loggedInUserName, setLoggedInUserName] = useState("");

  /**
   * Fetch the user's profile on mount to get their name for the first registration
   */
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

  /**
   * Whenever registrations change, recalculate the total
   */
  useEffect(() => {
    calculateGrandTotal();
  }, [registrations]);

  /**
   * Step 1: user enters the number of registrations
   */
  const handleNext = () => {
    const count = parseInt(numRegistrationsInput, 10);
    if (!count || count < 1 || count > 10) {
      alert("Please enter a valid number (1–10).");
      return;
    }
    console.log("User clicked next with registration count:", count);
    // Initialize the registrations array
    const newRegs = Array.from({ length: count }, (_, index) => ({
      name: index === 0 ? loggedInUserName : "",
      age: "",
      TicketType: "",
      registrationCharge: 0,
    }));
    setRegistrations(newRegs);
    setHasClickedNext(true);
    Keyboard.dismiss();
  };

  /**
   * Add another registration
   * If sameTicketInfo is enabled, copy details from the first registration
   */
  const handleAddRegistration = () => {
    if (registrations.length >= 10) {
      return;
    }
    if (sameTicketInfo && registrations[0]) {
      const firstReg = registrations[0];
      const newReg = {
        ...firstReg,
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
    console.log("Added another registration. Total:", registrations.length + 1);
  };

  /**
   * Cancel a registration at a given index
   */
  const handleCancelRegistration = (index) => {
    console.log("Removing registration at index:", index);
    const newRegs = [...registrations];
    newRegs.splice(index, 1);
    setRegistrations(newRegs);

    // If a coupon was applied, check if we still meet min participant requirements
    if (appliedCoupon && newRegs.length < appliedCoupon.minParticipant) {
      console.log(
        "Removing coupon due to participant count dropping below requirement"
      );
      setAppliedCoupon(null);
      calculateGrandTotal(true);
    }
  };

  /**
   * When sameTicketInfo toggles, copy the first registration details to all others
   */
  useEffect(() => {
    if (sameTicketInfo && registrations.length > 1) {
      const firstReg = registrations[0];
      setRegistrations((prev) =>
        prev.map((reg, idx) => (idx === 0 ? reg : { ...firstReg }))
      );
      calculateGrandTotal();
    }
  }, [sameTicketInfo]);

  /**
   * Calculate total cost
   * If a coupon is applied, apply the discount
   */
  const calculateGrandTotal = (removeCoupon = false) => {
    const rawTotal = registrations.reduce(
      (acc, reg) => acc + (reg.registrationCharge || 0),
      0
    );
    let newTotal = rawTotal;
    if (!removeCoupon && appliedCoupon) {
      handleApplyCoupon(appliedCoupon, rawTotal);
    } else {
      setGrandTotal(newTotal);
    }
  };

  /**
   * Handle coupon application
   */
  const handleApplyCoupon = (coupon, rawTotal) => {
    if (!coupon) return;
    const discount = Math.min(
      (rawTotal * coupon.dicountPercentage) / 100,
      coupon.maxDiscountAmount
    );
    const discountedTotal = rawTotal - discount;
    setAppliedCoupon(coupon);
    setGrandTotal(discountedTotal);
    setShowCouponsModal(false);
  };

  /**
   * Remove the applied coupon
   */
  const handleRemoveCoupon = () => {
    console.log("Removing coupon:", appliedCoupon?.couponCode);
    setAppliedCoupon(null);
    calculateGrandTotal(true);
  };

  /**
   * Opens the ticket type modal for a specific registration index
   */
  const handleOpenTicketModal = (index) => {
    console.log("Opening ticket modal for registration index:", index);
    setActiveRegIndexTicket(index);
    setShowTicketModal(true);
  };

  /**
   * Select a ticket type for the active registration
   */
  const handleTicketTypeSelect = (type) => {
    console.log("Selected ticket type:", type.TicketTypeDetail?.TicketType);
    const newRegs = [...registrations];
    newRegs[activeRegIndexTicket].TicketType = type.TicketTypeDetail;
    newRegs[activeRegIndexTicket].registrationCharge = type.ratesForParticipant;
    setRegistrations(newRegs);
    setShowTicketModal(false);
    setActiveRegIndexTicket(null);
  };

  /**
   * Final check and proceed to PaymentScreen
   */
  const handleProceed = () => {
    let hasError = false;
    registrations.forEach((reg) => {
      if (!reg.name.trim() || !reg.age.toString().trim()) {
        hasError = true;
      }
      if (eventDetail.IsPaid && !reg.TicketType) {
        hasError = true;
      }
    });
    if (hasError) {
      console.log("Validation error. Missing fields in registrations.");
      setShowValidation(true);
      return;
    }
    console.log(
      "Proceeding to PaymentScreen with registrations:",
      registrations
    );
    navigation.navigate("PaymentScreen", {
      registrations,
      grandTotal,
      eventDetail,
      appliedCoupon,
    });
  };

  // Subtotal for order summary
  const subtotal = registrations.reduce(
    (acc, reg) => acc + (reg.registrationCharge || 0),
    0
  );
  // If coupon is applied, how much discount?
  const couponDiscount = appliedCoupon ? subtotal - grandTotal : 0;

  const toggleTitleReadMore = useCallback(() => {
    console.log("Toggling title read more state");
    setTitleReadMore((prev) => !prev);
  }, []);

  return (
    <View style={styles.rootContainer}>
      <StatusBar style="auto" />

      {/* 
        Top Section with Event Image 
        Using the same styling for back and share button as in EventsDetail
      */}
      <View style={styles.topSection}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            console.log("Navigating back");
            navigation.goBack();
          }}
        >
          <Ionicons name="chevron-back" size={20} color="#FFF" />
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity
          style={styles.shareTopButton}
          onPress={() => {
            console.log(
              "Sharing event from BuyTicketScreen:",
              eventDetail?.EventName
            );
            // Add your share logic if needed
          }}
        >
          <Ionicons name="share-social-outline" size={20} color="#FFF" />
        </TouchableOpacity>

        {/* Event Image with Skeleton Loader */}
        <EventImage
          uri={
            eventDetail?.EventImage
              ? `${API_BASE_URL_UPLOADS}/${eventDetail?.EventImage}`
              : null
          }
          style={styles.topImage}
        />

        {/* Floating Card with ONLY Event Name */}
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

      {/* White Container */}
      <View style={styles.whiteContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 
            Event Location and Date/Time 
            Moved from the top to the white container
          */}
          <View style={styles.eventInfoContainer}>
            {/* Location Row */}
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
            {/* Date/Time Row */}
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

          {/* Step 1: Number of Registrations */}
          {!hasClickedNext && (
            <View style={styles.registrationNumberSection}>
              <Text style={styles.sectionLabel}>Number of Registrations</Text>
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
            registrations.map((reg, index) => {
              const nameInvalid = showValidation && !reg.name.trim();
              const ageInvalid = showValidation && !reg.age.toString().trim();
              const ticketTypeInvalid =
                showValidation && eventDetail.IsPaid && !reg.TicketType;

              return (
                <View key={index} style={styles.registrationCard}>
                  <View style={styles.registrationHeader}>
                    <Text style={styles.registrationTitle}>
                      Registration #{index + 1}
                    </Text>
                    {/* Cancel button for additional registrations */}
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

                  {/* Name Input */}
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
                        onChangeText={(val) =>
                          setRegistrations((prev) =>
                            prev.map((item, i) =>
                              i === index ? { ...item, name: val } : item
                            )
                          )
                        }
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
                        onChangeText={(val) =>
                          setRegistrations((prev) =>
                            prev.map((item, i) =>
                              i === index ? { ...item, age: val } : item
                            )
                          )
                        }
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
                        onPress={() => handleOpenTicketModal(index)}
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
                                !reg.TicketType && styles.placeholderText,
                              ]}
                            >
                              {reg.TicketType
                                ? reg.TicketType.TicketType
                                : "Select a ticket type"}
                            </Text>
                            {reg.TicketType && (
                              <Text style={styles.ticketPrice}>
                                {eventDetail?.countryDetail?.[0]?.Currency}{" "}
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

          {/* Add Another Registration Button (if < 10) */}
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
                      <Ionicons name="ticket" size={20} color="#FFFFFF" />
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
                    <Ionicons name="close-circle" size={20} color="#FFFFFF" />
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
                        name="ticket-outline"
                        size={18}
                        color="#FFFFFF"
                      />
                    </View>
                    <Text style={styles.viewCouponsText}>
                      View Available Coupons
                    </Text>
                  </View>
                  <View style={styles.arrowContainer}>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#FFFFFF"
                    />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Order Summary Section */}
          {hasClickedNext && registrations.length > 0 && (
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              <View style={styles.summaryCard}>
                {/* Show each ticket with its cost */}
                {registrations.map((reg, index) => (
                  <View key={index} style={styles.summaryItem}>
                    <Text style={styles.summaryText}>
                      Ticket #{index + 1}:{" "}
                      {reg?.TicketType?.TicketType || "No ticket selected"}
                    </Text>
                    <Text style={styles.summaryPrice}>
                      {eventDetail?.countryDetail?.[0]?.Currency}{" "}
                      {reg.registrationCharge || 0}
                    </Text>
                  </View>
                ))}

                {/* Subtotal */}
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryText}>Subtotal</Text>
                  <Text style={styles.summaryPrice}>
                    {eventDetail?.countryDetail?.[0]?.Currency} {subtotal}
                  </Text>
                </View>

                {/* Coupon Discount */}
                {appliedCoupon && (
                  <View style={styles.summaryDiscountContainer}>
                    <Text style={styles.discountLabel}>
                      Discount ({appliedCoupon.couponCode})
                    </Text>
                    <Text style={styles.discountAmount}>
                      -
                      {eventDetail?.countryDetail?.[0]?.Currency}{" "}
                      {Math.abs(couponDiscount).toFixed(2)}
                    </Text>
                  </View>
                )}

                {/* Grand Total */}
                <View style={styles.totalRow}>
                  <Text style={styles.totalText}>Total Amount</Text>
                  <Text style={styles.totalPrice}>
                    {eventDetail?.countryDetail?.[0]?.Currency} {grandTotal}
                  </Text>
                </View>
              </View>

              {/* 
                NEW placement of the "Proceed to Payment" button and 
                Grand Total section, now directly below the order summary
              */}
              <View style={styles.proceedContainer}>
                <View style={styles.proceedTotalSection}>
                  <Text style={styles.totalLabel}>Grand Total</Text>
                  <Text style={styles.grandTotalText}>
                    {eventDetail?.countryDetail?.[0]?.Currency} {grandTotal}
                  </Text>
                </View>
                <TouchableOpacity style={styles.proceedButton} onPress={handleProceed}>
                  <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
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

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Ticket Modal */}
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
                {eventDetail?.IsPaid &&
                  eventDetail?.eventRates?.map((item, idx) => (
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
                            {eventDetail?.countryDetail?.[0]?.Currency}{" "}
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
                  // Check if coupon is valid based on participant count
                  const isCouponAvailable =
                    registrations.length >= coupon.minParticipant;
                  return (
                    <View key={coupon.couponCode} style={styles.couponCard}>
                      <View style={styles.couponContent}>
                        <View style={styles.couponHeader}>
                          <View style={styles.couponBadge}>
                            <Ionicons name="ticket" size={20} color="#FFF" />
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
                            Get discount up to{" "}
                            {eventDetail?.countryDetail?.[0]?.Currency}{" "}
                            {coupon.maxDiscountAmount}
                          </Text>
                          {coupon.minParticipant > 1 && (
                            <Text style={styles.couponRequirement}>
                              Requires minimum {coupon.minParticipant}{" "}
                              participants
                            </Text>
                          )}
                        </View>
                      </View>
                      {isCouponAvailable ? (
                        <TouchableOpacity
                          style={styles.couponApplyButton}
                          onPress={() => {
                            console.log("Applying coupon:", coupon.couponCode);
                            handleApplyCoupon(coupon, subtotal);
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  // Top Section with Event Image
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
  shareTopButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 25,
    right: 16,
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
  // Floating Card
  headerCard: {
    position: "absolute",
    bottom: 15,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 10,
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
    fontFamily: "Poppins-Bold",
    color: "#000000",
  },
  readMoreText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#E3000F",
    marginTop: 4,
  },
  // White container
  whiteContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginTop: -65,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 40,
  },
  // Event Info (location + date/time)
  eventInfoContainer: {
    marginBottom: 24,
  },
  eventInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  eventInfoIcon: {
    marginRight: 6,
  },
  eventInfoText: {
    fontSize: 14,
    color: "#666666",
  },
  // Number of Registrations
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
  // Registration Card
  registrationCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: Platform.OS === "android" ? 0 : 6,
  },
  registrationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
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
  // Coupons Section
  couponsSection: {
    marginBottom: 24,
  },
  viewCouponsButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 0,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#E3000F",
    shadowColor: "#E3000F",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  viewCouponsContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  couponIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  viewCouponsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  arrowContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  appliedCouponContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 0,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#FF3B4E",
    shadowColor: "rgba(227, 0, 15, 0.4)",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
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
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  appliedCouponDiscount: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
    letterSpacing: 0.1,
  },
  removeCouponButton: {
    padding: 6,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  // Order Summary
  summarySection: {
    marginBottom: 32,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  summaryCard: {
    borderWidth: 0,
    borderRadius: 20,
    padding: 24,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: Platform.OS === "android" ? 1 : 6,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 15,
    color: "#555555",
    letterSpacing: 0.1,
  },
  summaryPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
  },
  summaryDiscountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(40, 167, 69, 0.08)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#28A745",
  },
  discountLabel: {
    fontSize: 15,
    color: "#28A745",
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  discountAmount: {
    fontSize: 15,
    color: "#28A745",
    fontWeight: "700",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    alignItems: "center",
  },
  totalText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222222",
    letterSpacing: 0.2,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: "#E3000F",
    letterSpacing: 0.3,
  },

  // New container for "Proceed to Payment" below summary
  proceedContainer: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E9ECEF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  proceedTotalSection: {
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
    marginTop: 2,
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

  // Modal Overlays
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
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
  // Coupon Modal
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
  discountText: {
    fontSize: 14,
    color: "#E3000F",
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
