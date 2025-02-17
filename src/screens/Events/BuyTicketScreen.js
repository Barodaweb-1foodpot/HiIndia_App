import React, { useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const { width } = Dimensions.get("window");

const ticketData = {
  "Gold- $299": 299,
  "Silver- $199": 199,
  "Platinum- $499": 499,
};

const couponsList = [
  {
    code: "FESTIVE10",
    discount: 10,
    minSpend: 500,
  },
  {
    code: "MEGA50",
    discount: 50,
    minSpend: 2000,
  },
  {
    code: "SUMMER20",
    discount: 20,
    minSpend: 700,
  },
  {
    code: "SUPER30",
    discount: 30,
    minSpend: 1000,
  },
  {
    code: "BONUS25",
    discount: 25,
    minSpend: 1500,
  },
];

const calculateAgeFromDate = (dobDate) => {
  if (!dobDate) return "";
  const today = new Date();
  let age = today.getFullYear() - dobDate.getFullYear();
  const m = today.getMonth() - dobDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
    age--;
  }
  return String(age);
};

export default function BuyTicketScreen() {
  const navigation = useNavigation();

  const [numRegistrationsInput, setNumRegistrationsInput] = useState("1");
  const [hasClickedNext, setHasClickedNext] = useState(false);

  const [registrations, setRegistrations] = useState([]);

  const [showMore, setShowMore] = useState(false);

  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [activeRegIndexDOB, setActiveRegIndexDOB] = useState(null);

  const [showTicketModal, setShowTicketModal] = useState(false);
  const [activeRegIndexTicket, setActiveRegIndexTicket] = useState(null);

  const [showCouponsModal, setShowCouponsModal] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const [showValidation, setShowValidation] = useState(false);

  const handleNext = () => {
    const count = parseInt(numRegistrationsInput, 10);
    if (!count || count < 1 || count > 10) {
      alert("Please enter a valid number (1–10).");
      return;
    }

    const newRegs = Array.from({ length: count }, () => ({
      name: "",
      dob: null,
      dobString: "",
      age: "",
      ticketType: "Gold- $299",
      ticketPrice: ticketData["Gold- $299"],
      copyDetails: false,
    }));
    setRegistrations(newRegs);
    setHasClickedNext(true);
  };

  const handleAddRegistration = () => {
    const lastReg = registrations[registrations.length - 1];
    let newReg = {
      name: "",
      dob: null,
      dobString: "",
      age: "",
      ticketType: "Gold- $299",
      ticketPrice: ticketData["Gold- $299"],
      copyDetails: false,
    };

    if (lastReg.copyDetails) {
      newReg = {
        ...newReg,
        name: lastReg.name,
        dob: lastReg.dob,
        dobString: lastReg.dobString,
        age: lastReg.age,
      };
    }

    setRegistrations((prev) => [...prev, newReg]);
  };

  const handleCancelRegistration = (index) => {
    const newRegs = [...registrations];
    newRegs.splice(index, 1);
    setRegistrations(newRegs);
  };

  const showDatePicker = (regIndex) => {
    setActiveRegIndexDOB(regIndex);
    setDatePickerVisible(true);
  };
  const hideDatePicker = () => {
    setDatePickerVisible(false);
    setActiveRegIndexDOB(null);
  };
  const handleConfirmDOB = (date) => {
    const newRegs = [...registrations];
    newRegs[activeRegIndexDOB].dob = date;

    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    newRegs[activeRegIndexDOB].dobString = `${dd}/${mm}/${yyyy}`;

    newRegs[activeRegIndexDOB].age = calculateAgeFromDate(date);
    setRegistrations(newRegs);
    hideDatePicker();
  };

  const handleTicketTypeSelect = (type) => {
    const newRegs = [...registrations];
    newRegs[activeRegIndexTicket].ticketType = type;
    newRegs[activeRegIndexTicket].ticketPrice = ticketData[type];
    setRegistrations(newRegs);
    setShowTicketModal(false);
    setActiveRegIndexTicket(null);
  };

  const toggleCopyDetails = (index) => {
    const newRegs = [...registrations];
    newRegs[index].copyDetails = !newRegs[index].copyDetails;
    setRegistrations(newRegs);
  };

  const handleApplyCoupon = (coupon) => {
    setAppliedCoupon(coupon);
    setShowCouponsModal(false);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };

  const rawTotal = registrations.reduce((acc, reg) => acc + reg.ticketPrice, 0);
  let finalTotal = rawTotal;
  let couponMessage = "";
  if (appliedCoupon) {
    if (rawTotal >= appliedCoupon.minSpend) {
      const discountAmount = (rawTotal * appliedCoupon.discount) / 100;
      finalTotal = rawTotal - discountAmount;
      couponMessage = `Coupon Applied Successfully: ${appliedCoupon.code}`;
    } else {
      couponMessage = `Min spend $${appliedCoupon.minSpend} not met.`;
    }
  }

  const handleProceed = () => {
    let hasError = false;
    registrations.forEach((reg) => {
      if (!reg.name.trim() || !reg.dobString.trim()) {
        hasError = true;
      }
    });

    if (hasError) {
      setShowValidation(true);
      return;
    }

    navigation.navigate("PaymentScreen", {
      registrations,
      finalTotal,
    });
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" />

      {/* TOP SECTION */}
      <View style={styles.topSection}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("EventsDetail")}
        >
          <Ionicons name="chevron-back" size={20} color="#FFF" />
        </TouchableOpacity>

        {/* Main Image */}
        <Image
          source={require("../../../assets/Atul_bhai.png")}
          style={styles.topImage}
          resizeMode="cover"
        />

        {/* Bridging Card */}
        <View style={styles.headerCard}>
          <Text style={styles.headerCardTitle}>
            Register for Atul Purohit Graba
          </Text>
          <View style={styles.headerCardRow}>
            <Ionicons
              name="location-outline"
              size={16}
              color="#666666"
              style={styles.headerCardIcon}
            />
            <Text style={styles.headerCardSubtitle}>
              Gelora Bung Karno Stadium, Ahmedabad
            </Text>
          </View>
          <View style={styles.headerCardRow}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color="#666666"
              style={styles.headerCardIcon}
            />
            <Text style={styles.headerCardSubtitle}>
              August 30 - September 2, 2024
            </Text>
          </View>
          <View style={styles.headerCardRow}>
            <Ionicons
              name="time-outline"
              size={16}
              color="#666666"
              style={styles.headerCardIcon}
            />
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
          <Text style={styles.shortText}>
            {showMore
              ? "Join us for an unforgettable Garba Night, where tradition meets celebrations. Enjoy a full lineup of music and dance, delightful food stalls, and interactive events that bring together a vibrant community spirit. Don't miss this spectacular event that honors cultural heritage and modern festivities. "
              : "Join us for an unforgettable Garba Night, where tradition meets celebrations.. "}
            <Text
              style={styles.readMore}
              onPress={() => setShowMore(!showMore)}
            >
              {showMore ? "Read less" : "Read more"}
            </Text>
          </Text>

          {/* Number of Registrations */}
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
            registrations.map((reg, index) => {
              // Check if current fields are invalid
              const nameInvalid = showValidation && !reg.name.trim();
              const dobInvalid = showValidation && !reg.dobString.trim();

              return (
                <View key={index} style={styles.registrationCard}>
                  <View style={styles.registrationHeader}>
                    <Text style={styles.registrationTitle}>
                      Registration #{index + 1}
                    </Text>
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

                  {/* NAME Input */}
                  <View style={styles.inputGroup}>
                    <View
                      style={[
                        styles.boxInputContainer,
                        nameInvalid && { borderColor: "red" },
                      ]}
                    >
                      <Ionicons name="person-outline" size={20} color="#666" />
                      <TextInput
                        style={styles.boxInput}
                        placeholder="Enter your full name"
                        placeholderTextColor="#999"
                        value={reg.name}
                        onChangeText={(val) => {
                          const newRegs = [...registrations];
                          newRegs[index].name = val;
                          setRegistrations(newRegs);
                        }}
                      />
                    </View>
                    {nameInvalid && (
                      <Text style={styles.errorText}>
                        Please enter your name
                      </Text>
                    )}
                  </View>

                  {/* DOB Input */}
                  <View style={styles.inputGroup}>
                    <View
                      style={[
                        styles.boxInputContainer,
                        dobInvalid && { borderColor: "red" },
                      ]}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color="#666"
                      />
                      <Text
                        style={[
                          styles.boxInput,
                          !reg.dobString && styles.placeholderText,
                        ]}
                        onPress={() => showDatePicker(index)}
                      >
                        {reg.dobString || "Select your date of birth"}
                      </Text>
                    </View>
                    {dobInvalid && (
                      <Text style={styles.errorText}>
                        Please select your date of birth
                      </Text>
                    )}
                  </View>

                  {/* Age (read-only, not required) */}
                  <View style={styles.inputGroup}>
                    <View style={styles.boxInputContainer}>
                      <Ionicons
                        name="hourglass-outline"
                        size={20}
                        color="#666"
                      />
                      <TextInput
                        style={styles.boxInput}
                        placeholder="Age"
                        placeholderTextColor="#999"
                        value={reg.age}
                        editable={false}
                      />
                    </View>
                  </View>

                  {/* Ticket Selection */}
                  <View style={styles.ticketSection}>
                    <Text style={styles.sectionLabel}>Select Ticket Type</Text>
                    <TouchableOpacity
                      style={styles.ticketSelector}
                      onPress={() => {
                        setActiveRegIndexTicket(index);
                        setShowTicketModal(true);
                      }}
                    >
                      <View style={styles.ticketInfo}>
                        <Text style={styles.selectedTicketType}>
                          {reg.ticketType}
                        </Text>
                        <Text style={styles.ticketPrice}>
                          ${reg.ticketPrice}
                        </Text>
                      </View>
                      <Ionicons name="chevron-down" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>

                  {/* Copy Details Option */}
                  <TouchableOpacity
                    style={styles.copyDetailsButton}
                    onPress={() => toggleCopyDetails(index)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        reg.copyDetails && styles.checkboxChecked,
                      ]}
                    >
                      {reg.copyDetails && (
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                      )}
                    </View>
                    <Text style={styles.copyDetailsText}>
                      Copy these details for other tickets
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}

          {/* Add Registration Button */}
          {hasClickedNext && (
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
          {hasClickedNext && (
            <View style={styles.couponsSection}>
              {appliedCoupon ? (
                <View style={styles.appliedCouponContainer}>
                  <View style={styles.appliedCouponInfo}>
                    <Ionicons name="pricetag" size={24} color="#28A745" />
                    <View style={styles.appliedCouponTexts}>
                      <Text style={styles.appliedCouponTitle}>
                        Coupon Applied: {appliedCoupon.code}
                      </Text>
                      <Text style={styles.appliedCouponDiscount}>
                        {appliedCoupon.discount}% off on total amount
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
                    <Ionicons name="pricetags-outline" size={24} color="#666" />
                    <Text style={styles.viewCouponsText}>
                      View Available Coupons
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Bottom Spacing */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom Bar */}
        {hasClickedNext && (
          <View style={styles.bottomBar}>
            <View style={styles.totalSection}>
              <Text style={styles.grandTotalText}>
                Grand Total: ${finalTotal}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.proceedButton}
              onPress={handleProceed}
            >
              <Text style={styles.proceedButtonText}>Proceed</Text>
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
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Ticket Type</Text>
                <TouchableOpacity
                  onPress={() => setShowTicketModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              {Object.entries(ticketData).map(([type, price]) => (
                <TouchableOpacity
                  key={type}
                  style={styles.ticketOption}
                  onPress={() => handleTicketTypeSelect(type)}
                >
                  <View style={styles.ticketOptionContent}>
                    <Text style={styles.ticketOptionType}>{type}</Text>
                    <Text style={styles.ticketOptionPrice}>${price}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        {/* Coupons Modal */}
        <Modal visible={showCouponsModal} transparent animationType="slide">
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
                {couponsList.map((coupon) => {
                  const isCouponAvailable = rawTotal >= coupon.minSpend;

                  return (
                    <View key={coupon.code} style={styles.couponCard}>
                      <View style={styles.couponContent}>
                        <View style={styles.couponHeader}>
                          <Ionicons name="pricetag" size={24} color="#E3000F" />
                          <Text style={styles.couponCode}>{coupon.code}</Text>
                          <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>
                              {coupon.discount}% OFF
                            </Text>
                          </View>
                        </View>
                        <View style={styles.couponDetails}>
                          <Text style={styles.couponMinSpend}>
                            Minimum spend: ${coupon.minSpend}
                          </Text>
                        </View>
                      </View>
                      {isCouponAvailable ? (
                        <TouchableOpacity
                          style={styles.couponApplyButton}
                          onPress={() => handleApplyCoupon(coupon)}
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
  },
  headerCardIcon: {
    marginRight: 4,
  },
  headerCardSubtitle: {
    fontSize: 12,
    color: "#666",
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
  shortText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#555",
    marginBottom: 24,
  },
  readMore: {
    color: "#E3000F",
    fontWeight: "600",
  },

  registrationNumberSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    marginBottom: 12,
  },
  numberRegContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  numberRegInput: {
    flex: 1,
    height: 52,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#222",
    borderWidth: 1,
    borderColor: "#E9ECEF",
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
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
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
    marginBottom: 20,
  },
  registrationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },
  cancelButton: {
    padding: 2,
  },

  inputGroup: {
    marginBottom: 16,
  },
  boxInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  boxInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: "#222",
  },
  placeholderText: {
    color: "#999",
  },
  errorText: {
    marginTop: 4,
    marginLeft: 4,
    fontSize: 13,
    color: "red",
  },

  ticketSection: {
    marginTop: 24,
  },
  ticketSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 60,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  ticketInfo: {
    flex: 1,
  },
  selectedTicketType: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
    marginBottom: 4,
  },
  ticketPrice: {
    fontSize: 14,
    color: "#666",
  },

  copyDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#E3000F",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#E3000F",
  },
  copyDetailsText: {
    marginLeft: 12,
    fontSize: 14,
    color: "#444",
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
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "#E3000F",
  },

  couponsSection: {
    marginBottom: 24,
  },
  appliedCouponContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#28A745",
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
    fontWeight: "600",
    color: "#222",
  },
  appliedCouponDiscount: {
    fontSize: 14,
    color: "#28A745",
    marginTop: 2,
  },
  removeCouponButton: {
    padding: 2,
  },
  viewCouponsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  viewCouponsContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewCouponsText: {
    marginLeft: 12,
    fontSize: 15,
    color: "#444",
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },
  modalCloseButton: {
    padding: 4,
  },
  ticketOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  ticketOptionContent: {
    flex: 1,
  },
  ticketOptionType: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
    marginBottom: 4,
  },
  ticketOptionPrice: {
    fontSize: 14,
    color: "#666",
  },

  couponModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  couponModalContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  couponModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  couponModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },
  couponCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  couponContent: {
    flex: 1,
  },
  couponHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  couponCode: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    marginLeft: 12,
  },
  discountBadge: {
    backgroundColor: "#FFE5E7",
    borderRadius: 15,
    paddingHorizontal: 3,
    paddingVertical: 4,
    marginLeft: 8,
  },
  discountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E3000F",
  },
  couponDetails: {
    marginLeft: 36,
  },
  couponMinSpend: {
    fontSize: 14,
    color: "#666",
  },
  couponApplyButton: {
    backgroundColor: "#E3000F",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 12,
  },
  couponApplyText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  couponUnavailableOverlay: {
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  couponUnavailableText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E3000F",
    textAlign: "center",
  },
});
