#include <iostream>
#include <string>
#include <iomanip>
#include <limits>
#include <cstdlib>
#include <fstream>

#ifdef _WIN32
#include <windows.h>
#include <conio.h>
#endif

using namespace std;

// =============================================
// TABLE & TALE - RESTAURANT MANAGEMENT SYSTEM
// Where Fine Dining Meets Unforgettable Stories.
// Original C++ Source Preserved as Reference
// =============================================

string customerName;
string diningType;
string deliveryAddress;

bool tableBooked[10] = {false};
string reservedBy[10];

bool currentTables[10] = {false};
int currentTableCount = 0;
int currentGuests = 0;

string categories[5] = {
    "Desi Delights",
    "Fast Food",
    "International Specials",
    "Desserts",
    "Beverages"
};

string foodItems[5][4] = {
    {"Chicken Biryani", "Chicken Karahi", "Beef Nihari", "Chicken Pulao"},
    {"Zinger Burger", "Chicken Pizza", "French Fries", "Club Sandwich"},
    {"Alfredo Pasta", "Lasagna", "Chicken Steak", "Chow Mein"},
    {"Chocolate Cake", "Brownie", "Ice Cream", "Cheesecake"},
    {"Mineral Water", "Cold Drink", "Fresh Juice", "Milkshake"}
};

int prices[5][4] = {
    {350, 900, 550, 300},
    {450, 850, 200, 400},
    {650, 750, 950, 500},
    {250, 200, 150, 350},
    {80, 100, 180, 250}
};

int quantities[5][4] = {0};
int itemTotals[5][4] = {0};

int grandTotal = 0;
float discountAmount = 0;
float taxAmount = 0;
float deliveryCharge = 0;
float billTotal = 0;

const float DISCOUNT_RATE = 0.10;
const float TAX_RATE = 0.05;
const int DISCOUNT_LIMIT = 2000;
const int DELIVERY_FEE = 150;
const int TABLE_CAPACITY = 6;
const string MANAGEMENT_PASSWORD = "staff123";
const string DATA_FILE = "tabletale_data.txt";
const int MAX_ORDERS = 100;

int orderHistory[MAX_ORDERS][5][4] = {0};
string orderCustomers[MAX_ORDERS];
string orderDiningTypes[MAX_ORDERS];
string orderAddresses[MAX_ORDERS];
bool orderTables[MAX_ORDERS][10] = {false};
int orderGuests[MAX_ORDERS] = {0};

float orderSubtotals[MAX_ORDERS] = {0};
float orderDiscounts[MAX_ORDERS] = {0};
float orderTaxes[MAX_ORDERS] = {0};
float orderDeliveryCharges[MAX_ORDERS] = {0};
float orderBills[MAX_ORDERS] = {0};

bool orderPaid[MAX_ORDERS] = {false};
bool orderCancelled[MAX_ORDERS] = {false};
int orderRatings[MAX_ORDERS] = {0};
string orderReviews[MAX_ORDERS];
float orderTips[MAX_ORDERS] = {0};

int totalOrders = 0;
int currentOrderIndex = -1;
float totalSales = 0;
int totalCompletedOrders = 0;
bool paymentStatus = false;

const int STAFF_COUNT = 4;
string staffIDs[STAFF_COUNT] = {"ST101", "ST102", "ST103", "ST104"};
string staffNames[STAFF_COUNT] = {"Ayesha Khan", "Hamza Ali", "Sana Malik", "Bilal Ahmed"};
string staffRoles[STAFF_COUNT] = {"Cashier", "Order Manager", "Head Chef", "Floor Supervisor"};
string staffShifts[STAFF_COUNT] = {"night", "mid night", "night", "mid night"};
string staffHours[STAFF_COUNT] = {"6 PM - 9 PM", "9 PM - 1 AM", "6 PM - 1 AM", "9 PM - 1 AM"};

int main() {
    cout << "Original Table & Tale Console Reference Archived." << endl;
    return 0;
}
