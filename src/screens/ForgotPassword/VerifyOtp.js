import React, { useRef, useState, useEffect } from "react";
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
import { requestOTP, verifyOTP } from "../../api/auth_api";
import Toast from "react-native-toast-message";

const VerifyOtp = ({ navigation }) => {
  const inputRefs = useRef([]);
  const { forgotEmail } = useAuthContext();
  const [timeLeft, setTimeLeft] = useState(60);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const validationSchema = Yup.object().shape({
    otp: Yup.string()
      .required("OTP is required")
      .matches(/^\d{6}$/, "OTP must be exactly 6 digits"),
  });

  const handleSendAgain = async () => {
    setIsLoading(true);
    const res = await requestOTP(forgotEmail);
    if (res.isOk) {
      Toast.show({
        type: "success",
        text1: res.message,
        position: "bottom",
        visibilityTime: 2000,
      });
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

  const handleVerifyAndContinue = async (values) => {
    setIsLoading(true);
    const payload = { email: forgotEmail, otp: values.otp };
    const res = await verifyOTP(payload);
    if (res.isOk) {
      Toast.show({
        type: "success",
        text1: res.message,
        position: "bottom",
        visibilityTime: 2000,
      });
      setTimeout(() => {
        navigation.navigate("VerifyCode");
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
                onPress={() => navigation.navigate("ForgotPassword")}
              >
                <Ionicons name="chevron-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <Image
                source={require("../../../assets/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <View style={styles.headerCard}>
                <Text style={styles.headerCardTitle}>Verification Code</Text>
                <Text style={styles.headerCardSubtitle}>
                  Verification code sent to {forgotEmail}
                </Text>
              </View>
            </View>

            <View style={styles.whiteContainer}>
              <Formik
                initialValues={{ otp: "" }}
                validationSchema={validationSchema}
                onSubmit={() => {}}
              >
                {({
                  handleChange,
                  handleBlur,
                  values,
                  errors,
                  touched,
                }) => (
                  <>
                    <View style={styles.inputContainer}>
                      <View style={styles.otpContainer}>
                        {[...Array(6)].map((_, index) => (
                          <TextInput
                            key={index}
                            ref={(ref) => (inputRefs.current[index] = ref)}
                            style={[
                              styles.otpInput,
                              values.otp[index] && styles.otpInputFilled,
                            ]}
                            keyboardType="phone-pad"
                            maxLength={1}
                            value={values.otp[index]}
                            onChangeText={(val) => {
                              const newOtp =
                                values.otp.substring(0, index) +
                                val +
                                values.otp.substring(index + 1);
                              handleChange("otp")(newOtp);
                              if (val && index < 5) {
                                inputRefs.current[index + 1].focus();
                              }
                            }}
                            onKeyPress={(e) => {
                              if (
                                e.nativeEvent.key === "Backspace" &&
                                index > 0
                              ) {
                                const newOtp =
                                  values.otp.substring(0, index) +
                                  " " +
                                  values.otp.substring(index + 1);
                                handleChange("otp")(newOtp);
                                inputRefs.current[index - 1].focus();
                              }
                            }}
                            onBlur={handleBlur("otp")}
                          />
                        ))}
                      </View>
                      {touched.otp && errors.otp && (
                        <Text style={styles.errorText}>{errors.otp}</Text>
                      )}
                      <View style={styles.timerRow}>
                        <Text style={styles.timerText}>Didn’t receive code? </Text>
                        {timeLeft > 0 ? (
                          <Text style={styles.timer}>Wait {timeLeft}s</Text>
                        ) : (
                          <TouchableOpacity
                            onPress={handleSendAgain}
                            activeOpacity={0.7}
                            disabled={isLoading}
                          >
                            <Text style={styles.timer}>Send Again</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Button placed here, so it's below the "Didn’t receive code?" text */}
                      <TouchableOpacity
                        style={styles.verifyButton}
                        onPress={() => handleVerifyAndContinue(values)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.verifyButtonText}>
                          Verify and Continue
                        </Text>
                      </TouchableOpacity>
                    </View>
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
    backgroundColor: "#000",
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
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  otpInput: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 18,
    fontFamily: "Poppins-Regular",
    backgroundColor: "#FFF",
  },
  otpInputFilled: {
    backgroundColor: "#F5F5F5",
    borderColor: "#000",
  },
  errorText: {
    color: "#F00",
    fontSize: 12,
    marginBottom: 8,
    fontFamily: "Poppins-Regular",
  },
  timerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 20, 
  },
  timerText: {
    color: "#666",
    fontSize: 14,
    fontFamily: "Poppins-Regular",
  },
  timer: {
    color: "#E3000F",
    fontSize: 14,
    fontFamily: "Poppins-Medium",
  },
  verifyButton: {
    backgroundColor: "#E3000F",
    borderRadius: 25,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Poppins-Medium",
  },
});

export default VerifyOtp;
