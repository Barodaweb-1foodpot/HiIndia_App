import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import PropTypes from "prop-types";

export default function DeleteAccountModal({ visible, onClose, onConfirm }) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.deleteAccountModalContent]}>
          <View style={styles.deleteWarningIcon}>
            <Ionicons name="trash" size={24} color="#fff" />
          </View>
          <Text style={styles.deleteAccountTitle}>Delete Account</Text>
          <Text style={styles.deleteAccountMessage}>
            Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
          </Text>
          <View style={styles.deleteAccountButtons}>
            <TouchableOpacity style={styles.cancelDeleteButton} onPress={onClose}>
              <Text style={styles.cancelDeleteButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmDeleteButton} onPress={onConfirm}>
              <Text style={styles.confirmDeleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

DeleteAccountModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
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
    alignItems: "center",
  },
  deleteAccountModalContent: {
    paddingTop: 40,
    paddingBottom: 24,
  },
  deleteWarningIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E3000F",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  deleteAccountTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#E3000F",
    marginBottom: 8,
  },
  deleteAccountMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  deleteAccountButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    paddingHorizontal: 16,
  },
  cancelDeleteButton: {
    flex: 1,
    backgroundColor: "#000",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  cancelDeleteButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: "#E3000F",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  confirmDeleteButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
