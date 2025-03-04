import React, { useRef, useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Formik } from "formik";
import * as Yup from "yup";
import { useAuthContext } from "../../context/AuthContext";
import { handleLogin } from "../../api/auth_api";
import Toast from "react-native-toast-message";

/**
 * LoginPinScreen Component
 *
 * This screen allows users to enter their 6-digit security PIN.
 * It handles input focus management, toggling of PIN visibility,
 * form submission (calling the login API), and navigation to the Tab screen.
 *
 * Console logs have been added to help trace user interactions and debugging.
 */
const LoginPinScreen = ({ navigation }) => {
  const { loginEmail } = useAuthContext();
  const inputRefs = useRef([]);
  const [isPinVisible, setIsPinVisible] = useState(false);

  // Dismiss the keyboard when the user taps outside the input fields.
  const dismissKeyboard = () => {
    Keyboard.dismiss();
    console.log("Keyboard dismissed");
  };

  // Toggle the visibility of the PIN (for secure text entry).
  const togglePinVisibility = () => {
    setIsPinVisible(!isPinVisible);
    console.log("PIN visibility toggled. Now visible:", !isPinVisible);
  };

  // Validation schema to ensure the PIN is exactly 6 digits.
  const validationSchema = Yup.object().shape({
    pin: Yup.string()
      .required("PIN is required")
      .matches(/^\d{6}$/, "PIN must be exactly 6 digits"),
  });

  // Handle the PIN submission and call the login API.
  const handleSubmit2 = async (values) => {
    console.log("Submitting PIN for login:", values.pin);
    const temp = { email: loginEmail, password: values.pin };
    const res = await handleLogin(temp);
    if (res.isOk) {
      console.log("Login successful:", res);
      Toast.show({
        type: "success",
        text1: "Email entered successfully",
        position: "bottom",
        visibilityTime: 2000,
      });
      setTimeout(() => {
        console.log("Navigating to Tab screen");
        navigation.navigate("Tab");
      }, 2000);
    } else {
      console.log("Login failed:", res);
      Toast.show({
        type: "error",
        text1: res.message,
        position: "bottom",
        visibilityTime: 2000,
      });
    }
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
        animated={true}
      />
      <KeyboardAvoidingView style={styles.container}>
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={styles.inner}>
            {/* Top Section: Back button, Logo, and Header Card */}
            <View style={styles.topSection}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  console.log("Navigating back to Login screen");
                  navigation.navigate("Login");
                }}
              >
                <Ionicons name="chevron-back" size={30} color="#FFF" />
              </TouchableOpacity>
              <Image
                source={require("../../../assets/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <View style={styles.headerCard}>
                <Text style={styles.headerCardTitle}>
                  Log in to your account
                </Text>
                <Text style={styles.headerCardSubtitle}>
                  Enter your PIN to proceed
                </Text>
              </View>
            </View>

            {/* White Container: Formik form for PIN input */}
            <View style={styles.whiteContainer}>
              <Formik
                initialValues={{ pin: "" }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit2}
              >
                {({
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  values,
                  errors,
                  touched,
                  setFieldTouched,
                }) => (
                  <>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Enter SECURITY PIN</Text>
                      <Text style={styles.inputSubtitle}>
                        Enter your 6 digit SECURITY PIN.
                      </Text>
                      <View style={styles.pinContainer}>
                        {[...Array(6)].map((_, index) => (
                          <TextInput
                            key={index}
                            ref={(ref) => (inputRefs.current[index] = ref)}
                            style={[
                              styles.pinInput,
                              values.pin[index] && styles.pinInputFilled,
                            ]}
                            keyboardType="phone-pad"
                            maxLength={1}
                            value={values.pin[index]}
                            onChangeText={(value) => {
                              const newPin =
                                values.pin.substring(0, index) +
                                value +
                                values.pin.substring(index + 1);
                              handleChange("pin")(newPin);
                              console.log(
                                `Updated PIN at index ${index}:`,
                                newPin
                              );
                              if (value && index < 5) {
                                inputRefs.current[index + 1].focus();
                              }
                            }}
                            onKeyPress={(e) => {
                              if (
                                e.nativeEvent.key === "Backspace" &&
                                index > 0
                              ) {
                                const newPin =
                                  values.pin.substring(0, index) +
                                  " " +
                                  values.pin.substring(index + 1);
                                handleChange("pin")(newPin);
                                console.log(
                                  `Backspace pressed at index ${index}. New PIN:`,
                                  newPin
                                );
                                inputRefs.current[index - 1].focus();
                              }
                            }}
                            onBlur={() => {
                              setFieldTouched("pin", true);
                              handleBlur("pin");
                              console.log(`Input at index ${index} blurred`);
                            }}
                            secureTextEntry={!isPinVisible}
                            // Removed the placeholder property as requested.
                          />
                        ))}
                      </View>
                      {touched.pin && errors.pin && (
                        <Text style={styles.errorText}>{errors.pin}</Text>
                      )}
                      <View style={styles.forgotPinRow}>
                        <TouchableOpacity
                          onPress={() => {
                            console.log("Navigating to ForgotPassword screen");
                            navigation.navigate("ForgotPassword");
                          }}
                        >
                          <Text style={styles.forgotPinText}>
                            Forgot SECURITY PIN?
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={togglePinVisibility}
                          style={styles.eyeIcon}
                        >
                          <Ionicons
                            name={
                              isPinVisible ? "eye-off-outline" : "eye-outline"
                            }
                            size={20}
                            color="#666666"
                          />
                          <Text style={styles.showText}>
                            {isPinVisible ? "Hide" : "Show"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.loginButton}
                      onPress={() => {
                        setFieldTouched("pin", true);
                        if (values.pin.length === 6) {
                          console.log("PIN complete, submitting form");
                          handleSubmit();
                        } else {
                          console.log("PIN incomplete. Current PIN:", values.pin);
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.loginButtonText}>Login</Text>
                    </TouchableOpacity>
                  </>
                )}
              </Formik>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      <Toast />
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
    paddingTop: 30,
    paddingBottom: 50,
    height: 180,
  },
  backButton: {
    position: "absolute",
    top: 45,
    left: 16,
    zIndex: 1,
  },
  logo: {
    width: "100%",
    height: 60,
    marginTop: 10,
  },
  headerCard: {
    position: "absolute",
    bottom: -45,
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "Poppins-Bold",
    color: "#000000",
    marginBottom: 10,
    marginTop: 20,
  },
  inputSubtitle: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    marginBottom: 16,
  },
  pinContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  pinInput: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 18,
    fontFamily: "Poppins-Regular",
    backgroundColor: "#FFFFFF",
    includeFontPadding: false,
    lineHeight: 28,
  },
  pinInputFilled: {
    backgroundColor: "#F5F5F5",
    borderColor: "#000000",
  },
  forgotPinRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotPinText: {
    color: "#666666",
    fontSize: 14,
  },
  eyeIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  showText: {
    marginLeft: 4,
    color: "#666666",
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: "#E3000F",
    borderRadius: 25,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 300,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins-Medium",
  },
  errorText: {
    color: "#FF0000",
    fontSize: 12,
    marginBottom: 8,
    fontFamily: "Poppins-Regular",
  },
});

export default LoginPinScreen;
