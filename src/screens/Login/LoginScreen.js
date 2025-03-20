import React, { useEffect } from "react";
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
  Linking,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";

import Toast from "react-native-toast-message";
import { useAuthContext } from "../../context/AuthContext";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

import { handleGoogleLogin, verifyGoogleToken } from "../../api/auth_api";

GoogleSignin.configure({
  webClientId:
    "936625231687-ddktg6euin84vs3i5d96fatjpar3f78s.apps.googleusercontent.com",
});

const LoginScreen = ({ navigation }) => {
  const { setLoginEmail } = useAuthContext();

  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email("Enter a valid email")
      .required("Email is required"),
  });

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleLogin = async (values) => {
    const lowerCaseEmail = values.email.toLowerCase();
    console.log("Attempting login with email:", lowerCaseEmail);
    setLoginEmail(lowerCaseEmail);
    navigation.navigate("LoginPin");
  };

  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();

      const userInfo = await GoogleSignin.signIn();
      console.log("Google Sign-In userInfo:", userInfo);

      if (userInfo?.type === "success") {
        const idToken = userInfo?.data?.idToken;
        if (!idToken) {
          Toast.show({
            type: "info",
            text1: "Something went wrong. Try again later.",
          });
          return;
        }

        //  idToken to backend to verify
        const verificationResult = await verifyGoogleToken(idToken);
        console.log("Google token verification result:", verificationResult);

        if (verificationResult === true) {
          navigation.navigate("Tab");
        }
      } else {
        Toast.show({
          type: "info",
          text1: "Something went wrong. Try again later.",
        });
      }
    } catch (error) {
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Toast.show({
          type: "error",
          text1: "Google Play Services not available or outdated",
        });
      } else {
        console.log("Error during Google Sign-In:", error);
        Toast.show({
          type: "error",
          text1: "Google Sign-In Error",
          text2: error.message,
        });
      }
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
            <View style={styles.topSection}>
              <Image
                source={require("../../../assets/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />

            </View>

            <View style={styles.whiteContainer}>
            <View style={styles.headerCard}>
                <Text style={styles.headerCardTitle}>
                  Log in to your account
                </Text>
                <Text style={styles.headerCardSubtitle}>
                  Enter Your Email address to continue
                </Text>
              </View>
              <View style={styles.contentContainer}>
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
                        <TouchableOpacity
                          onPress={() => navigation.navigate("SignUp")}
                        >
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

                      <TouchableOpacity
                        style={styles.socialButton}
                        onPress={handleGoogleSignIn}
                      >
                        <Image
                          source={require("../../../assets/google.png")}
                          style={styles.socialIcon}
                        />
                        <Text style={styles.socialButtonText}>
                          Continue with Google
                        </Text>
                      </TouchableOpacity> 

                      <View style={styles.termsContainer}>
                        <Text style={styles.termsText}>
                          By continuing, you agree to our{" "}
                          <Text
                            style={styles.linkText}
                            onPress={() =>
                              Linking.openURL(
                                "https://participanthiindia.barodaweb.org/terms-and-condition"
                              )
                            }
                          >
                            Terms and conditions
                          </Text>
                        </Text>
                      </View>
                    </>
                  )}
                </Formik>
              </View>
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
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 50,
    paddingBottom: 50,
    height: 200,
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
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 15,
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 10,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 80,
    marginTop: 15,
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
  requiredAsterisk: {
    color: "#FF0000",
  },
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
  greyText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
  },
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
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
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
  socialIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  socialButtonText: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#000000",
    marginRight: 32,
  },
  termsContainer: {
    marginBottom: 24,
  },
  termsText: {
    textAlign: "center",
    fontSize: 10,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    lineHeight: 18,
  },
  linkText: {
    color: "#FF0000",
    textDecorationLine: "underline",
  },
});

export default LoginScreen;
