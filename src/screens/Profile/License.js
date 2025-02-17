import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function License({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>License Agreement</Text>
      </View>

      {/* Main Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.introText}>
          Please read the following terms carefully before using the App.
        </Text>

        {/* 1. Grant of License */}
        <Text style={styles.subHeader}>1. Grant of License</Text>
        <Text style={styles.paragraph}>
          The Company grants you a limited, non-exclusive, revocable license to
          download, install, and use the App on your personal device solely for
          personal, non-commercial purposes, subject to the terms of this
          Agreement.
        </Text>

        {/* 2. Restrictions */}
        <Text style={styles.subHeader}>2. Restrictions</Text>
        <Text style={styles.paragraph}>
          You agree not to:
          {"\n"}• Modify, reverse-engineer, decompile, or disassemble the App.
          {"\n"}• Use the App for any illegal, harmful, or unauthorized purpose.
          {"\n"}• Rent, lease, sublicense, distribute, or transfer the App to
          any third party.
          {"\n"}• Copy or reproduce any part of the App, except as permitted by
          this Agreement or applicable law.
          {"\n"}• Attempt to gain unauthorized access to the App or its
          associated systems or networks.
        </Text>

        {/* 3. Ownership */}
        <Text style={styles.subHeader}>3. Ownership</Text>
        <Text style={styles.paragraph}>
          The App, including all intellectual property, logos, designs, code, or
          content, is the sole property of the Company or its licensors. This
          Agreement does not grant you any ownership rights to the App.
        </Text>

        {/* 4. User Responsibilities */}
        <Text style={styles.subHeader}>4. User Responsibilities</Text>
        <Text style={styles.paragraph}>
          • You are responsible for maintaining the confidentiality of your
          account credentials and for all activity under your account.
          {"\n"}• You must ensure that your use of the App complies with all
          applicable laws and regulations.
        </Text>

        {/* 5. Termination (Optional) */}
        <Text style={styles.subHeader}>5. Termination</Text>
        <Text style={styles.paragraph}>
          The Company may terminate or suspend your access to the App at any
          time, without notice or liability, if you breach this Agreement or
          engage in any prohibited activity.
        </Text>

        {/* 6. Changes to Agreement (Optional) */}
        <Text style={styles.subHeader}>6. Changes to Agreement</Text>
        <Text style={styles.paragraph}>
          The Company reserves the right to modify or replace this Agreement at
          any time. Your continued use of the App after any such changes
          constitutes acceptance of the revised Agreement.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 65 : 15,
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
    marginTop: 14,
    lineHeight: 20,
    fontFamily: "Poppins-Medium",
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
