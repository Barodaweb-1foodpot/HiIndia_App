import React, { useEffect, useState, useCallback } from "react";
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
  Animated,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

import { fetchEvents, getEventCategoriesByPartner } from "../api/event_api";
import { API_BASE_URL_UPLOADS } from "@env";
import { formatEventDateTime } from "../helper/helper_Function";
import { CheckAccessToken } from "../api/token_api";

// Import custom components
import Header from "../components/Header";
import SkeletonLoader from "../components/SkeletonLoader";
import BlurWrapper from "../components/BlurWrapper";
import LoginPromptModal from "../components/LoginPromptModal";

/**
 * EventImage - Displays an image with a skeleton loader while loading
 */
const EventImage = ({ uri, style }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <View style={style}>
      {!loaded && <SkeletonLoader style={StyleSheet.absoluteFill} />}
      <Image
        source={
          uri && !error ? { uri } : require("../../assets/placeholder.jpg")
        }
        style={[style, loaded ? {} : { opacity: 0 }]}
        resizeMode="cover"
        onLoadEnd={() => {
          setLoaded(true);
          console.log("Image loaded:", uri);
        }}
        onError={() => {
          setError(true);
          setLoaded(true);
          console.log("Error loading image:", uri);
        }}
      />
    </View>
  );
};

/**
 * SearchBar - Renders a search input if visible with a clear (cross) button
 */
const SearchBar = React.memo(({ visible, searchText, setSearchText }) =>
  visible ? (
    <View style={styles.searchWrapper}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search event..."
          placeholderTextColor="#666"
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText !== "" && (
          <TouchableOpacity onPress={() => setSearchText("")}>
            <Ionicons name="close-circle" size={24} color="#000" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  ) : null
);

/**
 * Dropdown - Category dropdown filter
 */
const Dropdown = React.memo(
  ({
    dropdownOpen,
    selectedCategory,
    category,
    onToggle,
    onSelectCategory,
  }) => (
    <View style={styles.dropdownWrapper}>
      <TouchableOpacity style={styles.dropdownButton} onPress={onToggle}>
        <Text style={styles.dropdownButtonText}>{selectedCategory}</Text>
        <Ionicons name="chevron-down-outline" size={20} color="#000" />
      </TouchableOpacity>
      {dropdownOpen && (
        <View style={styles.dropdownList}>
          {category?.map((cat, index) => (
            <View key={index}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => onSelectCategory(cat)}
              >
                <Text style={styles.dropdownItemText}>{cat.name}</Text>
              </TouchableOpacity>
              {index < category.length - 1 && (
                <View style={styles.dropdownSeparator} />
              )}
            </View>
          ))}
          {category && category.length > 0 && (
            <View style={styles.dropdownSeparator} />
          )}
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => onSelectCategory({ _id: "All", name: "All" })}
          >
            <Text style={styles.dropdownItemText}>All</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
);

/**
 * CategoryCard - Displays a single event card (from the artistGroups data)
 * Now shows only the first 2 categories and, if more exist, shows a "+X" pill.
 */
const CategoryCard = React.memo(({ item, navigation }) => {
  const MAX_CATEGORIES = 2;
  const categories = item.EventCategoryDetail || [];
  const displayedCategories = categories.slice(0, MAX_CATEGORIES);
  const extraCount = categories.length - displayedCategories.length;

  return (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("App", {
          screen: "EventsDetail",
          params: { eventDetail: item },
        })
      }
      style={{ marginBottom: 16 }}
    >
      <View style={styles.categoryCard}>
        <EventImage
          uri={
            item.EventImage
              ? `${API_BASE_URL_UPLOADS}/${item.EventImage}`
              : undefined
          }
          style={styles.categoryCardImage}
        />
        <View style={styles.categoryCardContent}>
          <Text style={styles.categoryCardTitle} numberOfLines={1}>
            {item.EventName}
          </Text>
          <Text style={styles.categoryCardDate}>
            {formatEventDateTime(item.StartDate, item.EndDate)}
          </Text>
          <View style={styles.categoryLocationContainer}>
            <Ionicons name="location-outline" size={12} color="#666" />
            <Text style={styles.categoryLocationText} numberOfLines={2}>
              {item.EventLocation}
            </Text>
          </View>
          <View style={styles.dflex2}>
            {displayedCategories.map((data, index) => (
              <View style={styles.categoryPill} key={index}>
                <Text style={styles.categoryText}>{data.category}</Text>
              </View>
            ))}
            {extraCount > 0 && (
              <View style={styles.categoryPill}>
                <Text style={styles.categoryText}>+{extraCount}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

/**
 * OtherEventCard - Displays a single event card (from the allEvent data)
 * with the same style as HomeScreen cards.
 */
const OtherEventCard = React.memo(({ item, navigation, onShare, onBookNow }) => {
  const eventImageUri = item.EventImage
    ? `${API_BASE_URL_UPLOADS}/${item.EventImage}`
    : undefined;
  const eventDate = formatEventDateTime(item.StartDate, item.EndDate);
  return (
    <View style={styles.eventCard}>
      {!item.IsPaid && !item.hasExternalLink && item.externalLink !== "" ? (
        <View style={[styles.badge, styles.freeBadge]}>
          <Text style={styles.badgeText}>Free</Text>
        </View>
      ) : (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Paid</Text>
        </View>
      )}
      <EventImage uri={eventImageUri} style={styles.eventImage} />
      <View style={styles.topRightIcons}>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() =>
            navigation.navigate("App", {
              screen: "EventsDetail",
              params: { eventDetail: item },
            })
          }
        >
          <Ionicons name="information-circle-outline" size={20} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => onShare(item)}
        >
          <Ionicons name="share-social-outline" size={20} color="#000" />
        </TouchableOpacity>
      </View>
      <BlurWrapper style={styles.eventContent}>
        <View style={styles.eventDetailsColumn}>
          <Text style={styles.eventTitle} numberOfLines={1}>
            {item.EventName}
          </Text>

          <View style={styles.eventDetail}>
            <Ionicons name="calendar-outline" size={14} color="#fff" />
            <Text style={styles.eventDetailText}>{eventDate}</Text>
          </View>
          <View style={styles.eventDetail}>
            <Ionicons name="location-outline" size={14} color="#fff" />
            <Text style={styles.eventDetailText} numberOfLines={2}>
              {item.EventLocation}
            </Text>
          </View>
        </View>

        <View style={styles.registerContainer}>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => onBookNow(item)}
          >
            <Text style={styles.registerText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </BlurWrapper>
    </View>
  );
});

export default function EventsScreen({ navigation }) {
  const [searchVisible, setSearchVisible] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All events");
  const [searchText, setSearchText] = useState("");
  const [category, setCategory] = useState([]);
  const [artistGroups, setArtistGroups] = useState([]);
  const [catId, setCatId] = useState("");
  const [firstTime, setFirstTime] = useState(true);
  const [allEvent, setAllEvent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setHidden(false);
      StatusBar.setBarStyle("light-content");
      return () => {};
    }, [])
  );

  useEffect(() => {
    fetchCategory();
  }, []);

  useEffect(() => {
    fetchEvent();
  }, [searchText, selectedCategory]);

  const fetchEvent = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
        console.log("Fetching events (initial load)...");
      }
      const res = await fetchEvents(searchText, catId);
      console.log("Fetched events:", res);

      if (Array.isArray(res) && res.length > 0 && res[0].data) {
        const groups = res[0].data;
        // Sort each group's events by StartDate
        const sortedGroups = groups.map((group) => {
          const sortedEvents = [...group.data].sort(
            (a, b) => new Date(a.StartDate) - new Date(b.StartDate)
          );
          return { ...group, data: sortedEvents };
        });
        // Sort groups by the earliest event date in each group
        sortedGroups.sort((a, b) => {
          const earliestA = a.data[0]
            ? new Date(a.data[0].StartDate).getTime()
            : Infinity;
          const earliestB = b.data[0]
            ? new Date(b.data[0].StartDate).getTime()
            : Infinity;
          return earliestA - earliestB;
        });
        if (firstTime) {
          let flattened = [];
          sortedGroups.forEach((g) => {
            flattened.push(...g.data);
          });
          setAllEvent(flattened);
          setFirstTime(false);
        }
        setArtistGroups(sortedGroups);
      } else {
        setArtistGroups([]);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      setArtistGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategory = async () => {
    try {
      const res = await getEventCategoriesByPartner();
      console.log("Fetched categories:", res.data);
      if (res.data.data?.length > 0) {
        setCategory(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  // --- Event Sharing ---
  const shareEvent = useCallback(async (event) => {
    try {
      const eventDate = formatEventDateTime(event.StartDate, event.EndDate);
      const eventImageUri = event.EventImage
        ? `${API_BASE_URL_UPLOADS}/${event.EventImage}`
        : null;
      const shareMessage =
        `🎶 *Check out this event!*\n\n` +
        `📌 *Event:* ${event.EventName}\n` +
        `📍 *Location:* ${event.EventLocation}\n` +
        `🗓️ *Date:* ${eventDate}\n` +
        (eventImageUri ? `🖼️ *Image:* ${eventImageUri}\n` : "");
      console.log("Sharing event with message:", shareMessage);
      await Share.share({ message: shareMessage });
    } catch (error) {
      console.error("Error sharing event", error);
    }
  }, []);

  const handleSelectCategory = useCallback((cat) => {
    console.log("Selected category:", cat);
    setCatId(cat._id);
    setSelectedCategory(cat.name);
    setDropdownOpen(false);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvent();
    setRefreshing(false);
  };

  const handleBookNow = async (event) => {
    if (event.hasExternalLink && event.externalLink) {
      Linking.openURL(event.externalLink);
      return;
    }
    
    const isAuthenticated = await CheckAccessToken();
    if (!isAuthenticated) {
      // Show login modal instead of direct navigation
      setSelectedEvent(event);
      setLoginModalVisible(true);
      return;
    }
    
    // If authenticated, proceed to buy ticket flow
    navigation.navigate("App", {
      screen: "BuyTicket",
      params: { eventDetail: event },
    });
  };

  const handleLoginContinue = () => {
    setLoginModalVisible(false);
    // Navigate to login screen
    navigation.navigate("Auth", { screen: "Login" });
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
        animated
      />
      {/* Header Section (imported) */}
      <Header
        onNotificationPress={() => {
          console.log("Navigating to Notification screen");
          navigation.navigate("App", { screen: "Notification" });
        }}
        onCalendarPress={() => {
          console.log("Navigating to Calendar screen");
          navigation.navigate("App", { screen: "Calender" });
        }}
      />

      <View style={styles.whiteSection}>
        {/* Title and Search Icon */}
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

        {/* Search Bar with clear button */}
        <SearchBar
          visible={searchVisible}
          searchText={searchText}
          setSearchText={setSearchText}
        />

        {/* Dropdown for Category Filtering */}
        <Dropdown
          dropdownOpen={dropdownOpen}
          selectedCategory={selectedCategory}
          category={category}
          onToggle={() => setDropdownOpen(!dropdownOpen)}
          onSelectCategory={handleSelectCategory}
        />

        {/* Main Events List with Pull-to-Refresh */}
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {loading && !refreshing ? (
            <ActivityIndicator
              size="large"
              color="#000"
              style={{ marginVertical: 20 }}
            />
          ) : artistGroups.length > 0 ? (
            artistGroups.map((group, groupIndex) => (
              <View key={groupIndex} style={{ marginBottom: 24 }}>
                <Text style={styles.artistName}>
                  {group.artistName || "Unknown Artist"}
                </Text>
                {group.data.map((item) => (
                  <CategoryCard
                    key={item._id}
                    item={item}
                    navigation={navigation}
                  />
                ))}
              </View>
            ))
          ) : (
            <Text style={styles.noEventsText}>No events found.</Text>
          )}

          {/* Other Events Section */}
          {allEvent.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Other events</Text>
              {allEvent.map((item) => (
                <OtherEventCard
                  key={item._id}
                  item={item}
                  navigation={navigation}
                  onShare={shareEvent}
                  onBookNow={handleBookNow}
                />
              ))}
            </>
          )}
        </ScrollView>
      </View>
      
      {/* Login Prompt Modal */}
      <LoginPromptModal
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
        onContinue={handleLoginContinue}
      />
    </View>
  );
}

// ------------------- STYLES -------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // White section container
  whiteSection: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 16,
    paddingTop: 20,
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
  // Search
  searchWrapper: {
    marginBottom: 16,
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
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#000",
  },
  // Dropdown
  dropdownWrapper: {
    marginBottom: 16,
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: "#000",
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: "#fff",
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#000",
  },
  dropdownSeparator: {
    height: 1,
    width: "100%",
    backgroundColor: "#ccc",
  },
  // Scroll
  scrollContainer: {
    paddingBottom: 120,
  },
  noEventsText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginVertical: 20,
  },
  // Artist grouping
  artistName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  // CategoryCard
  categoryCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    elevation: Platform.OS === "android" ? 0 : 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 1,
    borderWidth: 0.5,
    borderColor: "#f0f0f0",
    overflow: "hidden",
    width: "100%",
    height: 140,
  },
  categoryCardImage: {
    width: 120,
    height: 140,
    resizeMode: "cover",
  },
  categoryCardContent: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  categoryCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  categoryCardDate: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  categoryLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  categoryLocationText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  dflex2: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryPill: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginRight: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#666",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginVertical: 16,
  },
  // OtherEventCard (HomeScreen style)
  eventCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    height: 250,
  },
  eventImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#E3000F",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  freeBadge: {
    backgroundColor: "#28a745",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  topRightIcons: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    zIndex: 2,
  },
  infoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginRight: 4,
  },
  shareButton: {
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
    flex: 1,
    justifyContent: "center",
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  eventDetail: {
    flexDirection: "row",
    alignItems: "center",
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
  },
  registerButton: {
    backgroundColor: "#E3000F",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 20,
  },
  registerText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
