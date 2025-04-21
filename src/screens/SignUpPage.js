import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  StatusBar,
  ScrollView,
  Platform,
  Animated,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Formik } from "formik";
import * as Yup from "yup";
import { handleSignup, fetchActiveCountries } from "../api/auth_api";
import Toast from "react-native-toast-message";

const CountryCodeDropdown = ({ selectedCode, onSelect, countries }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={styles.countryCodeButton}
        onPress={() => setIsOpen(true)}
      >
        <Text style={styles.countryCodeButtonText}>{selectedCode}</Text>
        <Ionicons name="chevron-down" size={16} color="#000" />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalDropdownContainer}>
            <View style={styles.modalDropdownHeader}>
              <Text style={styles.modalDropdownTitle}>Select Country Code</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalDropdownScrollView}>
              {countries.map((item) => (
                <TouchableOpacity
                  key={item._id}
                  style={styles.modalDropdownItem}
                  onPress={() => {
                    onSelect("+" + item.CountryCode, item._id);
                    setIsOpen(false);
                  }}
                >
                  <Text style={styles.countryCodeText}>
                    +{item.CountryCode}
                  </Text>
                  <Text style={styles.countryNameText}>{item.CountryName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const SignUpPage = ({ navigation }) => {
  const [selectedCountryCode, setSelectedCountryCode] = useState("+");
  const [selectedCountryId, setSelectedCountryId] = useState("");
  const [countries, setCountries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [countryCodeError, setCountryCodeError] = useState(null);
  const scrollViewRef = useRef(null);
  // Create refs for each digit input in the two PIN fields
  const inputRefsSetPin = useRef([...Array(6)].map(() => React.createRef()));
  const inputRefsConfirmPin = useRef(
    [...Array(6)].map(() => React.createRef())
  );
  // State for modal visibility
  const [modalVisible, setModalVisible] = useState(false);
  // Ref to store Formik's handleSubmit function
  const formSubmitRef = useRef(null);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const data = await fetchActiveCountries();
        setCountries(data);
      } catch (error) {
        console.error("Error loading countries:", error);
      }
    };
    loadCountries();
  }, []);

  const validationSchema = Yup.object().shape({
    firstName: Yup.string().required("First Name is required"),
    lastName: Yup.string().required("Last Name is required"),
    phoneNumber: Yup.string()
      .matches(/^\d{6,10}$/, "Phone Number must be between 6-10 digits")
      .required("Phone Number is required"),
    email: Yup.string()
      .email("Enter a valid email")
      .required("Email is required"),
    setPin: Yup.string()
      .required("Set PIN is required")
      .matches(/^\d{6}$/, "PIN must be exactly 6 digits"),
    confirmPin: Yup.string()
      .required("Confirm PIN is required")
      .oneOf([Yup.ref("setPin")], "PINs do not match"),
  });

  return (
    <View style={styles.rootContainer}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
        animated={true}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.inner}>
          {/* Header Section */}
          <View style={styles.topSection}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate("Login")}
            >
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>

            <Image
              source={require("../../assets/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.headerCard}>
              <Text style={styles.headerCardTitle}>Create new account</Text>
              <Text style={styles.headerCardSubtitle}>
                Begin with creating new account.
              </Text>
            </View>
          </View>

          {/* White Container */}
          <View style={styles.whiteContainer}>
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Formik
                initialValues={{
                  firstName: "",
                  lastName: "",
                  phoneNumber: "",
                  email: "",
                  setPin: "______",
                  confirmPin: "______",
                }}
                validationSchema={validationSchema}
                onSubmit={async (values) => {
                  // Ensure country code is selected
                  if (!selectedCountryCode || selectedCountryCode === "+" || selectedCountryId === "") {
                    Toast.show({
                      type: "error",
                      text1: "Country Code Required",
                      text2: "Please select a country code",
                      position: "bottom",
                    });
                    setIsLoading(false);
                    return;
                  }
                  
                  const payload = {
                    firstName: values.firstName,
                    lastName: values.lastName,
                    emailId: values.email.toLowerCase(),
                    password: values.setPin.replace(/_/g, ""),
                    contactNumber: values.phoneNumber,
                    ParticipantCountryCode: selectedCountryCode,
                    country: selectedCountryId,
                    isMailVerified: false,
                    isContactNumberVerified: false,
                    IsActive: true,
                  };

                  console.log("------------------------payload", payload);
                  try {
                    setIsLoading(true); // Set loading state before API call

                    const response = await handleSignup(payload);
                    if (response.isOk) {
                      Toast.show({
                        type: "success",
                        text1: "Signup Successful",
                        text2: "Account created successfully.",
                        position: "bottom",
                      });
                      navigation.navigate("Login");
                    } else {
                      Toast.show({
                        type: "error",
                        text1: "Signup Failed",
                        text2: response.message || "Please try again.",
                        position: "bottom",
                      });
                      setIsLoading(false);
                    }
                  } catch (err) {
                    console.error(err);
                    setIsLoading(false);
                  }
                }}
              >
                {({
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  setFieldTouched,
                  values,
                  errors,
                  touched,
                  setFieldValue,
                }) => {
                  // Store Formik's handleSubmit in the ref for later use in the modal.
                  formSubmitRef.current = handleSubmit;
                  return (
                    <>
                      {/* First Name */}
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>First Name</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="First Name"
                          placeholderTextColor="#AAAAAA"
                          onChangeText={handleChange("firstName")}
                          onBlur={handleBlur("firstName")}
                          value={values.firstName}
                        />
                        {touched.firstName && errors.firstName && (
                          <Text style={styles.errorText}>
                            {errors.firstName}
                          </Text>
                        )}

                        {/* Last Name */}
                        <Text style={styles.inputLabel}>Last Name</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Last Name"
                          placeholderTextColor="#AAAAAA"
                          onChangeText={handleChange("lastName")}
                          onBlur={handleBlur("lastName")}
                          value={values.lastName}
                        />
                        {touched.lastName && errors.lastName && (
                          <Text style={styles.errorText}>
                            {errors.lastName}
                          </Text>
                        )}

                        {/* Phone Number + Country Code */}
                        <Text style={styles.inputLabel}>
                          Phone Number
                        </Text>
                        <View style={styles.phoneInputContainer}>
                          <CountryCodeDropdown
                            selectedCode={selectedCountryCode}
                            onSelect={(code, _id) => {
                              console.log("------------------------code", _id);
                              setSelectedCountryCode(code);
                              setSelectedCountryId(_id);
                              setCountryCodeError(null);
                            }}
                            countries={countries}
                          />
                          <TextInput
                            style={styles.phoneInput}
                            placeholder="Phone Number"
                            placeholderTextColor="#AAAAAA"
                            keyboardType="numeric"
                            onChangeText={handleChange("phoneNumber")}
                            onBlur={handleBlur("phoneNumber")}
                            value={values.phoneNumber}
                            maxLength={10}
                          />
                        </View>
                        {touched.phoneNumber && errors.phoneNumber && (
                          <Text style={styles.errorText}>
                            {errors.phoneNumber}
                          </Text>
                        )}

                        {/* Email */}
                        <Text style={styles.inputLabel}>Email</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Email Address"
                          placeholderTextColor="#AAAAAA"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          onChangeText={handleChange("email")}
                          onBlur={handleBlur("email")}
                          value={values.email}
                        />
                        {touched.email && errors.email && (
                          <Text style={styles.errorText}>{errors.email}</Text>
                        )}

                        {/* Set PIN using 6 separate inputs */}
                        <Text style={styles.inputLabel}>Set PIN</Text>
                        <View style={styles.pinContainer}>
                          {[...Array(6)].map((_, index) => (
                            <TextInput
                              key={`set-${index}`}
                              ref={(ref) =>
                                (inputRefsSetPin.current[index] = ref)
                              }
                              style={styles.pinInput}
                              keyboardType="phone-pad"
                              maxLength={1}
                              value={
                                values.setPin[index] === "_"
                                  ? ""
                                  : values.setPin[index]
                              }
                              onChangeText={(digit) => {
                                let newPin = values.setPin.split("");
                                newPin[index] = digit || "_";
                                const joined = newPin.join("");
                                setFieldValue("setPin", joined);
                                if (digit && index < 5) {
                                  inputRefsSetPin.current[index + 1].focus();
                                }
                              }}
                              onKeyPress={(e) => {
                                if (
                                  e.nativeEvent.key === "Backspace" &&
                                  values.setPin[index] === "_" &&
                                  index > 0
                                ) {
                                  inputRefsSetPin.current[index - 1].focus();
                                }
                              }}
                            />
                          ))}
                        </View>
                        {touched.setPin && errors.setPin && (
                          <Text style={styles.errorText}>{errors.setPin}</Text>
                        )}

                        {/* Confirm PIN using 6 separate inputs */}
                        <Text style={styles.inputLabel}>Confirm PIN</Text>
                        <View style={styles.pinContainer}>
                          {[...Array(6)].map((_, index) => (
                            <TextInput
                              key={`confirm-${index}`}
                              ref={(ref) =>
                                (inputRefsConfirmPin.current[index] = ref)
                              }
                              style={styles.pinInput}
                              keyboardType="phone-pad"
                              maxLength={1}
                              value={
                                values.confirmPin[index] === "_"
                                  ? ""
                                  : values.confirmPin[index]
                              }
                              onChangeText={(digit) => {
                                let newPin = values.confirmPin.split("");
                                newPin[index] = digit || "_";
                                const joined = newPin.join("");
                                setFieldValue("confirmPin", joined);
                                if (digit && index < 5) {
                                  inputRefsConfirmPin.current[
                                    index + 1
                                  ].focus();
                                }
                              }}
                              onKeyPress={(e) => {
                                if (
                                  e.nativeEvent.key === "Backspace" &&
                                  values.confirmPin[index] === "_" &&
                                  index > 0
                                ) {
                                  inputRefsConfirmPin.current[
                                    index - 1
                                  ].focus();
                                }
                              }}
                            />
                          ))}
                        </View>
                        {touched.confirmPin && errors.confirmPin && (
                          <Text style={styles.errorText}>
                            {errors.confirmPin}
                          </Text>
                        )}
                      </View>

                      {/* Continue Button that triggers a Modal */}
                      <TouchableOpacity
                        style={styles.continueButton}
                        onPress={() => {
                          // Set loading state
                          setIsLoading(true);

                          // Touch all fields to trigger validation
                          Object.keys(values).forEach((field) =>
                            setFieldTouched(field, true)
                          );

                          // Validate country code is selected
                          if (!selectedCountryCode || selectedCountryCode === "+" || selectedCountryId === "") {
                            setCountryCodeError("Please select a country code");
                            setIsLoading(false);
                            return;
                          } else {
                            setCountryCodeError(null);
                          }

                          // Check for form errors
                          const hasErrors = Object.keys(errors).length > 0;

                          if (hasErrors) {
                            // If there are errors, reset loading state
                            setIsLoading(false);
                            return;
                          }

                          // If valid, show modal
                          setModalVisible(true);
                        }}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.continueButtonText}>
                            Continue
                          </Text>
                        )}
                      </TouchableOpacity>
                    </>
                  );
                }}
              </Formik>
              {/* Modal for Email Verification */}
              <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => {
                  setModalVisible(false);
                  setIsLoading(false);
                }}
              >
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalText}>
                      Please check your mail to verify the account
                    </Text>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => {
                        setModalVisible(false);
                        // Ensure we're using the current form submission function
                        if (formSubmitRef.current) {
                          console.log("Submitting form from modal OK button");
                          // Execute after modal is closed to avoid state conflicts
                          setTimeout(() => {
                            formSubmitRef.current();
                          }, 100);
                        } else {
                          console.error("Form submit function not available");
                          setIsLoading(false);
                        }
                      }}
                    >
                      <Text style={styles.modalButtonText}>Ok</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignUpPage;

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    zIndex: 0,
  },
  topSection: {
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 50,
    paddingBottom: 50,
    height: 180,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 16,
    zIndex: 1,
  },
  logo: {
    width: "100%",
    height: 70,
    marginTop: 10,
  },
  headerCard: {
    position: "absolute",
    bottom: -40,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1111,
  },
  headerCardTitle: {
    fontSize: 22,
    fontFamily: "Poppins-Bold",
    color: "#000000",
  },
  headerCardSubtitle: {
    marginTop: 5,
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666666",
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 80,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#000000",
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
    color: "#000000",
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    zIndex: 1000,
  },
  phoneInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    backgroundColor: "#FFFFFF",
    color: "#000000",
  },
  dropdownContainer: {
    position: "relative",
    zIndex: 1000,
    width: 78,
  },
  countryCodeButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 6,
    height: 48,
    marginRight: 8,
    backgroundColor: "#FFFFFF",
    width: 70,
    justifyContent: "space-between",
  },
  countryCodeButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#000000",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalDropdownContainer: {
    width: "80%",
    maxHeight: "70%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 5,
  },
  modalDropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalDropdownTitle: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#000000",
  },
  modalDropdownScrollView: {
    maxHeight: 300,
  },
  modalDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    width: "100%",
  },
  countryCodeText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#000000",
    width: 50,
  },
  countryNameText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    flex: 1,
    marginLeft: 8,
  },
  pinContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  pinInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    textAlign: "center",
    fontSize: 18,
    backgroundColor: "#f5f5f5",
  },
  errorText: {
    marginTop: 4,
    color: "#FF0000",
    fontSize: 12,
    fontFamily: "Poppins-Regular",
  },
  continueButton: {
    backgroundColor: "#E3000F",
    borderRadius: 25,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins-Medium",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
  },
  modalText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    marginBottom: 20,
    textAlign: "center",
    color: "#000000",
  },
  modalButton: {
    backgroundColor: "#E3000F",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins-Medium",
  },
  optionalText: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#888888",
  },
});
