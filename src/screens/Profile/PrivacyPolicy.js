import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function PrivacyPolicy({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      {/* Main Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.introText}>
          Welcome to HiIndia Events! Your privacy is important to us.
        </Text>

        {/* a. Personal Information */}
        <Text style={styles.subHeader}>a. Personal Information</Text>
        <Text style={styles.paragraph}>
          Name, email address, phone number, and other registration details provided
          when creating an account or registering for an event.
        </Text>
        <Text style={styles.paragraph}>
          Payment information if required to pay for event registration (handled by
          third-party payment processors).
        </Text>

        {/* b. Non-Personal Information */}
        <Text style={styles.subHeader}>b. Non-Personal Information</Text>
        <Text style={styles.paragraph}>
          Device information (e.g. device type, operating system, browser type),
          app usage data, such as pages visited, buttons clicked, and session duration.
        </Text>
        <Text style={styles.paragraph}>
          IP address and geolocation data (if allowed by your device settings).
        </Text>

        {/* Data Security */}
        <Text style={styles.subHeader}>Data Security</Text>
        <Text style={styles.paragraph}>
          We implement industry-standard security measures to protect user data from
          unauthorized access. However, no system is completely secure, and we cannot
          guarantee absolute security.
        </Text>

        {/* Third-Party Links */}
        <Text style={styles.subHeader}>Third-Party Links</Text>
        <Text style={styles.paragraph}>
          The app may contain links to third-party websites or services. We are not
          responsible for their privacy practices. Please review their privacy
          policies.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 65 : 25,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    width: 35,
    height: 35,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginLeft: 8,
    fontFamily: "Poppins-Bold",
  },
  introText: {
    fontSize: 16,
    color: "#1F2937",
    marginBottom: 16,
    marginTop:14,
    lineHeight: 20,
    fontFamily: "Poppins-medium",
  },
  subHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 6,
    marginTop: 12,
    fontFamily: "Poppins-SemiBold",
  },
  paragraph: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: "Poppins-Regular",
  },
});
