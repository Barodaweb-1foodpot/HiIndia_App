import React, { useRef } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Formik } from "formik";
import * as Yup from "yup";

const SignUpPage = ({ navigation }) => {
  const scrollViewRef = useRef(null);
  const inputRefsSetPin = useRef([]);
  const inputRefsConfirmPin = useRef([]);

  const validationSchema = Yup.object().shape({
    firstName: Yup.string().required("First Name is required"),
    lastName: Yup.string().required("Last Name is required"),
    phoneNumber: Yup.string()
      .required("Phone Number is required")
      .matches(/^\d{10}$/, "Phone Number must be 10 digits"),
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
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.inner}>
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
                  setPin: "",
                  confirmPin: "",
                }}
                validationSchema={validationSchema}
                onSubmit={(values) => {
                  console.log("SignUp Values:", values);
                  navigation.navigate("LoginPin");
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
                }) => (
                  <>
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

                      <Text style={styles.inputLabel}>Phone Number</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Phone Number"
                        placeholderTextColor="#AAAAAA"
                        keyboardType="numeric"
                        onChangeText={handleChange("phoneNumber")}
                        onBlur={handleBlur("phoneNumber")}
                        value={values.phoneNumber}
                      />
                      {touched.phoneNumber && errors.phoneNumber && (
                        <Text style={styles.errorText}>
                          {errors.phoneNumber}
                        </Text>
                      )}

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

                      <Text style={styles.inputLabel}>Set PIN</Text>
                      <View style={styles.pinContainer}>
                        {[...Array(6)].map((_, index) => (
                          <TextInput
                            key={index}
                            ref={(ref) => (inputRefsSetPin.current[index] = ref)}
                            style={[
                              styles.pinInput,
                              values.setPin[index] && styles.pinInputFilled,
                            ]}
                            keyboardType="numeric"
                            maxLength={1}
                            value={values.setPin[index]}
                            onChangeText={(value) => {
                              const newPin =
                                values.setPin.substring(0, index) +
                                value +
                                values.setPin.substring(index + 1);
                              handleChange("setPin")(newPin);
                              if (value && index < 5) {
                                inputRefsSetPin.current[index + 1].focus();
                              }
                            }}
                            onKeyPress={(e) => {
                              if (
                                e.nativeEvent.key === "Backspace" &&
                                index > 0
                              ) {
                                const newPin =
                                  values.setPin.substring(0, index) +
                                  " " +
                                  values.setPin.substring(index + 1);
                                handleChange("setPin")(newPin);
                                inputRefsSetPin.current[index - 1].focus();
                              }
                            }}
                            onBlur={() => {
                              setFieldTouched("setPin", true);
                              handleBlur("setPin");
                            }}
                            placeholder="-"
                            placeholderTextColor="#999"
                          />
                        ))}
                      </View>
                      {touched.setPin && errors.setPin && (
                        <Text style={styles.errorText}>{errors.setPin}</Text>
                      )}

                      <Text style={styles.inputLabel}>Confirm PIN</Text>
                      <View style={styles.pinContainer}>
                        {[...Array(6)].map((_, index) => (
                          <TextInput
                            key={index}
                            ref={(ref) => (inputRefsConfirmPin.current[index] = ref)}
                            style={[
                              styles.pinInput,
                              values.confirmPin[index] && styles.pinInputFilled,
                            ]}
                            keyboardType="numeric"
                            maxLength={1}
                            value={values.confirmPin[index]}
                            onChangeText={(value) => {
                              const newPin =
                                values.confirmPin.substring(0, index) +
                                value +
                                values.confirmPin.substring(index + 1);
                              handleChange("confirmPin")(newPin);
                              if (value && index < 5) {
                                inputRefsConfirmPin.current[index + 1].focus();
                              }
                            }}
                            onKeyPress={(e) => {
                              if (
                                e.nativeEvent.key === "Backspace" &&
                                index > 0
                              ) {
                                const newPin =
                                  values.confirmPin.substring(0, index) +
                                  " " +
                                  values.confirmPin.substring(index + 1);
                                handleChange("confirmPin")(newPin);
                                inputRefsConfirmPin.current[index - 1].focus();
                              }
                            }}
                            onBlur={() => {
                              setFieldTouched("confirmPin", true);
                              handleBlur("confirmPin");
                            }}
                            placeholder="-"
                            placeholderTextColor="#999"
                          />
                        ))}
                      </View>
                      {touched.confirmPin && errors.confirmPin && (
                        <Text style={styles.errorText}>
                          {errors.confirmPin}
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.continueButton}
                      onPress={handleSubmit}
                    >
                      <Text style={styles.continueButtonText}>Continue</Text>
                    </TouchableOpacity>
                  </>
                )}
              </Formik>
            </ScrollView>
          </View>
        </View>
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
  },
  logo: {
    width: "100%",
    height: 60,
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
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
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
  whiteContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
  },
  pinContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  pinInput: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 18,
    fontFamily: "Poppins-Regular",
    backgroundColor: "#FFFFFF",
  },
  pinInputFilled: {
    borderColor: "#000000",
    backgroundColor: "#F8F8F8",
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
});

export default SignUpPage;