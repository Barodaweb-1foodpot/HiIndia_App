import React, { useRef , useState} from "react";
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
import { handleSetPassword } from "../../api/auth_api";
import Toast from "react-native-toast-message";

const VerifyCode = ({ navigation }) => {
  const resetInputRefs = useRef([]);
  const { forgot_id, setForgot_Id } = useAuthContext()
    const [isloading, setIsLoading] = useState(false)
  
  const confirmInputRefs = useRef([]);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const validationSchema = Yup.object().shape({
    resetPin: Yup.string()
      .required("Reset PIN is required")
      .matches(/^\d{6}$/, "Reset PIN must be exactly 6 digits"),
    confirmPin: Yup.string()
      .required("Confirm PIN is required")
      .oneOf([Yup.ref("resetPin")], "Pins do not match")
      .matches(/^\d{6}$/, "Confirm PIN must be exactly 6 digits"),
  });


  const handleResetPassword = async (values) => {
    console.log(forgot_id)

    const res = await handleSetPassword(forgot_id, values.confirmPin)
    console.log("-----------",res)
    if (res.isOk) {

      setIsLoading(false)
      Toast.show({
        type: "success",
        text1: res.message,
        position: "top",
        visibilityTime: 2000,
      });
      setTimeout(() => {
        navigation.navigate("Login");
      }, 1000);

    }
    else {
      setIsLoading(false)
      Toast.show({
        type: "error",
        text1: res.message,
        position: "top",
        visibilityTime: 2000,
      });

    }
  }

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
                <Text style={styles.headerCardTitle}>Update Security PIN</Text>
                <Text style={styles.headerCardSubtitle}>
                  Set a new PIN to keep your account secure
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
                            keyboardType="numeric"
                            maxLength={1}
                            value={values.resetPin[index]}
                            onChangeText={(value) => {
                              const newPin =
                                values.resetPin.substring(0, index) +
                                value +
                                values.resetPin.substring(index + 1);
                              handleChange("resetPin")(newPin);
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
                              }
                            }}
                            onBlur={handleBlur("resetPin")}
                            placeholder="-"
                            placeholderTextColor="#999"
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
                              values.confirmPin[index] &&
                              styles.pinInputFilled,
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
                              }
                            }}
                            onBlur={handleBlur("confirmPin")}
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
                      style={styles.resetButton}
                      onPress={handleSubmit}
                      disabled={isloading}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.resetButtonText}>
                       {isloading ? "Setting...." :" Reset and Continue"}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </Formik>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      <Toast/>
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
    paddingVertical: 12,
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
    textAlign: "left",
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

export default VerifyCode;
