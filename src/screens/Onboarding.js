import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from "react-native";

const { width, height } = Dimensions.get("window");

const Onboarding = ({ navigation }) => {
  const handleGetStarted = () => {
    navigation.replace("Login");
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <Image
        source={require("../../assets/onboarding.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.textContent}>
          <Text style={styles.title}>
            Your Gateway to Global{"\n"}Events and Unforgettable{"\n"}
            Experiences.
          </Text>

          <Text style={styles.description}>
            Stay updated with the latest events,{"\n"}exclusive experiences, and
            must-attend{"\n"}gatherings tailored to your interests.{"\n"}
            Seamlessly connect and make the most{"\n"}of every event.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Get Started {">"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: "absolute",
    width: width,
    height: height,
    top: 0,
    left: 0,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logo: {
    width: "100%",
    height: height * 0.09,
  },
  textContent: {
    paddingHorizontal: 25,
  },
  title: {
    fontSize: 28,
    fontFamily: "Poppins-Bold",
    color: "#FFFFFF",
    marginBottom: 20,
    lineHeight: 36,
  },
  description: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#FFFFFF",
    opacity: 0.8,
    marginBottom: 30,
    lineHeight: 24,
  },
  button: {
    backgroundColor: "#E3000F",
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Poppins-Medium",
  },
});

export default Onboarding;
