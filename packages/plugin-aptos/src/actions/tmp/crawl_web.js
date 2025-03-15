"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var puppeteer_1 = require("puppeteer");
var url_1 = require("url");
function getPageContent(targetUrl) {
    return __awaiter(this, void 0, void 0, function () {
        var browser, page, domain, content;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, puppeteer_1.default.launch({ headless: true })];
                case 1:
                    browser = _a.sent();
                    return [4 /*yield*/, browser.newPage()];
                case 2:
                    page = _a.sent();
                    return [4 /*yield*/, page.goto(targetUrl, { waitUntil: "networkidle2" })];
                case 3:
                    _a.sent();
                    domain = new url_1.URL(targetUrl).hostname;
                    if (!(domain.includes("aptos.dev") ||
                        domain.includes("move-developers-dao.gitbook.io"))) return [3 /*break*/, 5];
                    return [4 /*yield*/, page.evaluate(function () {
                            var mainElement = document.querySelector("main");
                            return mainElement ? mainElement.innerText : "";
                        })];
                case 4:
                    // Lấy nội dung chỉ trong <main>
                    content = _a.sent();
                    return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, page.evaluate(function () { return document.body.innerText; })];
                case 6:
                    // Mặc định lấy toàn bộ nội dung từ <body>
                    content = _a.sent();
                    _a.label = 7;
                case 7:
                    console.log("--- Content from ".concat(targetUrl, " ---"));
                    console.log(content);
                    return [4 /*yield*/, browser.close()];
                case 8:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Ví dụ gọi hàm
(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // Crawl aptos.dev
            return [4 /*yield*/, getPageContent("https://aptos.dev/en/build/smart-contracts")];
            case 1:
                // Crawl aptos.dev
                _a.sent();
                // Crawl move-developers-dao.gitbook.io
                return [4 /*yield*/, getPageContent("https://move-developers-dao.gitbook.io/aptos-move-by-example/why-is-move-secure")];
            case 2:
                // Crawl move-developers-dao.gitbook.io
                _a.sent();
                // Crawl một trang khác (thử Google)
                return [4 /*yield*/, getPageContent("https://google.com")];
            case 3:
                // Crawl một trang khác (thử Google)
                _a.sent();
                return [2 /*return*/];
        }
    });
}); })();
