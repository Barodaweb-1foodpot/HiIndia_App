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
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Formik } from "formik";
import * as Yup from "yup";
import { useAuthContext } from "../../context/AuthContext";
import { handleSetPassword } from "../../api/auth_api";
import Toast from "react-native-toast-message";

const UpdatedPin = ({ navigation }) => {
  // References for PIN input fields
  const resetInputRefs = useRef([]);
  const confirmInputRefs = useRef([]);
  const { forgot_id } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);

  // Dismiss keyboard when user taps outside input fields
  const dismissKeyboard = () => {
    Keyboard.dismiss();
    console.log("Keyboard dismissed");
  };

  // Validation schema for reset and confirm PIN
  const validationSchema = Yup.object().shape({
    resetPin: Yup.string()
      .required("Reset PIN is required")
      .matches(/^\d{6}$/, "Reset PIN must be exactly 6 digits"),
    confirmPin: Yup.string()
      .required("Confirm PIN is required")
      .oneOf([Yup.ref("resetPin")], "Pins do not match")
      .matches(/^\d{6}$/, "Confirm PIN must be exactly 6 digits"),
  });

  // Handle setting the new PIN using the provided forgot_id
  const handleResetPassword = async (values) => {
    console.log("Attempting to reset password with forgot_id:", forgot_id);
    setIsLoading(true);
    const res = await handleSetPassword(forgot_id, values.confirmPin);
    console.log("Reset password response:", res);
    if (res.isOk) {
      Toast.show({
        type: "success",
        text1: res.message,
        position: "bottom",
        visibilityTime: 2000,
      });
      setTimeout(() => {
        console.log("Navigating to Login screen after reset");
        navigation.navigate("Login");
      }, 1000);
    } else {
      Toast.show({
        type: "error",
        text1: res.message,
        position: "bottom",
        visibilityTime: 2000,
      });
    }
    setIsLoading(false);
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar style="auto" />
      <KeyboardAvoidingView style={styles.container}>
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={styles.inner}>
            <View style={styles.topSection}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  console.log("Navigating back to ForgotPassword");
                  navigation.navigate("ForgotPassword");
                }}
              >
                <Ionicons name="chevron-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <Image
                source={require("../../../assets/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <View style={styles.headerCard}>
                <Text style={styles.headerCardTitle}>Update Security PIN</Text>
                <Text style={styles.headerCardSubtitle}>
                  Your PIN is updated. Enter the new PIN to continue.
                </Text>
              </View>
            </View>

            <View style={styles.whiteContainer}>
              <Formik
                initialValues={{ resetPin: "", confirmPin: "" }}
                validationSchema={validationSchema}
                onSubmit={handleResetPassword}
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
                      <Text style={styles.inputLabel}>Reset PIN</Text>
                      <View style={styles.pinContainer}>
                        {[...Array(6)].map((_, index) => (
                          <TextInput
                            key={index}
                            ref={(ref) => (resetInputRefs.current[index] = ref)}
                            style={[
                              styles.pinInput,
                              values.resetPin[index] && styles.pinInputFilled,
                            ]}
                            keyboardType="phone-pad"
                            maxLength={1}
                            value={values.resetPin[index]}
                            onChangeText={(value) => {
                              const newPin =
                                values.resetPin.substring(0, index) +
                                value +
                                values.resetPin.substring(index + 1);
                              handleChange("resetPin")(newPin);
                              console.log(
                                `Reset PIN updated at index ${index}: ${newPin}`
                              );
                              if (value && index < 5) {
                                resetInputRefs.current[index + 1].focus();
                              }
                            }}
                            onKeyPress={(e) => {
                              if (
                                e.nativeEvent.key === "Backspace" &&
                                index > 0
                              ) {
                                const newPin =
                                  values.resetPin.substring(0, index) +
                                  " " +
                                  values.resetPin.substring(index + 1);
                                handleChange("resetPin")(newPin);
                                resetInputRefs.current[index - 1].focus();
                                console.log(
                                  `Backspace pressed on reset PIN at index ${index}`
                                );
                              }
                            }}
                            onBlur={() => {
                              setFieldTouched("resetPin", true);
                              handleBlur("resetPin");
                              console.log(`Reset PIN input at index ${index} blurred`);
                            }}
                          />
                        ))}
                      </View>
                      {touched.resetPin && errors.resetPin && (
                        <Text style={styles.errorText}>{errors.resetPin}</Text>
                      )}

                      <Text style={styles.inputLabel}>Confirm PIN</Text>
                      <View style={styles.pinContainer}>
                        {[...Array(6)].map((_, index) => (
                          <TextInput
                            key={index}
                            ref={(ref) =>
                              (confirmInputRefs.current[index] = ref)
                            }
                            style={[
                              styles.pinInput,
                              values.confirmPin[index] && styles.pinInputFilled,
                            ]}
                            keyboardType="phone-pad"
                            maxLength={1}
                            value={values.confirmPin[index]}
                            onChangeText={(value) => {
                              const newPin =
                                values.confirmPin.substring(0, index) +
                                value +
                                values.confirmPin.substring(index + 1);
                              handleChange("confirmPin")(newPin);
                              console.log(
                                `Confirm PIN updated at index ${index}: ${newPin}`
                              );
                              if (value && index < 5) {
                                confirmInputRefs.current[index + 1].focus();
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
                                confirmInputRefs.current[index - 1].focus();
                                console.log(
                                  `Backspace pressed on confirm PIN at index ${index}`
                                );
                              }
                            }}
                            onBlur={handleBlur("confirmPin")}
                          />
                        ))}
                      </View>
                      {touched.confirmPin && errors.confirmPin && (
                        <Text style={styles.errorText}>{errors.confirmPin}</Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.resetButton}
                      onPress={() => {
                        setFieldTouched("resetPin", true);
                        setFieldTouched("confirmPin", true);
                        if (values.resetPin.length === 6 && values.confirmPin.length === 6) {
                          console.log("Reset PIN form complete, submitting...");
                          handleSubmit();
                        }
                      }}
                      disabled={isLoading}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.resetButtonText}>
                        {isLoading ? "Setting..." : "Reset and Continue"}
                      </Text>
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
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 30,
    paddingBottom: 50,
    height: 180,
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 45 : 10,
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
    bottom: -50,
    alignSelf: "center",
    backgroundColor: "#FFF",
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
    color: "#000",
  },
  headerCardSubtitle: {
    marginTop: 5,
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666",
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingVertical: 40,
    zIndex: 0,
  },
  inputContainer: {
    marginTop: 40,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#000000",
    marginBottom: 4,
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
    backgroundColor: "#F5F5F5",
    borderColor: "#000000",
  },
  resetButton: {
    backgroundColor: "#E3000F",
    borderRadius: 25,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  resetButtonText: {
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

export default UpdatedPin;
