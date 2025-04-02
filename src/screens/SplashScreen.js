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
  SafeAreaView,
} from "react-native"; 

const { width, height } = Dimensions.get("window");

const SplashScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }).start();
    }, 500);
    return () => clearTimeout(timer);
  }, [fadeAnim]);

  return (
    <SafeAreaView style={styles.safeArea}>
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

        {/* <Animated.View style={[styles.footerContainer, { opacity: fadeAnim }]}>
          <Text style={styles.footerText}>
            Events, Experiences, Connections
          </Text>
        </Animated.View> */}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#1a0000",
  },
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: "absolute",
    width: width,
    height: height + (Platform.OS === "android" ? 50 : 0),
    top: 0,
    left: 0,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 50,
    paddingBottom: Platform.OS === "ios" ? 40 : 70,
  },
  logo: {
    width: width * 0.9,
    height: height * 0.4,
    marginBottom: 10,
  },
  footerContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 40 : 60,
    width: "100%",
    alignItems: "center",
  },
  footerText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: "Poppins-Regular",
    textAlign: "center",
  },
});

export default SplashScreen;
