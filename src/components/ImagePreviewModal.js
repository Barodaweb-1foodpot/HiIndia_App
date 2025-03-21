import React from "react";
import { View, Modal, TouchableOpacity, Image, StyleSheet, Platform } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import SkeletonLoader from "./SkeletonLoader";
import PropTypes from "prop-types";

export default function ImagePreviewModal({ visible, imageSource, onClose }) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.imagePreviewOverlay}>
        <View style={styles.imagePreviewContent}>
          <TouchableOpacity style={styles.closePreviewButton} onPress={onClose}>
            <Ionicons name="close-circle" size={36} color="#fff" />
          </TouchableOpacity>
          <View style={styles.circularImageContainer}>
            <SkeletonLoader
              style={[StyleSheet.absoluteFill, { borderRadius: styles.circularImageContainer.borderRadius }]}
            />
            <Image
              source={imageSource}
              style={styles.circularPreviewImage}
              resizeMode="cover"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

ImagePreviewModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  imageSource: PropTypes.oneOfType([PropTypes.object, PropTypes.number]).isRequired,
  onClose: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreviewContent: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  closePreviewButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 20,
  },
  circularImageContainer: {
    width: 300,
    height: 300,
    borderRadius: 150,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  circularPreviewImage: {
    width: "100%",
    height: "100%",
  },
});
