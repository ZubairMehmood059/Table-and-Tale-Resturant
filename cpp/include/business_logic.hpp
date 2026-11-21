#pragma once

#include "models.hpp"
#include <algorithm>
#include <cmath>
#include <string>
#include <vector>

namespace tabletale::logic {

struct OperationResult {
    bool ok = false;
    std::string message;
};

struct QuickOrderParseResult {
    bool ok = false;
    bool finishRequested = false;
    std::vector<int> validItemNumbers;
    std::vector<int> skippedNumbers;
    std::string error;
};

inline double roundMoney(double val) {
    return std::round(val * 100.0) / 100.0;
}

// Preserves C++ takeOrder() line parsing: digits, spaces, commas only; 1-20 valid; 0 finishes; deduplicated
inline QuickOrderParseResult parseQuickOrderLine(const std::string& line) {
    QuickOrderParseResult res;
    for (char ch : line) {
        if (!(ch >= '0' && ch <= '9') && ch != ' ' && ch != ',') {
            res.error = "Invalid input! Use only numbers separated by spaces or commas (example: 1 2 4).";
            return res;
        }
    }

    std::array<bool, TOTAL_MENU_ITEMS> selected{};
    int number = 0;
    bool inNumber = false;

    for (size_t c = 0; c <= line.length(); c++) {
        char ch = (c < line.length()) ? line[c] : ' ';
        if (ch >= '0' && ch <= '9') {
            inNumber = true;
            if (number < 1000) {
                number = number * 10 + (ch - '0');
            }
        } else if (inNumber) {
            if (number == 0) {
                res.finishRequested = true;
            } else if (number > TOTAL_MENU_ITEMS) {
                res.skippedNumbers.push_back(number);
            } else if (!selected[static_cast<size_t>(number - 1)]) {
                selected[static_cast<size_t>(number - 1)] = true;
                res.validItemNumbers.push_back(number);
            }
            number = 0;
            inNumber = false;
        }
    }

    if (res.validItemNumbers.empty() && !res.finishRequested) {
        res.error = "No valid item numbers entered. Enter item numbers between 1 and 20.";
        return res;
    }

    res.ok = true;
    return res;
}

// Exact C++ calculateTotal() + calculateBill() rules
inline BillSummary calculateBillBreakdown(
    const std::array<std::array<int, ITEMS_PER_CATEGORY>, NUM_CATEGORIES>& quantities,
    const std::string& diningType
) {
    BillSummary bill;
    int subtotalInt = 0;

    for (int i = 0; i < NUM_CATEGORIES; i++) {
        for (int j = 0; j < ITEMS_PER_CATEGORY; j++) {
            int qty = std::max(0, quantities[i][j]);
            subtotalInt += PRICES[i][j] * qty;
        }
    }

    bill.subtotal = static_cast<double>(subtotalInt);

    if (subtotalInt >= DISCOUNT_LIMIT) {
        bill.discount = roundMoney(bill.subtotal * DISCOUNT_RATE);
    }

    bill.discountedSubtotal = roundMoney(bill.subtotal - bill.discount);
    bill.tax = roundMoney(bill.discountedSubtotal * TAX_RATE);

    if (diningType == "Online Delivery") {
        bill.deliveryCharge = static_cast<double>(DELIVERY_FEE);
    }

    bill.billTotal = roundMoney(bill.discountedSubtotal + bill.tax + bill.deliveryCharge);
    return bill;
}

inline int countAvailableTables(const RestaurantState& state) {
    int count = 0;
    for (int i = 0; i < NUM_TABLES; i++) {
        if (!state.tableBooked[i]) count++;
    }
    return count;
}

inline int calculateTablesNeeded(int guests) {
    if (guests <= 0) return 0;
    return (guests + TABLE_CAPACITY - 1) / TABLE_CAPACITY;
}

struct ReservationResult {
    bool ok = false;
    std::string message;
    int tablesNeeded = 0;
    std::vector<int> reservedTables;
};

inline ReservationResult reserveTables(
    RestaurantState& state,
    const std::string& customerName,
    int guests,
    const std::vector<int>& tableNumbers
) {
    ReservationResult res;

    if (customerName.empty()) {
        res.message = "Customer name cannot be empty.";
        return res;
    }

    int availableTables = countAvailableTables(state);
    if (availableTables == 0) {
        res.message = "Sorry! All tables are currently reserved.";
        return res;
    }

    if (guests <= 0) {
        res.message = "Number of guests must be greater than zero.";
        return res;
    }

    if (guests > availableTables * TABLE_CAPACITY) {
        res.message = "Sorry! Only " + std::to_string(availableTables * TABLE_CAPACITY) +
                      " seats are currently available.";
        return res;
    }

    int tablesNeeded = calculateTablesNeeded(guests);
    res.tablesNeeded = tablesNeeded;

    if (static_cast<int>(tableNumbers.size()) != tablesNeeded) {
        res.message = std::to_string(guests) + " guest(s) need exactly " +
                      std::to_string(tablesNeeded) + " table(s) (" +
                      std::to_string(tablesNeeded * TABLE_CAPACITY) + " seats).";
        return res;
    }

    std::array<bool, NUM_TABLES> seen{};
    for (int tableNum : tableNumbers) {
        if (tableNum < 1 || tableNum > NUM_TABLES) {
            res.message = "Invalid table number " + std::to_string(tableNum) + ". Select between 1 and 10.";
            return res;
        }
        int idx = tableNum - 1;
        if (seen[static_cast<size_t>(idx)]) {
            res.message = "Table " + std::to_string(tableNum) + " was selected more than once.";
            return res;
        }
        if (state.tableBooked[static_cast<size_t>(idx)]) {
            res.message = "Table " + std::to_string(tableNum) + " is already booked by " +
                          state.reservedBy[static_cast<size_t>(idx)] + ".";
            return res;
        }
        seen[static_cast<size_t>(idx)] = true;
    }

    for (int tableNum : tableNumbers) {
        int idx = tableNum - 1;
        state.tableBooked[static_cast<size_t>(idx)] = true;
        state.reservedBy[static_cast<size_t>(idx)] = customerName;
        res.reservedTables.push_back(tableNum);
    }

    res.ok = true;
    res.message = "Reservation completed successfully!";
    return res;
}

inline OperationResult releaseTables(RestaurantState& state, const std::vector<int>& tableNumbers) {
    OperationResult res;
    int released = 0;
    for (int tableNum : tableNumbers) {
        if (tableNum >= 1 && tableNum <= NUM_TABLES) {
            int idx = tableNum - 1;
            if (state.tableBooked[static_cast<size_t>(idx)]) {
                state.tableBooked[static_cast<size_t>(idx)] = false;
                state.reservedBy[static_cast<size_t>(idx)] = "";
                released++;
            }
        }
    }
    res.ok = true;
    res.message = "Released " + std::to_string(released) + " table(s).";
    return res;
}

struct CheckoutResult {
    bool ok = false;
    std::string message;
    int orderIndex = -1;
    BillSummary bill;
    double change = 0.0;
    bool paid = false;
    bool cancelled = false;
};

inline CheckoutResult checkoutOrder(
    RestaurantState& state,
    const std::string& customerName,
    const std::string& diningType,
    const std::string& deliveryAddress,
    int guests,
    const std::vector<int>& tableNumbers,
    const std::array<std::array<int, ITEMS_PER_CATEGORY>, NUM_CATEGORIES>& quantities,
    const std::string& paymentMethod,
    double cashGiven
) {
    CheckoutResult res;

    if (customerName.empty()) {
        res.message = "Customer name cannot be empty.";
        return res;
    }

    if (diningType != "Dine-in" && diningType != "Takeaway" && diningType != "Online Delivery") {
        res.message = "Invalid order type!";
        return res;
    }

    if (diningType == "Online Delivery" && deliveryAddress.empty()) {
        res.message = "Delivery address cannot be empty!";
        return res;
    }

    if (state.totalOrders >= MAX_ORDERS) {
        res.message = "Order limit reached (" + std::to_string(MAX_ORDERS) + "). Cannot save more orders.";
        return res;
    }

    BillSummary bill = calculateBillBreakdown(quantities, diningType);
    if (bill.subtotal <= 0.0) {
        res.message = "No items were ordered.";
        return res;
    }

    if (paymentMethod != "cash" && paymentMethod != "online" && paymentMethod != "cancel") {
        res.message = "Invalid payment method! Choose cash, online, or cancel.";
        return res;
    }

    if (paymentMethod == "cash") {
        if (cashGiven < 0.0) {
            res.message = "Invalid cash amount.";
            return res;
        }
        if (cashGiven + 1e-6 < bill.billTotal) {
            res.message = "Insufficient cash given! Required: Rs. " + std::to_string(static_cast<int>(std::ceil(bill.billTotal)));
            return res;
        }
        res.change = roundMoney(cashGiven - bill.billTotal);
    }

    OrderRecord record;
    record.customerName = customerName;
    record.diningType = diningType;
    record.deliveryAddress = (diningType == "Online Delivery") ? deliveryAddress : "";
    record.guests = (diningType == "Dine-in") ? guests : 0;
    record.quantities = quantities;
    record.subtotal = bill.subtotal;
    record.discount = bill.discount;
    record.tax = bill.tax;
    record.deliveryCharge = bill.deliveryCharge;
    record.billTotal = bill.billTotal;

    if (diningType == "Dine-in") {
        for (int t : tableNumbers) {
            if (t >= 1 && t <= NUM_TABLES) {
                record.tables[static_cast<size_t>(t - 1)] = true;
            }
        }
    }

    if (paymentMethod == "cancel") {
        record.paid = false;
        record.cancelled = true;
        record.kitchenStatus = "Cancelled";
        res.cancelled = true;
        res.message = "Payment cancelled. Order has been marked as CANCELLED.";
    } else {
        record.paid = true;
        record.cancelled = false;
        record.kitchenStatus = "Queued";
        state.totalSales = roundMoney(state.totalSales + bill.billTotal);
        state.totalCompletedOrders++;
        res.paid = true;
        res.message = (paymentMethod == "cash")
                          ? "Cash payment received successfully."
                          : "Online payment processed successfully.";
    }

    int idx = state.totalOrders;
    state.orders.push_back(record);
    state.totalOrders++;

    // Release reserved tables after checkout or cancellation (matching C++ customerFlow)
    if (!tableNumbers.empty()) {
        releaseTables(state, tableNumbers);
    }

    res.ok = true;
    res.orderIndex = idx;
    res.bill = bill;
    return res;
}

inline OperationResult updateKitchenStatus(
    RestaurantState& state,
    int orderIndex,
    const std::string& nextStatus
) {
    OperationResult res;
    if (orderIndex < 0 || orderIndex >= state.totalOrders || orderIndex >= static_cast<int>(state.orders.size())) {
        res.message = "Order not found.";
        return res;
    }

    auto& ord = state.orders[static_cast<size_t>(orderIndex)];
    if (ord.cancelled) {
        res.message = "Cancelled orders cannot be updated in the kitchen queue.";
        return res;
    }

    if (nextStatus != "Queued" && nextStatus != "Preparing" && nextStatus != "Ready" && nextStatus != "Served") {
        res.message = "Invalid kitchen status. Allowed values: Queued, Preparing, Ready, Served.";
        return res;
    }

    ord.kitchenStatus = nextStatus;
    res.ok = true;
    res.message = "Order #" + std::to_string(orderIndex + 1) + " kitchen status updated to " + nextStatus + ".";
    return res;
}

inline OperationResult submitFeedback(
    RestaurantState& state,
    int orderIndex,
    int rating,
    const std::string& review,
    double tip
) {
    OperationResult res;
    if (orderIndex < 0 || orderIndex >= state.totalOrders || orderIndex >= static_cast<int>(state.orders.size())) {
        res.message = "Order not found.";
        return res;
    }

    auto& ord = state.orders[static_cast<size_t>(orderIndex)];
    if (!ord.paid) {
        res.message = "Feedback is only available for paid orders.";
        return res;
    }

    if (rating < 0 || rating > 5) {
        res.message = "Invalid rating! Enter a number from 0 to 5.";
        return res;
    }

    if (tip < 0.0) {
        res.message = "Invalid tip amount! Enter a non-negative amount.";
        return res;
    }

    ord.rating = rating;
    ord.review = (rating > 0) ? review : "";
    ord.tip = roundMoney(tip);

    res.ok = true;
    res.message = (rating > 0 || tip > 0.0)
                      ? "Thank you for your feedback!"
                      : "Thank you for dining with us!";
    return res;
}

inline std::string trimText(const std::string& input) {
    size_t start = input.find_first_not_of(" \t\n\r");
    if (start == std::string::npos) return "";
    size_t end = input.find_last_not_of(" \t\n\r");
    return input.substr(start, end - start + 1);
}

struct GuestFeedbackResult {
    bool ok = false;
    std::string message;
    int feedbackIndex = -1;
};

inline GuestFeedbackResult submitGuestFeedback(
    RestaurantState& state,
    const std::string& customerName,
    int rating,
    const std::vector<std::string>& categories,
    const std::string& comment,
    const std::string& createdAt
) {
    GuestFeedbackResult res;

    std::string cleanName = trimText(customerName);
    if (cleanName.empty()) {
        res.message = "Please enter your name before submitting feedback.";
        return res;
    }

    if (rating < 1 || rating > 5) {
        res.message = "Please select an experience rating between 1 and 5 stars.";
        return res;
    }

    std::vector<std::string> cleanCategories;
    for (const auto& cat : categories) {
        std::string trimmed = trimText(cat);
        if (!trimmed.empty()) {
            cleanCategories.push_back(trimmed);
        }
    }

    if (cleanCategories.empty()) {
        res.message = "Please select at least one service category.";
        return res;
    }

    std::string cleanComment = trimText(comment);
    if (cleanComment.empty()) {
        res.message = "Please share a comment about your dining experience.";
        return res;
    }

    if (state.guestFeedbacks.size() >= 1000) {
        res.message = "Feedback log capacity reached.";
        return res;
    }

    GuestFeedback entry;
    entry.customerName = cleanName;
    entry.rating = rating;
    entry.categories = std::move(cleanCategories);
    entry.comment = cleanComment;
    entry.createdAt = trimText(createdAt);

    int idx = static_cast<int>(state.guestFeedbacks.size());
    state.guestFeedbacks.push_back(std::move(entry));

    res.ok = true;
    res.feedbackIndex = idx;
    res.message = "Thank you for sharing your story with Table & Tale!";
    return res;
}

struct SalesReport {
    int totalOrders = 0;
    int totalCompletedOrders = 0;
    int cancelledOrders = 0;
    double totalSales = 0.0;
    double totalTips = 0.0;
    int ratingCount = 0;
    double averageRating = 0.0;
    int guestFeedbackCount = 0;
};

inline SalesReport computeSalesReport(const RestaurantState& state) {
    SalesReport report;
    report.totalOrders = state.totalOrders;
    report.totalCompletedOrders = state.totalCompletedOrders;
    report.totalSales = roundMoney(state.totalSales);
    report.guestFeedbackCount = static_cast<int>(state.guestFeedbacks.size());

    int ratingSum = 0;
    for (int k = 0; k < state.totalOrders && k < static_cast<int>(state.orders.size()); k++) {
        const auto& ord = state.orders[static_cast<size_t>(k)];
        if (ord.cancelled) {
            report.cancelledOrders++;
        }
        if (ord.rating > 0) {
            report.ratingCount++;
            ratingSum += ord.rating;
        }
        report.totalTips = roundMoney(report.totalTips + ord.tip);
    }

    if (report.ratingCount > 0) {
        report.averageRating = std::round((static_cast<double>(ratingSum) / report.ratingCount) * 100.0) / 100.0;
    }

    return report;
}

inline bool verifyStaffPassword(const std::string& password) {
    return password == MANAGEMENT_PASSWORD;
}

} // namespace tabletale::logic
