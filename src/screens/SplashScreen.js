import React, { useEffect, useRef } from "react";
import {
  View,
  Image,
  StyleSheet,
  Text,
  StatusBar,
  Dimensions,
  Animated,
  Platform,
} from "react-native";

const { width, height } = Dimensions.get("window");

const SplashScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
        animated={true}
      />

      <Image
        source={require("../../assets/splashscreen.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      <View style={styles.contentContainer}>
        <Animated.Image
          source={require("../../assets/logo.png")}
          style={[styles.logo, { opacity: fadeAnim }]}
          resizeMode="contain"
        />

        <Animated.Text style={[styles.footerText, { opacity: fadeAnim }]}>
          Events, Experiences, Connections
        </Animated.Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a0000",
  },
  backgroundImage: {
    position: "absolute",
    width: width,
    height: height,
    top: 0,
    left: 0,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 50,
  },
  logo: {
    width: width * 0.7,
    height: height * 0.2,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: "Poppins-Regular",
    position: "absolute",
    bottom: 40,
    textAlign: "center",
  },
});

export default SplashScreen;
