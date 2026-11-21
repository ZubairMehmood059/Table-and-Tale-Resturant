#pragma once

#include <cctype>
#include <iomanip>
#include <map>
#include <sstream>
#include <stdexcept>
#include <string>
#include <variant>
#include <vector>

namespace tabletale::json {

struct Value;
using Object = std::map<std::string, Value>;
using Array = std::vector<Value>;

struct Value {
    using Variant = std::variant<std::nullptr_t, bool, double, std::string, Array, Object>;
    Variant data;

    Value() : data(nullptr) {}
    Value(std::nullptr_t) : data(nullptr) {}
    Value(bool b) : data(b) {}
    Value(int i) : data(static_cast<double>(i)) {}
    Value(double d) : data(d) {}
    Value(const char* s) : data(std::string(s)) {}
    Value(std::string s) : data(std::move(s)) {}
    Value(Array a) : data(std::move(a)) {}
    Value(Object o) : data(std::move(o)) {}

    bool isNull() const { return std::holds_alternative<std::nullptr_t>(data); }
    bool isBool() const { return std::holds_alternative<bool>(data); }
    bool isNumber() const { return std::holds_alternative<double>(data); }
    bool isString() const { return std::holds_alternative<std::string>(data); }
    bool isArray() const { return std::holds_alternative<Array>(data); }
    bool isObject() const { return std::holds_alternative<Object>(data); }

    bool asBool(bool fallback = false) const {
        return isBool() ? std::get<bool>(data) : fallback;
    }

    int asInt(int fallback = 0) const {
        return isNumber() ? static_cast<int>(std::get<double>(data)) : fallback;
    }

    double asDouble(double fallback = 0.0) const {
        return isNumber() ? std::get<double>(data) : fallback;
    }

    std::string asString(const std::string& fallback = "") const {
        return isString() ? std::get<std::string>(data) : fallback;
    }

    const Array& asArray() const {
        static const Array empty;
        return isArray() ? std::get<Array>(data) : empty;
    }

    const Object& asObject() const {
        static const Object empty;
        return isObject() ? std::get<Object>(data) : empty;
    }

    const Value& get(const std::string& key) const {
        static const Value nullVal;
        if (!isObject()) return nullVal;
        const auto& obj = std::get<Object>(data);
        auto it = obj.find(key);
        return (it != obj.end()) ? it->second : nullVal;
    }
};

inline std::string escapeString(const std::string& s) {
    std::ostringstream out;
    out << '"';
    for (unsigned char c : s) {
        switch (c) {
            case '"': out << "\\\""; break;
            case '\\': out << "\\\\"; break;
            case '\b': out << "\\b"; break;
            case '\f': out << "\\f"; break;
            case '\n': out << "\\n"; break;
            case '\r': out << "\\r"; break;
            case '\t': out << "\\t"; break;
            default:
                if (c < 0x20) {
                    out << "\\u" << std::hex << std::setw(4) << std::setfill('0') << static_cast<int>(c);
                } else {
                    out << static_cast<char>(c);
                }
        }
    }
    out << '"';
    return out.str();
}

inline std::string dump(const Value& v) {
    if (v.isNull()) return "null";
    if (v.isBool()) return v.asBool() ? "true" : "false";
    if (v.isNumber()) {
        std::ostringstream out;
        double d = v.asDouble();
        if (d == static_cast<long long>(d)) {
            out << static_cast<long long>(d);
        } else {
            out << std::fixed << std::setprecision(2) << d;
        }
        return out.str();
    }
    if (v.isString()) return escapeString(v.asString());
    if (v.isArray()) {
        std::ostringstream out;
        out << '[';
        const auto& arr = v.asArray();
        for (size_t i = 0; i < arr.size(); ++i) {
            if (i > 0) out << ',';
            out << dump(arr[i]);
        }
        out << ']';
        return out.str();
    }
    std::ostringstream out;
    out << '{';
    const auto& obj = v.asObject();
    bool first = true;
    for (const auto& [k, val] : obj) {
        if (!first) out << ',';
        first = false;
        out << escapeString(k) << ':' << dump(val);
    }
    out << '}';
    return out.str();
}

class Parser {
public:
    explicit Parser(const std::string& input) : src_(input), pos_(0) {}

    Value parse() {
        skipWs();
        Value val = parseValue();
        skipWs();
        return val;
    }

private:
    const std::string& src_;
    size_t pos_;

    void skipWs() {
        while (pos_ < src_.size() && std::isspace(static_cast<unsigned char>(src_[pos_]))) {
            ++pos_;
        }
    }

    char peek() const {
        return pos_ < src_.size() ? src_[pos_] : '\0';
    }

    char get() {
        if (pos_ >= src_.size()) throw std::runtime_error("Unexpected end of JSON");
        return src_[pos_++];
    }

    Value parseValue() {
        skipWs();
        char c = peek();
        if (c == '{') return parseObject();
        if (c == '[') return parseArray();
        if (c == '"') return Value(parseString());
        if (c == 't') { expect("true"); return Value(true); }
        if (c == 'f') { expect("false"); return Value(false); }
        if (c == 'n') { expect("null"); return Value(nullptr); }
        if (c == '-' || std::isdigit(static_cast<unsigned char>(c))) return parseNumber();
        throw std::runtime_error("Invalid JSON character");
    }

    void expect(const std::string& lit) {
        for (char expected : lit) {
            if (get() != expected) throw std::runtime_error("Invalid JSON literal");
        }
    }

    std::string parseString() {
        if (get() != '"') throw std::runtime_error("Expected quote");
        std::string res;
        while (pos_ < src_.size()) {
            char c = get();
            if (c == '"') return res;
            if (c == '\\') {
                char esc = get();
                switch (esc) {
                    case '"': res += '"'; break;
                    case '\\': res += '\\'; break;
                    case '/': res += '/'; break;
                    case 'b': res += '\b'; break;
                    case 'f': res += '\f'; break;
                    case 'n': res += '\n'; break;
                    case 'r': res += '\r'; break;
                    case 't': res += '\t'; break;
                    default: res += esc; break;
                }
            } else {
                res += c;
            }
        }
        throw std::runtime_error("Unterminated JSON string");
    }

    Value parseNumber() {
        size_t start = pos_;
        if (peek() == '-') ++pos_;
        while (pos_ < src_.size() && (std::isdigit(static_cast<unsigned char>(src_[pos_])) || src_[pos_] == '.' || src_[pos_] == 'e' || src_[pos_] == 'E' || src_[pos_] == '+' || src_[pos_] == '-')) {
            if ((src_[pos_] == '+' || src_[pos_] == '-') && pos_ > start && src_[pos_ - 1] != 'e' && src_[pos_ - 1] != 'E') {
                break;
            }
            ++pos_;
        }
        return Value(std::stod(src_.substr(start, pos_ - start)));
    }

    Value parseArray() {
        get(); // '['
        Array arr;
        skipWs();
        if (peek() == ']') { get(); return Value(arr); }
        while (true) {
            arr.push_back(parseValue());
            skipWs();
            char c = get();
            if (c == ']') break;
            if (c != ',') throw std::runtime_error("Expected ',' in array");
        }
        return Value(arr);
    }

    Value parseObject() {
        get(); // '{'
        Object obj;
        skipWs();
        if (peek() == '}') { get(); return Value(obj); }
        while (true) {
            skipWs();
            std::string key = parseString();
            skipWs();
            if (get() != ':') throw std::runtime_error("Expected ':' in object");
            obj[key] = parseValue();
            skipWs();
            char c = get();
            if (c == '}') break;
            if (c != ',') throw std::runtime_error("Expected ',' in object");
        }
        return Value(obj);
    }
};

inline Value parse(const std::string& input) {
    return Parser(input).parse();
}

} // namespace tabletale::json
