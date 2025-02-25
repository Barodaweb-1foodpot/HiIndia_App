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
} from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { Formik } from "formik";
import * as Yup from "yup";
import { useAuthContext } from "../../context/AuthContext";
import { requestOTP } from "../../api/auth_api";

const ForgotPassword = ({ navigation }) => {
  const { setForgotEmail, forgotEmail, setForgot_Id } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    console.log("Keyboard dismissed");
  };

  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email("Enter a valid email")
      .required("Email is required"),
  });

  // Requests an OTP for the entered email
  const handleSendOTP = async (values) => {
    console.log("Requesting OTP for:", values.email);
    setIsLoading(true);
    setForgotEmail(values.email);
    const res = await requestOTP(values.email);
    console.log("OTP request response:", res);
    if (res.isOk) {
      setForgot_Id(res.data._id);
      Toast.show({
        type: "success",
        text1: res.message,
        position: "bottom",
        visibilityTime: 2000,
      });
      setTimeout(() => {
        console.log("Navigating to VerifyOtp screen");
        navigation.navigate("VerifyOtp");
      }, 2000);
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
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
        animated
      />
      <KeyboardAvoidingView style={styles.container}>
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={styles.inner}>
            <View style={styles.topSection}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  console.log("Navigating back to Login");
                  navigation.navigate("Login");
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
                <Text style={styles.headerCardTitle}>Forgot Password</Text>
                <Text style={styles.headerCardSubtitle}>
                  Enter your registered email address below to recover your password.
                </Text>
              </View>
            </View>

            <View style={styles.whiteContainer}>
              <Formik
                initialValues={{ email: forgotEmail || "" }}
                validationSchema={validationSchema}
                onSubmit={handleSendOTP}
              >
                {({
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  values,
                  errors,
                  touched,
                }) => (
                  <>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Email</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="example@example.com"
                        placeholderTextColor="#999"
                        keyboardType="email-address"
                        value={values.email}
                        onChangeText={handleChange("email")}
                        onBlur={handleBlur("email")}
                        autoCapitalize="none"
                      />
                      {touched.email && errors.email && (
                        <Text style={styles.errorText}>{errors.email}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.sendOTPButton}
                      onPress={() => {
                        console.log("Send OTP pressed for:", values.email);
                        handleSubmit();
                      }}
                      activeOpacity={0.8}
                      disabled={isLoading}
                    >
                      <Text style={styles.sendOTPButtonText}>
                        {isLoading ? "Sending..." : "Send OTP"}
                      </Text>
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
    zIndex: 10,
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
  },
  inputContainer: {
    marginTop: 35,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#000",
    marginBottom: 10,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    backgroundColor: "#FFF",
    color: "#000",
  },
  errorText: {
    color: "#F00",
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
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Poppins-Medium",
  },
});

export default ForgotPassword;
