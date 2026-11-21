#include "../include/business_logic.hpp"
#include "../include/json_util.hpp"
#include "../include/models.hpp"
#include "../include/storage.hpp"

#include <iostream>
#include <sstream>
#include <string>
#include <vector>

using namespace tabletale;

namespace {

json::Value serializeBill(const BillSummary& bill) {
    return json::Object{
        {"subtotal", bill.subtotal},
        {"discount", bill.discount},
        {"discountedSubtotal", bill.discountedSubtotal},
        {"tax", bill.tax},
        {"deliveryCharge", bill.deliveryCharge},
        {"billTotal", bill.billTotal}
    };
}

json::Value serializeTables(const RestaurantState& state) {
    json::Array tablesArr;
    int booked = 0;
    for (int i = 0; i < NUM_TABLES; i++) {
        bool isBooked = state.tableBooked[static_cast<size_t>(i)];
        if (isBooked) booked++;
        tablesArr.push_back(json::Object{
            {"tableNumber", i + 1},
            {"capacity", TABLE_CAPACITY},
            {"booked", isBooked},
            {"reservedBy", state.reservedBy[static_cast<size_t>(i)]}
        });
    }
    return json::Object{
        {"tables", tablesArr},
        {"summary", json::Object{
            {"totalTables", NUM_TABLES},
            {"bookedTables", booked},
            {"availableTables", NUM_TABLES - booked},
            {"tableCapacity", TABLE_CAPACITY},
            {"availableSeats", (NUM_TABLES - booked) * TABLE_CAPACITY}
        }}
    };
}

json::Value serializeMenu() {
    json::Array categoriesArr;
    json::Array itemsArr;

    for (int i = 0; i < NUM_CATEGORIES; i++) {
        categoriesArr.push_back(json::Object{
            {"index", i},
            {"name", CATEGORIES[static_cast<size_t>(i)]}
        });
        for (int j = 0; j < ITEMS_PER_CATEGORY; j++) {
            int itemNumber = i * ITEMS_PER_CATEGORY + j + 1;
            itemsArr.push_back(json::Object{
                {"itemNumber", itemNumber},
                {"categoryIndex", i},
                {"categoryName", CATEGORIES[static_cast<size_t>(i)]},
                {"itemIndex", j},
                {"name", FOOD_ITEMS[static_cast<size_t>(i)][static_cast<size_t>(j)]},
                {"price", PRICES[static_cast<size_t>(i)][static_cast<size_t>(j)]}
            });
        }
    }

    return json::Object{
        {"categories", categoriesArr},
        {"items", itemsArr}
    };
}

json::Value serializeOrder(const OrderRecord& ord, int index) {
    json::Array reservedTables;
    for (int t = 0; t < NUM_TABLES; t++) {
        if (ord.tables[static_cast<size_t>(t)]) {
            reservedTables.push_back(t + 1);
        }
    }

    json::Array items;
    for (int i = 0; i < NUM_CATEGORIES; i++) {
        for (int j = 0; j < ITEMS_PER_CATEGORY; j++) {
            int qty = ord.quantities[static_cast<size_t>(i)][static_cast<size_t>(j)];
            if (qty > 0) {
                int price = PRICES[static_cast<size_t>(i)][static_cast<size_t>(j)];
                items.push_back(json::Object{
                    {"itemNumber", i * ITEMS_PER_CATEGORY + j + 1},
                    {"name", FOOD_ITEMS[static_cast<size_t>(i)][static_cast<size_t>(j)]},
                    {"categoryName", CATEGORIES[static_cast<size_t>(i)]},
                    {"quantity", qty},
                    {"unitPrice", price},
                    {"lineTotal", qty * price}
                });
            }
        }
    }

    std::string status = ord.paid ? "PAID" : (ord.cancelled ? "CANCELLED" : "UNPAID");

    return json::Object{
        {"orderNumber", index + 1},
        {"orderIndex", index},
        {"customerName", ord.customerName},
        {"diningType", ord.diningType},
        {"deliveryAddress", ord.deliveryAddress},
        {"guests", ord.guests},
        {"reservedTables", reservedTables},
        {"items", items},
        {"subtotal", ord.subtotal},
        {"discount", ord.discount},
        {"tax", ord.tax},
        {"deliveryCharge", ord.deliveryCharge},
        {"billTotal", ord.billTotal},
        {"paid", ord.paid},
        {"cancelled", ord.cancelled},
        {"paymentStatus", status},
        {"kitchenStatus", ord.kitchenStatus.empty() ? (ord.cancelled ? "Cancelled" : "Queued") : ord.kitchenStatus},
        {"rating", ord.rating},
        {"review", ord.review},
        {"tip", ord.tip}
    };
}

std::array<std::array<int, ITEMS_PER_CATEGORY>, NUM_CATEGORIES> parseQuantities(const json::Value& itemsVal) {
    std::array<std::array<int, ITEMS_PER_CATEGORY>, NUM_CATEGORIES> quantities{};
    for (const auto& entry : itemsVal.asArray()) {
        int itemNumber = entry.get("itemNumber").asInt(0);
        int qty = entry.get("quantity").asInt(0);
        if (itemNumber >= 1 && itemNumber <= TOTAL_MENU_ITEMS && qty > 0) {
            int cat = (itemNumber - 1) / ITEMS_PER_CATEGORY;
            int item = (itemNumber - 1) % ITEMS_PER_CATEGORY;
            quantities[static_cast<size_t>(cat)][static_cast<size_t>(item)] += qty;
        }
    }
    return quantities;
}

std::vector<int> parseTableNumbers(const json::Value& arrVal) {
    std::vector<int> tables;
    for (const auto& entry : arrVal.asArray()) {
        tables.push_back(entry.asInt(0));
    }
    return tables;
}

std::vector<std::string> parseStringList(const json::Value& arrVal) {
    std::vector<std::string> items;
    for (const auto& entry : arrVal.asArray()) {
        items.push_back(entry.asString());
    }
    return items;
}

json::Value serializeGuestFeedback(const GuestFeedback& fb, int index) {
    json::Array categoriesArr;
    for (const auto& cat : fb.categories) {
        categoriesArr.push_back(cat);
    }
    return json::Object{
        {"id", index + 1},
        {"feedbackIndex", index},
        {"customerName", fb.customerName},
        {"rating", fb.rating},
        {"categories", categoriesArr},
        {"comment", fb.comment},
        {"createdAt", fb.createdAt}
    };
}

} // namespace

int main() {
    std::ostringstream buffer;
    buffer << std::cin.rdbuf();
    std::string input = buffer.str();

    try {
        json::Value req = json::parse(input);
        std::string action = req.get("action").asString();
        std::string dataFile = req.get("dataFile").asString("tabletale_data.txt");

        if (action == "info") {
            json::Object resp{
                {"ok", true},
                {"restaurant", json::Object{
                    {"name", RESTAURANT_NAME},
                    {"tagline", RESTAURANT_TAGLINE},
                    {"address", RESTAURANT_ADDRESS},
                    {"contact", RESTAURANT_CONTACT},
                    {"hours", RESTAURANT_HOURS},
                    {"receiptClosing", RECEIPT_CLOSING}
                }},
                {"settings", json::Object{
                    {"discountRate", DISCOUNT_RATE},
                    {"discountLimit", DISCOUNT_LIMIT},
                    {"taxRate", TAX_RATE},
                    {"deliveryFee", DELIVERY_FEE},
                    {"tableCapacity", TABLE_CAPACITY},
                    {"numTables", NUM_TABLES},
                    {"maxOrders", MAX_ORDERS}
                }},
                {"menu", serializeMenu()}
            };
            std::cout << json::dump(resp) << "\n";
            return 0;
        }

        if (action == "parse_quick_order") {
            std::string line = req.get("line").asString();
            auto parsed = logic::parseQuickOrderLine(line);
            json::Array validArr;
            for (int n : parsed.validItemNumbers) validArr.push_back(n);
            json::Array skippedArr;
            for (int n : parsed.skippedNumbers) skippedArr.push_back(n);

            std::cout << json::dump(json::Object{
                {"ok", parsed.ok},
                {"finishRequested", parsed.finishRequested},
                {"validItemNumbers", validArr},
                {"skippedNumbers", skippedArr},
                {"error", parsed.error}
            }) << "\n";
            return 0;
        }

        if (action == "preview_bill") {
            auto quantities = parseQuantities(req.get("items"));
            std::string diningType = req.get("diningType").asString("Dine-in");
            BillSummary bill = logic::calculateBillBreakdown(quantities, diningType);
            std::cout << json::dump(json::Object{
                {"ok", true},
                {"bill", serializeBill(bill)}
            }) << "\n";
            return 0;
        }

        RestaurantState state = storage::loadData(dataFile, true);

        if (action == "tables") {
            json::Object resp = serializeTables(state).asObject();
            resp["ok"] = true;
            std::cout << json::dump(resp) << "\n";
            return 0;
        }

        if (action == "reserve_tables") {
            std::string customerName = req.get("customerName").asString();
            int guests = req.get("guests").asInt(0);
            auto tables = parseTableNumbers(req.get("tableNumbers"));

            auto result = logic::reserveTables(state, customerName, guests, tables);
            if (result.ok) {
                storage::saveData(dataFile, state);
            }
            json::Array reservedArr;
            for (int t : result.reservedTables) reservedArr.push_back(t);

            json::Object tableSnapshot = serializeTables(state).asObject();
            std::cout << json::dump(json::Object{
                {"ok", result.ok},
                {"message", result.message},
                {"tablesNeeded", result.tablesNeeded},
                {"reservedTables", reservedArr},
                {"tables", tableSnapshot["tables"]},
                {"summary", tableSnapshot["summary"]}
            }) << "\n";
            return 0;
        }

        if (action == "release_tables") {
            auto tables = parseTableNumbers(req.get("tableNumbers"));
            auto result = logic::releaseTables(state, tables);
            storage::saveData(dataFile, state);
            json::Object tableSnapshot = serializeTables(state).asObject();
            std::cout << json::dump(json::Object{
                {"ok", result.ok},
                {"message", result.message},
                {"tables", tableSnapshot["tables"]},
                {"summary", tableSnapshot["summary"]}
            }) << "\n";
            return 0;
        }

        if (action == "checkout") {
            std::string customerName = req.get("customerName").asString();
            std::string diningType = req.get("diningType").asString();
            std::string deliveryAddress = req.get("deliveryAddress").asString();
            int guests = req.get("guests").asInt(0);
            auto tables = parseTableNumbers(req.get("tableNumbers"));
            auto quantities = parseQuantities(req.get("items"));
            std::string paymentMethod = req.get("paymentMethod").asString();
            double cashGiven = req.get("cashGiven").asDouble(0.0);

            auto result = logic::checkoutOrder(
                state, customerName, diningType, deliveryAddress, guests, tables, quantities, paymentMethod, cashGiven
            );
            if (result.ok) {
                storage::saveData(dataFile, state);
            }

            json::Value orderJson(nullptr);
            if (result.ok && result.orderIndex >= 0 && result.orderIndex < static_cast<int>(state.orders.size())) {
                orderJson = serializeOrder(state.orders[static_cast<size_t>(result.orderIndex)], result.orderIndex);
            }

            std::cout << json::dump(json::Object{
                {"ok", result.ok},
                {"message", result.message},
                {"orderIndex", result.orderIndex},
                {"paid", result.paid},
                {"cancelled", result.cancelled},
                {"change", result.change},
                {"bill", serializeBill(result.bill)},
                {"order", orderJson}
            }) << "\n";
            return 0;
        }

        if (action == "feedback") {
            int orderIndex = req.get("orderIndex").asInt(-1);
            int rating = req.get("rating").asInt(0);
            std::string review = req.get("review").asString();
            double tip = req.get("tip").asDouble(0.0);

            auto result = logic::submitFeedback(state, orderIndex, rating, review, tip);
            if (result.ok) {
                storage::saveData(dataFile, state);
            }

            json::Value orderJson(nullptr);
            if (result.ok && orderIndex >= 0 && orderIndex < static_cast<int>(state.orders.size())) {
                orderJson = serializeOrder(state.orders[static_cast<size_t>(orderIndex)], orderIndex);
            }

            std::cout << json::dump(json::Object{
                {"ok", result.ok},
                {"message", result.message},
                {"order", orderJson}
            }) << "\n";
            return 0;
        }

        if (action == "guest_feedback") {
            std::string customerName = req.get("customerName").asString();
            int rating = req.get("rating").asInt(0);
            auto categories = parseStringList(req.get("categories"));
            std::string comment = req.get("comment").asString();
            std::string createdAt = req.get("createdAt").asString();

            auto result = logic::submitGuestFeedback(
                state, customerName, rating, categories, comment, createdAt
            );
            if (result.ok) {
                storage::saveData(dataFile, state);
            }

            json::Value feedbackJson(nullptr);
            if (result.ok && result.feedbackIndex >= 0 &&
                result.feedbackIndex < static_cast<int>(state.guestFeedbacks.size())) {
                feedbackJson = serializeGuestFeedback(
                    state.guestFeedbacks[static_cast<size_t>(result.feedbackIndex)],
                    result.feedbackIndex
                );
            }

            std::cout << json::dump(json::Object{
                {"ok", result.ok},
                {"message", result.message},
                {"feedbackIndex", result.feedbackIndex},
                {"feedback", feedbackJson}
            }) << "\n";
            return 0;
        }

        if (action == "update_kitchen_status") {
            int orderIndex = req.get("orderIndex").asInt(-1);
            std::string kitchenStatus = req.get("kitchenStatus").asString();

            auto result = logic::updateKitchenStatus(state, orderIndex, kitchenStatus);
            if (result.ok) {
                storage::saveData(dataFile, state);
            }

            json::Value orderJson(nullptr);
            if (result.ok && orderIndex >= 0 && orderIndex < static_cast<int>(state.orders.size())) {
                orderJson = serializeOrder(state.orders[static_cast<size_t>(orderIndex)], orderIndex);
            }

            std::cout << json::dump(json::Object{
                {"ok", result.ok},
                {"message", result.message},
                {"order", orderJson}
            }) << "\n";
            return 0;
        }

        if (action == "staff_login") {
            std::string password = req.get("password").asString();
            bool valid = logic::verifyStaffPassword(password);
            std::cout << json::dump(json::Object{
                {"ok", valid},
                {"message", valid ? "Access granted. Welcome, staff member!" : "Incorrect password."}
            }) << "\n";
            return 0;
        }

        if (action == "management_orders") {
            json::Array ordersArr;
            for (int k = 0; k < state.totalOrders && k < static_cast<int>(state.orders.size()); k++) {
                ordersArr.push_back(serializeOrder(state.orders[static_cast<size_t>(k)], k));
            }
            std::cout << json::dump(json::Object{
                {"ok", true},
                {"totalOrders", state.totalOrders},
                {"orders", ordersArr}
            }) << "\n";
            return 0;
        }

        if (action == "management_sales") {
            auto report = logic::computeSalesReport(state);
            std::cout << json::dump(json::Object{
                {"ok", true},
                {"report", json::Object{
                    {"totalOrders", report.totalOrders},
                    {"totalCompletedOrders", report.totalCompletedOrders},
                    {"cancelledOrders", report.cancelledOrders},
                    {"totalSales", report.totalSales},
                    {"totalTips", report.totalTips},
                    {"ratingCount", report.ratingCount},
                    {"averageRating", report.averageRating},
                    {"guestFeedbackCount", report.guestFeedbackCount}
                }}
            }) << "\n";
            return 0;
        }

        if (action == "management_feedback") {
            json::Array feedbackArr;
            for (int i = 0; i < static_cast<int>(state.guestFeedbacks.size()); i++) {
                feedbackArr.push_back(serializeGuestFeedback(
                    state.guestFeedbacks[static_cast<size_t>(i)], i
                ));
            }
            std::cout << json::dump(json::Object{
                {"ok", true},
                {"totalFeedback", static_cast<int>(state.guestFeedbacks.size())},
                {"feedbacks", feedbackArr}
            }) << "\n";
            return 0;
        }

        if (action == "management_staff") {
            json::Array staffArr;
            for (int i = 0; i < STAFF_COUNT; i++) {
                const auto& member = STAFF_ROSTER[static_cast<size_t>(i)];
                staffArr.push_back(json::Object{
                    {"id", member.id},
                    {"name", member.name},
                    {"role", member.role},
                    {"shift", member.shift},
                    {"hours", member.hours}
                });
            }
            std::cout << json::dump(json::Object{
                {"ok", true},
                {"staff", staffArr}
            }) << "\n";
            return 0;
        }

        std::cout << json::dump(json::Object{
            {"ok", false},
            {"message", "Unknown action: " + action}
        }) << "\n";
        return 1;
    } catch (const std::exception& ex) {
        std::cout << json::dump(json::Object{
            {"ok", false},
            {"message", std::string("Engine error: ") + ex.what()}
        }) << "\n";
        return 1;
    }
}
