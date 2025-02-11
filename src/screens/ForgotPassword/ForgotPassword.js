import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Formik } from "formik";
import * as Yup from "yup";

const countryCodes = [
  { label: "+91 (India)", value: "+91" },
  { label: "+1 (USA)", value: "+1" },
  { label: "+44 (UK)", value: "+44" },
  { label: "+61 (Australia)", value: "+61" },
];

const ForgotPassword = ({ navigation }) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    setDropdownVisible(false);
  };

  const validationSchema = Yup.object().shape({
    countryCode: Yup.string().required("Country code is required"),
    phoneNumber: Yup.string()
      .required("Phone number is required")
      .matches(/^[0-9]+$/, "Enter a valid phone number")
      .length(10, "Phone number must be exactly 10 digits"),
  });

  const handleSendOTP = (values) => {
    console.log(
      "Sending OTP to:",
      `${values.countryCode}${values.phoneNumber}`
    );
    navigation.navigate("VerifyOtp");
  };

  const renderCountryCodeItem = (item, setFieldValue) => (
    <TouchableOpacity
      style={styles.countryCodeItem}
      onPress={() => {
        setFieldValue("countryCode", item.value);
        setDropdownVisible(false);
      }}
    >
      <Text style={styles.countryCodeText}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={styles.container}>
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={styles.inner}>
            <View style={styles.topSection}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.navigate("Login")}
              >
                <Ionicons name="chevron-back" size={24} color="#FFF" />
              </TouchableOpacity>

              <Image
                source={require("../../../assets/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <View style={styles.headerCard}>
                <Text style={styles.headerCardTitle}>Forgot password</Text>
                <Text style={styles.headerCardSubtitle}>
                  Enter your registered phone number below to recover your
                  password.
                </Text>
              </View>
            </View>

            <View style={styles.whiteContainer}>
              <Formik
                initialValues={{ countryCode: "+91", phoneNumber: "" }}
                validationSchema={validationSchema}
                onSubmit={handleSendOTP}
              >
                {({
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  setFieldValue,
                  values,
                  errors,
                  touched,
                }) => (
                  <>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Phone Number</Text>
                      <View style={styles.phoneInputContainer}>
                        <TouchableOpacity
                          style={styles.dropdown}
                          onPress={() => setDropdownVisible(!dropdownVisible)}
                        >
                          <Text style={styles.countryCodeText}>
                            {values.countryCode}
                          </Text>
                          <Ionicons
                            name={
                              dropdownVisible
                                ? "chevron-up-outline"
                                : "chevron-down-outline"
                            }
                            size={16}
                            color="#666666"
                          />
                        </TouchableOpacity>
                        <TextInput
                          style={styles.phoneInput}
                          placeholder="9876543210"
                          placeholderTextColor="#999"
                          keyboardType="phone-pad"
                          value={values.phoneNumber}
                          onChangeText={handleChange("phoneNumber")}
                          onBlur={handleBlur("phoneNumber")}
                          maxLength={10}
                        />
                      </View>
                      {dropdownVisible && (
                        <View style={styles.dropdownList}>
                          <FlatList
                            data={countryCodes}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) =>
                              renderCountryCodeItem(item, setFieldValue)
                            }
                          />
                        </View>
                      )}
                      {touched.phoneNumber && errors.phoneNumber && (
                        <Text style={styles.errorText}>
                          {errors.phoneNumber}
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.sendOTPButton}
                      onPress={handleSubmit}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.sendOTPButtonText}>Send OTP</Text>
                    </TouchableOpacity>
                  </>
                )}
              </Formik>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

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
  topSection: {
    flex: 0.3,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: 48,
    left: 16,
  },
  logo: {
    width: "100%",
    height: 60,
    marginTop: 10,
  },
  headerCard: {
    position: "absolute",
    bottom: -30,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
    textAlign: "left",
  },
  headerCardTitle: {
    fontSize: 22,
    fontFamily: "Poppins-Bold",
    color: "#000000",
    textAlign: "left",
  },
  headerCardSubtitle: {
    marginTop: 5,
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    textAlign: "left",
    lineHeight: 18,
  },

  whiteContainer: {
    flex: 0.7,
    backgroundColor: "#FFFFFF",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#000000",
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  dropdown: {
    width: 80,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
    backgroundColor: "#F5F5F5",
  },
  countryCodeText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#000000",
    marginRight: 4,
  },
  dropdownList: {
    position: "absolute",
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    zIndex: 1000,
    paddingVertical: 8,
  },
  phoneInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#000000",
  },
  errorText: {
    color: "#FF0000",
    fontSize: 12,
    marginTop: 4,
    fontFamily: "Poppins-Regular",
  },
  sendOTPButton: {
    backgroundColor: "#E3000F",
    borderRadius: 25,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  sendOTPButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins-Medium",
  },
  countryCodeItem: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
});

export default ForgotPassword;
