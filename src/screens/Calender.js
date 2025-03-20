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
  ScrollView,
  Dimensions,
} from "react-native";
import { Calendar } from "react-native-calendars";
import Ionicons from "react-native-vector-icons/Ionicons";
import { BlurView } from "expo-blur";
import { fetchCalendarEvents } from "../api/event_api"; 
import { API_BASE_URL_UPLOADS } from "@env";

const { width } = Dimensions.get('window');

export default function CalendarScreen({ navigation }) {
  const [selectedDate, setSelectedDate] = useState("");
  const [eventsData, setEventsData] = useState({});
  const [currentMonth, setCurrentMonth] = useState('');
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const scrollY = useRef(new Animated.Value(0)).current;
  const currentMonthRef = useRef('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch events with pageNo=1, perPage=1000, no search query, category "All", filterDate "All"
        const res = await fetchCalendarEvents("", "All", "All", "All");
        const eventsArray = res[0].data || [];
        const groupedEvents = {};

        // Set current month from today's date
        const today = new Date();
        const currentMonthStr = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        setCurrentMonth(currentMonthStr);
        currentMonthRef.current = currentMonthStr;
        
        // Set today's date as selected by default
        const todayString = today.toISOString().split("T")[0];
        setSelectedDate(todayString);

        // Group events by date
        eventsArray.forEach((event) => {
          if (event.StartDate) {
            const dateKey = new Date(event.StartDate)
              .toISOString()
              .split("T")[0];
            if (!groupedEvents[dateKey]) {
              groupedEvents[dateKey] = [];
            }
            groupedEvents[dateKey].push(event);
          }
        });
        setEventsData(groupedEvents);

        // Find upcoming events (next 3 events from today)
        const allEvents = [];
        Object.keys(groupedEvents).forEach(date => {
          groupedEvents[date].forEach(event => {
            allEvents.push({...event, dateKey: date});
          });
        });
        
        // Sort by date
        allEvents.sort((a, b) => new Date(a.StartDate) - new Date(b.StartDate));
        
        // Filter future events
        const futureEvents = allEvents.filter(event => 
          new Date(event.StartDate) >= today
        ).slice(0, 3);
        
        setUpcomingEvents(futureEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };
    fetchData();
  }, []);

  // Updated renderHeader function to include the legend
  const renderHeader = (date) => {
    const monthYear = date.toString("MMMM yyyy");
    // Store the current month in a ref instead of state
    currentMonthRef.current = monthYear;
    
    return (
      <BlurView intensity={80} tint="light" style={styles.monthHeader}>
        <Text style={styles.monthText}>{monthYear}</Text>
        <View style={styles.inlineLegendsContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#E3000F" }]} />
            <Text style={styles.legendText}>Selected</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "rgba(252, 224, 228, 0.8)" }]} />
            <Text style={styles.legendText}>Has Events</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { borderWidth: 1, borderColor: "#1F2937" }]} />
            <Text style={styles.legendText}>Today</Text>
          </View>
        </View>
      </BlurView>
    );
  };

  // Update the current month state when the month changes
  const onMonthChange = (month) => {
    setCurrentMonth(month.toString("MMMM yyyy"));
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
            backgroundColor: "rgba(252, 224, 228, 0.8)",
          },
          text: {
            fontWeight: "600",
          },
        },
        dots: [
          { color: '#E3000F', selectedDotColor: '#E3000F' }
        ],
      };
    });

    // Mark today's date with a black border
    if (!marked[todayString]) {
      marked[todayString] = {
        customStyles: {
          container: {
            borderRadius: 12,
            borderColor: "#1F2937",
            borderWidth: 1,
          },
          text: {
            fontWeight: "600",
          },
        },
      };
    } else {
      marked[todayString].customStyles.container.borderColor = "#1F2937";
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

  const formatEventTime = (dateString) => {
    if (!dateString) return "";
    const dateObj = new Date(dateString);
    if (isNaN(dateObj)) return "";
    return dateObj.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
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
            <View style={styles.dateTimeContainer}>
              <View style={styles.dateBadge}>
                <Ionicons name="calendar-outline" size={14} color="#E3000F" style={styles.dateIcon} />
                <Text style={styles.dateText}>
                  {formatSelectedDate(event.StartDate || selectedDate)}
                </Text>
              </View>
              {event.StartDate && (
                <View style={styles.timeBadge}>
                  <Ionicons name="time-outline" size={14} color="#4B5563" style={styles.dateIcon} />
                  <Text style={styles.timeText}>
                    {formatEventTime(event.StartDate)}
                  </Text>
                </View>
              )}
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

  // Render upcoming events preview below calendar
  const renderUpcomingEvents = () => {
    if (upcomingEvents.length === 0) return null;
    
    return (
      <View style={styles.upcomingEventsContainer}>
        <Text style={styles.upcomingEventsTitle}>Upcoming Events</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.upcomingEventsScroll}
        >
          {upcomingEvents.map((event, index) => (
            <TouchableOpacity
              key={event._id ? event._id : index}
              style={styles.upcomingEventCard}
              activeOpacity={0.7}
              onPress={() => {
                setSelectedDate(event.dateKey);
                // Scroll to event list
                setTimeout(() => {
                  if (eventsListRef.current) {
                    eventsListRef.current.scrollTo({ y: 400, animated: true });
                  }
                }, 300);
              }}
            >
              <Image
                source={
                  event.EventImage
                    ? { uri: `${API_BASE_URL_UPLOADS}/${event.EventImage}` }
                    : require("../../assets/placeholder.jpg")
                }
                style={styles.upcomingEventImage}
              />
              <View style={styles.upcomingEventOverlay}>
                <Text style={styles.upcomingEventDate}>
                  {formatSelectedDate(event.dateKey)}
                </Text>
              </View>
              <View style={styles.upcomingEventInfo}>
                <Text style={styles.upcomingEventTitle} numberOfLines={1}>
                  {event.EventName}
                </Text>
                <View style={styles.upcomingEventLocation}>
                  <Ionicons name="location-outline" size={12} color="#6B7280" />
                  <Text style={styles.upcomingEventLocationText} numberOfLines={1}>
                    {event.EventLocation}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const eventsListRef = useRef(null);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
        animated
      />
      <BlurView intensity={80} tint="light" style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Events Calendar</Text>
        <TouchableOpacity style={styles.todayButton} onPress={() => {
          const today = new Date().toISOString().split("T")[0];
          setSelectedDate(today);
        }}>
          <Ionicons name="today-outline" size={20} color="#E3000F" />
        </TouchableOpacity>
      </BlurView>

      <Animated.ScrollView
        ref={eventsListRef}
        style={styles.scrollContainer}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.calendarContainer}>
          <Calendar
            style={styles.calendar}
            theme={{
              backgroundColor: "#ffffff",
              calendarBackground: "#ffffff",
              textSectionTitleColor: "#6B7280",
              textSectionTitleDisabledColor: "#d9e1e8",
              selectedDayBackgroundColor: "#E3000F",
              selectedDayTextColor: "#ffffff",
              todayTextColor: "#1F2937",
              dayTextColor: "#1F2937",
              textDisabledColor: "#d9e1e8",
              dotColor: "#E3000F",
              selectedDotColor: "#ffffff",
              arrowColor: "#1F2937",
              disabledArrowColor: "#d9e1e8",
              monthTextColor: "#1F2937",
              indicatorColor: "#E3000F",
              textDayFontFamily: "System",
              textMonthFontFamily: "System",
              textDayHeaderFontFamily: "System",
              textDayFontWeight: "400",
              textMonthFontWeight: "700",
              textDayHeaderFontWeight: "600",
              textDayFontSize: 16,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 14,
            }}
            markingType="custom"
            markedDates={getMarkedDates()}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            renderHeader={renderHeader}
            onMonthChange={onMonthChange}
            enableSwipeMonths
          />
        </View>

        {renderUpcomingEvents()}

        {selectedDate && eventsData[selectedDate] && (
          <View style={styles.eventListContainer}>
            <View style={styles.eventsHeaderContainer}>
              <View style={styles.eventsHeaderLeft}>
                <Ionicons name="calendar" size={20} color="#E3000F" />
                <Text style={styles.eventsHeader}>
                  Events on{" "}
                  <Text style={styles.selectedDate}>
                    {formatSelectedDate(selectedDate)}
                  </Text>
                </Text>
              </View>
              <Text style={styles.eventCount}>
                {eventsData[selectedDate].length} {eventsData[selectedDate].length === 1 ? 'Event' : 'Events'}
              </Text>
            </View>
            {renderEventList(eventsData[selectedDate])}
          </View>
        )}

        {selectedDate && (!eventsData[selectedDate] || eventsData[selectedDate].length === 0) && (
          <View style={styles.noEventsContainer}>
            <View style={styles.noEventsIconContainer}>
              <Ionicons name="calendar-outline" size={40} color="#fff" />
            </View>
            <Text style={styles.noEventsTitle}>No Events</Text>
            <Text style={styles.noEventsSubtitle}>
              There are no events scheduled for {formatSelectedDate(selectedDate)}
            </Text>
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
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 15,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
    zIndex: 10,
  },
  backButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  todayButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(227, 0, 15, 0.1)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  calendarContainer: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 24,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  monthHeader: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
  monthText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  inlineLegendsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: "#6B7280",
  },
  calendar: {
    borderRadius: 24,
    backgroundColor: "#fff",
    padding: 8,
  },
  upcomingEventsContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  upcomingEventsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
    paddingLeft: 4,
  },
  upcomingEventsScroll: {
    paddingBottom: 8,
  },
  upcomingEventCard: {
    width: width * 0.4,
    marginRight: 12,
    borderRadius: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  upcomingEventImage: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  upcomingEventOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(227, 0, 15, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
  },
  upcomingEventDate: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  upcomingEventInfo: {
    padding: 10,
  },
  upcomingEventTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  upcomingEventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upcomingEventLocationText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  eventListContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  eventsHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventsHeader: {
    fontSize: 16,
    color: "#6B7280",
    marginLeft: 8,
  },
  eventCount: {
    fontSize: 14,
    fontWeight: '600',
    color: "#E3000F",
    backgroundColor: "rgba(227, 0, 15, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
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
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#E3000F",
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
  dateTimeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "rgba(227, 0, 15, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dateIcon: {
    marginRight: 4,
  },
  dateText: {
    fontSize: 12,
    color: "#E3000F",
    fontWeight: "500",
  },
  timeText: {
    fontSize: 12,
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
  noEventsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
  },
  noEventsIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E3000F",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#E3000F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  noEventsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  noEventsSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: 'center',
  },
});