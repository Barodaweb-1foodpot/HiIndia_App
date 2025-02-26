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
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { BlurView } from "expo-blur";
import { fetchEvents, getEventCategoriesByPartner } from "../api/event_api";
import { API_BASE_URL, API_BASE_URL_UPLOADS } from "@env";
import { formatDateRange } from "../helper/helper_Function";
import moment from "moment";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

// --- Skeleton Loader Component ---
const SkeletonLoader = ({ style }) => {
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.timing(animation, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
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

// --- EventImage with Skeleton Loader ---
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
        onLoadEnd={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(true);
        }}
      />
    </View>
  );
};

// --- Blur Wrapper ---
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

// --- Header Component ---
const Header = React.memo(({ navigation }) => {
  const handleNotificationPress = useCallback(() => {
    navigation.navigate("App", { screen: "Notification" });
  }, [navigation]);

  const handleCalenderPress = useCallback(() => {
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

// --- SearchBar Component ---
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

// --- Dropdown Component ---
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

// --- CategoryCard Component ---
const CategoryCard = React.memo(({ item, navigation }) => (
  <TouchableOpacity
    onPress={() =>
      navigation.navigate("App", {
        screen: "EventsDetail",
        params: { eventDetail: item },
      })
    }
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
          {formatDateRange(item.StartDate, item.EndDate)}
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

// --- OtherEventCard Component ---
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
            {formatDateRange(item.StartDate, item.EndDate)}
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
  const [events, setEvents] = useState([]);
  const [catId, setCatId] = useState("");
  const [firstTime, setFirstTime] = useState(true);
  const [allEvent, setAllEvent] = useState([]);

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
    const res = await fetchEvents(searchText, (categoryFilter = catId));
    console.log("Fetched events:", res);
    if (res?.data?.length > 0) {
      if (firstTime) {
        setAllEvent(res.data);
      }
      setEvents(res.data);
      setFirstTime(false);
    } else {
      setEvents([]);
    }
  };

  const fetchCategory = async () => {
    const res = await getEventCategoriesByPartner();
    console.log("Categories:", res.data);
    if (res.data.data?.length > 0) {
      setCategory(res.data.data);
    }
  };

  const shareEvent = useCallback(async (event) => {
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
      await Share.share({ message: shareMessage });
    } catch (error) {
      console.error("Error sharing event", error);
    }
  }, []);

  const handleSelectCategory = useCallback((cat) => {
    setCatId(cat._id);
    setSelectedCategory(cat.name);
    setDropdownOpen(false);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
        animated
      />
      <Header navigation={navigation} />
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
          <SearchBar
            visible={searchVisible}
            searchText={searchText}
            setSearchText={setSearchText}
          />
          <Dropdown
            dropdownOpen={dropdownOpen}
            selectedCategory={selectedCategory}
            category={category}
            onToggle={() => setDropdownOpen(!dropdownOpen)}
            onSelectCategory={handleSelectCategory}
          />
          {/* Main Events List */}
          {events.length > 0 && (
            <>
              {events.map((item) => (
                <CategoryCard
                  key={item._id}
                  item={item}
                  navigation={navigation}
                />
              ))}
            </>
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
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 46,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
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
  categoryCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    overflow: "hidden",
    width: "100%",
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginVertical: 16,
  },
  eventCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#fff",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    height: 200,
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
    shadowOffset: {
      width: 0,
      height: 1,
    },
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
});
