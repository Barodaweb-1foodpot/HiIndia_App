import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  StatusBar,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";

export default function HelpSupport() {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const stars = [1, 2, 3, 4, 5];

  const scaleAnim = useRef(stars.map(() => new Animated.Value(1))).current;

  const navigation = useNavigation();

  const handleSendFeedback = () => {
    Toast.show({
      type: "success",
      text1: "❤️ Thanks for your feedback!",
      position: "bottom",
    });
    setShowFeedbackModal(false);
    setFeedbackText("");
    setRating(0);
  };

  const handleStarPress = (index, starValue) => {
    Animated.sequence([
      Animated.timing(scaleAnim[index], {
        toValue: 1.3,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim[index], {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setRating(starValue);
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help/Support</Text>
      </View>

      {/* <TouchableOpacity
        style={styles.menuItem}
        onPress={() => setShowFeedbackModal(true)}
      >
        <View style={styles.menuLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="star-outline" size={20} color="#1F2937" />
          </View>
          <Text style={styles.menuText}>Rate Us/Feedback</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
      </TouchableOpacity> */}

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate("PrivacyPolicy")}
      >
        <View style={styles.menuLeft}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color="#1F2937"
            />
          </View>
          <Text style={styles.menuText}>Privacy Policy</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate("License")}
      >
        <View style={styles.menuLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="document-text-outline" size={20} color="#1F2937" />
          </View>
          <Text style={styles.menuText}>License Agreement</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent
        visible={showFeedbackModal}
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPressOut={() => setShowFeedbackModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => {}}>
            <KeyboardAvoidingView
              style={styles.modalContainer}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Give us Feedback</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowFeedbackModal(false)}
                >
                  <Ionicons name="close" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <View style={styles.starContainer}>
                {stars.map((starValue, index) => {
                  const animatedStyle = {
                    transform: [{ scale: scaleAnim[index] }],
                  };
                  return (
                    <TouchableOpacity
                      key={starValue}
                      onPress={() => handleStarPress(index, starValue)}
                      style={{ marginHorizontal: 4 }}
                    >
                      <Animated.View style={animatedStyle}>
                        <Ionicons
                          name={starValue <= rating ? "star" : "star-outline"}
                          size={32}
                          color={starValue <= rating ? "#FBBF24" : "#D1D5DB"}
                        />
                      </Animated.View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.userReviewText}>1,230 User Reviews</Text>

              <TextInput
                style={styles.feedbackInput}
                multiline
                value={feedbackText}
                onChangeText={setFeedbackText}
                placeholder="Your Views Matters to us"
                placeholderTextColor="#9CA3AF"
              />

              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendFeedback}
              >
                <Text style={styles.sendButtonText}>Send feedback</Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 65 : 25,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
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
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 248, 249, 1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuText: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
    fontFamily: "Poppins-medium",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    fontFamily: "Poppins-medium",
  },
  closeButton: {
    padding: 4,
  },
  starContainer: {
    flexDirection: "row",
    alignSelf: "center",
    marginBottom: 16,
  },
  userReviewText: {
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 16,
    fontFamily: "Poppins-medium",
  },
  feedbackInput: {
    height: 80,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    textAlignVertical: "top",
    fontSize: 14,
    color: "#1F2937",
    marginBottom: 16,
  },
  sendButton: {
    backgroundColor: "#E3000F",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginBottom: 20,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Poppins-medium",
  },
});
