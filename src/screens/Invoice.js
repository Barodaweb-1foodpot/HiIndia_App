import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Platform,
  Share,
  Image,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import { getTicketsByOrderId } from "../api/ticket_api";

/**
 * Helper function to format date/time from your API if needed
 * (Adjust as per your actual date/time format.)
 */
const formatEventDateTime = (startDate, endDate) => {
  // Example: "Sep 29, 2025 | 7:00 PM - 11:00 PM"
  // Adjust the logic as needed for your date/time format
  const start = new Date(startDate);
  const end = new Date(endDate);

  const options = { month: "short", day: "numeric", year: "numeric" };
  const startDateStr = start.toLocaleDateString("en-US", options);
  const endDateStr = end.toLocaleDateString("en-US", options);

  const startTime = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const endTime = end.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (startDateStr === endDateStr) {
    // Same day: "Sep 29, 2025 | 7:00 PM - 11:00 PM"
    return `${startDateStr} | ${startTime} - ${endTime}`;
  } else {
    // Different days
    return `${startDateStr} ${startTime} - ${endDateStr} ${endTime}`;
  }
};

export default function Invoice({ route, navigation }) {
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);

  // Get the orderId and optionally orderDetails (totals) from route params
  const { orderId, orderDetails: routeOrderDetails = {} } = route.params || {
    orderId: "ORD468635",
  };

  useEffect(() => {
    fetchOrderData();
  }, [orderId]);

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      const response = await getTicketsByOrderId(orderId);
      if (response.isOk && response.data && response.data.length > 0) {
        const firstTicket = response.data[0];

        // Use the totals passed via route if available; otherwise use from API
        const totals =
          Object.keys(routeOrderDetails).length > 0
            ? routeOrderDetails
            : {
                totalRate: firstTicket.totalRate || 0,
                couponDiscount: firstTicket.couponDiscount || 0,
                total: firstTicket.total || 0,
              };

        // Construct the object we'll display on the invoice
        const orderDetailsData = {
          id: orderId,
          eventName: firstTicket.eventName?.EventName || firstTicket.title || "Event Name",
          // Using formatEventDateTime if you want to show in custom format
          date: formatEventDateTime(
            firstTicket.eventName?.StartDate || firstTicket.StartDate,
            firstTicket.eventName?.EndDate || firstTicket.EndDate
          ),
          // We replace "purchase date" usage with event date here (as requested).
          // But if you do have an actual "purchase date", you can store it in another field.
          // For demonstration, we'll treat firstTicket.date from your transformation as the "purchase date."
          // Or simply re-use date if that is the user’s request.
          purchaseDate: firstTicket.date || "",

          tickets: response.data.map((ticket) => ({
            name: ticket.name || "Guest",
            type:
              ticket.TicketType?.TicketType ||
              ticket.type ||
              "Standard",
            price: Number(ticket.price || ticket.total || 0),
          })),

          totalRate: totals.totalRate,
          couponDiscount: totals.couponDiscount,
          total: totals.total,

          // If you have a real "order date" from the API:
          orderDate: firstTicket.orderDate || "",
          paymentMethod: firstTicket.paymentMethod || "Credit Card",
        };
        setOrderData(orderDetailsData);
      } else {
        alert("No invoice data found.");
      }
    } catch (error) {
      console.error("Error fetching invoice data:", error);
      alert("Error fetching invoice data.");
    } finally {
      setLoading(false);
    }
  };

  // Generate the HTML string for the invoice PDF
  const generateInvoiceHTML = () => {
    if (!orderData) return "";

    const ticketRows = orderData.tickets
      .map(
        (ticket, index) => `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px 8px;">${index + 1}</td>
            <td style="padding: 12px 8px;">${ticket.name}</td>
            <td style="padding: 12px 8px;">${ticket.type}</td>
            <td style="padding: 12px 8px; text-align: right;">$${ticket.price.toFixed(
              2
            )}</td>
          </tr>`
      )
      .join("");

    // Always show discount if couponDiscount is not zero (using absolute value)
    const discountRow =
      Number(orderData.couponDiscount) !== 0
        ? `<div class="summary-row">
            <strong>Discount:</strong> <span class="discount-text">-$${Math.abs(
              Number(orderData.couponDiscount)
            ).toFixed(2)}</span>
          </div>`
        : "";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${orderData.id}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0; 
            color: #333; 
            background-color: #f9fafb; 
          }
          .invoice-container { 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 30px; 
            background-color: #fff; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
            border-radius: 12px; 
          }
          .logo { 
            text-align: center; 
            margin-bottom: 10px; 
          }
          .logo-img { 
            max-width: 180px; 
            height: auto; 
          }
          .invoice-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 30px; 
          }
          .header-left { font-weight: 600; margin-bottom: 5px; }
          .event-details { 
            background-color: #f9fafb; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 30px; 
          }
          .event-name { 
            font-size: 18px; 
            font-weight: 600; 
            margin-bottom: 10px; 
            color: #111827; 
          }
          .event-meta { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 15px; 
          }
          .event-meta-item { 
            display: flex; 
            align-items: center; 
            gap: 8px; 
            color: #4b5563; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 30px; 
          }
          thead { background-color: #f3f4f6; }
          th { 
            padding: 14px 12px; 
            text-align: left; 
            color: #4b5563; 
            font-weight: 600; 
          }
          td { 
            padding: 14px 12px; 
            border-bottom: 1px solid #f3f4f6; 
          }
          .summary { 
            margin-top: 30px; 
            text-align: right; 
            background-color: #f9fafb; 
            padding: 20px; 
            border-radius: 8px; 
          }
          .summary-row { margin-bottom: 10px; font-size: 15px; }
          .discount-text { color: #10b981; }
          .total { 
            font-size: 18px; 
            font-weight: bold; 
            margin-top: 15px; 
            padding-top: 15px; 
            border-top: 1px solid #e5e7eb; 
            color: #111827; 
          }
          .payment-info { 
            background-color: #f9fafb; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 30px; 
          }
          .payment-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 10px; 
          }
          .payment-status { 
            background-color: #dcfce7; 
            color: #059669; 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-weight: 600; 
            display: inline-block; 
          }
          .footer { 
            margin-top: 40px; 
            text-align: center; 
            font-size: 14px; 
            color: #6b7280; 
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="logo">
            <!-- Replace with your actual base64 or remote image as needed -->
            <img src="https://fronthiindia.barodaweb.org/_next/static/media/Hi-India%20Logo.bacafd6b.png" class="logo-img" alt="HI India" />
          </div>
          <div class="invoice-header">
            <div>
              <div class="header-left">Invoice #: ${orderData.id}</div>
              <div>Date: ${orderData.purchaseDate}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 600; margin-bottom: 5px;">Payment Method</div>
              <div>${orderData.paymentMethod}</div>
            </div>
          </div>
          
          <div class="event-details">
            <div class="event-name">${orderData.eventName}</div>
            <div class="event-meta">
              <div class="event-meta-item">
                <span>📅</span>
                <span>${orderData.date}</span>
              </div>
              <!-- Venue removed as requested -->
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 10%;">No.</th>
                <th style="width: 35%;">Attendee</th>
                <th style="width: 25%;">Ticket Type</th>
                <th style="width: 30%; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${ticketRows}
            </tbody>
          </table>
          
          <div class="summary">
            <div class="summary-row">
              <strong>Subtotal:</strong> $${Number(orderData.totalRate).toFixed(2)}
            </div>
            ${discountRow}
            <div class="total">
              <strong>Total:</strong> $${Number(orderData.total).toFixed(2)}
            </div>
          </div>
          
          <div class="payment-info">
            <div style="font-weight: 600; margin-bottom: 10px;">Payment Status</div>
            <div class="payment-status">Paid</div>
          </div>
          
          <div class="footer">
            <p style="font-weight: 600; color: #4b5563; margin-bottom: 10px;">
              Thank you for your purchase!
            </p>
            <p>For any questions, please contact support@hiindia.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Create and share/download the PDF invoice
  const handleDownloadInvoice = async () => {
    try {
      setLoading(true);
      const html = generateInvoiceHTML();
      // Generate PDF file
      const { uri } = await Print.printToFileAsync({ html });
      const filename = `invoice_${orderData.id}.pdf`;

      if (Platform.OS === "ios") {
        // iOS can share directly
        await Sharing.shareAsync(uri);
      } else {
        // Android: copy to a shareable location and then share
        const downloadDir = FileSystem.documentDirectory + filename;
        await FileSystem.copyAsync({ from: uri, to: downloadDir });
        await Share.share({
          url: `file://${downloadDir}`,
          title: filename,
        });
      }
      setLoading(false);
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Failed to generate invoice. Please try again.");
      setLoading(false);
    }
  };

  // Share as plain text with invoice details
  const handleShareInvoice = async () => {
    try {
      const discountText =
        Number(orderData.couponDiscount) !== 0
          ? `Discount: -$${Math.abs(
              Number(orderData.couponDiscount)
            ).toFixed(2)}\n`
          : "";

      const shareMessage = `
Invoice #${orderData.id}
Event: ${orderData.eventName}
Date: ${orderData.date}

Tickets:
${orderData.tickets
  .map(
    (ticket, index) =>
      `${index + 1}. ${ticket.name} - ${ticket.type} - $${Number(
        ticket.price
      ).toFixed(2)}`
  )
  .join("\n")}

Subtotal: $${Number(orderData.totalRate).toFixed(2)}
${discountText}Total: $${Number(orderData.total).toFixed(2)}

Thank you for your purchase!
      `;

      await Share.share({
        message: shareMessage,
        title: `Invoice #${orderData.id}`,
      });
    } catch (error) {
      console.error("Error sharing invoice:", error);
      alert("Failed to share invoice. Please try again.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>Loading invoice...</Text>
      </View>
    );
  }

  if (!orderData) {
    return (
      <View style={styles.loaderContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <MaterialCommunityIcons
          name="file-document-outline"
          size={60}
          color="#999"
        />
        <Text style={styles.errorText}>No invoice data available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchOrderData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.actionRow}>
          <View style={styles.invoiceInfoBox}>
            <Text style={styles.invoiceInfoLabel}>Order ID</Text>
            <Text style={styles.invoiceInfoValue}>{orderData.id}</Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShareInvoice}
              disabled={!orderData}
            >
              <MaterialCommunityIcons
                name="share-variant"
                size={20}
                color="#333"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={handleDownloadInvoice}
              disabled={!orderData}
            >
              <MaterialCommunityIcons
                name="download"
                size={20}
                color="#FFF"
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.invoiceContainer}
          contentContainerStyle={styles.invoiceContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={["#FFFFFF", "#F9FAFB"]}
            style={styles.invoiceCard}
          >
            {/* Logo and header details */}
            <View style={styles.logoWrapper}>
              <View style={styles.logoContainer}>
                <Image
                  source={require("../../assets/Hi.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Top Row: Purchase Date + Invoice Number */}
            <View style={styles.brandRow}>
              <View>
                <Text style={styles.invoiceInfoSmallLabel}>Purchase Date</Text>
                {/* 
                  Overriding with the event date as requested.
                  If you prefer to keep actual purchase date, use orderData.orderDate 
                  or add another line for event date. 
                */}
                <Text style={styles.invoiceInfoSmallValue}>
                  {orderData.purchaseDate}
                </Text>
              </View>
              <View>
                <Text style={styles.invoiceInfoSmallLabel}>Invoice Number</Text>
                <Text style={styles.invoiceInfoSmallValue}>{orderData.id}</Text>
              </View>
            </View>

            {/* Event Details */}
            <View style={styles.eventDetailsContainer}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventHeaderText}>Event Details</Text>
              </View>
              <View style={styles.eventDetailsBody}>
                <Text style={styles.eventName}>{orderData.eventName}</Text>
                <View style={styles.eventMetaRow}>
                  <View style={styles.eventMetaItem}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color="#6B7280"
                    />
                    <Text style={styles.eventMetaText}>{orderData.date}</Text>
                  </View>
                  {/* Event venue removed as requested */}
                </View>
              </View>
            </View>

            {/* Tickets Section */}
            <View style={styles.ticketsContainer}>
              <Text style={styles.sectionTitle}>Tickets</Text>
              <View style={styles.ticketHeader}>
                <Text style={[styles.ticketHeaderText, { flex: 1.5 }]}>
                  Attendee
                </Text>
                <Text style={[styles.ticketHeaderText, { flex: 1 }]}>
                  Type
                </Text>
                <Text
                  style={[
                    styles.ticketHeaderText,
                    { flex: 1, textAlign: "right" },
                  ]}
                >
                  Price
                </Text>
              </View>
              {orderData.tickets.map((ticket, index) => (
                <View key={index} style={styles.ticketRow}>
                  <Text style={[styles.ticketText, { flex: 1.5 }]}>
                    {ticket.name}
                  </Text>
                  <View style={[styles.ticketTypeContainer, { flex: 1 }]}>
                    <Text style={styles.ticketTypeText}>{ticket.type}</Text>
                  </View>
                  <Text
                    style={[
                      styles.ticketText,
                      { flex: 1, textAlign: "right", fontWeight: "600" },
                    ]}
                  >
                    ${Number(ticket.price).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Summary */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryInnerContainer}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>
                    ${Number(orderData.totalRate).toFixed(2)}
                  </Text>
                </View>
                {Number(orderData.couponDiscount) !== 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Discount</Text>
                    <Text style={[styles.summaryValue, styles.discountText]}>
                      -${Math.abs(Number(orderData.couponDiscount)).toFixed(2)}
                    </Text>
                  </View>
                )}
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    ${Number(orderData.total).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Payment Info */}
            <View style={styles.paymentInfoContainer}>
              <View style={styles.paymentInfoHeader}>
                <Text style={styles.paymentInfoHeaderText}>
                  Payment Information
                </Text>
              </View>
              <View style={styles.paymentInfoBody}>
                <View style={styles.paymentInfoRow}>
                  <Text style={styles.paymentInfoLabel}>Method</Text>
                  <Text style={styles.paymentInfoValue}>
                    {orderData.paymentMethod}
                  </Text>
                </View>
                <View style={styles.paymentInfoRow}>
                  <Text style={styles.paymentInfoLabel}>Status</Text>
                  <View style={styles.paymentStatusContainer}>
                    <Text style={styles.paymentStatusText}>Paid</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Thank you for your purchase!
              </Text>
              <Text style={styles.footerSubText}>
                For any questions, please contact support@hiindia.com
              </Text>
            </View>
          </LinearGradient>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#000000",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // Header styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: { width: 40 },

  // Content styles
  contentContainer: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  invoiceInfoBox: {},
  invoiceInfoLabel: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
  invoiceInfoValue: { fontSize: 18, fontWeight: "700", color: "#111827" },
  actionButtons: { flexDirection: "row", alignItems: "center" },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },

  invoiceContainer: { flex: 1, paddingHorizontal: 20 },
  invoiceContentContainer: { paddingBottom: 40 },
  invoiceCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },

  // Logo
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: { height: 80, width: 180 },

  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  invoiceInfoSmallLabel: { fontSize: 12, color: "#6B7280", marginBottom: 2 },
  invoiceInfoSmallValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  // Event Details
  eventDetailsContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  eventHeader: {
    padding: 12,
    backgroundColor: "#F3F4F6",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  eventHeaderText: { fontSize: 14, fontWeight: "600", color: "#4B5563" },
  eventDetailsBody: { padding: 16 },
  eventName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  eventMetaRow: { gap: 12 },
  eventMetaItem: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  eventMetaText: { fontSize: 14, color: "#4B5563", marginLeft: 6 },

  // Tickets
  ticketsContainer: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  ticketHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    marginBottom: 8,
  },
  ticketHeaderText: { fontSize: 13, fontWeight: "600", color: "#4B5563" },
  ticketRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    alignItems: "center",
  },
  ticketText: { fontSize: 14, color: "#1F2937" },
  ticketTypeContainer: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  ticketTypeText: { fontSize: 12, color: "#4B5563", fontWeight: "500" },

  // Summary
  summaryContainer: {
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 12,
    overflow: "hidden",
  },
  summaryInnerContainer: { padding: 16 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: { fontSize: 14, color: "#4B5563" },
  summaryValue: { fontSize: 14, color: "#1F2937", fontWeight: "500" },
  discountText: { color: "#10B981" },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#111827" },
  totalValue: { fontSize: 16, fontWeight: "700", color: "#000000" },

  // Payment Info
  paymentInfoContainer: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 24,
  },
  paymentInfoHeader: {
    padding: 12,
    backgroundColor: "#F3F4F6",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  paymentInfoHeaderText: { fontSize: 14, fontWeight: "600", color: "#4B5563" },
  paymentInfoBody: { padding: 16 },
  paymentInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  paymentInfoLabel: { fontSize: 14, color: "#4B5563" },
  paymentInfoValue: { fontSize: 14, fontWeight: "500", color: "#1F2937" },
  paymentStatusContainer: {
    backgroundColor: "#DCFCE7",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  paymentStatusText: { fontSize: 12, color: "#059669", fontWeight: "600" },

  // Footer
  footer: { alignItems: "center", marginTop: 8 },
  footerText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 8,
  },
  footerSubText: { fontSize: 13, color: "#6B7280" },
});
