import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Platform,
  SafeAreaView,
} from "react-native";

const { width, height } = Dimensions.get("window");

const Onboarding = ({ navigation }) => {
  const handleGetStarted = () => {
    navigation.replace("Auth");
  };

  const handleSkip = () => {
    navigation.replace("Tab");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
        animated={true}
      />

      <Image
        source={require("../../assets/onboarding.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={handleSkip}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E3000F', // Match background color with your theme
  },
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: "absolute",
    width: width,
    height: height + (Platform.OS === 'android' ? 50 : 0), // Add extra height for Android
    top: 0,
    left: 0,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 50,
    paddingBottom: Platform.OS === "ios" ? 40 : 70, // Increased bottom padding
  },
  logoContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: -20,
  },
  logo: {
    width: "100%",
    top: Platform.OS === "ios" ? 10 : 25,
    height:Platform.OS === "ios" ? 100 : 110,
  },
  skipButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 15 : 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignSelf: 'flex-end',
  },
  skipButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    fontWeight: "500",
  },
  textContent: {
    paddingHorizontal: 25,
    marginBottom: Platform.OS === "ios" ? 0 : 20, // Add margin bottom for Android
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