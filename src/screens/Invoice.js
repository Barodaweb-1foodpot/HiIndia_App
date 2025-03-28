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
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import { getTicketsByOrderId } from "../api/ticket_api";

/**
 * Format the event's start and end date/time in a friendlier format.
 * Now includes "at" between the date and time (e.g., "Sep 29, 2025 at 7:00 PM - 11:00 PM").
 */
const formatEventDateTime = (startDate, endDate) => {
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
    // Same day
    return `${startDateStr} at ${startTime} - ${endTime}`;
  } else {
    // Different days
    return `${startDateStr} at ${startTime} - ${endDateStr} at ${endTime}`;
  }
};

/**
 * Format the purchase date in a similar "Month day, year at HH:MM" style.
 */
const formatPurchaseDate = (dateString) => {
  if (!dateString) return "";
  const dateObj = new Date(dateString);
  const options = { month: "short", day: "numeric", year: "numeric" };
  const datePart = dateObj.toLocaleDateString("en-US", options);
  const timePart = dateObj.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} at ${timePart}`;
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
      console.log("API Response:", response);
      
      if (response.isOk && response.data && response.data.length > 0) {
        const firstTicket = response.data[0];
        console.log("First Ticket Data:", firstTicket);
        console.log("Payment ID Details:", firstTicket.payment_id);

        // Use the totals passed via route if available; otherwise use from API
        const totals =
          Object.keys(routeOrderDetails).length > 0
            ? routeOrderDetails
            : {
                totalRate: firstTicket.totalRate || 0,
                couponDiscount: firstTicket.couponDiscount || 0,
                total: firstTicket.total || 0,
              };
        console.log("Totals:", totals);

        // Extract payment status
        let paymentStatus = "Completed"; // Default value
        if (firstTicket.payment_id) {
          // Check if payment_id is an object with paymentStatus directly
          if (typeof firstTicket.payment_id === 'object' && firstTicket.payment_id.paymentStatus) {
            paymentStatus = firstTicket.payment_id.paymentStatus;
          }
          // If payment_id is an array or has a different structure
          else if (Array.isArray(firstTicket.payment_idDetails) && firstTicket.payment_idDetails.length > 0) {
            paymentStatus = firstTicket.payment_idDetails[0].paymentStatus || "Completed";
          }
        }
        console.log("Payment Status:", paymentStatus);

        // Construct the object we'll display on the invoice.
        const orderDetailsData = {
          id: orderId,
          eventName:
            firstTicket.eventName?.EventName ||
            firstTicket.title ||
            "Event Name",
          date: formatEventDateTime(
            firstTicket.eventName?.StartDate || firstTicket.StartDate,
            firstTicket.eventName?.EndDate || firstTicket.EndDate
          ),
          // Using createdAt for the purchase date
          purchaseDate: firstTicket.createdAt || firstTicket.date || "",
          tickets: response.data.map((ticket) => ({
            name: ticket.name || "Guest",
            type: ticket.TicketType?.TicketType || ticket.type || "Standard",
            price: Number(ticket.price || ticket.total || 0),
            ticketId: ticket.ticketId || `TKT-${Math.floor(Math.random() * 10000)}`, // Add ticketId to each ticket
          })),
          totalRate: totals.totalRate,
          couponDiscount: totals.couponDiscount,
          total: totals.total,
          orderDate: firstTicket.orderDate || "",
          paymentMethod: firstTicket.paymentMethod || "Credit Card",
          paymentId: firstTicket.paymentId || `PAY-${Math.floor(Math.random() * 100000)}`,
          // Use the extracted payment status
          payment_idDetails: [{ paymentStatus }]
        };
        console.log("Final Order Data:", orderDetailsData);
        setOrderData(orderDetailsData);
      } else {
        console.log("No invoice data found in response");
        alert("No invoice data found.");
      }
    } catch (error) {
      console.error("Error fetching invoice data:", error);
      alert("Error fetching invoice data.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate the HTML string for the PDF:
   * - Logo on the left
   * - "Invoice : {orderId}" and "Purchased date: ..." on the right
   * - Removed the big "Invoice" heading
   * - Summary shows:
   *    Subtotal
   *    Discount (if applicable)
   *    Grand Total
   */
  const generateInvoiceHTML = () => {
    if (!orderData) return "";

    // Generate the ticket rows
    const ticketRows = orderData.tickets
      .map(
        (ticket, index) => `
          <tr>
            <td style="padding: 12px 8px; border: 1px solid #e0e0e0;">
              ${index + 1}
            </td>
            <td style="padding: 12px 8px; border: 1px solid #e0e0e0;">
              ${ticket.name}
            </td>
            <td style="padding: 12px 8px; border: 1px solid #e0e0e0;">
              ${ticket.type}
            </td>
            <td style="padding: 12px 8px; border: 1px solid #e0e0e0;">
              ${ticket.ticketId || ''}
            </td>
            <td style="padding: 12px 8px; border: 1px solid #e0e0e0; text-align: right;">
              $${ticket.price.toFixed(2)}
            </td>
          </tr>`
      )
      .join("");

    // Create discount line in summary if couponDiscount is not zero
    const discountLine =
      Number(orderData.couponDiscount) !== 0
        ? `
          <div>
            <strong>Discount:</strong>
            -$${Math.abs(Number(orderData.couponDiscount)).toFixed(2)}
          </div>
        `
        : "";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${orderData.id}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
            color: #444;
          }

          .invoice-container {
            max-width: 800px;
            margin: 40px auto;
            background-color: #fff;
            padding: 30px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }

          .header-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
          }

          .header-left img {
            max-width: 180px;
            height: auto;
          }

          .header-right {
            text-align: right;
          }

          .header-right p {
            margin: 3px 0;
            font-size: 14px;
          }

          .invoice-details {
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
          }

          .invoice-details .left,
          .invoice-details .right {
            width: 48%;
          }

          .invoice-details h2 {
            margin: 0 0 10px;
            font-size: 18px;
            color: #333;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 5px;
          }

          .invoice-details p {
            margin: 4px 0;
            font-size: 14px;
            color: #444;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }

          table th,
          table td {
            padding: 12px 8px;
            border: 1px solid #e0e0e0;
            text-align: left;
            font-size: 14px;
            color: #444;
          }

          table th {
            background-color: #f8f8f8;
            font-weight: 600;
            color: #333;
          }

          .summary {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            margin-bottom: 30px;
          }

          .summary div {
            font-size: 14px;
            margin: 4px 0;
            color: #444;
          }

          .summary .grand-total {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            border-top: 1px solid #e0e0e0;
            padding-top: 10px;
          }

          .footer {
            text-align: center;
            font-size: 12px;
            color: #444;
            border-top: 1px solid #e0e0e0;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">

          <!-- Header section with logo on left and "Invoice : {id}" & "Purchased date" on right -->
          <div class="header-section">
            <div class="header-left">
              <img 
                src="https://fronthiindia.barodaweb.org/_next/static/media/Hi-India%20Logo.bacafd6b.png"
                alt="Hi India Logo"
              />
            </div>
            <div class="header-right">
              <p style="font-weight: bold;">Invoice : ${orderData.id}</p>
              <p>Purchased date: ${formatPurchaseDate(orderData.purchaseDate)}</p>
            </div>
          </div>

          <div class="invoice-details">
            <div class="left">
              <h2>Event Details</h2>
              <p><strong>Event:</strong> ${orderData.eventName}</p>
              <p><strong>Date:</strong> ${orderData.date}</p>
            </div>
            <div class="right">
              <h2>Payment Information</h2>
              <p><strong>Payment ID:</strong> ${orderData.paymentId || ''}</p>
              <p><strong>Status:</strong> ${orderData?.payment_idDetails?.[0]?.paymentStatus || 'Completed'}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 8%;">No.</th>
                <th style="width: 30%;">Attendee</th>
                <th style="width: 20%;">Ticket Type</th>
                <th style="width: 20%;">Ticket ID</th>
                <th style="width: 22%;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${ticketRows}
            </tbody>
          </table>

          <div class="summary">
            <div>
              <strong>Subtotal:</strong>
              $${Number(orderData.totalRate).toFixed(2)}
            </div>
            ${discountLine}
            <div class="grand-total">
              <strong>Grand Total:</strong>
              $${Number(orderData.total).toFixed(2)}
            </div>
          </div>

          <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>For any questions, please contact advt@hiindia.com</p>
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
      const { uri } = await Print.printToFileAsync({ html });
      const filename = `invoice_${orderData.id}.pdf`;
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: filename,
      });
      setLoading(false);
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Failed to generate invoice. Please try again.");
      setLoading(false);
    }
  };

  // Share invoice details as plain text
  const handleShareInvoice = async () => {
    try {
      const discountText =
        Number(orderData.couponDiscount) !== 0
          ? `Discount: -$${Math.abs(Number(orderData.couponDiscount)).toFixed(2)}\n`
          : "";
      const shareMessage = `
Invoice : ${orderData.id}
Event: ${orderData.eventName}
Date: ${orderData.date}

Tickets:
${orderData.tickets
  .map(
    (ticket, index) =>
      `${index + 1}. ${ticket.name} - ${ticket.type} - Ticket ID: ${ticket.ticketId || 'N/A'} - $${Number(ticket.price).toFixed(2)}`
  )
  .join("\n")}

Subtotal: $${Number(orderData.totalRate).toFixed(2)}
${discountText}Grand Total: $${Number(orderData.total).toFixed(2)}

Thank you for your purchase!
      `;
      await Share.share({
        message: shareMessage,
        title: `Invoice : ${orderData.id}`,
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
        <MaterialCommunityIcons name="file-document-outline" size={60} color="#999" />
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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
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
              <MaterialCommunityIcons name="share-variant" size={20} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={handleDownloadInvoice}
              disabled={!orderData}
            >
              <MaterialCommunityIcons name="download" size={20} color="#FFF" />
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
                {/* This local logo is just for the on-screen UI.
                    The PDF uses the remote logo on the left. */}
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
                <Text style={styles.invoiceInfoSmallValue}>
                  {formatPurchaseDate(orderData.purchaseDate)}
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
                    <Text style={styles.eventMetaText}>{orderData.date}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Tickets Section */}
            <View style={styles.ticketsContainer}>
              <Text style={styles.sectionTitle}>Tickets</Text>
              
              {orderData.tickets.map((ticket, index) => (
                <View key={index} style={styles.ticketCard}>
                  <View style={styles.ticketCardHeader}>
                    <Text style={styles.ticketCardName}>{ticket.name}</Text>
                    <View style={styles.ticketTypeBadge}>
                      <Text style={styles.ticketTypeText}>{ticket.type}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.ticketCardBody}>
                    <View style={styles.ticketDetail}>
                      <Text style={styles.ticketDetailLabel}>Ticket ID</Text>
                      <Text style={styles.ticketDetailValue}>{ticket.ticketId || 'N/A'}</Text>
                    </View>
                    <View style={styles.ticketPrice}>
                      <Text style={styles.ticketPriceValue}>${Number(ticket.price).toFixed(2)}</Text>
                    </View>
                  </View>
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
                  <Text style={styles.totalLabel}>Grand Total</Text>
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
                  <Text style={styles.paymentInfoLabel}>Payment ID</Text>
                  <Text style={styles.paymentInfoValue}>
                    {orderData.paymentId || 'N/A'}
                  </Text>
                </View>
                <View style={styles.paymentInfoRow}>
                  <Text style={styles.paymentInfoLabel}>Status</Text>
                  <View style={styles.paymentStatusContainer}>
                    <Text style={styles.paymentStatusText}>{orderData?.payment_idDetails?.[0]?.paymentStatus}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Thank you for your purchase!</Text>
              <Text style={styles.footerSubText}>
                For any questions, please contact advt@hiindia.com
              </Text>
            </View>
          </LinearGradient>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
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
    paddingTop: Platform.OS === "ios" ? 50 : 45,
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
  headerRight: {
    width: 40,
  },
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
  invoiceInfoLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  invoiceInfoValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
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
  invoiceContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  invoiceContentContainer: {
    paddingBottom: 40,
  },
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
  logoImage: {
    height: 80,
    width: 180,
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  invoiceInfoSmallLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
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
  eventHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
  },
  eventDetailsBody: {
    padding: 16,
  },
  eventName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  eventMetaRow: {
    gap: 12,
  },
  eventMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  eventMetaText: {
    fontSize: 14,
    color: "#4B5563",
    marginLeft: 6,
  },
  // Tickets
  ticketsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  ticketCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  ticketCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  ticketCardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  ticketTypeBadge: {
    backgroundColor: "#E3000F15",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#E3000F30",
  },
  ticketTypeText: {
    fontSize: 12,
    color: "#E3000F",
    fontWeight: "600",
  },
  ticketCardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketDetail: {
    flex: 1,
  },
  ticketDetailLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  ticketDetailValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
  },
  ticketPrice: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  ticketPriceValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  // Summary
  summaryContainer: {
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 12,
    overflow: "hidden",
  },
  summaryInnerContainer: {
    padding: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#4B5563",
  },
  summaryValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
  },
  discountText: {
    color: "#10B981",
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
  },
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
  paymentInfoHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
  },
  paymentInfoBody: {
    padding: 16,
  },
  paymentInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  paymentInfoLabel: {
    fontSize: 14,
    color: "#4B5563",
  },
  paymentInfoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
  },
  paymentStatusContainer: {
    backgroundColor: "#DCFCE7",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  paymentStatusText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
  },
  // Footer
  footer: {
    alignItems: "center",
    marginTop: 8,
  },
  footerText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 8,
  },
  footerSubText: {
    fontSize: 13,
    color: "#6B7280",
  },
});
