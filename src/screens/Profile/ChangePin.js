import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import Toast from "react-native-toast-message";
import { Formik } from "formik";
import * as Yup from "yup";

export default function ChangePin({ navigation }) {
  const pinInputRefs = useRef([]);
  const confirmPinInputRefs = useRef([]);
  const [isLoading, setIsLoading] = useState(false);

  const validationSchema = Yup.object().shape({
    pin: Yup.string()
      .required("PIN is required")
      .matches(/^\d{6}$/, "PIN must be exactly 6 digits"),
    confirmPin: Yup.string()
      .required("Confirm PIN is required")
      .oneOf([Yup.ref("pin")], "Pins do not match")
      .matches(/^\d{6}$/, "Confirm PIN must be exactly 6 digits"),
  });

  const handleChangePin = async (values) => {
    setIsLoading(true);
    try {
      console.log("PIN:", values.pin);
      console.log("Confirm PIN:", values.confirmPin);
      Toast.show({
        type: "success",
        text1: "PIN Updated",
        text2: "Your PIN has been updated successfully.",
      });
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update PIN.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={18} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Enter new security PIN</Text>
          </View>

          <Text style={styles.subHeader}>
            This will be your new PIN to authorise transactions. Make sure your
            PIN is unique and secure!
          </Text>

          <Formik
            initialValues={{ pin: "", confirmPin: "" }}
            validationSchema={validationSchema}
            onSubmit={handleChangePin}
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
                <View style={styles.formContainer}>
                  <Text style={styles.label}>Reset PIN</Text>
                  <View style={styles.pinContainer}>
                    {[...Array(6)].map((_, index) => (
                      <TextInput
                        key={`pin-${index}`}
                        ref={(ref) => (pinInputRefs.current[index] = ref)}
                        style={[
                          styles.pinInput,
                          values.pin[index] && styles.pinInputFilled,
                        ]}
                        keyboardType="numeric"
                        maxLength={1}
                        value={values.pin[index] || ""}
                        onChangeText={(val) => {
                          const newPin =
                            values.pin.substring(0, index) +
                            val +
                            values.pin.substring(index + 1);
                          handleChange("pin")(newPin);
                          if (val && index < 5) {
                            pinInputRefs.current[index + 1].focus();
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.nativeEvent.key === "Backspace" && index > 0) {
                            const newPin =
                              values.pin.substring(0, index) +
                              "" +
                              values.pin.substring(index + 1);
                            handleChange("pin")(newPin);
                            pinInputRefs.current[index - 1].focus();
                          }
                        }}
                        onBlur={handleBlur("pin")}
                        placeholder="-"
                        placeholderTextColor="#999"
                      />
                    ))}
                  </View>
                  {touched.pin && errors.pin && (
                    <Text style={styles.errorText}>{errors.pin}</Text>
                  )}

                  <Text style={[styles.label, { marginTop: 16 }]}>
                    Confirm PIN
                  </Text>
                  <View style={styles.pinContainer}>
                    {[...Array(6)].map((_, index) => (
                      <TextInput
                        key={`confirmPin-${index}`}
                        ref={(ref) =>
                          (confirmPinInputRefs.current[index] = ref)
                        }
                        style={[
                          styles.pinInput,
                          values.confirmPin[index] && styles.pinInputFilled,
                        ]}
                        keyboardType="numeric"
                        maxLength={1}
                        value={values.confirmPin[index] || ""}
                        onChangeText={(val) => {
                          const newPin =
                            values.confirmPin.substring(0, index) +
                            val +
                            values.confirmPin.substring(index + 1);
                          handleChange("confirmPin")(newPin);
                          if (val && index < 5) {
                            confirmPinInputRefs.current[index + 1].focus();
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.nativeEvent.key === "Backspace" && index > 0) {
                            const newPin =
                              values.confirmPin.substring(0, index) +
                              "" +
                              values.confirmPin.substring(index + 1);
                            handleChange("confirmPin")(newPin);
                            confirmPinInputRefs.current[index - 1].focus();
                          }
                        }}
                        onBlur={handleBlur("confirmPin")}
                        placeholder="-"
                        placeholderTextColor="#999"
                      />
                    ))}
                  </View>
                  {touched.confirmPin && errors.confirmPin && (
                    <Text style={styles.errorText}>{errors.confirmPin}</Text>
                  )}

                  <TouchableOpacity
                    style={styles.resetButton}
                    onPress={handleSubmit}
                    disabled={isLoading}
                  >
                    <Text style={styles.resetButtonText}>
                      {isLoading ? "Updating..." : "Update"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Formik>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Platform.OS === "ios" ? 45 : 15,
    marginBottom: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginLeft: 8,
    fontFamily: "Poppins-Bold",
  },
  subHeader: {
    fontSize: 12,
    color: "#666666",
    lineHeight: 18,
    marginBottom: 24,
    fontFamily: "Poppins-Regular",
  },
  formContainer: {
    marginTop: 20,
  },
  label: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
    fontFamily: "Poppins-Regular",
  },
  pinContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  errorText: {
    color: "#FF0000",
    fontSize: 12,
    marginTop: 4,
    fontFamily: "Poppins-Regular",
  },
  resetButton: {
    backgroundColor: "#E3000F",
    borderRadius: 25,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
  },
  resetButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins-Medium",
  },
});
