import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  LogBox,
  YellowBox,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import RenderHtml from "react-native-render-html";
import { useWindowDimensions } from "react-native";

// More aggressive warning suppression
LogBox.ignoreAllLogs(); // Disable all yellow box warnings
YellowBox.ignoreWarnings(["Support for defaultProps"]);

export default function ExchangeAndRefund({ route, navigation }) {
  const { data } = route.params;
  const { width } = useWindowDimensions();

  useEffect(() => {
    // Ensure warnings are suppressed when component mounts
    LogBox.ignoreLogs([
      "Support for defaultProps will be removed from function components",
      "Support for defaultProps will be removed from memo components",
    ]);
  }, []);

  // Custom renderer for headings to make them more compact
  const renderers = {
    h1: ({ children }) => <Text style={styles.heading}>{children}</Text>,
    h2: ({ children }) => <Text style={styles.subheading}>{children}</Text>,
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
        animated
      />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exchange & Refund</Text>
      </View>

      {/* Main Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {data?.Description ? (
          <RenderHtml
            contentWidth={width - 30}
            source={{ html: data.Description }}
            renderers={renderers}
            enableCSSInlineProcessing={true}
            tagsStyles={{
              p: {
                fontSize: 14,
                color: "#4B5563",
                lineHeight: 18,
                marginVertical: 4,
                fontFamily: "Poppins-Regular",
              },
              strong: {
                fontFamily: "Poppins-SemiBold",
                color: "#1F2937",
              },
              h1: {
                fontSize: 16,
                fontWeight: "bold",
                color: "#1F2937",
                marginTop: 14,
                marginBottom: 2,
                fontFamily: "Poppins-Bold",
              },
              h2: {
                fontSize: 15,
                fontWeight: "600",
                color: "#1F2937",
                marginTop: 10,
                marginBottom: 2,
                fontFamily: "Poppins-SemiBold",
              },
              ul: {
                marginLeft: 0,
                marginVertical: 2,
              },
              li: {
                fontSize: 14,
                color: "#4B5563",
                marginVertical: 2,
                fontFamily: "Poppins-Regular",
              },
              a: {
                color: "#E3000F",
                textDecorationLine: "none",
              },
              div: {
                marginVertical: 0,
              },
              span: {
                fontFamily: "Poppins-Regular",
              },
              br: {
                height: 4,
              },
              body: {
                fontFamily: "Poppins-Regular",
              },
            }}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.paragraph}>Loading content...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 40 : 40,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  contentContainer: {
    paddingBottom: 15,
  },
  heading: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    fontFamily: "Poppins-Bold",
    marginTop: 12,
    marginBottom: 2,
  },
  subheading: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    fontFamily: "Poppins-SemiBold",
    marginTop: 10,
    marginBottom: 2,
  },
  paragraph: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 18,
    fontFamily: "Poppins-Regular",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
});
