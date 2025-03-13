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

const LoginPinScreen = ({ navigation }) => {
  const { loginEmail } = useAuthContext();
  // Create refs for each of the 6 PIN input boxes
  const inputRefs = useRef([...Array(6)].map(() => React.createRef()));
  const [isPinVisible, setIsPinVisible] = useState(false);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    console.log("Keyboard dismissed");
  };

  const togglePinVisibility = () => {
    setIsPinVisible(!isPinVisible);
    console.log("PIN visibility toggled. Now visible:", !isPinVisible);
  };

  // Validation expects a 6-digit PIN
  const validationSchema = Yup.object().shape({
    pin: Yup.string()
      .required("PIN is required")
      .matches(/^\d{6}$/, "PIN must be exactly 6 digits"),
  });

  // When the form is submitted, remove any underscores and call the login API.
  const handleSubmitPin = async (values, { setFieldValue, setFieldTouched, handleBlur }) => {
    const finalPin = values.pin.replace(/_/g, "");
    console.log("Submitting PIN for login:", finalPin);
    const temp = { email: loginEmail, password: finalPin };
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
            {/* Top Section */}
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
                <Text style={styles.headerCardTitle}>Log in to your account</Text>
                <Text style={styles.headerCardSubtitle}>
                  Enter your PIN to proceed
                </Text>
              </View>
            </View>

            {/* White Container: Formik form for PIN input */}
            <View style={styles.whiteContainer}>
              <Formik
                initialValues={{ pin: "______" }}
                validationSchema={validationSchema}
                onSubmit={handleSubmitPin}
              >
                {({
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  values,
                  errors,
                  touched,
                  setFieldValue,
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
                            key={`pin-${index}`}
                            ref={(ref) => (inputRefs.current[index] = ref)}
                            style={styles.pinInput}
                            keyboardType="phone-pad"
                            maxLength={1}
                            value={
                              values.pin[index] === "_" ? "" : values.pin[index]
                            }
                            onChangeText={(digit) => {
                              let newPin = values.pin.split("");
                              newPin[index] = digit || "_";
                              const joined = newPin.join("");
                              setFieldValue("pin", joined);
                              if (digit && index < 5) {
                                inputRefs.current[index + 1].focus();
                              }
                            }}
                            onKeyPress={(e) => {
                              if (
                                e.nativeEvent.key === "Backspace" &&
                                values.pin[index] === "_" &&
                                index > 0
                              ) {
                                inputRefs.current[index - 1].focus();
                              }
                            }}
                            onBlur={() => {
                              setFieldTouched("pin", true);
                              handleBlur("pin");
                              console.log(`Input at index ${index} blurred`);
                            }}
                            secureTextEntry={!isPinVisible}
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
                            name={isPinVisible ? "eye-off-outline" : "eye-outline"}
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
                        if (values.pin.replace(/_/g, "").length === 6) {
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
    zIndex: 0,
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
  // Updated PIN input style (same as SignUpPage)
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
