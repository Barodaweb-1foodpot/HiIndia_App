import React from "react";
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
  ScrollView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Formik } from "formik";
import * as Yup from "yup";

const LoginScreen = ({ navigation }) => {
  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email("Enter a valid email")
      .required("Email is required"),
  });

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleLogin = (values) => {
    console.log("Logging in with:", values.email);
    navigation.navigate("LoginPin");
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
                onPress={() => {
                  if (navigation.canGoBack()) {
                    navigation.goBack();
                  } else {
                    navigation.navigate("Onboarding");
                  }
                }}
              >
                <Ionicons name="chevron-back" size={24} color="#FFF" />
              </TouchableOpacity>

              <Image
                source={require("../../assets/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <View style={styles.headerCard}>
                <Text style={styles.headerCardTitle}>
                  Log in to your account
                </Text>
                <Text style={styles.headerCardSubtitle}>
                  Enter Your Email address to continue
                </Text>
              </View>
            </View>
            <View style={styles.whiteContainer}>
              <ScrollView
                contentContainerStyle={styles.scrollViewContent}
                showsVerticalScrollIndicator={false}
              >
                <Formik
                  initialValues={{ email: "" }}
                  validationSchema={validationSchema}
                  onSubmit={handleLogin}
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
                        <Text style={styles.inputLabel}>
                          Email <Text style={styles.requiredAsterisk}>*</Text>
                        </Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Email Address"
                          placeholderTextColor="#AAAAAA"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          onChangeText={handleChange("email")}
                          onBlur={handleBlur("email")}
                          value={values.email}
                        />
                        {touched.email && errors.email && (
                          <Text style={styles.errorText}>{errors.email}</Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleSubmit}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.loginButtonText}>Log in</Text>
                      </TouchableOpacity>
                      <View style={styles.createAccountContainer}>
                        <Text style={styles.greyText}>
                          Don't have an account?{" "}
                        </Text>
                        <TouchableOpacity>
                          <Text style={styles.createAccountText}>
                            Create One
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.dividerContainer}>
                        <View style={styles.divider} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.divider} />
                      </View>
                      <TouchableOpacity style={styles.socialButton}>
                        <Image
                          source={require("../../assets/email.png")}
                          style={styles.socialIcon}
                        />
                        <Text style={styles.socialButtonText}>
                          Continue with Email
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.socialButton}>
                        <Image
                          source={require("../../assets/google.png")}
                          style={styles.socialIcon}
                        />
                        <Text style={styles.socialButtonText}>
                          Continue with Google
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.appleButton}>
                        <Image
                          source={require("../../assets/apple.png")}
                          style={[styles.socialIcon, styles.appleIcon]}
                        />
                        <Text style={styles.appleButtonText}>
                          Continue with Apple
                        </Text>
                      </TouchableOpacity>
                      <View style={styles.termsContainer}>
                        <Text style={styles.termsText}>
                          By continuing, you agree to our{" "}
                          <Text style={styles.linkText}>Privacy Policy</Text>{" "}
                          and <Text style={styles.linkText}>Terms of Use</Text>
                        </Text>
                      </View>
                    </>
                  )}
                </Formik>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: { flex: 1, backgroundColor: "#000000" },
  container: { flex: 1 },
  inner: { flex: 1 },
  topSection: {
    flex: 0.3,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  backButton: { position: "absolute", top: 48, left: 16 },
  logo: { width: "100%", height: 60, marginTop: 10 },
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
  whiteContainer: { flex: 0.8, backgroundColor: "#FFFFFF" },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  inputContainer: { marginBottom: 20 },
  inputLabel: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#000000",
    marginBottom: 8,
  },
  requiredAsterisk: { color: "#FF0000" },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    backgroundColor: "#FFFFFF",
  },
  errorText: {
    marginTop: 4,
    color: "#FF0000",
    fontSize: 12,
    fontFamily: "Poppins-Regular",
  },
  loginButton: {
    backgroundColor: "#E3000F",
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#000000",
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins-Medium",
  },
  createAccountContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 24,
  },
  greyText: { fontSize: 14, fontFamily: "Poppins-Regular", color: "#666666" },
  createAccountText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#000000",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  divider: { flex: 1, height: 1, backgroundColor: "#E0E0E0" },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 24,
    marginBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
  },
  socialIcon: { width: 20, height: 20, marginRight: 12 },
  socialButtonText: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#000000",
    marginRight: 32,
  },
  appleButton: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 24,
    marginBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: "#000000",
  },
  appleIcon: { tintColor: "#FFFFFF" },
  appleButtonText: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#FFFFFF",
    marginRight: 32,
  },
  termsContainer: { marginBottom: 24 },
  termsText: {
    textAlign: "center",
    fontSize: 10,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    lineHeight: 18,
  },
  linkText: { color: "#FF0000", textDecorationLine: "underline" },
});

export default LoginScreen;
