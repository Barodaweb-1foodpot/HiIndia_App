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
  SafeAreaView,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";

export default function Invoice({ route, navigation }) {
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  
  // Get order ID from route params or use a default for testing
  const { orderId } = route.params || { orderId: "ORD468635" };

  useEffect(() => {
    // Fetch order data - for now using static data
    setLoading(true);
    
    // Simulate API call with setTimeout
    setTimeout(() => {
      setOrderData({
        id: "ORD468635",
        eventName: "Soulful Rhythms: Falguni Pathak's Navratri Extravaganza",
        date: "Sep 29, 2025 | 7:00 PM - 11:00 PM",
        venue: "Baroda Exhibition Center, Vadodara",
        tickets: [
          { name: "Deep Mehta", type: "Gold", price: 299.00 },
          { name: "Ansh Raiyni", type: "Gold", price: 299.00 },
          { name: "Yaksh Patel", type: "Gold", price: 299.00 },
        ],
        totalRate: 897.00,
        couponDiscount: 50.00,
        total: 847.00,
        orderDate: "March 10, 2025",
        paymentMethod: "Credit Card"
      });
      
      setLoading(false);
    }, 1000);
  }, [orderId]);

  const generateInvoiceHTML = () => {
    if (!orderData) return "";
    
    const ticketRows = orderData.tickets.map((ticket, index) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px 8px;">${index + 1}</td>
        <td style="padding: 12px 8px;">${ticket.name}</td>
        <td style="padding: 12px 8px;">${ticket.type}</td>
        <td style="padding: 12px 8px; text-align: right;">$${ticket.price.toFixed(2)}</td>
      </tr>
    `).join('');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #333;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #E3000F;
          }
          .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: #333;
            margin-bottom: 20px;
            text-align: center;
          }
          .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .invoice-details-col {
            max-width: 50%;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          thead {
            background-color: #f5f5f5;
          }
          th {
            padding: 12px 8px;
            text-align: left;
          }
          .summary {
            margin-top: 30px;
            text-align: right;
          }
          .summary-row {
            margin-bottom: 8px;
          }
          .total {
            font-size: 18px;
            font-weight: bold;
            margin-top: 12px;
            color: #E3000F;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 14px;
            color: #777;
          }
          .divider {
            height: 2px;
            background-color: #eee;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="invoice-header">
            <div class="logo">HIIN INDIA</div>
            <div>
              <div><strong>Invoice #: ${orderData.id}</strong></div>
              <div>Date: ${orderData.orderDate}</div>
            </div>
          </div>
          
          <div class="invoice-title">INVOICE</div>
          
          <div class="invoice-details">
            <div class="invoice-details-col">
              <div><strong>Event:</strong></div>
              <div>${orderData.eventName}</div>
              <div>${orderData.date}</div>
              <div>${orderData.venue}</div>
            </div>
            <div class="invoice-details-col" style="text-align: right;">
              <div><strong>Order ID:</strong> ${orderData.id}</div>
              <div><strong>Payment Method:</strong> ${orderData.paymentMethod}</div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Attendee</th>
                <th>Ticket Type</th>
                <th style="text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${ticketRows}
            </tbody>
          </table>
          
          <div class="summary">
            <div class="summary-row">
              <strong>Subtotal:</strong> $${orderData.totalRate.toFixed(2)}
            </div>
            <div class="summary-row">
              <strong>Discount:</strong> -$${orderData.couponDiscount.toFixed(2)}
            </div>
            <div class="total">
              <strong>Total:</strong> $${orderData.total.toFixed(2)}
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>For any questions, please contact support@hiindia.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleDownloadInvoice = async () => {
    try {
      setLoading(true);
      const html = generateInvoiceHTML();
      
      // Generate PDF file
      const { uri } = await Print.printToFileAsync({ html });
      
      // Get the PDF file name
      const filename = `invoice_${orderData.id}.pdf`;
      
      if (Platform.OS === 'ios') {
        // On iOS, use sharing
        await Sharing.shareAsync(uri);
      } else {
        // On Android, save to downloads
        const downloadDir = FileSystem.documentDirectory + filename;
        await FileSystem.copyAsync({
          from: uri,
          to: downloadDir
        });
        
        // Share the downloaded file
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

  const handleShareInvoice = async () => {
    try {
      const shareMessage = `
Invoice #${orderData.id}
Event: ${orderData.eventName}
Date: ${orderData.date}
Venue: ${orderData.venue}

Tickets:
${orderData.tickets.map((ticket, index) => `${index + 1}. ${ticket.name} - ${ticket.type} - $${ticket.price}`).join('\n')}

Subtotal: $${orderData.totalRate.toFixed(2)}
Discount: -$${orderData.couponDiscount.toFixed(2)}
Total: $${orderData.total.toFixed(2)}

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#E3000F" />
      
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
            <Text style={styles.invoiceInfoValue}>{orderData?.id || '-'}</Text>
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
        
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#E3000F" />
            <Text style={styles.loadingText}>Loading invoice...</Text>
          </View>
        ) : orderData ? (
          <ScrollView 
            style={styles.invoiceContainer}
            contentContainerStyle={styles.invoiceContentContainer}
            showsVerticalScrollIndicator={false}
          >
            <LinearGradient
              colors={["#FFFFFF", "#F9FAFB"]}
              style={styles.invoiceCard}
            >
              {/* Logo and Date */}
              <View style={styles.brandRow}>
                <Text style={styles.brandName}>HIIN INDIA</Text>
                <Text style={styles.invoiceDate}>{orderData.orderDate}</Text>
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
                      <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                      <Text style={styles.eventMetaText}>{orderData.date}</Text>
                    </View>
                    <View style={styles.eventMetaItem}>
                      <Ionicons name="location-outline" size={16} color="#6B7280" />
                      <Text style={styles.eventMetaText}>{orderData.venue}</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Tickets Section */}
              <View style={styles.ticketsContainer}>
                <Text style={styles.sectionTitle}>Tickets</Text>
                
                <View style={styles.ticketHeader}>
                  <Text style={[styles.ticketHeaderText, { flex: 1.5 }]}>Attendee</Text>
                  <Text style={[styles.ticketHeaderText, { flex: 1 }]}>Type</Text>
                  <Text style={[styles.ticketHeaderText, { flex: 1, textAlign: 'right' }]}>Price</Text>
                </View>
                
                {orderData.tickets.map((ticket, index) => (
                  <View key={index} style={styles.ticketRow}>
                    <Text style={[styles.ticketText, { flex: 1.5 }]}>{ticket.name}</Text>
                    <View style={[styles.ticketTypeContainer, { flex: 1 }]}>
                      <Text style={styles.ticketTypeText}>{ticket.type}</Text>
                    </View>
                    <Text style={[styles.ticketText, { flex: 1, textAlign: 'right', fontWeight: '600' }]}>
                      ${ticket.price.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
              
              {/* Summary */}
              <View style={styles.summaryContainer}>
                <View style={styles.summaryInnerContainer}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>${orderData.totalRate.toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Discount</Text>
                    <Text style={[styles.summaryValue, styles.discountText]}>
                      -${orderData.couponDiscount.toFixed(2)}
                    </Text>
                  </View>
                  <View style={[styles.summaryRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>${orderData.total.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
              
              {/* Payment Info */}
              <View style={styles.paymentInfoContainer}>
                <View style={styles.paymentInfoHeader}>
                  <Text style={styles.paymentInfoHeaderText}>Payment Information</Text>
                </View>
                <View style={styles.paymentInfoBody}>
                  <View style={styles.paymentInfoRow}>
                    <Text style={styles.paymentInfoLabel}>Method</Text>
                    <Text style={styles.paymentInfoValue}>{orderData.paymentMethod}</Text>
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
                <Text style={styles.footerText}>Thank you for your purchase!</Text>
                <Text style={styles.footerSubText}>For any questions, please contact support@hiindia.com</Text>
              </View>
            </LinearGradient>
          </ScrollView>
        ) : (
          <View style={styles.noDataContainer}>
            <MaterialCommunityIcons name="receipt-text-outline" size={64} color="#D1D5DB" />
            <Text style={styles.noDataText}>No invoice data found</Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={() => navigation.replace('Invoice', { orderId })}
            >
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3000F",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
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
  invoiceInfoBox: {
    flex: 1,
  },
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
    backgroundColor: "#E3000F",
    alignItems: "center",
    justifyContent: "center",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#6B7280",
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
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  brandName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#E3000F",
    letterSpacing: 0.5,
  },
  invoiceDate: {
    fontSize: 14,
    color: "#6B7280",
  },
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
  ticketsContainer: {
    marginBottom: 24,
  },
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
  ticketHeaderText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
  },
  ticketRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    alignItems: "center",
  },
  ticketText: {
    fontSize: 14,
    color: "#1F2937",
  },
  ticketTypeContainer: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  ticketTypeText: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "500",
  },
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
    color: "#E3000F",
  },
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
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 50,
  },
  noDataText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 12,
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: "#E3000F",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
});