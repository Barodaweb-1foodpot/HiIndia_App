// TicketsScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Animated,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { getTickets } from "../api/ticket_api";
import { formatDateRange } from "../helper/helper_Function";
import { API_BASE_URL_UPLOADS } from "@env";
import { useFocusEffect } from '@react-navigation/native';

export default function TicketScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [expandedOrders, setExpandedOrders] = useState({});
  const [tickets, setTickets] = useState([]);
  const [animation] = useState(new Animated.Value(0));
  const [titleReadMore, setTitleReadMore] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setHidden(false); 
      StatusBar.setBarStyle("light-content"); 
      return () => {};
    }, [])
  );

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await getTickets();
      if (res.isOk && res.data && res.data.length > 0) {
        console.log("Event detail:", res.data[0]);
        const transformedTickets = res.data.map((order) => ({
          id: order._id,
          countryCurrency: order.event?.countryDetail?.Currency,
          title: order.event?.EventName || "Untitled Event",
          date:
            formatDateRange(order.event?.StartDate, order.event?.EndDate) ||
            "Date Not Available",
          image: order.event?.EventImage
            ? { uri: `${API_BASE_URL_UPLOADS}/${order.event.EventImage}` }
            : require("../../assets/placeholder.jpg"),
          tickets: order.registrations.map((reg) => ({
            name: reg.name,
            type: reg.TicketType?.name || "Standard",
            price: reg.total || 0,
          })),
          totalRate: order.subTotal, 
          total: order.totalRate,   
          coupon: order.couponDiscount || 0,
        }));
        setTickets(transformedTickets);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error("Error fetching tickets: ", error);
    }
  };

  const toggleOrderDetails = (id) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));

    Animated.spring(animation, {
      toValue: expandedOrders[id] ? 0 : 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Black Header Gradient */}
      <LinearGradient colors={["#000000", "#1A1A1A"]} style={styles.header}>
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
              onPress={() =>
                navigation.navigate("App", { screen: "Calender" })
              }
            >
              <Ionicons name="calendar-outline" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* White Section */}
      <View style={styles.whiteSection}>
        <Text style={styles.title}>Ticket</Text>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "Upcoming" && styles.activeTab]}
            onPress={() => setActiveTab("Upcoming")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "Upcoming" && styles.activeTabText,
              ]}
            >
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "Past" && styles.activeTab]}
            onPress={() => setActiveTab("Past")}
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

        {/* Tickets List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 110 }}
        >
          {tickets.map((ticket) => (
            <Animated.View
              key={ticket.id}
              style={[
                styles.ticketCard,
                {
                  transform: [
                    {
                      scale: animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.02],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={["#FFFFFF", "#F8F9FA"]}
                style={styles.cardGradient}
              >
                {/* Ticket Header */}
                <View style={styles.ticketHeader}>
                  <View style={styles.imageContainer}>
                    <Image source={ticket.image} style={styles.eventImage} />
                  </View>
                  <View style={styles.eventInfo}>
                    <View style={styles.titleContainer}>
                      <View style={styles.ticketIconContainer}>
                        <LinearGradient
                          colors={["#FF1A1A", "#E3000F"]}
                          style={styles.ticketIconBg}
                        >
                          <Ionicons name="ticket" size={16} color="#FFF" />
                        </LinearGradient>
                      </View>
                      <View style={{width:"90%" }}>
                        <Text
                          style={styles.eventTitle}
                          numberOfLines={titleReadMore ? undefined : 2}
                        >
                          {ticket.title}
                        </Text>
                        {ticket.title?.length > 10 && (
                          <TouchableOpacity
                            onPress={() => setTitleReadMore(!titleReadMore)}
                          >
                            <Text style={styles.readMoreText}>
                              {titleReadMore ? "Read Less" : "Read More"}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    <Text style={styles.eventDate}>{ticket.date}</Text>
                    <Text style={styles.ticketCount}>
                      {ticket.tickets.length} Ticket's
                    </Text>
                  </View>
                </View>

                {/* Order Details Container */}
                <TouchableOpacity
                  style={[
                    styles.orderDetailsContainer,
                    expandedOrders[ticket.id] && styles.expandedContainer,
                  ]}
                  onPress={() => toggleOrderDetails(ticket.id)}
                >
                  {!expandedOrders[ticket.id] ? (
                    <View style={styles.viewDetailsRow}>
                      <Text style={styles.viewDetailsText}>
                        View Order Details
                      </Text>
                      <Ionicons
                        name="chevron-down"
                        size={20}
                        color="#1F2937"
                      />
                    </View>
                  ) : (
                    <View style={styles.orderDetails}>
                      {/* Ticket Holders Rows */}
                      {ticket.tickets.map((t, index) => (
                        <View key={index}>
                          <View style={styles.ticketHolderRow}>
                            <Text style={styles.ticketHolderName}>
                              {t.name}
                            </Text>
                            <View style={styles.priceTypeContainer}>
                              <LinearGradient
                                colors={["#EFEAFF", "#E5E0FF"]}
                                style={styles.purplePriceBox}
                              >
                                <Text style={styles.purplePriceText}>
                                  {ticket.countryCurrency} {t.price}
                                </Text>
                              </LinearGradient>
                              <Text style={styles.purplePriceType}>
                                <Text style={styles.italic}>{t.type}</Text>
                              </Text>
                            </View>
                          </View>
                          {index < ticket.tickets.length - 1 && (
                            <View style={styles.rowSeparator} />
                          )}
                        </View>
                      ))}

                      {/* Totals */}
                      <View style={styles.longSeparator} />
                      <View style={styles.whiteTotalsBox}>
                        {/* "Total Rate" */}
                        <View style={styles.whiteTotalsRow}>
                          <Text style={styles.whiteTotalsLabel}>
                            Total Rate
                          </Text>
                          <Text style={styles.whiteTotalsValue}>
                            {ticket.countryCurrency}
                            {ticket.totalRate}
                          </Text>
                        </View>
                        <View style={styles.whiteShortSeparator} />

                       
                        {ticket.coupon ? (
                          <>
                            <View style={styles.whiteTotalsRow}>
                              <Text style={styles.whiteTotalsLabel}>
                                Coupon applied
                              </Text>
                              <Text style={styles.couponValue}>
                                {ticket.countryCurrency}
                                {Number(ticket.coupon).toFixed(2)}
                              </Text>
                            </View>
                            <View style={styles.whiteShortSeparator} />
                            <View style={styles.whiteTotalsRow}>
                              <Text style={styles.whiteTotalsLabel}>
                                Total
                              </Text>
                              <Text style={styles.finalTotal}>
                                {ticket.countryCurrency}
                                {ticket.total}
                              </Text>
                            </View>
                            <View style={styles.whiteShortSeparator} />
                          </>
                        ) : (
                          <>
                            <View style={styles.whiteTotalsRow}>
                              <Text style={styles.whiteTotalsLabel}>Total</Text>
                              <Text style={styles.finalTotal}>
                                {ticket.countryCurrency}
                                {ticket.totalRate}
                              </Text>
                            </View>
                            <View style={styles.whiteShortSeparator} />
                          </>
                        )}
                      </View>

                      {/* Hide Order Details Button */}
                      <View style={styles.hideDetailsButtonRow}>
                        <TouchableOpacity
                          style={styles.hideDetailsButton}
                          onPress={() => toggleOrderDetails(ticket.id)}
                        >
                          <Text style={styles.hideDetailsText}>
                            Hide Order Details
                          </Text>
                          <Ionicons
                            name="chevron-up"
                            size={20}
                            color="#1F2937"
                            style={{ marginLeft: 4 }}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    height: "15%",
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
  whiteSection: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginBottom: 16,
  },
  tab: {
    paddingBottom: 8,
    marginRight: 24,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "rgba(0, 0, 0, 1)",
  },
  tabText: {
    fontSize: 16,
    color: "#6B7280",
  },
  activeTabText: {
    color: "rgba(0, 0, 0, 1)",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  ticketCard: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 4,
  },
  cardGradient: {
    borderRadius: 16,
    overflow: "hidden",
  },
  ticketHeader: {
    flexDirection: "row",
    padding: 16,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventImage: {
    width: "100%",
    height: "100%",
  },
  eventInfo: {
    width:'100%',
    marginLeft: 16,
    flex: 1,
    justifyContent: "center",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    width: "100%"
  },
  ticketIconContainer: {
    marginRight: 8,
  },
  ticketIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    flex: 1,
    letterSpacing: 0.5,
  },
  readMoreText: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
    marginTop: 4,
  },
  eventDate: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  ticketCount: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  orderDetailsContainer: {
    backgroundColor: "#FFF5F5",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  expandedContainer: {
    backgroundColor: "#FFF5F5",
  },
  viewDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewDetailsText: {
    color: "#1F2937",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Poppins-Medium",
  },
  orderDetails: {
    paddingTop: 2,
  },
  ticketHolderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  ticketHolderName: {
    fontSize: 14,
    color: "#000",
    fontFamily: "Poppins-Medium",
  },
  priceTypeContainer: {
    alignItems: "center",
  },
  purplePriceBox: {
    width: 70,
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 5,
    marginBottom: 2,
  },
  purplePriceText: {
    fontSize: 15,
    color: "#000",
    fontFamily: "Poppins-Medium",
  },
  purplePriceType: {
    fontSize: 12,
    color: "#666",
    fontFamily: "Poppins-Medium",
  },
  italic: {
    fontStyle: "italic",
  },
  rowSeparator: {
    height: 1,
    width: "100%",
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginVertical: 1,
  },
  longSeparator: {
    height: 1,
    width: "100%",
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
  },
  whiteTotalsBox: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    width: "90%",
    alignSelf: "center",
  },
  whiteTotalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  whiteTotalsLabel: {
    fontSize: 14,
    color: "#000",
    fontFamily: "Poppins-Medium",
  },
  whiteTotalsValue: {
    fontSize: 15,
    color: "#000",
    fontWeight: "600",
    fontFamily: "Poppins-Medium",
  },
  whiteShortSeparator: {
    height: 1,
    width: "100%",
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginVertical: 4,
  },
  couponValue: {
    fontSize: 15,
    color: "rgba(0, 0, 0, 1)",
    fontWeight: "600",
    fontFamily: "Poppins-Medium",
  },
  finalTotal: {
    fontSize: 15,
    color: "rgba(0, 0, 0, 1)",
    fontWeight: "600",
    fontFamily: "Poppins-Medium",
  },
  hideDetailsButtonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  hideDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  hideDetailsText: {
    color: "#1F2937",
    fontSize: 14,
    marginRight: 2,
    fontFamily: "Poppins-Medium",
  },
});
