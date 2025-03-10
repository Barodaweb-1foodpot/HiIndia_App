import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from "react-native-vector-icons/Ionicons";

const Header = ({ onNotificationPress, onCalendarPress }) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Image source={require("../../assets/logo.png")} style={styles.logo} />
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconCircle} onPress={onNotificationPress}>
            <Ionicons name="notifications-outline" size={20} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconCircle} onPress={onCalendarPress}>
            <Ionicons name="calendar-outline" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: "15%",
    backgroundColor: "#000",
    paddingHorizontal: 16,
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    width: 160,
    height: 50,
    resizeMode: "contain",
  },
  headerIcons: {
    flexDirection: "row",
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default Header;
