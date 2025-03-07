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
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { BlurView } from "expo-blur";
import { fetchEvents, getEventCategoriesByPartner } from "../api/event_api";
import { API_BASE_URL_UPLOADS } from "@env";
import { formatEventDateTime } from "../helper/helper_Function";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

const SkeletonLoader = ({ style }) => {
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.timing(animation, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, [animation]);

  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <View style={[style, { backgroundColor: "#E0E0E0", overflow: "hidden" }]}>
      <Animated.View
        style={{
          width: "100%",
          height: "100%",
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={[
            "rgba(255, 255, 255, 0)",
            "rgba(255, 255, 255, 0.5)",
            "rgba(255, 255, 255, 0)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: "100%", height: "100%" }}
        />
      </Animated.View>
    </View>
  );
};

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

const Header = React.memo(({ navigation }) => {
  const handleNotificationPress = useCallback(() => {
    console.log("Navigating to Notification screen");
    navigation.navigate("App", { screen: "Notification" });
  }, [navigation]);

  const handleCalenderPress = useCallback(() => {
    console.log("Navigating to Calendar screen");
    navigation.navigate("App", { screen: "Calender" });
  }, [navigation]);

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Image source={require("../../assets/logo.png")} style={styles.logo} />
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={handleNotificationPress}
          >
            <Ionicons name="notifications-outline" size={20} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={handleCalenderPress}
          >
            <Ionicons name="calendar-outline" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

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
      </View>
    </View>
  ) : null
);

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

const CategoryCard = React.memo(({ item, navigation }) => (
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
          {item.EventCategoryDetail?.map((data, index) => (
            <View style={styles.categoryPill} key={index}>
              <Text style={styles.categoryText}>{data.category}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  </TouchableOpacity>
));

const OtherEventCard = React.memo(({ item, navigation, onShare }) => (
  <View style={styles.eventCard}>
    <EventImage
      uri={
        item.EventImage
          ? `${API_BASE_URL_UPLOADS}/${item.EventImage}`
          : undefined
      }
      style={styles.eventImage}
    />
    <TouchableOpacity style={styles.shareButton} onPress={() => onShare(item)}>
      <Ionicons name="share-social-outline" size={20} color="#000" />
    </TouchableOpacity>
    <BlurWrapper style={styles.eventContent}>
      <View style={styles.eventDetailsColumn}>
        <Text style={styles.eventTitle} numberOfLines={1}>
          {item.EventName}
        </Text>
        <View style={styles.eventDetail}>
          <Ionicons name="location-outline" size={14} color="#fff" />
          <Text style={styles.eventDetailText} numberOfLines={2}>
            {item.EventLocation}
          </Text>
        </View>
        <View style={styles.eventDetail}>
          <Ionicons name="calendar-outline" size={14} color="#fff" />
          <Text style={styles.eventDetailText}>
            {formatEventDateTime(item.StartDate, item.EndDate)}
          </Text>
        </View>
      </View>
      <View style={styles.registerContainer}>
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() =>
            navigation.navigate("App", {
              screen: "EventsDetail",
              params: { eventDetail: item },
            })
          }
        >
          <Text style={styles.registerText}>Register</Text>
        </TouchableOpacity>
      </View>
    </BlurWrapper>
  </View>
));

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

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
        if (firstTime) {
          let flattened = [];
          groups.forEach((g) => {
            flattened.push(...g.data);
          });
          setAllEvent(flattened);
          setFirstTime(false);
        }
        setArtistGroups(groups);
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

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
        animated
      />
      {/* Header Section */}
      <Header navigation={navigation} />

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

        {/* Search Bar */}
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
          {artistGroups.length > 0 ? (
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
                />
              ))}
            </>
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
  scrollContainer: {
    paddingBottom: 120,
  },
  noEventsText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginVertical: 20,
  },

  artistName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },

  categoryCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 1,
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
    gap: 10,
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
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  registerText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginVertical: 16,
  },

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
