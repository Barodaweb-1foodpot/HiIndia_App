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
import { useAuthContext } from "../../context/AuthContext";
import { handleSetPassword } from "../../api/auth_api";
import Toast from "react-native-toast-message";

const VerifyCode = ({ navigation }) => {
  // Create refs for each of the 6-digit input boxes
  const resetInputRefs = useRef([...Array(6)].map(() => React.createRef()));
  const confirmInputRefs = useRef([...Array(6)].map(() => React.createRef()));
  const { forgot_id } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  
  // Local state arrays for reset and confirm PIN
  const [resetPin, setResetPin] = useState(["", "", "", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", "", "", ""]);

  // Dismiss the keyboard on tap outside
  const dismissKeyboard = () => {
    Keyboard.dismiss();
    console.log("Keyboard dismissed");
  };

  // ---------------- Reset PIN Logic ---------------- //
  const handleResetPinChange = (text, index) => {
    if (/^\d*$/.test(text)) {
      const newPin = [...resetPin];
      newPin[index] = text;
      setResetPin(newPin);
      // If a digit is entered and not the last box, move focus to the next
      if (text.length === 1 && index < 5) {
        resetInputRefs.current[index + 1].focus();
      }
    }
  };

  const handleResetPinKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace") {
      if (resetPin[index] === "" && index > 0) {
        const newPin = [...resetPin];
        newPin[index - 1] = "";
        setResetPin(newPin);
        resetInputRefs.current[index - 1].focus();
      }
    }
  };

  // ---------------- Confirm PIN Logic ---------------- //
  const handleConfirmPinChange = (text, index) => {
    if (/^\d*$/.test(text)) {
      const newPin = [...confirmPin];
      newPin[index] = text;
      setConfirmPin(newPin);
      // Move to next input if a digit is entered
      if (text.length === 1 && index < 5) {
        confirmInputRefs.current[index + 1].focus();
      }
    }
  };

  const handleConfirmPinKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace") {
      if (confirmPin[index] === "" && index > 0) {
        const newPin = [...confirmPin];
        newPin[index - 1] = "";
        setConfirmPin(newPin);
        confirmInputRefs.current[index - 1].focus();
      }
    }
  };

  // ---------------- Handle PIN Reset Submission ---------------- //
  const handleResetPassword = async () => {
    const resetPinStr = resetPin.join("");
    const confirmPinStr = confirmPin.join("");

    if (resetPinStr.length < 6 || confirmPinStr.length < 6) {
      Toast.show({
        type: "error",
        text1: "Please enter a complete 6-digit PIN for both fields",
        position: "bottom",
        visibilityTime: 2000,
      });
      return;
    }
    if (resetPinStr !== confirmPinStr) {
      Toast.show({
        type: "error",
        text1: "Pins do not match",
        position: "bottom",
        visibilityTime: 2000,
      });
      return;
    }
    setIsLoading(true);
    const res = await handleSetPassword(forgot_id, confirmPinStr);
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
            </View>

            <View style={styles.whiteContainer}>
              <View style={styles.headerCard}>
                <Text style={styles.headerCardTitle}>Update Security PIN</Text>
                <Text style={styles.headerCardSubtitle}>
                  Set a new PIN to keep your account secure
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Reset PIN</Text>
                <View style={styles.pinContainer}>
                  {[...Array(6)].map((_, index) => (
                    <TextInput
                      key={`reset-${index}`}
                      ref={(ref) => (resetInputRefs.current[index] = ref)}
                      style={styles.pinInput}
                      keyboardType="phone-pad"
                      maxLength={1}
                      value={resetPin[index]}
                      onChangeText={(text) => handleResetPinChange(text, index)}
                      onKeyPress={(e) => handleResetPinKeyPress(e, index)}
                    />
                  ))}
                </View>

                <Text style={styles.inputLabel}>Confirm PIN</Text>
                <View style={styles.pinContainer}>
                  {[...Array(6)].map((_, index) => (
                    <TextInput
                      key={`confirm-${index}`}
                      ref={(ref) => (confirmInputRefs.current[index] = ref)}
                      style={styles.pinInput}
                      keyboardType="phone-pad"
                      maxLength={1}
                      value={confirmPin[index]}
                      onChangeText={(text) =>
                        handleConfirmPinChange(text, index)
                      }
                      onKeyPress={(e) => handleConfirmPinKeyPress(e, index)}
                    />
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleResetPassword}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.resetButtonText}>
                  {isLoading ? "Setting..." : "Reset and Continue"}
                </Text>
              </TouchableOpacity>
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
    top: -40,
    alignSelf: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingVertical: 16,
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
  inputLabel: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#000000",
    marginBottom: 4,
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
    backgroundColor: "#fff",
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
});

export default VerifyCode;
