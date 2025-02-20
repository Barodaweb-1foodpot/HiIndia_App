import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Platform,
  StatusBar,
} from "react-native";
import { Calendar } from "react-native-calendars";
import Ionicons from "react-native-vector-icons/Ionicons";
import { BlurView } from "expo-blur";
import { fetchEvents } from "../api/event_api"; // Using fetchEvents instead of listActiveEvents
import { API_BASE_URL_UPLOADS } from "@env";

export default function CalendarScreen({ navigation }) {
  const [selectedDate, setSelectedDate] = useState("");
  const [eventsData, setEventsData] = useState({});
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch events with pageNo=1, perPage=1000, no search query, category "All", filterDate "All"
        const res = await fetchEvents( "", "All", "All");
        const eventsArray = res.data || [];
        const groupedEvents = {};

        eventsArray.forEach((event) => {
          if (event.StartDate) {
            const dateKey = new Date(event.StartDate)
              .toISOString()
              .split("T")[0];
            if (!groupedEvents[dateKey]) {
              groupedEvents[dateKey] = [];
            }
            // Push the entire event object so that the details page receives all fields
            groupedEvents[dateKey].push(event);
          }
        });
        setEventsData(groupedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };
    fetchData();
  }, []);

  const renderHeader = (date) => {
    const monthYear = date.toString("MMMM yyyy");
    return (
      <BlurView intensity={80} tint="light" style={styles.monthHeader}>
        <Text style={styles.monthText}>{monthYear}</Text>
      </BlurView>
    );
  };

  /**
   * Mark the following:
   * 1. Event dates => backgroundColor: "rgba(252, 224, 228, 1)"
   * 2. Today's date => black border
   * 3. Selected date => #E3000F background with white text
   */
  const getMarkedDates = () => {
    const todayString = new Date().toISOString().split("T")[0];
    const marked = {};

    // Mark event dates
    Object.keys(eventsData).forEach((date) => {
      marked[date] = {
        customStyles: {
          container: {
            borderRadius: 12,
            backgroundColor: "rgba(252, 224, 228, 1)",
          },
          text: {
            fontWeight: "600",
          },
        },
      };
    });

    // Mark today's date with a black border
    if (!marked[todayString]) {
      marked[todayString] = {
        customStyles: {
          container: {
            borderRadius: 12,
            borderColor: "black",
            borderWidth: 1,
          },
          text: {
            fontWeight: "600",
          },
        },
      };
    } else {
      marked[todayString].customStyles.container.borderColor = "black";
      marked[todayString].customStyles.container.borderWidth = 1;
    }

    // Mark selected date with #E3000F background
    if (selectedDate) {
      if (!marked[selectedDate]) {
        marked[selectedDate] = {
          customStyles: {
            container: {
              borderRadius: 12,
              backgroundColor: "#E3000F",
            },
            text: {
              fontWeight: "600",
              color: "#fff",
            },
          },
        };
      } else {
        marked[selectedDate].customStyles.container.backgroundColor = "#E3000F";
        marked[selectedDate].customStyles.text.color = "#fff";
      }
    }
    return marked;
  };

  const formatSelectedDate = (dateString) => {
    if (!dateString) return "";
    const dateObj = new Date(dateString);
    if (isNaN(dateObj)) return "";
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Render event cards for the selected date.
  const renderEventList = (eventsList = []) => {
    return eventsList.map((event, index) => (
      <TouchableOpacity
        key={event._id ? event._id : index}
        style={styles.eventCard}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate("App", {
            screen: "EventsDetail",
            params: { eventDetail: event },
          })
        }
      >
        <Image
          source={
            event.EventImage
              ? { uri: `${API_BASE_URL_UPLOADS}/${event.EventImage}` }
              : require("../../assets/placeholder.jpg")
          }
          style={styles.eventImage}
        />
        <View style={styles.eventInfo}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {event.EventName}
            </Text>
            <View style={styles.dateBadge}>
              <Text style={styles.dateText}>
                {formatSelectedDate(selectedDate)}
              </Text>
            </View>
          </View>
          <View style={styles.locationContainer}>
            <View style={styles.locationIconContainer}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
            </View>
            <Text style={styles.eventLocation} numberOfLines={1}>
              {event.EventLocation}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <BlurView intensity={80} tint="light" style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Events Calendar</Text>
        <View style={styles.placeholder} />
      </BlurView>
      <Calendar
        style={styles.calendar}
        theme={{
          backgroundColor: "#ffffff",
          calendarBackground: "#ffffff",
          textSectionTitleColor: "#6B7280",
          dayTextColor: "#1F2937",
          textDisabledColor: "#d9e1e8",
          arrowColor: "#1F2937",
          monthTextColor: "#1F2937",
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 14,
        }}
        markingType="custom"
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
        {selectedDate && eventsData[selectedDate] && (
          <View style={styles.eventListContainer}>
            <Text style={styles.eventsHeader}>
              Showing events schedule on{" "}
              <Text style={styles.selectedDate}>
                {formatSelectedDate(selectedDate)}
              </Text>
            </Text>
            {renderEventList(eventsData[selectedDate])}
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
    backgroundColor: "rgba(255,255,255,0.9)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  backButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  placeholder: {
    width: 44,
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
    margin: 16,
    borderRadius: 24,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    padding: 8,
  },
  eventsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  eventListContainer: {
    marginTop: 16,
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
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  eventImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: "#f3f4f6",
  },
  eventInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  eventHeader: {
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  dateBadge: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  dateText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  eventLocation: {
    flex: 1,
    fontSize: 14,
    color: "#6B7280",
  },
});
