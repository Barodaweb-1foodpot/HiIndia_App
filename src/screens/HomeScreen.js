import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
  Share,
  StyleSheet as RNStyleSheet,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { BlurView } from "expo-blur";
import { fetchEvents, listActiveEvents } from "../api/event_api";
import { API_BASE_URL_UPLOADS } from "@env";
import moment from "moment";
import AsyncStorage from "@react-native-async-storage/async-storage";

// A wrapper component for blur effect
const BlurWrapper = ({ style, children }) => {
  if (Platform.OS === "android") {
    return (
      <View style={[style, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
        {children}
      </View>
    );
  }
  return (
    <BlurView intensity={50} tint="dark" style={style}>
      {children}
    </BlurView>
  );
};

// Custom component to handle image loading with a placeholder
const EventImage = ({ uri, style }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <View style={style}>
      {!loaded && (
        <Image
          source={require("../../assets/placeholder.jpg")}
          style={[StyleSheet.absoluteFill, style]}
          resizeMode="cover"
        />
      )}
      <Image
        source={uri ? { uri } : require("../../assets/placeholder.jpg")}
        style={style}
        resizeMode="cover"
        onLoadEnd={() => setLoaded(true)}
      />
    </View>
  );
};

export default function HomeScreen({ navigation }) {
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [events, setEvents] = useState([]);
  const [perPage, setPerPage] = useState(2);
  const [pageNo, setPageNo] = useState(0);
  const [activeEvent, setActiveEvents] = useState([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetchEvent();
    fetchActiveEvent();
  }, [searchText, perPage, pageNo]);

  useEffect(() => {
    setEvents([]);
    // console.log(activeTab);
    fetchEvent();
  }, [activeTab]);

  const fetchEvent = async () => {
    const res = await fetchEvents(
      pageNo,
      perPage,
      searchText,
      (filterDate = activeTab)
    );
    if (res.data.length > 0) {
      setCount(res.count);
      setEvents(res.data);
    } else {
      setCount(0);
      setEvents([]);
    }
  };

  const fetchActiveEvent = async () => {
    const res = await listActiveEvents();
    if (res.data.length > 0) {
      setActiveEvents(res.data);
    }
  };

  // Function to share event details
  const shareEvent = async (event) => {
    try {
      const eventDate =
        event.StartDate && event.EndDate
          ? `${moment(event.StartDate).format("D/M/YY HH:mm")} to ${moment(
              event.EndDate
            ).format("D/M/YY HH:mm")}`
          : "Date not available";
      const eventImageUri = event.EventImage
        ? `${API_BASE_URL_UPLOADS}/${event.EventImage}`
        : null;
      const shareMessage =
        `🎶 *Check out this event!*\n\n` +
        `📌 *Event:* ${event.EventName}\n` +
        `📍 *Location:* ${event.EventLocation}\n` +
        `🗓️ *Date:* ${eventDate}\n` +
        (eventImageUri ? `🖼️ *Image:* ${eventImageUri}\n` : "");

      await Share.share({
        message: shareMessage,
      });
    } catch (error) {
      console.error("Error sharing event", error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
          />
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconCircle}>
              <Ionicons name="notifications-outline" size={20} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconCircle}
              onPress={() => navigation.navigate("App", { screen: "Calender" })}
            >
              <Ionicons name="calendar-outline" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.whiteSection}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Search Header */}
          <View style={styles.eventsHeader}>
            <Text style={styles.eventsTitle}>Events</Text>
            <TouchableOpacity
              onPress={() => {
                setSearchVisible((prev) => !prev);
                if (!searchVisible) setSearchText("");
              }}
            >
              <Ionicons name="search-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Search Wrapper */}
          {searchVisible && (
            <View style={styles.searchWrapper}>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search event..."
                  placeholderTextColor="#666"
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>
            </View>
          )}

          {/* Tabs Section */}
          <View style={styles.tabsContainer}>
            <View style={styles.tabsWrapper}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === "All" && styles.activeTab,
                ]}
                onPress={() => {
                  setActiveTab("All");
                  setPerPage(2);
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "All" && styles.activeTabText,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === "Past" && styles.activeTab,
                ]}
                onPress={() => {
                  setActiveTab("Past");
                  setPerPage(2);
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "Past" && styles.activeTabText,
                  ]}
                >
                  Past
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Trending Events Section */}
          <View style={styles.section}>
            {activeTab === "All" && (
              <Text style={styles.sectionTitle}>All Events</Text>
            )}

            {events?.map((event, index) => {
              const eventImageUri = event.EventImage
                ? `${API_BASE_URL_UPLOADS}/${event.EventImage}`
                : null;
              const eventDate =
                event.StartDate && event.EndDate
                  ? `${moment(event.StartDate).format(
                      "D/M/YY HH:mm"
                    )} to ${moment(event.EndDate).format("D/M/YY HH:mm")}`
                  : "Date not available";

              return (
                <View key={index} style={styles.eventCard}>
                  {/* Event image with placeholder until load */}
                  <EventImage uri={eventImageUri} style={styles.eventImage} />

                  {/* Share Button */}
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => shareEvent(event)}
                  >
                    <Ionicons
                      name="share-social-outline"
                      size={20}
                      color="#000"
                    />
                  </TouchableOpacity>

                  <BlurWrapper style={styles.eventContent}>
                    <View style={styles.eventDetailsColumn}>
                      <Text style={styles.eventTitle} numberOfLines={1}>
                        {event.EventName}
                      </Text>
                      <View style={styles.dflex}>
                        <View style={styles.eventDetail}>
                          <Text
                            style={styles.eventDetailText}
                            numberOfLines={2}
                          >
                            <Ionicons
                              name="location-outline"
                              size={14}
                              color="#fff"
                            />{" "}
                            {event.EventLocation}
                          </Text>
                          <Text style={styles.eventDetailText}>
                            <Ionicons
                              name="calendar-outline"
                              size={14}
                              color="#fff"
                            />{" "}
                            {eventDate}
                          </Text>
                        </View>

                        <View style={styles.registerContainer}>
                          <TouchableOpacity
                            style={styles.registerButton}
                            onPress={() =>
                              navigation.navigate("App", {
                                screen: "EventsDetail",
                                params: { eventDetail: event },
                              })
                            }
                          >
                            <Text style={styles.registerText}>Register</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </BlurWrapper>
                </View>
              );
            })}

            {count > events.length && (
              <View style={styles.viewMoreContainer}>
                <TouchableOpacity
                  style={styles.viewMoreButton}
                  onPress={() => {
                    setPerPage(perPage + 5);
                    console.log(perPage + 5);
                  }}
                >
                  <View style={styles.viewMoreButtonContent}>
                    <Text style={styles.viewMoreText}>View More</Text>
                    <Ionicons name="chevron-forward" size={16} color="#000" />
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Event Hub Section (shown only in the All tab) */}
          {activeTab === "All" && (
            <View style={styles.hubSection}>
              <Text style={styles.sectionTitle}>The Event Hub</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.hubScrollView}
              >
                {activeEvent.map((item, index) => {
                  const eventImageUri =
                    item.EventImage &&
                    `${API_BASE_URL_UPLOADS}/${item.EventImage}`;
                  const eventDate =
                    item.StartDate && item.EndDate
                      ? `${moment(item.StartDate).format(
                          "D/M/YY HH:mm"
                        )} to ${moment(item.EndDate).format("D/M/YY HH:mm")}`
                      : "Date not available";
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        console.log("Selected Item ID:", item._id);
                        const selectedEvent = events.find(
                          (e) => e._id === item._id
                        );
                        if (selectedEvent) {
                          navigation.navigate("App", {
                            screen: "EventsDetail",
                            params: { eventDetail: selectedEvent },
                          });
                        }
                      }}
                    >
                      <View style={styles.hubCard}>
                        <EventImage
                          uri={eventImageUri}
                          style={styles.hubCardImage}
                        />
                        <View style={styles.hubCardContent}>
                          <Text style={styles.hubCardTitle} numberOfLines={1}>
                            {item.EventName}
                          </Text>
                          <Text style={styles.hubCardDate}>
                            <Ionicons
                              name="calendar-outline"
                              style={styles.iconCircle}
                            />{" "}
                            {eventDate}
                          </Text>
                          <View style={styles.hubLocationContainer}>
                            <Ionicons
                              name="location-outline"
                              size={12}
                              color="#666"
                            />
                            <Text
                              style={styles.hubLocationText}
                              numberOfLines={1}
                            >
                              {item.EventLocation}
                            </Text>
                          </View>
                          <View style={styles.dflex2}>
                            {item.EventCategory?.map((data, index) => (
                              <View style={styles.categoryPill} key={index}>
                                <Text style={styles.categoryText}>
                                  {data.category}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
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
  },
  whiteSection: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  scrollContainer: {
    paddingBottom: 120,
  },
  eventsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  eventsTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
  },
  searchWrapper: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 46,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#000",
    marginLeft: 8,
  },
  tabsContainer: {
    marginBottom: 24,
  },
  tabsWrapper: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#E3000F",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
  },
  activeTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E3000F",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  eventCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#fff",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    height: 250,
  },
  eventImage: {
    width: "100%",
    height: "100%",
  },
  shareButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  eventContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 20,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 6,
    overflow: "hidden",
    flexDirection: "row",
  },
  eventDetailsColumn: {
    // You can adjust as needed
  },
  dflex: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  dflex2: {
    gap: 10,
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  eventDetail: {
    width: "60%",
    marginBottom: 4,
  },
  eventDetailText: {
    color: "#fff",
    marginLeft: 6,
    fontSize: 12,
  },
  registerContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 8,
    width: "40%",
    flex: 1,
    alignSelf: "flex-end",
  },
  registerButton: {
    backgroundColor: "#E3000F",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  registerText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  viewMoreContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    marginBottom: 16,
  },
  viewMoreButton: {
    borderWidth: 1,
    borderColor: "#000",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  viewMoreButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewMoreText: {
    fontSize: 14,
    color: "#000",
    fontWeight: "600",
  },
  hubSection: {
    marginTop: 0,
  },
  hubScrollView: {
    marginTop: 16,
  },
  hubCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginRight: 16,
    width: 340,
    minHeight: 100,
    maxHeight: 120,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    overflow: "hidden",
    alignItems: "center",
  },
  hubCardImage: {
    width: 100,
    height: "100%",
  },
  hubCardContent: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  hubCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  hubCardDate: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  hubLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  hubLocationText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  categoryPill: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#666",
  },
});
