import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import PropTypes from "prop-types";

export default function ShareModal({ visible, onClose, onShareOption }) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.shareModalContent]}>
          <View style={styles.shareHeader}>
            <Text style={styles.shareTitle}>Share Event</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <View style={styles.shareOptionsContainer}>
            <TouchableOpacity
              style={styles.shareOption}
              onPress={() => onShareOption("copyLink")}
            >
              <Ionicons name="copy-outline" size={24} color="#1F2937" />
              <Text style={styles.shareOptionText}>Copy Link</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shareOption}
              onPress={() => onShareOption("whatsapp")}
            >
              <Ionicons name="logo-whatsapp" size={24} color="#1F2937" />
              <Text style={styles.shareOptionText}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shareOption}
              onPress={() => onShareOption("facebook")}
            >
              <Ionicons name="logo-facebook" size={24} color="#1F2937" />
              <Text style={styles.shareOptionText}>Facebook</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shareOption}
              onPress={() => onShareOption("email")}
            >
              <Ionicons name="mail-outline" size={24} color="#1F2937" />
              <Text style={styles.shareOptionText}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shareOption}
              onPress={() => onShareOption("linkedin")}
            >
              <Ionicons name="logo-linkedin" size={24} color="#1F2937" />
              <Text style={styles.shareOptionText}>LinkedIn</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shareOption}
              onPress={() => onShareOption("twitter")}
            >
              <Ionicons name="logo-twitter" size={24} color="#1F2937" />
              <Text style={styles.shareOptionText}>Twitter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

ShareModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onShareOption: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
  shareModalContent: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 16,
  },
  shareHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 12,
  },
  shareTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  closeButton: {
    padding: 4,
  },
  shareOptionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 8,
  },
  shareOption: {
    width: "30%",
    alignItems: "center",
    marginVertical: 12,
  },
  shareOptionText: {
    marginTop: 6,
    fontSize: 12,
    color: "#1F2937",
  },
});
