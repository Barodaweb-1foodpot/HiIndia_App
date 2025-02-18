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
import { EventTicket } from "../api/event_api";

export default function TicketScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [expandedOrders, setExpandedOrders] = useState({});
  const [animation] = useState(new Animated.Value(0));
  
  // Sample Data
  const tickets = [
    {
      id: "ticket-1",
      title: "Atul Purohit Graba",
      date: "August 30 - September 2, 2024",
      image: require("../../assets/Atul_bhai.png"),
      tickets: [
        { name: "Deep Mehta", type: "Gold", price: 499 },
        { name: "Ansh", type: "Silver", price: 299 },
        { name: "Dev", type: "Platinum", price: 599 },
      ],
      coupon: 70,
    },
    {
      id: "ticket-2",
      title: "Navratri Special",
      date: "August 30 - September 2, 2024",
      image: require("../../assets/placeholder.jpg"),
      tickets: [
        { name: "Deep Mehta", type: "Gold", price: 499 },
        { name: "Ansh", type: "Silver", price: 299 },
        { name: "Dev", type: "Platinum", price: 599 },
      ],
    },
  ];

  // Toggle expand/collapse
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

  useEffect(()=>{
    fetchTicket()
  },[])

   const fetchTicket = async () => {
     
      const res = await EventTicket();
      console.log("rrrrrrrrrr", res);
      if (res.data.length > 0) {
        setCount(res.count)
        setEvents(res.data);
      }
      else {
        setCount(0)
        setEvents([])
      }
    };

  // Calculate total of ticket prices
  const calculateTotal = (ticketsArr) => {
    return ticketsArr.reduce((sum, ticket) => sum + ticket.price, 0);
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
            <TouchableOpacity style={styles.iconCircle}>
              onPress={() => navigation.navigate("App", { screen: "Calender" })}
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
              {/* Card Gradient */}
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
                      <Text style={styles.eventTitle}>{ticket.title}</Text>
                    </View>
                    <Text style={styles.eventDate}>{ticket.date}</Text>
                    <Text style={styles.ticketCount}>
                      {ticket.tickets.length} Ticket's
                    </Text>
                  </View>
                </View>

                {/* Pink Bridging Container */}
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
                      <Ionicons name="chevron-down" size={20} color="#1F2937" />
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

                            {/* Price & Type Container */}
                            <View style={styles.priceTypeContainer}>
                              {/* Purple Gradient for Price ONLY */}
                              <LinearGradient
                                colors={["#EFEAFF", "#E5E0FF"]}
                                style={styles.purplePriceBox}
                              >
                                <Text style={styles.purplePriceText}>
                                  ${t.price}
                                </Text>
                              </LinearGradient>
                              {/* Type in italic, below the price box */}
                              <Text style={styles.purplePriceType}>
                                <Text style={styles.italic}>{t.type}</Text>
                              </Text>
                            </View>
                          </View>
                          {/* Row Separator */}
                          {index < ticket.tickets.length - 1 && (
                            <View style={styles.rowSeparator} />
                          )}
                        </View>
                      ))}

                      {/* Totals */}
                      <View style={styles.longSeparator} />
                      {/* White Totals Box (aligned narrower, like the design) */}
                      <View style={styles.whiteTotalsBox}>
                        <View style={styles.whiteTotalsRow}>
                          <Text style={styles.whiteTotalsLabel}>
                            Total Rate
                          </Text>
                          <Text style={styles.whiteTotalsValue}>
                            ${calculateTotal(ticket.tickets)}
                          </Text>
                        </View>
                        <View style={styles.whiteShortSeparator} />

                        {ticket.coupon && (
                          <>
                            <View style={styles.whiteTotalsRow}>
                              <Text style={styles.whiteTotalsLabel}>
                                Coupon applied
                              </Text>
                              <Text style={styles.couponValue}>
                                -${ticket.coupon}
                              </Text>
                            </View>
                            <View style={styles.whiteShortSeparator} />
                            <View style={styles.whiteTotalsRow}>
                              <Text style={styles.whiteTotalsLabel}>Total</Text>
                              <Text style={styles.finalTotal}>
                                $
                                {calculateTotal(ticket.tickets) - ticket.coupon}
                              </Text>
                            </View>
                            <View style={styles.whiteShortSeparator} />
                          </>
                        )}
                        {!ticket.coupon && (
                          <>
                            <View style={styles.whiteTotalsRow}>
                              <Text style={styles.whiteTotalsLabel}>Total</Text>
                              <Text style={styles.finalTotal}>
                                ${calculateTotal(ticket.tickets)}
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
  /* Root Container */
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  /* Header Gradient */
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

  /* White Section */
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

  /* Tabs */
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
    fontSize: 14,
    color: "#6B7280",
  },
  activeTabText: {
    color: "rgba(0, 0, 0, 1)",
    fontWeight: "600",
  },

  /* Scroll Area */
  scrollView: {
    flex: 1,
  },

  /* Ticket Card */
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
    marginLeft: 16,
    flex: 1,
    justifyContent: "center",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
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

  /* Pink Bridging Container (Order Details) */
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

  /* Ticket Holder Row */
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

  /* Price & Type Container */
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

  /* Row Separator (shorter from both sides) */
  rowSeparator: {
    height: 1,
    width: "100%",
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginVertical: 1,
  },

  /* Long Separator above Totals */
  longSeparator: {
    height: 1,
    width: "100%",
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
  },

  /* White Totals Box (slightly narrower) */
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

  /* Hide Details Button Row */
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
