#include <iostream>
#include <string>
#include <iomanip>
#include <limits>
#include<cstdlib>
#include <fstream>      // [NEW] needed for saving / loading data

#ifdef _WIN32
#include <windows.h>
#include <conio.h>      // [NEW] needed to hide the password while typing
#endif

using namespace std;

// =============================================
// TABLE & TALE - RESTAURANT MANAGEMENT SYSTEM
// Where Fine Dining Meets Unforgettable Stories.
// =============================================
//
// Changes in this version are marked with  // [NEW]  or  // [CHANGED]
//


// ---------- SHARED CUSTOMER VARIABLES ----------

string customerName;
string diningType;
string deliveryAddress;

bool tableBooked[10] = {false};
string reservedBy[10];

bool currentTables[10] = {false};
int currentTableCount = 0;

int currentGuests = 0;                      // [NEW] guests for the current reservation


// ---------- SHARED FOOD ARRAYS ----------

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


// ---------- BILLING SETTINGS ----------

const float DISCOUNT_RATE = 0.10;
const float TAX_RATE = 0.05;

const int DISCOUNT_LIMIT = 2000;
const int DELIVERY_FEE = 150;


// ---------- TABLE SETTINGS ----------

const int TABLE_CAPACITY = 6;               // [NEW] one table seats 6 people


// ---------- SECURITY & FILE SETTINGS ----------

const string MANAGEMENT_PASSWORD = "staff123";      // [NEW] change this to your own password
const string DATA_FILE = "tabletale_data.txt";      // [NEW] all data is saved in this file


// ---------- ORDER HISTORY ----------

const int MAX_ORDERS = 100;                 // [CHANGED] was 20 - orders are now saved forever, so 20 would fill up quickly

int orderHistory[MAX_ORDERS][5][4] = {0};

string orderCustomers[MAX_ORDERS];
string orderDiningTypes[MAX_ORDERS];
string orderAddresses[MAX_ORDERS];

bool orderTables[MAX_ORDERS][10] = {false};

int orderGuests[MAX_ORDERS] = {0};          // [NEW]

float orderSubtotals[MAX_ORDERS] = {0};
float orderDiscounts[MAX_ORDERS] = {0};
float orderTaxes[MAX_ORDERS] = {0};
float orderDeliveryCharges[MAX_ORDERS] = {0};
float orderBills[MAX_ORDERS] = {0};

bool orderPaid[MAX_ORDERS] = {false};
bool orderCancelled[MAX_ORDERS] = {false};  // [NEW]

int orderRatings[MAX_ORDERS] = {0};         // [NEW] 1-5, 0 = no rating
string orderReviews[MAX_ORDERS];            // [NEW]
float orderTips[MAX_ORDERS] = {0};          // [NEW]

int totalOrders = 0;
int currentOrderIndex = -1;

float totalSales = 0;
int totalCompletedOrders = 0;

bool paymentStatus = false;


// ---------- STAFF MANAGEMENT ----------

const int STAFF_COUNT = 4;          // [CHANGED] was 2 (staff 3 and 4 are sample data - replace with your own)

string staffIDs[STAFF_COUNT] = {
    "ST101",
    "ST102",
    "ST103",
    "ST104"
};

string staffNames[STAFF_COUNT] = {
    "Ayesha Khan",
    "Hamza Ali",
    "Sana Malik",
    "Bilal Ahmed"
};

string staffRoles[STAFF_COUNT] = {
    "Cashier",
    "Order Manager",
    "Head Chef",
    "Floor Supervisor"
};

string staffShifts[STAFF_COUNT] = {
    "night",
    "mid night",
    "night",
    "mid night"
};

string staffHours[STAFF_COUNT] = {
    "6 PM - 9 PM",
    "9 PM - 1 AM",
    "6 PM - 1 AM",
    "9 PM - 1 AM"
};


// ---------- TABLE & TALE COLOUR THEME ----------

const int HEADING_PINK = 0xFD;
const int NORMAL_TEXT = 0xF0;
const int INPUT_BLUE = 0xF9;
const int HIGHLIGHT_GOLD = 0xF6;


// =============================================
// FUNCTION PROTOTYPES
// =============================================

// Member 1 - Main Interface

void setColor(int color);
void welcomeScreen();
void mainMenu();
void customerPanel();
void customerFlow();
void managementPanel();

// Input Validation

int getChoice();
float getAmount();

// Member 2 - Menu and Ordering

void displayMenu();
void displayCategories();
void displayFoodItems(int category);
void takeOrder();
void calculateTotal();
void displayOrder();
bool reviewOrder();                 // [NEW] confirm / add more / remove items
void removeItem();                  // [NEW]

// Member 3 - Dining and Reservations

bool selectDiningType();
bool reserveTable();
void displayTables();
void managementTableStatus();
void releaseTable();
void showReservationSummary();      // [NEW]

// Member 4 - Billing and Management

bool placeOrder();
void calculateBill();
bool processPayment();
void printReceipt();
void askFeedback();                 // [NEW]
void viewOrders();
void showTotalSales();

// Additional Feature - Staff

void staffManagement();
string readPassword();              // [NEW]
bool staffLogin();                  // [NEW]

// File Saving                      // [NEW]

void saveData();
void loadData();


// =============================================
// INPUT VALIDATION
// =============================================

int getChoice()
{
    int choice;

    while(!(cin >> choice))
    {
        cout << "Invalid input! Enter a number: ";

        cin.clear();

        cin.ignore(
            numeric_limits<streamsize>::max(),
            '\n'
        );
    }

    // Remove leftover newline
    cin.ignore(
        numeric_limits<streamsize>::max(),
        '\n'
    );

    return choice;
}


float getAmount()
{
    float amount;

    while(!(cin >> amount) || amount < 0)
    {
        cout << "Invalid amount! Enter a valid amount: Rs. ";

        cin.clear();

        cin.ignore(
            numeric_limits<streamsize>::max(),
            '\n'
        );
    }

    cin.ignore(
        numeric_limits<streamsize>::max(),
        '\n'
    );

    return amount;
}


// =============================================
// [NEW] FILE SAVING AND LOADING
// Every value is stored on its own line.
// =============================================

string readLine(ifstream &file)
{
    string line;

    getline(file, line);

    return line;
}


void saveData()
{
    ofstream file(DATA_FILE.c_str());

    if(!file)
    {
        // [CHANGED] explain the problem once instead of after every order
        static bool warned = false;

        if(!warned)
        {
            cout << "\nWarning: Could not save data to \"" << DATA_FILE << "\".\n";
            cout << "The program still works, but orders will be lost when it closes.\n";
            cout << "Make sure it runs from a folder you can write to (not a zip file,\n";
            cout << "Program Files, a read-only drive or an online compiler) and that\n";
            cout << "the file is not set to read-only.\n";

            warned = true;
        }

        return;
    }

    file << fixed << setprecision(2);

    // General totals

    file << totalOrders << "\n";
    file << totalSales << "\n";
    file << totalCompletedOrders << "\n";


    // Table status

    for(int i = 0; i < 10; i++)
    {
        file << (tableBooked[i] ? 1 : 0) << "\n";
        file << reservedBy[i] << "\n";
    }


    // All orders

    for(int k = 0; k < totalOrders; k++)
    {
        file << orderCustomers[k] << "\n";
        file << orderDiningTypes[k] << "\n";
        file << orderAddresses[k] << "\n";
        file << orderGuests[k] << "\n";

        for(int t = 0; t < 10; t++)
        {
            file << (orderTables[k][t] ? 1 : 0) << "\n";
        }

        for(int i = 0; i < 5; i++)
        {
            for(int j = 0; j < 4; j++)
            {
                file << orderHistory[k][i][j] << "\n";
            }
        }

        file << orderSubtotals[k] << "\n";
        file << orderDiscounts[k] << "\n";
        file << orderTaxes[k] << "\n";
        file << orderDeliveryCharges[k] << "\n";
        file << orderBills[k] << "\n";

        file << (orderPaid[k] ? 1 : 0) << "\n";
        file << (orderCancelled[k] ? 1 : 0) << "\n";

        file << orderRatings[k] << "\n";
        file << orderReviews[k] << "\n";
        file << orderTips[k] << "\n";
    }

    file.close();
}


void loadData()
{
    ifstream file(DATA_FILE.c_str());

    if(!file)
    {
        // First time running the program - nothing to load
        return;
    }

    int savedOrders = atoi(readLine(file).c_str());

    if(savedOrders < 0 || savedOrders > MAX_ORDERS)
    {
        cout << "\nWarning: Saved data file is damaged. Starting fresh.\n";

        return;
    }

    totalOrders = savedOrders;
    totalSales = atof(readLine(file).c_str());
    totalCompletedOrders = atoi(readLine(file).c_str());


    // [CHANGED] every customer's tables are released after checkout, so all
    // tables are free when the program starts. Old saved table status is ignored.
    for(int i = 0; i < 10; i++)
    {
        readLine(file);     // booked flag (ignored)
        readLine(file);     // reserved-by name (ignored)
    }


    for(int k = 0; k < totalOrders; k++)
    {
        orderCustomers[k] = readLine(file);
        orderDiningTypes[k] = readLine(file);
        orderAddresses[k] = readLine(file);
        orderGuests[k] = atoi(readLine(file).c_str());

        for(int t = 0; t < 10; t++)
        {
            orderTables[k][t] = (readLine(file) == "1");
        }

        for(int i = 0; i < 5; i++)
        {
            for(int j = 0; j < 4; j++)
            {
                orderHistory[k][i][j] = atoi(readLine(file).c_str());
            }
        }

        orderSubtotals[k] = atof(readLine(file).c_str());
        orderDiscounts[k] = atof(readLine(file).c_str());
        orderTaxes[k] = atof(readLine(file).c_str());
        orderDeliveryCharges[k] = atof(readLine(file).c_str());
        orderBills[k] = atof(readLine(file).c_str());

        orderPaid[k] = (readLine(file) == "1");
        orderCancelled[k] = (readLine(file) == "1");

        orderRatings[k] = atoi(readLine(file).c_str());
        orderReviews[k] = readLine(file);
        orderTips[k] = atof(readLine(file).c_str());
    }

    file.close();
}


// =============================================
// MEMBER 1: COLOUR FUNCTION
// =============================================

void setColor(int color)
{
#ifdef _WIN32

    HANDLE h = GetStdHandle(STD_OUTPUT_HANDLE);

    SetConsoleTextAttribute(h, color);

#else

    (void)color;

#endif
}


// =============================================
// MEMBER 1: WELCOME SCREEN
// =============================================

void welcomeScreen()
{
    setColor(HEADING_PINK);

    cout << "\n";
    cout << "================================================\n";
    cout << "                  TABLE & TALE                  \n";

    setColor(HIGHLIGHT_GOLD);

    cout << "     Where Fine Dining Meets Unforgettable Stories\n";

    setColor(INPUT_BLUE);

    cout << "             Welcome to TABLE & TALE\n";

    setColor(NORMAL_TEXT);

    cout << "================================================\n";

    setColor(HEADING_PINK);

    cout << " Address: Plot 18-C, Main Khayaban-e-Shahbaz,\n";
    cout << "          Phase 6, DHA\n";

    setColor(INPUT_BLUE);

    cout << " Contact: 92+ 03-1234567\n";

    setColor(NORMAL_TEXT);

    cout << " Opening Hours: 6 PM - 1 AM\n";

    setColor(HIGHLIGHT_GOLD);

    cout << "\n       WELCOME! WE ARE GLAD YOU ARE HERE\n";

    setColor(NORMAL_TEXT);

    cout << "================================================\n\n";
}


// =============================================
// MEMBER 1: MAIN MENU
// =============================================

void mainMenu()
{
    int choice;

    do
    {
        setColor(HEADING_PINK);

        cout << "\n========== MAIN MENU ==========\n";

        setColor(NORMAL_TEXT);

        cout << "1. Customer Panel\n";
        cout << "2. Management Panel\n";
        cout << "0. Exit\n";

        setColor(INPUT_BLUE);

        cout << "\nEnter your choice: ";

        setColor(NORMAL_TEXT);

        choice = getChoice();

        switch(choice)
        {
            case 1:
                customerPanel();
                break;

            case 2:
                // [CHANGED] password required before entering management panel
                if(staffLogin())
                {
                    managementPanel();
                }
                break;

            case 0:

                saveData();     // [NEW] make sure everything is saved on exit

                setColor(HIGHLIGHT_GOLD);

                cout << "\nThank you for visiting TABLE & TALE!\n";
                cout << "Have a wonderful day!\n";

                setColor(NORMAL_TEXT);

                break;

            default:

                cout << "\nInvalid choice! Please try again.\n";
        }

    } while(choice != 0);
}


// =============================================
// MEMBER 1 + MEMBER 3: CUSTOMER PANEL
// =============================================

void customerPanel()
{
    setColor(INPUT_BLUE);

    cout << "\nEnter Customer Name: ";

    setColor(NORMAL_TEXT);

    getline(cin, customerName);

    if(customerName.empty())
    {
        cout << "\nCustomer name cannot be empty.\n";
        return;
    }

    cout << "\nWelcome, " << customerName << "!\n";

    customerFlow();
}


// =============================================
// MEMBER 1: CUSTOMER FLOW
// =============================================

void customerFlow()
{
    // Reset current customer's order

    for(int i = 0; i < 5; i++)
    {
        for(int j = 0; j < 4; j++)
        {
            quantities[i][j] = 0;
            itemTotals[i][j] = 0;
        }
    }

    grandTotal = 0;

    discountAmount = 0;
    taxAmount = 0;
    deliveryCharge = 0;
    billTotal = 0;

    paymentStatus = false;

    currentOrderIndex = -1;

    currentTableCount = 0;

    currentGuests = 0;              // [NEW]

    deliveryAddress = "";

    for(int i = 0; i < 10; i++)
    {
        currentTables[i] = false;
    }


    // Select dining or delivery option

    if(!selectDiningType())
    {
        return;
    }


    // Display menu and take order

    displayMenu();

    takeOrder();

    calculateTotal();


    if(grandTotal <= 0)
    {
        cout << "\nNo items were ordered.\n";

        releaseTable();

        return;
    }


    // [CHANGED] Review order: customer can confirm, add more or remove items
    // before the order is finalized

    if(!reviewOrder())
    {
        cout << "\nOrder cancelled. Nothing was charged.\n";

        releaseTable();

        return;
    }


    // Save order

    if(!placeOrder())
    {
        releaseTable();

        return;
    }


    // Show reserved table status before billing

    if(currentTableCount > 0)
    {
        displayTables();
    }


    // Calculate bill including discount and tax

    calculateBill();


    // Process payment

    if(processPayment())
    {
        printReceipt();

        // Release reserved tables after checkout

        releaseTable();

        askFeedback();
    }
    else
    {
        releaseTable();
    }

    saveData();
}


// =============================================
// MEMBER 1: MANAGEMENT PANEL
// =============================================

void managementPanel()
{
    int choice;

    do
    {
        setColor(HEADING_PINK);

        cout << "\n======= MANAGEMENT PANEL =======\n";

        setColor(NORMAL_TEXT);

        cout << "1. View Menu\n";
        cout << "2. View Customer Orders\n";
        cout << "3. View Table Status\n";
        cout << "4. View Total Sales\n";
        cout << "5. Staff Management\n";
        cout << "0. Back to Main Menu\n";

        setColor(INPUT_BLUE);

        cout << "\nEnter your choice: ";

        setColor(NORMAL_TEXT);

        choice = getChoice();

        switch(choice)
        {
            case 1:
                displayMenu();
                break;

            case 2:
                viewOrders();
                break;

            case 3:
                managementTableStatus();
                break;

            case 4:
                showTotalSales();
                break;

            case 5:
                staffManagement();
                break;

            case 0:
                cout << "\nReturning to Main Menu...\n";
                break;

            default:
                cout << "\nInvalid choice! Please try again.\n";
        }

    } while(choice != 0);
}


// =============================================
// MEMBER 2: DISPLAY FOOD CATEGORIES
// (no longer used while ordering, kept for reference)
// =============================================

void displayCategories()
{
    setColor(HEADING_PINK);

    cout << "\n========== FOOD CATEGORIES ==========\n";

    setColor(NORMAL_TEXT);

    for(int i = 0; i < 5; i++)
    {
        cout << i + 1 << ". " << categories[i] << endl;
    }

    cout << "0. Finish Ordering\n";
}


// =============================================
// MEMBER 2: DISPLAY FOOD ITEMS
// (no longer used while ordering, kept for reference)
// =============================================

void displayFoodItems(int category)
{
    setColor(HEADING_PINK);

    cout << "\n========== " << categories[category] << " ==========\n";

    setColor(NORMAL_TEXT);

    for(int i = 0; i < 4; i++)
    {
        cout << i + 1 << ". " << foodItems[category][i];

        setColor(HIGHLIGHT_GOLD);

        cout << " - Rs. " << prices[category][i] << endl;

        setColor(NORMAL_TEXT);
    }
}


// =============================================
// MEMBER 2: DISPLAY COMPLETE MENU
// [CHANGED] every item now has its own number (1-20)
// =============================================

void displayMenu()
{
    setColor(HEADING_PINK);

    cout << "\n========================================\n";
    cout << "             TABLE & TALE MENU          \n";
    cout << "========================================\n";

    setColor(NORMAL_TEXT);

    for(int i = 0; i < 5; i++)
    {
        setColor(HEADING_PINK);

        cout << "\n--- " << categories[i] << " ---\n";

        setColor(NORMAL_TEXT);

        for(int j = 0; j < 4; j++)
        {
            int itemNumber = i * 4 + j + 1;

            cout << "  " << setw(2) << itemNumber << ". "
                 << left << setw(20) << foodItems[i][j] << right;

            setColor(HIGHLIGHT_GOLD);

            cout << " - Rs. " << prices[i][j] << endl;

            setColor(NORMAL_TEXT);
        }
    }

    cout << "\n========================================\n";
}


// =============================================
// MEMBER 2: TAKE CUSTOMER ORDER
// [CHANGED] order everything at once using item numbers 1-20
// =============================================

void takeOrder()
{
    string line;
    int numbers[20];            // item numbers chosen on this line
    bool selected[20];          // stops the same item being listed twice
    int count;
    int quantity;

    setColor(HEADING_PINK);

    cout << "\n========== PLACE YOUR ORDER ==========\n";

    setColor(NORMAL_TEXT);

    // [CHANGED] several items can be typed on ONE line
    cout << "Type all the item numbers you want on one line,\n";
    cout << "separated by spaces or commas. Example:  1 2 4\n";
    cout << "You will then be asked the quantity of each item.\n";
    cout << "Enter 0 when you are done ordering.\n";

    while(true)
    {
        setColor(INPUT_BLUE);

        cout << "\nItem numbers (1-20, or 0 to finish): ";

        setColor(NORMAL_TEXT);

        getline(cin, line);


        // Only digits, spaces and commas are allowed

        bool validText = true;

        for(int c = 0; c < (int)line.length(); c++)
        {
            char ch = line[c];

            if(!(ch >= '0' && ch <= '9') && ch != ' ' && ch != ',')
            {
                validText = false;
            }
        }

        if(!validText)
        {
            cout << "\nInvalid input! Use only numbers separated by";
            cout << " spaces or commas (example: 1 2 4).\n";

            continue;
        }


        // Pick the numbers out of the line

        count = 0;

        for(int k = 0; k < 20; k++)
        {
            selected[k] = false;
        }

        bool finish = false;
        int number = 0;
        bool inNumber = false;

        for(int c = 0; c <= (int)line.length(); c++)
        {
            // one extra loop at the end so the last number is also processed
            char ch = (c < (int)line.length()) ? line[c] : ' ';

            if(ch >= '0' && ch <= '9')
            {
                inNumber = true;

                if(number < 1000)
                {
                    number = number * 10 + (ch - '0');
                }
            }
            else if(inNumber)
            {
                if(number == 0)
                {
                    finish = true;
                }
                else if(number > 20)
                {
                    cout << "\nItem " << number
                         << " does not exist - skipped.\n";
                }
                else if(!selected[number - 1])
                {
                    selected[number - 1] = true;

                    numbers[count] = number;

                    count++;
                }

                number = 0;

                inNumber = false;
            }
        }

        if(count == 0 && !finish)
        {
            cout << "\nNo valid item numbers entered. Try again.\n";

            continue;
        }


        // Ask the quantity of every chosen item

        for(int k = 0; k < count; k++)
        {
            int category = (numbers[k] - 1) / 4;
            int item = (numbers[k] - 1) % 4;

            cout << "\n" << foodItems[category][item]
                 << " - Rs. " << prices[category][item] << endl;

            setColor(INPUT_BLUE);

            cout << "Enter quantity: ";

            setColor(NORMAL_TEXT);

            quantity = getChoice();

            if(quantity <= 0)
            {
                cout << "Quantity must be greater than zero! Item skipped.\n";

                continue;
            }

            quantities[category][item] += quantity;

            itemTotals[category][item] =
                prices[category][item] * quantities[category][item];

            cout << quantity << " x " << foodItems[category][item]
                 << " added successfully!\n";
        }


        if(finish)
        {
            break;
        }
    }
}


// =============================================
// MEMBER 2: CALCULATE TOTAL
// =============================================

void calculateTotal()
{
    grandTotal = 0;

    for(int i = 0; i < 5; i++)
    {
        for(int j = 0; j < 4; j++)
        {
            itemTotals[i][j] =
                prices[i][j] * quantities[i][j];

            grandTotal += itemTotals[i][j];
        }
    }
}


// =============================================
// MEMBER 2: DISPLAY CUSTOMER ORDER
// =============================================

void displayOrder()
{
    setColor(HEADING_PINK);

    cout << "\n========== CUSTOMER ORDER ==========\n";

    setColor(NORMAL_TEXT);

    // [CHANGED] columns lined up with setw instead of tabs
    cout << "\n" << left << setw(20) << "Food Item"
         << right << setw(6) << "Qty"
         << setw(7) << "Price"
         << setw(9) << "Total" << endl;

    cout << "----------------------------------------------\n";

    for(int i = 0; i < 5; i++)
    {
        for(int j = 0; j < 4; j++)
        {
            if(quantities[i][j] > 0)
            {
                cout << left << setw(20) << foodItems[i][j]
                     << right << setw(6) << quantities[i][j]
                     << setw(7) << prices[i][j]
                     << setw(9) << itemTotals[i][j] << endl;
            }
        }
    }

    setColor(HIGHLIGHT_GOLD);

    cout << "----------------------------------------------\n";

    cout << left << setw(33) << "Subtotal: Rs."
         << right << setw(13) << grandTotal << endl;

    setColor(NORMAL_TEXT);
}


// =============================================
// [NEW] REMOVE AN ITEM FROM THE CURRENT ORDER
// =============================================

void removeItem()
{
    int itemNumber;
    int quantity;

    setColor(HEADING_PINK);

    cout << "\n========== REMOVE AN ITEM ==========\n";

    setColor(NORMAL_TEXT);

    cout << "Items in your order:\n";

    for(int i = 0; i < 5; i++)
    {
        for(int j = 0; j < 4; j++)
        {
            if(quantities[i][j] > 0)
            {
                cout << "  " << setw(2) << i * 4 + j + 1 << ". "
                     << left << setw(20) << foodItems[i][j]
                     << right << " x " << quantities[i][j] << endl;
            }
        }
    }

    setColor(INPUT_BLUE);

    cout << "\nEnter item number to remove (0 to go back): ";

    setColor(NORMAL_TEXT);

    itemNumber = getChoice();

    if(itemNumber == 0)
    {
        return;
    }

    if(itemNumber < 1 || itemNumber > 20)
    {
        cout << "\nInvalid item number!\n";

        return;
    }

    int category = (itemNumber - 1) / 4;
    int item = (itemNumber - 1) % 4;

    if(quantities[category][item] == 0)
    {
        cout << "\nThat item is not in your order.\n";

        return;
    }

    setColor(INPUT_BLUE);

    cout << "Quantity to remove (1-" << quantities[category][item] << "): ";

    setColor(NORMAL_TEXT);

    quantity = getChoice();

    if(quantity < 1 || quantity > quantities[category][item])
    {
        cout << "\nInvalid quantity! Nothing was removed.\n";

        return;
    }

    quantities[category][item] -= quantity;

    itemTotals[category][item] =
        prices[category][item] * quantities[category][item];

    cout << "\n" << quantity << " x " << foodItems[category][item]
         << " removed from your order.\n";
}


// =============================================
// [NEW] REVIEW ORDER BEFORE FINALIZING
// Returns true if the customer confirms the order,
// false if the customer cancels it.
// =============================================

bool reviewOrder()
{
    int choice;

    while(true)
    {
        calculateTotal();

        displayOrder();

        if(grandTotal <= 0)
        {
            cout << "\nYour order is currently empty.\n";
        }

        setColor(HEADING_PINK);

        cout << "\n========== REVIEW YOUR ORDER ==========\n";

        setColor(NORMAL_TEXT);

        cout << "1. Confirm Order\n";
        cout << "2. Add More Items\n";
        cout << "3. Remove an Item\n";
        cout << "0. Cancel Order\n";

        setColor(INPUT_BLUE);

        cout << "\nEnter your choice: ";

        setColor(NORMAL_TEXT);

        choice = getChoice();

        switch(choice)
        {
            case 1:

                if(grandTotal <= 0)
                {
                    cout << "\nCannot confirm an empty order.\n";

                    break;
                }

                return true;

            case 2:

                displayMenu();

                takeOrder();

                break;

            case 3:

                if(grandTotal <= 0)
                {
                    cout << "\nThere is nothing to remove.\n";
                }
                else
                {
                    removeItem();
                }

                break;

            case 0:

                return false;

            default:

                cout << "\nInvalid choice! Please try again.\n";
        }
    }
}

// =============================================
// MEMBER 3: DISPLAY ALL TABLES
// =============================================

void displayTables()
{
    setColor(HEADING_PINK);

    cout << "\n========== TABLE STATUS ==========\n";

    setColor(NORMAL_TEXT);

    for(int i = 0; i < 10; i++)
    {
        cout << "Table " << i + 1 << " : ";

        if(tableBooked[i])
        {
            cout << "BOOKED";
            cout << " (Reserved by: " << reservedBy[i] << ")";

            if(currentTables[i])            // [NEW]
            {
                cout << " <- YOUR TABLE";
            }
        }
        else
        {
            cout << "AVAILABLE";
        }

        cout << endl;
    }

    cout << "==================================\n";
}


// =============================================
// [NEW] RESERVATION SUMMARY
// Shows which tables this customer booked, which are
// reserved by others and which are still available.
// =============================================

void showReservationSummary()
{
    bool found;

    setColor(HEADING_PINK);

    cout << "\n========== RESERVATION SUMMARY ==========\n";

    setColor(NORMAL_TEXT);


    // Tables booked by this customer

    cout << "Booked by " << customerName << ": ";

    found = false;

    for(int i = 0; i < 10; i++)
    {
        if(currentTables[i])
        {
            cout << "Table " << i + 1 << "  ";

            found = true;
        }
    }

    if(!found)
    {
        cout << "None";
    }

    cout << endl;


    // Tables reserved by other customers

    cout << "Reserved by others (cannot be booked):\n";

    found = false;

    for(int i = 0; i < 10; i++)
    {
        if(tableBooked[i] && !currentTables[i])
        {
            cout << "   Table " << i + 1
                 << " (" << reservedBy[i] << ")\n";

            found = true;
        }
    }

    if(!found)
    {
        cout << "   None\n";
    }


    // Tables still available

    cout << "Still available: ";

    found = false;

    for(int i = 0; i < 10; i++)
    {
        if(!tableBooked[i])
        {
            cout << "Table " << i + 1 << "  ";

            found = true;
        }
    }

    if(!found)
    {
        cout << "None";
    }

    cout << endl;

    cout << "=========================================\n";
}


// =============================================
// MEMBER 3: RESERVE MULTIPLE TABLES
// [CHANGED] asks for number of guests first (6 per table)
// =============================================

bool reserveTable()
{
    int choice;
    int guests;
    int availableTables = 0;
    int tablesNeeded;

    for(int i = 0; i < 10; i++)
    {
        if(!tableBooked[i])
        {
            availableTables++;
        }
    }

    if(availableTables == 0)
    {
        cout << "\nSorry! All tables are currently reserved.\n";
        cout << "You can continue without reservation.\n";

        return true;
    }


    cout << "\nEach table seats " << TABLE_CAPACITY << " people.\n";

    // Ask number of guests

    while(true)
    {
        setColor(INPUT_BLUE);

        cout << "\nHow many guests are you reserving for? (0 to skip): ";

        setColor(NORMAL_TEXT);

        guests = getChoice();

        if(guests == 0)
        {
            cout << "\nNo table reserved.\n";
            cout << "You can continue without reservation.\n";

            return true;
        }

        if(guests < 0)
        {
            cout << "\nNumber of guests cannot be negative!\n";

            continue;
        }

        if(guests > availableTables * TABLE_CAPACITY)
        {
            cout << "\nSorry! Only "
                 << availableTables * TABLE_CAPACITY
                 << " seats are currently available.\n";

            continue;
        }

        break;
    }

    tablesNeeded = (guests + TABLE_CAPACITY - 1) / TABLE_CAPACITY;

    cout << "\n" << guests << " guest(s) need " << tablesNeeded
         << " table(s) (" << tablesNeeded * TABLE_CAPACITY
         << " seats).\n";


    // Select the tables

    while(currentTableCount < tablesNeeded)
    {
        displayTables();

        setColor(INPUT_BLUE);

        cout << "\nSelect " << tablesNeeded - currentTableCount
             << " more table(s). Enter Table Number (1-10) or 0 to cancel: ";

        setColor(NORMAL_TEXT);

        choice = getChoice();

        if(choice == 0)
        {
            // Cancel reservation and give back tables chosen so far

            for(int i = 0; i < 10; i++)
            {
                if(currentTables[i])
                {
                    tableBooked[i] = false;

                    reservedBy[i] = "";

                    currentTables[i] = false;
                }
            }

            currentTableCount = 0;

            currentGuests = 0;

            cout << "\nReservation cancelled. No table reserved.\n";
            cout << "You can continue without reservation.\n";

            return true;
        }

        if(choice < 1 || choice > 10)
        {
            cout << "\nInvalid table number! Try again.\n";

            continue;
        }

        if(currentTables[choice - 1])
        {
            cout << "\nYou have already selected this table.\n";

            continue;
        }

        if(tableBooked[choice - 1])
        {
            cout << "\nSorry! Table " << choice
                 << " is already booked by "
                 << reservedBy[choice - 1] << ".\n";
            cout << "Please select another table.\n";

            continue;
        }

        tableBooked[choice - 1] = true;

        reservedBy[choice - 1] = customerName;

        currentTables[choice - 1] = true;

        currentTableCount++;

        setColor(HIGHLIGHT_GOLD);

        cout << "\nTable " << choice << " reserved successfully!\n";

        setColor(NORMAL_TEXT);
    }

    currentGuests = guests;

    cout << "\nReservation completed successfully!\n";

    cout << "Guests: " << currentGuests << endl;

    cout << "Total Tables Reserved: "
         << currentTableCount << endl;

    showReservationSummary();

    return true;
}


// =============================================
// MEMBER 3: DINING / TAKEAWAY / DELIVERY
// =============================================

bool selectDiningType()
{
    int choice;
    int reservationChoice;

    setColor(HEADING_PINK);

    cout << "\n========== ORDER TYPE ==========\n";

    setColor(NORMAL_TEXT);

    cout << "1. Dine-in\n";
    cout << "2. Takeaway\n";
    cout << "3. Online Delivery\n";
    cout << "0. Back to Main Menu\n";

    setColor(INPUT_BLUE);

    cout << "\nEnter your choice: ";

    setColor(NORMAL_TEXT);

    choice = getChoice();


    if(choice == 1)
    {
        diningType = "Dine-in";

        cout << "\nYou selected Dine-in.\n";

        cout << "\nDo you want table reservation?\n";
        cout << "1. Yes\n";
        cout << "2. No (Without Reservation)\n";

        setColor(INPUT_BLUE);

        cout << "\nEnter your choice: ";

        setColor(NORMAL_TEXT);

        reservationChoice = getChoice();

        if(reservationChoice == 1)
        {
            reserveTable();
        }
        else if(reservationChoice == 2)
        {
            cout << "\nReservation skipped.\n";
            cout << "You can proceed without a reserved table.\n";
        }
        else
        {
            cout << "\nInvalid reservation choice!\n";

            return false;
        }
    }

    else if(choice == 2)
    {
        diningType = "Takeaway";

        cout << "\nTakeaway selected successfully!\n";
        cout << "No table reservation is required.\n";
    }

    else if(choice == 3)
    {
        diningType = "Online Delivery";

        cout << "\nOnline Delivery selected!\n";

        setColor(INPUT_BLUE);

        cout << "\nEnter Delivery Address: ";

        setColor(NORMAL_TEXT);

        getline(cin, deliveryAddress);

        if(deliveryAddress.empty())
        {
            cout << "\nDelivery address cannot be empty!\n";

            return false;
        }

        cout << "\nDelivery address saved successfully.\n";
    }

    else if(choice == 0)
    {
        return false;
    }

    else
    {
        cout << "\nInvalid order type!\n";

        return false;
    }


    setColor(HEADING_PINK);

    cout << "\n========== ORDER DETAILS ==========\n";

    setColor(NORMAL_TEXT);

    cout << "Customer Name   : " << customerName << endl;
    cout << "Order Type      : " << diningType << endl;


    if(diningType == "Dine-in")
    {
        if(currentTableCount > 0)
        {
            cout << "Reserved Tables : ";

            for(int i = 0; i < 10; i++)
            {
                if(currentTables[i])
                {
                    cout << i + 1 << " ";
                }
            }

            cout << endl;

            cout << "Guests          : " << currentGuests << endl;    // [NEW]
        }
        else
        {
            cout << "Reservation     : Not Reserved\n";
        }
    }


    if(diningType == "Online Delivery")
    {
        cout << "Delivery Address: " << deliveryAddress << endl;
    }

    cout << "===================================\n";

    return true;
}


// =============================================
// MEMBER 3: MANAGEMENT TABLE STATUS
// =============================================

void managementTableStatus()
{
    int booked = 0;
    int available = 0;

    setColor(HEADING_PINK);

    cout << "\n========== MANAGEMENT TABLE STATUS ==========\n";

    setColor(NORMAL_TEXT);

    displayTables();

    for(int i = 0; i < 10; i++)
    {
        if(tableBooked[i])
        {
            booked++;
        }
        else
        {
            available++;
        }
    }

    cout << "\n========== TABLE SUMMARY ==========\n";

    cout << "Total Tables     : 10\n";
    cout << "Booked Tables    : " << booked << endl;
    cout << "Available Tables : " << available << endl;

    cout << "===================================\n";
}


// =============================================
// MEMBER 3: RELEASE RESERVED TABLES
// =============================================

void releaseTable()
{
    if(currentTableCount > 0)
    {
        for(int i = 0; i < 10; i++)
        {
            if(currentTables[i])
            {
                tableBooked[i] = false;

                reservedBy[i] = "";

                cout << "\nTable " << i + 1
                     << " is now available.\n";

                currentTables[i] = false;
            }
        }

        currentTableCount = 0;

        currentGuests = 0;      // [NEW]
    }
}


// =============================================
// MEMBER 4: SAVE CUSTOMER ORDER
// =============================================

bool placeOrder()
{
    if(totalOrders >= MAX_ORDERS)
    {
        cout << "\nOrder limit reached. Cannot save more orders.\n";

        return false;
    }

    currentOrderIndex = totalOrders;


    // Save food quantities

    for(int i = 0; i < 5; i++)
    {
        for(int j = 0; j < 4; j++)
        {
            orderHistory[currentOrderIndex][i][j] =
                quantities[i][j];
        }
    }


    // Save customer details

    orderCustomers[currentOrderIndex] = customerName;

    orderDiningTypes[currentOrderIndex] = diningType;

    orderAddresses[currentOrderIndex] = deliveryAddress;

    orderGuests[currentOrderIndex] = currentGuests;     // [NEW]


    // Save all reserved tables

    for(int i = 0; i < 10; i++)
    {
        orderTables[currentOrderIndex][i] = currentTables[i];
    }


    orderPaid[currentOrderIndex] = false;

    orderCancelled[currentOrderIndex] = false;          // [NEW]

    orderRatings[currentOrderIndex] = 0;                // [NEW]

    orderReviews[currentOrderIndex] = "";               // [NEW]

    orderTips[currentOrderIndex] = 0;                   // [NEW]

    totalOrders++;

    setColor(HIGHLIGHT_GOLD);

    cout << "\nOrder saved successfully!\n";

    setColor(NORMAL_TEXT);

    return true;
}


// =============================================
// MEMBER 4: CALCULATE BILL
// =============================================

void calculateBill()
{
    discountAmount = 0;

    taxAmount = 0;

    deliveryCharge = 0;


    // Apply 10% discount on eligible orders

    if(grandTotal >= DISCOUNT_LIMIT)
    {
        discountAmount = grandTotal * DISCOUNT_RATE;
    }


    // Calculate subtotal after discount

    float discountedSubtotal = grandTotal - discountAmount;


    // Calculate 5% tax after discount

    taxAmount = discountedSubtotal * TAX_RATE;


    // Add delivery fee for online delivery

    if(diningType == "Online Delivery")
    {
        deliveryCharge = DELIVERY_FEE;
    }


    // Calculate final bill

    billTotal =
        discountedSubtotal + taxAmount + deliveryCharge;


    // Save billing details in order history

    orderSubtotals[currentOrderIndex] = grandTotal;

    orderDiscounts[currentOrderIndex] = discountAmount;

    orderTaxes[currentOrderIndex] = taxAmount;

    orderDeliveryCharges[currentOrderIndex] = deliveryCharge;

    orderBills[currentOrderIndex] = billTotal;


    // Display bill

    setColor(HEADING_PINK);

    cout << "\n========================================\n";
    cout << "              CHECKOUT & BILL           \n";
    cout << "========================================\n";

    setColor(NORMAL_TEXT);

    cout << fixed << setprecision(2);

    // [CHANGED] amounts are right-aligned so the decimals line up

    cout << "Subtotal:        Rs. " << setw(10) << (float)grandTotal << endl;

    if(discountAmount > 0)
    {
        setColor(HIGHLIGHT_GOLD);

        cout << "Discount (10%):  Rs. " << setw(10) << discountAmount << endl;

        setColor(NORMAL_TEXT);
    }
    else
    {
        cout << "Discount:        Rs. " << setw(10) << 0.0f << endl;
    }

    cout << "Tax (5%):        Rs. " << setw(10) << taxAmount << endl;

    if(deliveryCharge > 0)
    {
        cout << "Delivery Charge: Rs. " << setw(10) << deliveryCharge << endl;
    }

    cout << "----------------------------------------\n";

    setColor(HIGHLIGHT_GOLD);

    cout << "Grand Total:     Rs. " << setw(10) << billTotal << endl;

    setColor(NORMAL_TEXT);

    cout << "========================================\n";
}


// =============================================
// MEMBER 4: PAYMENT PROCESSING
// =============================================

bool processPayment()
{
    int paymentChoice;

    while(true)
    {
        setColor(HEADING_PINK);

        cout << "\n========== PAYMENT METHOD ==========\n";

        setColor(NORMAL_TEXT);

        cout << "1. Cash\n";
        cout << "2. Online Payment (Simulation)\n";
        cout << "0. Cancel Payment\n";

        setColor(INPUT_BLUE);

        cout << "\nEnter your choice: ";

        setColor(NORMAL_TEXT);

        paymentChoice = getChoice();


        switch(paymentChoice)
        {
            case 1:
            {
                float cashGiven;

                setColor(INPUT_BLUE);

                cout << "\nEnter Cash Amount Given: Rs. ";

                setColor(NORMAL_TEXT);

                cashGiven = getAmount();

                if(cashGiven < billTotal)
                {
                    cout << "\nInsufficient cash given!\n";
                    cout << "Please try again.\n";

                    break;
                }

                float change = cashGiven - billTotal;

                cout << "\nCash payment received successfully.\n";

                cout << "Change to Return: Rs. "
                     << fixed << setprecision(2)
                     << change << endl;

                paymentStatus = true;

                break;
            }


            case 2:

                cout << "\nOnline payment processed successfully.\n";

                paymentStatus = true;

                break;


            case 0:

                cout << "\nPayment cancelled.\n";
                cout << "Order has been marked as CANCELLED.\n";    // [NEW]

                paymentStatus = false;

                orderCancelled[currentOrderIndex] = true;           // [NEW]

                return false;


            default:

                cout << "\nInvalid payment method! Try again.\n";

                break;
        }


        if(paymentStatus)
        {
            orderPaid[currentOrderIndex] = true;

            totalSales += billTotal;

            totalCompletedOrders++;

            return true;
        }
    }
}


// =============================================
// MEMBER 4: PRINT CUSTOMER RECEIPT
// =============================================

void printReceipt()
{
    if(!paymentStatus)
    {
        cout << "\nPayment not completed. No paid receipt available.\n";

        return;
    }

    setColor(HEADING_PINK);

    cout << "\n========================================\n";
    cout << "              TABLE & TALE              \n";
    cout << "              OFFICIAL RECEIPT          \n";
    cout << "========================================\n";

    setColor(NORMAL_TEXT);

    cout << "Customer Name   : " << customerName << endl;

    cout << "Dining Type     : " << diningType << endl;


    if(diningType == "Dine-in" && currentTableCount > 0)
    {
        cout << "Reserved Tables : ";

        for(int i = 0; i < 10; i++)
        {
            if(currentTables[i])
            {
                cout << i + 1 << " ";
            }
        }

        cout << endl;

        cout << "Guests          : " << currentGuests << endl;    // [NEW]
    }


    if(diningType == "Online Delivery")
    {
        cout << "Delivery Address: " << deliveryAddress << endl;
    }


    cout << "----------------------------------------\n";

    // [CHANGED] columns lined up with setw instead of tabs
    cout << left << setw(22) << "Food Item"
         << right << setw(8) << "Qty"
         << setw(10) << "Total" << endl;


    for(int i = 0; i < 5; i++)
    {
        for(int j = 0; j < 4; j++)
        {
            if(quantities[i][j] > 0)
            {
                cout << left << setw(22) << foodItems[i][j]
                     << right << setw(8) << quantities[i][j]
                     << setw(10) << itemTotals[i][j] << endl;
            }
        }
    }


    cout << "----------------------------------------\n";

    cout << fixed << setprecision(2);

    cout << "Subtotal:        Rs. " << setw(10) << (float)grandTotal << endl;

    cout << "Discount:        Rs. " << setw(10) << discountAmount << endl;

    cout << "Tax (5%):        Rs. " << setw(10) << taxAmount << endl;

    if(deliveryCharge > 0)
    {
        cout << "Delivery Charge: Rs. " << setw(10) << deliveryCharge << endl;
    }

    setColor(HIGHLIGHT_GOLD);

    cout << "Amount Paid:     Rs. " << setw(10) << billTotal << endl;

    setColor(NORMAL_TEXT);

    cout << "Payment Status: PAID\n";

    setColor(HEADING_PINK);

    cout << "===========================================================\n";
    cout << "       Thank you for choosing us!                           \n";
    cout << "  We hope your evening with us becomes a cherished chapter. \n";
    cout << "===========================================================\n";

    setColor(NORMAL_TEXT);
}


// =============================================
// [NEW] CUSTOMER REVIEW AND TIP
// =============================================

void askFeedback()
{
    int rating;
    float tip;
    string review = "";

    setColor(HEADING_PINK);

    cout << "\n========== CUSTOMER FEEDBACK ==========\n";

    setColor(NORMAL_TEXT);


    // Rating

    setColor(INPUT_BLUE);

    cout << "Rate your experience (1-5, or 0 to skip): ";

    setColor(NORMAL_TEXT);

    rating = getChoice();

    while(rating < 0 || rating > 5)
    {
        cout << "Invalid rating! Enter a number from 0 to 5: ";

        rating = getChoice();
    }


    // Written review (only if customer gave a rating)

    if(rating > 0)
    {
        setColor(INPUT_BLUE);

        cout << "Write a short review (press Enter to skip): ";

        setColor(NORMAL_TEXT);

        getline(cin, review);
    }


    // Tip

    setColor(INPUT_BLUE);

    cout << "Would you like to leave a tip? Enter amount (0 for no tip): Rs. ";

    setColor(NORMAL_TEXT);

    tip = getAmount();


    // Save feedback in order history

    orderRatings[currentOrderIndex] = rating;

    orderReviews[currentOrderIndex] = review;

    orderTips[currentOrderIndex] = tip;


    setColor(HIGHLIGHT_GOLD);

    if(rating > 0 || tip > 0)
    {
        cout << "\nThank you for your feedback";

        if(tip > 0)
        {
            cout << " and your generous tip";
        }

        cout << "!\n";
    }
    else
    {
        cout << "\nThank you for dining with us!\n";
    }

    setColor(NORMAL_TEXT);
}


// =============================================
// MEMBER 4: MANAGEMENT ORDER REPORT
// =============================================

void viewOrders()
{
    setColor(HEADING_PINK);

    cout << "\n========== CUSTOMER ORDER REPORT ==========\n";

    setColor(NORMAL_TEXT);

    if(totalOrders == 0)
    {
        cout << "\nNo customer orders have been placed yet.\n";

        return;
    }


    for(int k = 0; k < totalOrders; k++)
    {
        cout << "\nOrder Number: " << k + 1 << endl;

        cout << "Customer Name: " << orderCustomers[k] << endl;

        cout << "Dining Type: " << orderDiningTypes[k] << endl;


        if(orderDiningTypes[k] == "Dine-in")
        {
            cout << "Reserved Tables : ";

            bool foundTable = false;

            for(int t = 0; t < 10; t++)
            {
                if(orderTables[k][t])
                {
                    cout << t + 1 << " ";

                    foundTable = true;
                }
            }

            if(!foundTable)
            {
                cout << "Not Reserved";
            }

            cout << endl;

            if(orderGuests[k] > 0)                          // [NEW]
            {
                cout << "Guests: " << orderGuests[k] << endl;
            }
        }


        if(orderDiningTypes[k] == "Online Delivery")
        {
            cout << "Delivery Address: "
                 << orderAddresses[k] << endl;
        }


        cout << "\nOrdered Items:\n";

        for(int i = 0; i < 5; i++)
        {
            for(int j = 0; j < 4; j++)
            {
                if(orderHistory[k][i][j] > 0)
                {
                    cout << foodItems[i][j]
                         << " x "
                         << orderHistory[k][i][j]
                         << endl;
                }
            }
        }


        cout << fixed << setprecision(2);

        cout << "\nSubtotal: Rs. "
             << orderSubtotals[k] << endl;

        cout << "Discount: Rs. "
             << orderDiscounts[k] << endl;

        cout << "Tax: Rs. "
             << orderTaxes[k] << endl;

        if(orderDeliveryCharges[k] > 0)
        {
            cout << "Delivery Charge: Rs. "
                 << orderDeliveryCharges[k] << endl;
        }

        cout << "Final Bill: Rs. "
             << orderBills[k] << endl;


        if(orderPaid[k])
        {
            setColor(HIGHLIGHT_GOLD);

            cout << "Payment Status: PAID\n";

            setColor(NORMAL_TEXT);
        }
        else if(orderCancelled[k])                          // [NEW]
        {
            cout << "Payment Status: CANCELLED\n";
        }
        else
        {
            cout << "Payment Status: UNPAID\n";
        }


        // [NEW] customer feedback for paid orders

        if(orderPaid[k])
        {
            if(orderRatings[k] > 0)
            {
                cout << "Rating: " << orderRatings[k] << "/5\n";
            }
            else
            {
                cout << "Rating: Not given\n";
            }

            if(!orderReviews[k].empty())
            {
                cout << "Review: " << orderReviews[k] << endl;
            }

            if(orderTips[k] > 0)
            {
                cout << "Tip: Rs. " << orderTips[k] << endl;
            }
        }

        cout << "----------------------------------------\n";
    }
}


// =============================================
// MEMBER 4: MANAGEMENT SALES REPORT
// =============================================

void showTotalSales()
{
    // [NEW] work out cancelled orders, tips and average rating

    int cancelledOrders = 0;
    int ratingCount = 0;
    int ratingSum = 0;
    float totalTips = 0;

    for(int k = 0; k < totalOrders; k++)
    {
        if(orderCancelled[k])
        {
            cancelledOrders++;
        }

        if(orderRatings[k] > 0)
        {
            ratingCount++;
            ratingSum += orderRatings[k];
        }

        totalTips += orderTips[k];
    }


    setColor(HEADING_PINK);

    cout << "\n========================================\n";
    cout << "        MANAGEMENT SALES REPORT         \n";
    cout << "========================================\n";

    setColor(NORMAL_TEXT);

    cout << fixed << setprecision(2);

    cout << "Total Orders Placed:      "
         << totalOrders << endl;

    cout << "Total Completed Orders:  "
         << totalCompletedOrders << endl;

    cout << "Total Cancelled Orders:  "                      // [NEW]
         << cancelledOrders << endl;

    setColor(HIGHLIGHT_GOLD);

    cout << "Total Sales Revenue:      Rs. "
         << totalSales << endl;

    cout << "Total Tips Received:      Rs. "                     // [NEW]
         << totalTips << endl;

    setColor(NORMAL_TEXT);

    if(ratingCount > 0)                                     // [NEW]
    {
        cout << "Average Customer Rating: "
             << (float)ratingSum / ratingCount
             << " / 5 (" << ratingCount << " reviews)\n";
    }
    else
    {
        cout << "Average Customer Rating: No ratings yet\n";
    }

    cout << "========================================\n";
}


// =============================================
// ADDITIONAL FEATURE: STAFF MANAGEMENT
// =============================================

void staffManagement()
{
    setColor(HEADING_PINK);

    cout << "\n========================================\n";
    cout << "             STAFF MANAGEMENT           \n";
    cout << "========================================\n";

    setColor(NORMAL_TEXT);

    for(int i = 0; i < STAFF_COUNT; i++)
    {
        cout << "\nStaff Member " << i + 1 << endl;

        cout << "----------------------------------------\n";

        cout << "Employee ID   : " << staffIDs[i] << endl;

        cout << "Name          : " << staffNames[i] << endl;

        cout << "Designation   : " << staffRoles[i] << endl;

        cout << "Shift         : " << staffShifts[i] << endl;

        cout << "Working Hours : " << staffHours[i] << endl;
    }

    cout << "\n========================================\n";
}


// =============================================
// [NEW] STAFF PASSWORD
// =============================================

// Reads a password and shows * instead of the letters (Windows).
string readPassword()
{
    string password = "";

#ifdef _WIN32

    char ch;

    while(true)
    {
        ch = _getch();

        if(ch == '\r' || ch == '\n')
        {
            break;
        }

        if(ch == 0 || ch == -32)
        {
            _getch();       // ignore arrow keys / function keys

            continue;
        }

        if(ch == '\b')
        {
            if(!password.empty())
            {
                password.erase(password.size() - 1);

                cout << "\b \b";
            }
        }
        else
        {
            password += ch;

            cout << '*';
        }
    }

    cout << endl;

#else

    getline(cin, password);

#endif

    return password;
}


bool staffLogin()
{
    const int MAX_ATTEMPTS = 3;

    setColor(HEADING_PINK);

    cout << "\n======= STAFF LOGIN =======\n";

    setColor(NORMAL_TEXT);

    for(int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++)
    {
        setColor(INPUT_BLUE);

        cout << "Enter Staff Password: ";

        setColor(NORMAL_TEXT);

        string password = readPassword();

        if(password == MANAGEMENT_PASSWORD)
        {
            setColor(HIGHLIGHT_GOLD);

            cout << "\nAccess granted. Welcome, staff member!\n";

            setColor(NORMAL_TEXT);

            return true;
        }

        cout << "\nIncorrect password.";

        if(attempt < MAX_ATTEMPTS)
        {
            cout << " Attempts left: " << MAX_ATTEMPTS - attempt;
        }

        cout << "\n\n";
    }

    cout << "Too many wrong attempts. Returning to Main Menu.\n";

    return false;
}


// =============================================
// MAIN FUNCTION - MEMBER 1
// =============================================

int main()
{
#ifdef _WIN32

    system("color F0");

#endif

    loadData();                 // [NEW] load saved orders, sales and tables

    welcomeScreen();

    mainMenu();

    return 0;
}
