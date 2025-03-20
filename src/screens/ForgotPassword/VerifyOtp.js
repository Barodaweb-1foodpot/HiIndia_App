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
import { useAuthContext } from "../../context/AuthContext";
import { requestOTP, verifyOTP } from "../../api/auth_api";
import Toast from "react-native-toast-message";

const VerifyOtp = ({ navigation }) => {
  // Create refs for the 6 OTP input boxes
  const inputRefs = useRef([...Array(6)].map(() => React.createRef()));
  const { forgotEmail } = useAuthContext();
  const [timeLeft, setTimeLeft] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  // Local state array for the 6-digit code
  const [code, setCode] = useState(["", "", "", "", "", ""]);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

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
      setTimeLeft(60);
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

  const handleInputChange = (text, index) => {
    // Only allow numeric input
    if (/^\d*$/.test(text)) {
      const newCode = [...code];
      newCode[index] = text;
      setCode(newCode);
      // Move focus to next input if a digit is entered (and not the last box)
      if (text.length === 1 && index < 5) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace") {
      // If current box is empty and not the first, clear previous box and focus it
      if (code[index] === "" && index > 0) {
        const newCode = [...code];
        newCode[index - 1] = "";
        setCode(newCode);
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handleSubmitOTP = async () => {
    const otp = code.join("");
    if (otp.length < 6) {
      Toast.show({
        type: "error",
        text1: "Please enter the complete 6-digit OTP",
        position: "bottom",
        visibilityTime: 2000,
      });
      return;
    }
    setIsLoading(true);
    const payload = { email: forgotEmail, otp };
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
            </View>

            <View style={styles.whiteContainer}>
              <View style={styles.headerCard}>
                <Text style={styles.headerCardTitle}>Verification Code</Text>
                <Text style={styles.headerCardSubtitle}>
                  Verification code sent to {forgotEmail}
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.otpContainer}>
                  {[...Array(6)].map((_, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => (inputRefs.current[index] = ref)}
                      style={styles.otpInput}
                      keyboardType="phone-pad"
                      maxLength={1}
                      value={code[index]}
                      onChangeText={(val) => handleInputChange(val, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                    />
                  ))}
                </View>
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

                <TouchableOpacity
                  style={styles.verifyButton}
                  onPress={handleSubmitOTP}
                  activeOpacity={0.8}
                >
                  <Text style={styles.verifyButtonText}>
                    Verify and Continue
                  </Text>
                </TouchableOpacity>
              </View>
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
    height: 200,
  },
  backButton: {
    position: "absolute",
    top: 45,
    left: 16,
    zIndex: 1,
  },
  logo: {
    width: "100%",
    height: 70,
    marginTop: 20,
  },
  headerCard: {
    position: "absolute",
    top: -35,
    alignSelf: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 20,
    width: "95%",
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 10,
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
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    textAlign: "center",
    fontSize: 18,
    backgroundColor: "#fff",
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
