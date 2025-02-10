import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const LoginPinScreen = ({ navigation }) => {
  const [pin, setPin] = useState(Array(6).fill(""));
  const [isPinVisible, setIsPinVisible] = useState(false);
  const inputRefs = useRef([]);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const togglePinVisibility = () => {
    setIsPinVisible(!isPinVisible);
  };

  const handlePinChange = (value, index) => {
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePinLogin = () => {
    const enteredPin = pin.join("");
    console.log("Logging in with PIN:", enteredPin);
    navigation.navigate("Home");
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={styles.inner}>
            <View style={styles.topSection}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="chevron-back" size={24} color="#FFF" />
              </TouchableOpacity>

              <Image
                source={require("../../assets/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <View style={styles.headerCard}>
                <Text style={styles.headerCardTitle}>Log in to your account</Text>
                <Text style={styles.headerCardSubtitle}>Enter your PIN to proceed</Text>
              </View>
            </View>

            <View style={styles.whiteContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Enter SECURITY PIN</Text>
                <Text style={styles.inputSubtitle}>Enter your 6 digit SECURITY PIN.</Text>

                <View style={styles.pinContainer}>
                  {[...Array(6)].map((_, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => (inputRefs.current[index] = ref)}
                      style={[styles.pinInput, pin[index] && styles.pinInputFilled]}
                      keyboardType="numeric"
                      maxLength={1}
                      value={pin[index]}
                      onChangeText={(value) => handlePinChange(value, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      secureTextEntry={!isPinVisible}
                      placeholder="-"
                      placeholderTextColor="#999"
                    />
                  ))}
                </View>

                <View style={styles.forgotPinRow}>
                  <TouchableOpacity>
                    <Text style={styles.forgotPinText}>Forgot SECURITY PIN?</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={togglePinVisibility} style={styles.eyeIcon}>
                    <Ionicons
                      name={isPinVisible ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#666666"
                    />
                    <Text style={styles.showText}>{isPinVisible ? "Hide" : "Show"}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={handlePinLogin}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonText}>Login</Text>
              </TouchableOpacity>
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
    flex: 0.7,
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
    fontFamily: "Poppins-Regular",
    color: "#000000",
    marginBottom: 8,
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
    fontSize: 18,
    fontFamily: "Poppins-Regular",
    backgroundColor: "#FFFFFF",
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
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins-Medium",
  },
});

export default LoginPinScreen;