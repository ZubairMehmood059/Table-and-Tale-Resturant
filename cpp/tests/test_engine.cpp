#include "../include/business_logic.hpp"
#include "../include/models.hpp"
#include "../include/storage.hpp"

#include <cassert>
#include <cmath>
#include <cstdio>
#include <iostream>

using namespace tabletale;

bool approxEqual(double a, double b) {
    return std::fabs(a - b) < 0.01;
}

int main() {
    std::cout << "Running Table & Tale C++ Business Logic Tests...\n";

    // 1. Test Menu Integrity
    assert(CATEGORIES[0] == "Desi Delights");
    assert(FOOD_ITEMS[0][0] == "Chicken Biryani");
    assert(PRICES[0][0] == 350);
    assert(FOOD_ITEMS[2][2] == "Chicken Steak");
    assert(PRICES[2][2] == 950);

    // 2. Test Quick Order Line Parser
    {
        auto parsed = logic::parseQuickOrderLine("1, 2 4 21 1 0");
        assert(parsed.ok);
        assert(parsed.finishRequested);
        assert(parsed.validItemNumbers.size() == 3);
        assert(parsed.validItemNumbers[0] == 1);
        assert(parsed.validItemNumbers[1] == 2);
        assert(parsed.validItemNumbers[2] == 4);
        assert(parsed.skippedNumbers.size() == 1 && parsed.skippedNumbers[0] == 21);

        auto invalid = logic::parseQuickOrderLine("1 abc 2");
        assert(!invalid.ok);
    }

    // 3. Test Billing: Below Discount Limit (Rs. 1900) + Online Delivery
    {
        std::array<std::array<int, ITEMS_PER_CATEGORY>, NUM_CATEGORIES> qty{};
        qty[2][2] = 2; // 2 x Chicken Steak (950) = 1900 (< 2000)
        auto bill = logic::calculateBillBreakdown(qty, "Online Delivery");
        assert(approxEqual(bill.subtotal, 1900.0));
        assert(approxEqual(bill.discount, 0.0));
        assert(approxEqual(bill.tax, 95.0)); // 5% of 1900
        assert(approxEqual(bill.deliveryCharge, 150.0));
        assert(approxEqual(bill.billTotal, 2145.0));
    }

    // 4. Test Billing: At Discount Limit (Rs. 2000) + Dine-in
    {
        std::array<std::array<int, ITEMS_PER_CATEGORY>, NUM_CATEGORIES> qty{};
        qty[1][2] = 10; // 10 x French Fries (200) = 2000 (>= 2000)
        auto bill = logic::calculateBillBreakdown(qty, "Dine-in");
        assert(approxEqual(bill.subtotal, 2000.0));
        assert(approxEqual(bill.discount, 200.0)); // 10%
        assert(approxEqual(bill.discountedSubtotal, 1800.0));
        assert(approxEqual(bill.tax, 90.0)); // 5% of 1800
        assert(approxEqual(bill.deliveryCharge, 0.0));
        assert(approxEqual(bill.billTotal, 1890.0));
    }

    // 5. Test Table Capacity & Reservation Rules (6 per table)
    RestaurantState state;
    assert(logic::calculateTablesNeeded(1) == 1);
    assert(logic::calculateTablesNeeded(6) == 1);
    assert(logic::calculateTablesNeeded(7) == 2);

    auto res1 = logic::reserveTables(state, "Zain", 7, {1, 2});
    assert(res1.ok);
    assert(state.tableBooked[0] && state.reservedBy[0] == "Zain");
    assert(state.tableBooked[1] && state.reservedBy[1] == "Zain");

    // Prevent double booking Table 2
    auto resFail = logic::reserveTables(state, "Ali", 4, {2});
    assert(!resFail.ok);

    // 6. Test Checkout Cash (Insufficient vs Valid) & Table Release
    {
        std::array<std::array<int, ITEMS_PER_CATEGORY>, NUM_CATEGORIES> qty{};
        qty[0][0] = 2; // 700, tax 35 -> 735
        auto badCash = logic::checkoutOrder(state, "Zain", "Dine-in", "", 7, {1, 2}, qty, "cash", 500.0);
        assert(!badCash.ok);
        assert(state.tableBooked[0]); // Still booked

        auto goodCash = logic::checkoutOrder(state, "Zain", "Dine-in", "", 7, {1, 2}, qty, "cash", 1000.0);
        assert(goodCash.ok);
        assert(goodCash.paid);
        assert(approxEqual(goodCash.change, 265.0));
        assert(!state.tableBooked[0] && !state.tableBooked[1]); // Released after checkout
        assert(state.totalCompletedOrders == 1);
        assert(approxEqual(state.totalSales, 735.0));
    }

    // 7. Test Cancelled Order & Feedback + Tips
    {
        std::array<std::array<int, ITEMS_PER_CATEGORY>, NUM_CATEGORIES> qty{};
        qty[0][1] = 1; // 900
        auto cancelRes = logic::checkoutOrder(state, "Sara", "Takeaway", "", 0, {}, qty, "cancel", 0.0);
        assert(cancelRes.ok);
        assert(cancelRes.cancelled);
        assert(!cancelRes.paid);
        assert(state.totalOrders == 2);
        assert(state.totalCompletedOrders == 1);

        auto fbFail = logic::submitFeedback(state, cancelRes.orderIndex, 5, "Great", 100);
        assert(!fbFail.ok); // Cannot leave feedback on cancelled order

        auto fbOk = logic::submitFeedback(state, 0, 5, "Wonderful biryani!", 150.0);
        assert(fbOk.ok);

        // Kitchen status defaults and transitions
        assert(state.orders[0].kitchenStatus == "Queued");
        assert(state.orders[1].kitchenStatus == "Cancelled");

        auto ksBadCancelled = logic::updateKitchenStatus(state, 1, "Preparing");
        assert(!ksBadCancelled.ok);

        auto ksBadVal = logic::updateKitchenStatus(state, 0, "Unknown");
        assert(!ksBadVal.ok);

        auto ksPrep = logic::updateKitchenStatus(state, 0, "Preparing");
        assert(ksPrep.ok);
        assert(state.orders[0].kitchenStatus == "Preparing");

        auto ksReady = logic::updateKitchenStatus(state, 0, "Ready");
        assert(ksReady.ok);
        assert(state.orders[0].kitchenStatus == "Ready");
    }

    // 8. Test Sales Report & Persistence Round-Trip
    {
        auto report = logic::computeSalesReport(state);
        assert(report.totalOrders == 2);
        assert(report.totalCompletedOrders == 1);
        assert(report.cancelledOrders == 1);
        assert(approxEqual(report.totalSales, 735.0));
        assert(approxEqual(report.totalTips, 150.0));
        assert(report.ratingCount == 1);
        assert(approxEqual(report.averageRating, 5.0));

        const std::string tmpFile = "/tmp/test_tabletale_data.txt";
        assert(storage::saveData(tmpFile, state));
        auto reloaded = storage::loadData(tmpFile, true);
        assert(reloaded.totalOrders == 2);
        assert(reloaded.totalCompletedOrders == 1);
        assert(approxEqual(reloaded.totalSales, 735.0));
        assert(reloaded.orders[0].customerName == "Zain");
        assert(reloaded.orders[0].review == "Wonderful biryani!");
        assert(reloaded.orders[0].kitchenStatus == "Ready");
        assert(reloaded.orders[1].kitchenStatus == "Cancelled");
        std::remove(tmpFile.c_str());
    }

    // 9. Test Staff Password Verification
    assert(logic::verifyStaffPassword("staff123"));
    assert(!logic::verifyStaffPassword("wrong"));

    // 10. Test General Guest Feedback & TTv3 Persistence Round-Trip
    {
        auto emptyName = logic::submitGuestFeedback(
            state, "   ", 5, {"Food Quality"}, "Great dinner", "2026-11-21T19:00:00Z"
        );
        assert(!emptyName.ok);

        auto badRating = logic::submitGuestFeedback(
            state, "Hira", 0, {"Food Quality"}, "Great dinner", "2026-11-21T19:00:00Z"
        );
        assert(!badRating.ok);

        auto emptyCats = logic::submitGuestFeedback(
            state, "Hira", 5, {}, "Great dinner", "2026-11-21T19:00:00Z"
        );
        assert(!emptyCats.ok);

        auto emptyComment = logic::submitGuestFeedback(
            state, "Hira", 5, {"Food Quality"}, "   ", "2026-11-21T19:00:00Z"
        );
        assert(!emptyComment.ok);

        auto validFb = logic::submitGuestFeedback(
            state,
            "Hira Mansoor",
            5,
            {"Food Quality", "Hospitality & Staff", "Dine-in"},
            "Warm hospitality and unforgettable Chicken Karahi.",
            "2026-11-21T19:30:00.000Z"
        );
        assert(validFb.ok);
        assert(validFb.feedbackIndex == 0);

        auto report = logic::computeSalesReport(state);
        assert(report.guestFeedbackCount == 1);

        const std::string tmpFileV3 = "/tmp/test_tabletale_v3.txt";
        assert(storage::saveData(tmpFileV3, state));
        auto reloadedV3 = storage::loadData(tmpFileV3, true);
        assert(reloadedV3.guestFeedbacks.size() == 1);
        assert(reloadedV3.guestFeedbacks[0].customerName == "Hira Mansoor");
        assert(reloadedV3.guestFeedbacks[0].rating == 5);
        assert(reloadedV3.guestFeedbacks[0].categories.size() == 3);
        assert(reloadedV3.guestFeedbacks[0].categories[1] == "Hospitality & Staff");
        assert(reloadedV3.guestFeedbacks[0].comment == "Warm hospitality and unforgettable Chicken Karahi.");
        std::remove(tmpFileV3.c_str());
    }

    std::cout << "All C++ unit tests PASSED!\n";
    return 0;
}
