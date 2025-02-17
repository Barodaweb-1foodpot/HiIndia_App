import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { Calendar } from "react-native-calendars";
import Ionicons from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");

// Enhanced sample events data with more fields
const events = {
  "2025-02-14": [
    {
      id: 1,
      title: "Global Music Fest",
      description: "Experience the world's best artists live in concert",
      location: "Springfield Arena, IL 62704",
      time: "7:00 PM",
      image: "https://example.com/event-image.jpg",
      category: "music",
      gradient: ["#FF416C", "#FF4B2B"],
      attendees: 234,
      price: "$50",
      isFeatured: true,
    },
  ],
 
};

const CategoryIcon = ({ category }) => {
  const icons = {
    music: "musical-notes",
    technology: "hardware-chip",
    art: "color-palette",
    sports: "basketball",
    food: "restaurant",
    education: "school",
  };

  const colors = {
    music: "#FF416C",
    technology: "#4158D0",
    art: "#00C9FF",
    sports: "#FF8C00",
    food: "#FF6B6B",
    education: "#4CAF50",
  };

  return (
    <View
      style={[styles.categoryIcon, { backgroundColor: colors[category] + "20" }]}
    >
      <Ionicons name={icons[category]} size={16} color={colors[category]} />
    </View>
  );
};

export default function CalendarScreen({ navigation }) {
  const [selectedDate, setSelectedDate] = useState("");
  const scrollY = useRef(new Animated.Value(0)).current;

  const renderHeader = (date) => {
    const month = date.toString("MMMM yyyy");
    return (
      <BlurView intensity={80} tint="light" style={styles.monthHeader}>
        <Text style={styles.monthText}>{month}</Text>
      </BlurView>
    );
  };

  const getMarkedDates = () => {
    const marked = {};
    Object.keys(events).forEach((date) => {
      const event = events[date][0];
      marked[date] = {
        marked: true,
        selected: date === selectedDate,
        selectedColor: event.gradient[0],
        dotColor: event.gradient[0],
        customStyles: {
          container: {
            borderRadius: 12,
          },
          text: {
            fontWeight: "600",
          },
        },
      };
    });
    return marked;
  };

  const renderEventCard = (eventsList, date) => {
    if (!eventsList) return null;

    return eventsList.map((event) => (
      <Animated.View
        key={event.id}
        style={[
          styles.eventCard,
          {
            transform: [
              {
                translateY: scrollY.interpolate({
                  inputRange: [-100, 0, 100],
                  outputRange: [-20, 0, 20],
                }),
              },
            ],
          },
        ]}
      >
        <Image
          source={{ uri: event.image }}
          style={styles.eventImage}
          defaultSource={require("../../assets/placeholder.jpg")}
        />

        {/* Featured badge */}
        {event.isFeatured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={styles.eventOverlay}
        >
          <View style={styles.eventContent}>
            <View style={styles.eventHeader}>
              <CategoryIcon category={event.category} />
              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>{event.price}</Text>
              </View>
            </View>

            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDescription} numberOfLines={2}>
                {event.description}
              </Text>

              <View style={styles.eventDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={16} color="#FFF" />
                  <Text style={styles.detailText}>{event.time}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="location-outline" size={16} color="#FFF" />
                  <Text style={styles.detailText}>{event.location}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="people-outline" size={16} color="#FFF" />
                  <Text style={styles.detailText}>
                    {event.attendees} attending
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.registerButton}>
                <Text style={styles.registerButtonText}>Register Now</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Events Calendar</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <Calendar
        style={styles.calendar}
        theme={{
          backgroundColor: "#ffffff",
          calendarBackground: "#ffffff",
          textSectionTitleColor: "#6B7280",
          selectedDayBackgroundColor: "#E3000F",
          selectedDayTextColor: "#ffffff",
          todayTextColor: "#E3000F",
          dayTextColor: "#1F2937",
          textDisabledColor: "#d9e1e8",
          dotColor: "#E3000F",
          selectedDotColor: "#ffffff",
          arrowColor: "#1F2937",
          monthTextColor: "#1F2937",
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 14,
        }}
        markedDates={getMarkedDates()}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        renderHeader={renderHeader}
        enableSwipeMonths
      />

      <Animated.ScrollView
        style={styles.eventsContainer}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {selectedDate && (
          <View>
            <Text style={styles.eventsHeader}>
              Events on{" "}
              <Text style={styles.selectedDate}>
                {new Date(selectedDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </Text>
            {renderEventCard(events[selectedDate], selectedDate)}
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 44 : 20,
    paddingBottom: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  filterButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    marginBottom: 10,
    borderRadius: 16,
  },
  monthText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  calendar: {
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 20,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  eventsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  eventsHeader: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 16,
  },
  selectedDate: {
    color: "#1F2937",
    fontWeight: "600",
  },
  eventCard: {
    borderRadius: 24,
    marginBottom: 20,
    overflow: "hidden",
    height: 400,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  eventImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  featuredBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  featuredText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "600",
  },
  eventOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 20,
  },
  eventContent: {
    gap: 16,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryIcon: {
    padding: 8,
    borderRadius: 12,
  },
  priceBadge: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priceText: {
    color: "#1F2937",
    fontWeight: "700",
    fontSize: 14,
  },
  eventInfo: {
    gap: 12,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  eventDescription: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 20,
  },
  eventDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    color: "#fff",
    fontSize: 14,
  },
  registerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});