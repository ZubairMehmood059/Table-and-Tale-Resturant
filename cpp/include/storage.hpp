#pragma once

#include "models.hpp"
#include <cstdlib>
#include <fstream>
#include <iomanip>
#include <string>

namespace tabletale::storage {

inline std::string sanitizeSingleLine(std::string value) {
    for (char& ch : value) {
        if (ch == '\n' || ch == '\r') {
            ch = ' ';
        }
    }
    return value;
}

inline std::string sanitizeCategoryToken(std::string value) {
    for (char& ch : value) {
        if (ch == '\n' || ch == '\r' || ch == '|') {
            ch = ' ';
        }
    }
    return value;
}

inline std::vector<std::string> splitCategories(const std::string& line) {
    std::vector<std::string> result;
    std::string current;
    for (char ch : line) {
        if (ch == '|') {
            if (!current.empty()) {
                result.push_back(current);
                current.clear();
            }
        } else {
            current.push_back(ch);
        }
    }
    if (!current.empty()) {
        result.push_back(current);
    }
    return result;
}

inline std::string readLineTrimmed(std::ifstream& file) {
    std::string line;
    if (std::getline(file, line)) {
        if (!line.empty() && line.back() == '\r') {
            line.pop_back();
        }
    }
    return line;
}

inline bool saveData(const std::string& filePath, const RestaurantState& state) {
    std::ofstream file(filePath.c_str());
    if (!file) {
        return false;
    }

    file << std::fixed << std::setprecision(2);
    file << "TTv3\n";

    // General totals
    file << state.totalOrders << "\n";
    file << state.totalSales << "\n";
    file << state.totalCompletedOrders << "\n";

    // Table status (10 tables)
    for (int i = 0; i < NUM_TABLES; i++) {
        file << (state.tableBooked[i] ? 1 : 0) << "\n";
        file << sanitizeSingleLine(state.reservedBy[i]) << "\n";
    }

    // All orders
    for (int k = 0; k < state.totalOrders && k < static_cast<int>(state.orders.size()); k++) {
        const auto& ord = state.orders[k];
        file << sanitizeSingleLine(ord.customerName) << "\n";
        file << sanitizeSingleLine(ord.diningType) << "\n";
        file << sanitizeSingleLine(ord.deliveryAddress) << "\n";
        file << ord.guests << "\n";

        for (int t = 0; t < NUM_TABLES; t++) {
            file << (ord.tables[t] ? 1 : 0) << "\n";
        }

        for (int i = 0; i < NUM_CATEGORIES; i++) {
            for (int j = 0; j < ITEMS_PER_CATEGORY; j++) {
                file << ord.quantities[i][j] << "\n";
            }
        }

        file << ord.subtotal << "\n";
        file << ord.discount << "\n";
        file << ord.tax << "\n";
        file << ord.deliveryCharge << "\n";
        file << ord.billTotal << "\n";

        file << (ord.paid ? 1 : 0) << "\n";
        file << (ord.cancelled ? 1 : 0) << "\n";
        file << sanitizeSingleLine(ord.kitchenStatus.empty() ? (ord.cancelled ? "Cancelled" : "Queued") : ord.kitchenStatus) << "\n";

        file << ord.rating << "\n";
        file << sanitizeSingleLine(ord.review) << "\n";
        file << ord.tip << "\n";
    }

    // General guest feedback submissions
    file << state.guestFeedbacks.size() << "\n";
    for (const auto& fb : state.guestFeedbacks) {
        file << sanitizeSingleLine(fb.customerName) << "\n";
        file << fb.rating << "\n";
        std::string joinedCats;
        for (size_t c = 0; c < fb.categories.size(); c++) {
            if (c > 0) joinedCats += "|";
            joinedCats += sanitizeCategoryToken(fb.categories[c]);
        }
        file << sanitizeSingleLine(joinedCats) << "\n";
        file << sanitizeSingleLine(fb.comment) << "\n";
        file << sanitizeSingleLine(fb.createdAt) << "\n";
    }

    file.close();
    return true;
}

inline RestaurantState loadData(const std::string& filePath, bool preserveActiveTables = true) {
    RestaurantState state;
    std::ifstream file(filePath.c_str());
    if (!file) {
        return state;
    }

    std::string firstLine = readLineTrimmed(file);
    if (firstLine.empty()) {
        return state;
    }

    bool isV3 = (firstLine == "TTv3");
    bool hasKitchenStatus = (firstLine == "TTv2" || isV3);
    std::string orderCountLine = hasKitchenStatus ? readLineTrimmed(file) : firstLine;

    int savedOrders = std::atoi(orderCountLine.c_str());
    if (savedOrders < 0 || savedOrders > MAX_ORDERS) {
        return state;
    }

    state.totalOrders = savedOrders;
    state.totalSales = std::atof(readLineTrimmed(file).c_str());
    state.totalCompletedOrders = std::atoi(readLineTrimmed(file).c_str());

    for (int i = 0; i < NUM_TABLES; i++) {
        std::string bookedFlag = readLineTrimmed(file);
        std::string owner = readLineTrimmed(file);
        if (preserveActiveTables) {
            state.tableBooked[i] = (bookedFlag == "1");
            state.reservedBy[i] = state.tableBooked[i] ? owner : "";
        }
    }

    state.orders.resize(static_cast<size_t>(state.totalOrders));
    for (int k = 0; k < state.totalOrders; k++) {
        auto& ord = state.orders[static_cast<size_t>(k)];
        ord.customerName = readLineTrimmed(file);
        ord.diningType = readLineTrimmed(file);
        ord.deliveryAddress = readLineTrimmed(file);
        ord.guests = std::atoi(readLineTrimmed(file).c_str());

        for (int t = 0; t < NUM_TABLES; t++) {
            ord.tables[t] = (readLineTrimmed(file) == "1");
        }

        for (int i = 0; i < NUM_CATEGORIES; i++) {
            for (int j = 0; j < ITEMS_PER_CATEGORY; j++) {
                ord.quantities[i][j] = std::atoi(readLineTrimmed(file).c_str());
            }
        }

        ord.subtotal = std::atof(readLineTrimmed(file).c_str());
        ord.discount = std::atof(readLineTrimmed(file).c_str());
        ord.tax = std::atof(readLineTrimmed(file).c_str());
        ord.deliveryCharge = std::atof(readLineTrimmed(file).c_str());
        ord.billTotal = std::atof(readLineTrimmed(file).c_str());

        ord.paid = (readLineTrimmed(file) == "1");
        ord.cancelled = (readLineTrimmed(file) == "1");

        if (hasKitchenStatus) {
            ord.kitchenStatus = readLineTrimmed(file);
            if (ord.kitchenStatus.empty()) {
                ord.kitchenStatus = ord.cancelled ? "Cancelled" : "Queued";
            }
        } else {
            ord.kitchenStatus = ord.cancelled ? "Cancelled" : "Queued";
        }

        ord.rating = std::atoi(readLineTrimmed(file).c_str());
        ord.review = readLineTrimmed(file);
        ord.tip = std::atof(readLineTrimmed(file).c_str());
    }

    if (isV3) {
        std::string feedbackCountLine = readLineTrimmed(file);
        if (!feedbackCountLine.empty()) {
            int fbCount = std::atoi(feedbackCountLine.c_str());
            if (fbCount > 0 && fbCount <= 1000) {
                state.guestFeedbacks.resize(static_cast<size_t>(fbCount));
                for (int f = 0; f < fbCount; f++) {
                    auto& fb = state.guestFeedbacks[static_cast<size_t>(f)];
                    fb.customerName = readLineTrimmed(file);
                    fb.rating = std::atoi(readLineTrimmed(file).c_str());
                    fb.categories = splitCategories(readLineTrimmed(file));
                    fb.comment = readLineTrimmed(file);
                    fb.createdAt = readLineTrimmed(file);
                }
            }
        }
    }

    file.close();
    return state;
}

} // namespace tabletale::storage
