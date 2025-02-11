import React, { useRef } from "react";
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

const VerifyOtp = ({ navigation }) => {
  const inputRefs = useRef([]);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const validationSchema = Yup.object().shape({
    otp: Yup.string()
      .required("OTP is required")
      .matches(/^\d{6}$/, "OTP must be exactly 6 digits"),
  });

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.container}
      >
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
                  Verification code sent successfully to your registered email
                  address **hiindia@gmail.com**
                </Text>
              </View>
            </View>

            <View style={styles.whiteContainer}>
              <Formik
                initialValues={{ otp: "" }}
                validationSchema={validationSchema}
                onSubmit={(values) => {
                  console.log("Verifying OTP:", values.otp);
                  navigation.navigate("VerifyCode");
                }}
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
                      <View style={styles.otpContainer}>
                        {[...Array(6)].map((_, index) => (
                          <TextInput
                            key={index}
                            ref={(ref) => (inputRefs.current[index] = ref)}
                            style={[
                              styles.otpInput,
                              values.otp[index] && styles.otpInputFilled,
                            ]}
                            keyboardType="numeric"
                            maxLength={1}
                            value={values.otp[index]}
                            onChangeText={(value) => {
                              const newOtp =
                                values.otp.substring(0, index) +
                                value +
                                values.otp.substring(index + 1);
                              handleChange("otp")(newOtp);
                              if (value && index < 5) {
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
                            placeholder="-"
                            placeholderTextColor="#999"
                          />
                        ))}
                      </View>
                      {touched.otp && errors.otp && (
                        <Text style={styles.errorText}>{errors.otp}</Text>
                      )}
                      <TouchableOpacity
                        onPress={() => navigation.navigate("ForgotPassword")}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.timerText}>
                          Didn’t receive code?{" "}
                          <Text style={styles.timer}>01:30</Text>
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.verifyButton}
                      onPress={handleSubmit}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.verifyButtonText}>
                        Verify and Continue
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
    bottom: -50,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 10,
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
    marginTop: 4,
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    lineHeight: 18,
    textAlign: "left",
  },
  whiteContainer: {
    flex: 0.7,
    backgroundColor: "#FFFFFF",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 80,
  },
  inputContainer: {
    marginBottom: 20,
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
    backgroundColor: "#FFFFFF",
  },
  otpInputFilled: {
    backgroundColor: "#F5F5F5",
    borderColor: "#000000",
  },
  errorText: {
    color: "#FF0000",
    fontSize: 12,
    marginBottom: 8,
    fontFamily: "Poppins-Regular",
  },
  timerText: {
    color: "#666666",
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    textAlign: "center",
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
    marginTop: 20,
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins-Medium",
  },
});

export default VerifyOtp;
