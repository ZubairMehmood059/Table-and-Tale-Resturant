#pragma once

#include <array>
#include <string>
#include <vector>

namespace tabletale {

constexpr int NUM_CATEGORIES = 5;
constexpr int ITEMS_PER_CATEGORY = 4;
constexpr int TOTAL_MENU_ITEMS = NUM_CATEGORIES * ITEMS_PER_CATEGORY;
constexpr int NUM_TABLES = 10;
constexpr int TABLE_CAPACITY = 6;
constexpr int MAX_ORDERS = 100;
constexpr int STAFF_COUNT = 4;

constexpr double DISCOUNT_RATE = 0.10;
constexpr double TAX_RATE = 0.05;
constexpr int DISCOUNT_LIMIT = 2000;
constexpr int DELIVERY_FEE = 150;

inline const std::string MANAGEMENT_PASSWORD = "staff123";

inline const std::string RESTAURANT_NAME = "TABLE & TALE";
inline const std::string RESTAURANT_TAGLINE = "Where Fine Dining Meets Unforgettable Stories.";
inline const std::string RESTAURANT_ADDRESS = "Plot 18-C, Main Khayaban-e-Shahbaz, Phase 6, DHA";
inline const std::string RESTAURANT_CONTACT = "92+ 03-1234567";
inline const std::string RESTAURANT_HOURS = "6 PM - 1 AM";
inline const std::string RECEIPT_CLOSING =
    "Thank you for choosing us! We hope your evening with us becomes a cherished chapter.";

inline const std::array<std::string, NUM_CATEGORIES> CATEGORIES = {
    "Desi Delights",
    "Fast Food",
    "International Specials",
    "Desserts",
    "Beverages"
};

inline const std::array<std::array<std::string, ITEMS_PER_CATEGORY>, NUM_CATEGORIES> FOOD_ITEMS = {{
    {"Chicken Biryani", "Chicken Karahi", "Beef Nihari", "Chicken Pulao"},
    {"Zinger Burger", "Chicken Pizza", "French Fries", "Club Sandwich"},
    {"Alfredo Pasta", "Lasagna", "Chicken Steak", "Chow Mein"},
    {"Chocolate Cake", "Brownie", "Ice Cream", "Cheesecake"},
    {"Mineral Water", "Cold Drink", "Fresh Juice", "Milkshake"}
}};

inline const std::array<std::array<int, ITEMS_PER_CATEGORY>, NUM_CATEGORIES> PRICES = {{
    {350, 900, 550, 300},
    {450, 850, 200, 400},
    {650, 750, 950, 500},
    {250, 200, 150, 350},
    {80, 100, 180, 250}
}};

struct StaffMember {
    std::string id;
    std::string name;
    std::string role;
    std::string shift;
    std::string hours;
};

inline const std::array<StaffMember, STAFF_COUNT> STAFF_ROSTER = {{
    {"ST101", "Ayesha Khan", "Cashier", "night", "6 PM - 9 PM"},
    {"ST102", "Hamza Ali", "Order Manager", "mid night", "9 PM - 1 AM"},
    {"ST103", "Sana Malik", "Head Chef", "night", "6 PM - 1 AM"},
    {"ST104", "Bilal Ahmed", "Floor Supervisor", "mid night", "9 PM - 1 AM"}
}};

struct OrderRecord {
    std::string customerName;
    std::string diningType;
    std::string deliveryAddress;
    int guests = 0;
    std::array<bool, NUM_TABLES> tables{};
    std::array<std::array<int, ITEMS_PER_CATEGORY>, NUM_CATEGORIES> quantities{};
    double subtotal = 0.0;
    double discount = 0.0;
    double tax = 0.0;
    double deliveryCharge = 0.0;
    double billTotal = 0.0;
    bool paid = false;
    bool cancelled = false;
    std::string kitchenStatus = "Queued";
    int rating = 0;
    std::string review;
    double tip = 0.0;
};

struct GuestFeedback {
    std::string customerName;
    int rating = 0;
    std::vector<std::string> categories;
    std::string comment;
    std::string createdAt;
};

struct RestaurantState {
    int totalOrders = 0;
    double totalSales = 0.0;
    int totalCompletedOrders = 0;
    std::array<bool, NUM_TABLES> tableBooked{};
    std::array<std::string, NUM_TABLES> reservedBy{};
    std::vector<OrderRecord> orders;
    std::vector<GuestFeedback> guestFeedbacks;
};

struct BillSummary {
    double subtotal = 0.0;
    double discount = 0.0;
    double discountedSubtotal = 0.0;
    double tax = 0.0;
    double deliveryCharge = 0.0;
    double billTotal = 0.0;
};

} // namespace tabletale
