import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const iconName = () => {
          switch (route.name) {
            case "Home":
              return isFocused ? "home" : "home-outline";
            case "Events":
              return isFocused ? "calendar" : "calendar-outline";
            case "Tickets":
              return isFocused ? "ticket" : "ticket-outline";
            case "Profile":
              return isFocused ? "person" : "person-outline";
            default:
              return "ellipse-outline";
          }
        };

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabButton}
          >
            <Ionicons
              name={iconName()}
              size={24}
              color={isFocused ? "#000000" : "#8e8e93"}
            />
            <Text
              style={{
                color: isFocused ? "#000000" : "#8e8e93",
                fontSize: 12,
                fontFamily: "Poppins-Regular",
                marginTop: 4,
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    height: 70,
    borderRadius: 35,
    marginHorizontal: 16,
    position: "absolute", 
    bottom: 30, 
    alignSelf: "center",
    alignItems: "center",
    width: "90%", 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default CustomTabBar;
