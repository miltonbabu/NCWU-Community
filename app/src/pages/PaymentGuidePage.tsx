import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import {
  CreditCard,
  Wallet,
  Building2,
  CheckCircle,
  AlertCircle,
  Smartphone,
  QrCode,
  Banknote,
  Shield,
  ChevronDown,
} from "lucide-react";

interface PaymentSection {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  content: React.ReactNode;
}

function PaymentContent() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [openSections, setOpenSections] = useState<string[]>(["wechat"]);

  useEffect(() => {
    document.title = "Payment Guide - NCWU International";
  }, []);

  const toggleSection = (id: string) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const sections: PaymentSection[] = [
    {
      id: "wechat",
      title: "WeChat Pay Setup",
      icon: Smartphone,
      color: "from-green-500 to-green-600",
      content: (
        <div className="space-y-6">
          <div
            className={`p-5 rounded-xl ${isDark ? "bg-green-500/10 border border-green-500/30" : "bg-green-50 border border-green-200"}`}
          >
            <h4
              className={`font-semibold mb-3 ${isDark ? "text-green-300" : "text-green-700"}`}
            >
              What is WeChat Pay?
            </h4>
            <p
              className={`text-sm ${isDark ? "text-green-200/80" : "text-green-600"}`}
            >
              WeChat Pay (微信支付) is one of China's most popular payment
              methods. It's integrated into WeChat, making it convenient for
              daily transactions.
            </p>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
          >
            <h4
              className={`font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Setup Steps
            </h4>
            <div className="space-y-4">
              {[
                {
                  step: 1,
                  title: "Open WeChat",
                  desc: "Go to 'Me' → 'Wallet'",
                },
                {
                  step: 2,
                  title: "Add Bank Card",
                  desc: "Tap 'Cards' → 'Add Card'",
                },
                {
                  step: 3,
                  title: "Enter Card Details",
                  desc: "Input your Chinese bank card number",
                },
                {
                  step: 4,
                  title: "Verify Identity",
                  desc: "Enter phone number and verification code",
                },
                {
                  step: 5,
                  title: "Set Payment Password",
                  desc: "Create a 6-digit payment PIN",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className={`flex items-start gap-4 p-3 rounded-lg ${isDark ? "bg-slate-600/50" : "bg-white"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold bg-gradient-to-br from-green-500 to-green-600`}
                  >
                    {item.step}
                  </div>
                  <div>
                    <p
                      className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {item.title}
                    </p>
                    <p
                      className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-emerald-50 border border-emerald-200"}`}
          >
            <h4
              className={`font-semibold mb-3 ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
            >
              What You Can Do
            </h4>
            <ul
              className={`text-sm space-y-2 ${isDark ? "text-emerald-200/80" : "text-emerald-600"}`}
            >
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500" />
                Pay at stores, restaurants, and online
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500" />
                Transfer money to friends
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500" />
                Pay bills (utilities, phone, internet)
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500" />
                Book train tickets, hotels, and more
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "alipay",
      title: "Alipay Setup",
      icon: Wallet,
      color: "from-blue-500 to-blue-600",
      content: (
        <div className="space-y-6">
          <div
            className={`p-5 rounded-xl ${isDark ? "bg-blue-500/10 border border-blue-500/30" : "bg-blue-50 border border-blue-200"}`}
          >
            <h4
              className={`font-semibold mb-3 ${isDark ? "text-blue-300" : "text-blue-700"}`}
            >
              What is Alipay?
            </h4>
            <p
              className={`text-sm ${isDark ? "text-blue-200/80" : "text-blue-600"}`}
            >
              Alipay (支付宝) is China's leading payment platform. It offers
              more financial services than WeChat Pay and is widely accepted.
            </p>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
          >
            <h4
              className={`font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Setup Steps
            </h4>
            <div className="space-y-4">
              {[
                {
                  step: 1,
                  title: "Download Alipay",
                  desc: "Get from App Store or Google Play",
                },
                {
                  step: 2,
                  title: "Register Account",
                  desc: "Use your phone number",
                },
                {
                  step: 3,
                  title: "Add Bank Card",
                  desc: "Go to 'Me' → 'Bank Cards'",
                },
                {
                  step: 4,
                  title: "Complete Verification",
                  desc: "Upload passport if required",
                },
                {
                  step: 5,
                  title: "Set Payment Password",
                  desc: "Create a 6-digit PIN",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className={`flex items-start gap-4 p-3 rounded-lg ${isDark ? "bg-slate-600/50" : "bg-white"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold bg-gradient-to-br from-blue-500 to-blue-600`}
                  >
                    {item.step}
                  </div>
                  <div>
                    <p
                      className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {item.title}
                    </p>
                    <p
                      className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-amber-500/10 border border-amber-500/30" : "bg-amber-50 border border-amber-200"}`}
          >
            <h4
              className={`font-semibold mb-3 ${isDark ? "text-amber-300" : "text-amber-700"}`}
            >
              Alipay Features
            </h4>
            <ul
              className={`text-sm space-y-2 ${isDark ? "text-amber-200/80" : "text-amber-600"}`}
            >
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-amber-500" />
                Zhima Credit (credit score system)
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-amber-500" />
                International version available
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-amber-500" />
                Discounts and coupons
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-amber-500" />
                Investment and savings features
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "bank",
      title: "Opening a Bank Account",
      icon: Building2,
      color: "from-red-500 to-red-600",
      content: (
        <div className="space-y-6">
          <div
            className={`p-5 rounded-xl ${isDark ? "bg-red-500/10 border border-red-500/30" : "bg-red-50 border border-red-200"}`}
          >
            <h4
              className={`font-semibold mb-3 ${isDark ? "text-red-300" : "text-red-700"}`}
            >
              Why You Need a Chinese Bank Account
            </h4>
            <p
              className={`text-sm ${isDark ? "text-red-200/80" : "text-red-600"}`}
            >
              A Chinese bank account is essential for receiving scholarships,
              paying tuition, and using mobile payment apps like WeChat Pay and
              Alipay.
            </p>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
          >
            <h4
              className={`font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Required Documents
            </h4>
            <ul
              className={`text-sm space-y-2 ${isDark ? "text-slate-300" : "text-slate-600"}`}
            >
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500" />
                Valid Passport
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500" />
                Student ID or admission letter
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500" />
                Residence permit (if available)
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500" />
                Chinese phone number
              </li>
            </ul>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
          >
            <h4
              className={`font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Recommended Banks
            </h4>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { name: "ICBC (工商银行)", desc: "Largest bank, many ATMs" },
                { name: "Bank of China (中国银行)", desc: "Good for international transfers" },
                { name: "China Construction Bank (建设银行)", desc: "Campus branches available" },
                { name: "Agricultural Bank (农业银行)", desc: "Widely available" },
              ].map((bank) => (
                <div
                  key={bank.name}
                  className={`p-3 rounded-lg ${isDark ? "bg-slate-600/50" : "bg-white"}`}
                >
                  <p
                    className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {bank.name}
                  </p>
                  <p
                    className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                  >
                    {bank.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-emerald-50 border border-emerald-200"}`}
          >
            <h4
              className={`font-semibold mb-3 ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
            >
              Process
            </h4>
            <ol
              className={`text-sm space-y-2 ${isDark ? "text-emerald-200/80" : "text-emerald-600"}`}
            >
              <li>1. Visit a bank branch with your documents</li>
              <li>2. Fill out the application form (ask for English form)</li>
              <li>3. Staff will verify your documents</li>
              <li>4. Set your 6-digit PIN</li>
              <li>5. Receive your debit card (usually same day)</li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: "currency",
      title: "Currency Exchange",
      icon: Banknote,
      color: "from-yellow-500 to-amber-500",
      content: (
        <div className="space-y-6">
          <div
            className={`p-5 rounded-xl ${isDark ? "bg-yellow-500/10 border border-yellow-500/30" : "bg-yellow-50 border border-yellow-200"}`}
          >
            <h4
              className={`font-semibold mb-3 ${isDark ? "text-yellow-300" : "text-yellow-700"}`}
            >
              Chinese Currency
            </h4>
            <p
              className={`text-sm ${isDark ? "text-yellow-200/80" : "text-yellow-600"}`}
            >
              The Chinese currency is Renminbi (RMB), also called Yuan (¥).
              Commonly used notes: ¥1, ¥5, ¥10, ¥20, ¥50, ¥100.
            </p>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
          >
            <h4
              className={`font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Exchange Options
            </h4>
            <div className="space-y-3">
              <div
                className={`p-3 rounded-lg ${isDark ? "bg-slate-600/50" : "bg-white"}`}
              >
                <p
                  className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Bank Exchange
                </p>
                <p
                  className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  Best rates, bring passport. Bank of China offers best service.
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${isDark ? "bg-slate-600/50" : "bg-white"}`}
              >
                <p
                  className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Airport Exchange
                </p>
                <p
                  className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  Convenient but higher fees. Good for emergency cash.
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${isDark ? "bg-slate-600/50" : "bg-white"}`}
              >
                <p
                  className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  ATM Withdrawal
                </p>
                <p
                  className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  Use foreign cards at ATMs with UnionPay logo.
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-amber-500/10 border border-amber-500/30" : "bg-amber-50 border border-amber-200"}`}
          >
            <h4
              className={`font-semibold mb-3 ${isDark ? "text-amber-300" : "text-amber-700"}`}
            >
              Quick Reference (Approximate)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { currency: "USD", rate: "¥1 ≈ $0.14" },
                { currency: "EUR", rate: "¥1 ≈ €0.13" },
                { currency: "GBP", rate: "¥1 ≈ £0.11" },
                { currency: "PKR", rate: "¥1 ≈ Rs.39" },
              ].map((item) => (
                <div
                  key={item.currency}
                  className={`p-3 rounded-lg text-center ${isDark ? "bg-amber-500/20" : "bg-white"}`}
                >
                  <p
                    className={`text-xs ${isDark ? "text-amber-400" : "text-amber-500"}`}
                  >
                    {item.currency}
                  </p>
                  <p
                    className={`font-semibold ${isDark ? "text-amber-200" : "text-amber-700"}`}
                  >
                    {item.rate}
                  </p>
                </div>
              ))}
            </div>
            <p
              className={`text-xs mt-3 ${isDark ? "text-amber-200/60" : "text-amber-500"}`}
            >
              * Rates fluctuate. Check current rates before exchanging.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "qr",
      title: "QR Code Payments",
      icon: QrCode,
      color: "from-purple-500 to-purple-600",
      content: (
        <div className="space-y-6">
          <div
            className={`p-5 rounded-xl ${isDark ? "bg-purple-500/10 border border-purple-500/30" : "bg-purple-50 border border-purple-200"}`}
          >
            <h4
              className={`font-semibold mb-3 ${isDark ? "text-purple-300" : "text-purple-700"}`}
            >
              How QR Payments Work
            </h4>
            <p
              className={`text-sm ${isDark ? "text-purple-200/80" : "text-purple-600"}`}
            >
              QR code payments are the most common way to pay in China. Almost
              every store, from big malls to street vendors, accepts QR code
              payments.
            </p>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
          >
            <h4
              className={`font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Two Ways to Pay
            </h4>
            <div className="space-y-4">
              <div
                className={`p-4 rounded-lg ${isDark ? "bg-slate-600/50" : "bg-white"}`}
              >
                <p
                  className={`font-medium mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  1. Scan Merchant's QR Code
                </p>
                <p
                  className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  Open WeChat/Alipay → Scan → Enter amount → Confirm
                </p>
              </div>
              <div
                className={`p-4 rounded-lg ${isDark ? "bg-slate-600/50" : "bg-white"}`}
              >
                <p
                  className={`font-medium mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  2. Show Your QR Code
                </p>
                <p
                  className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  Open WeChat/Alipay → Show payment code → Merchant scans you
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-emerald-50 border border-emerald-200"}`}
          >
            <h4
              className={`font-semibold mb-3 ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
            >
              Tips
            </h4>
            <ul
              className={`text-sm space-y-2 ${isDark ? "text-emerald-200/80" : "text-emerald-600"}`}
            >
              <li>• Always check the amount before confirming</li>
              <li>• Keep your payment code private</li>
              <li>• Screenshot payment confirmation for records</li>
              <li>• Some places only accept WeChat or Alipay</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "safety",
      title: "Payment Safety",
      icon: Shield,
      color: "from-teal-500 to-teal-600",
      content: (
        <div className="space-y-6">
          <div
            className={`p-5 rounded-xl ${isDark ? "bg-teal-500/10 border border-teal-500/30" : "bg-teal-50 border border-teal-200"}`}
          >
            <h4
              className={`font-semibold mb-3 ${isDark ? "text-teal-300" : "text-teal-700"}`}
            >
              Stay Safe
            </h4>
            <p
              className={`text-sm ${isDark ? "text-teal-200/80" : "text-teal-600"}`}
            >
              Mobile payments are generally very safe in China, but you should
              still take precautions to protect your money.
            </p>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
          >
            <h4
              className={`font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Safety Tips
            </h4>
            <ul
              className={`text-sm space-y-3 ${isDark ? "text-slate-300" : "text-slate-600"}`}
            >
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500" />
                <span>
                  <strong>Set a strong payment PIN</strong> - Don't use simple
                  numbers like 123456
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500" />
                <span>
                  <strong>Enable fingerprint/face ID</strong> - Add biometric
                  authentication
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500" />
                <span>
                  <strong>Verify recipients</strong> - Double-check before
                  transferring money
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500" />
                <span>
                  <strong>Don't share codes</strong> - Never share verification
                  codes with anyone
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500" />
                <span>
                  <strong>Check transaction history</strong> - Review your
                  payments regularly
                </span>
              </li>
            </ul>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-red-500/10 border border-red-500/30" : "bg-red-50 border border-red-200"}`}
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                className={`w-5 h-5 mt-0.5 ${isDark ? "text-red-400" : "text-red-600"}`}
              />
              <div>
                <h4
                  className={`font-semibold mb-2 ${isDark ? "text-red-300" : "text-red-700"}`}
                >
                  Report Fraud
                </h4>
                <p
                  className={`text-sm ${isDark ? "text-red-200/80" : "text-red-600"}`}
                >
                  If you suspect fraud, contact your bank immediately and report
                  to the International Office. Save transaction records as
                  evidence.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${isDark ? "from-slate-900 via-slate-800 to-slate-900" : "from-slate-50 via-white to-slate-50"}`}
    >
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 mb-4">
            <CreditCard className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-medium text-amber-400">
              Payment Guide
            </span>
          </div>
          <h1
            className={`text-3xl sm:text-4xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Currency & Payments in China
          </h1>
          <p
            className={`text-lg ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            Everything you need to know about managing money in China
          </p>
        </div>

        <div className="space-y-4">
          {sections.map((section) => {
            const Icon = section.icon;
            const isOpen = openSections.includes(section.id);

            return (
              <div
                key={section.id}
                className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                  isDark
                    ? "bg-slate-800/50 border border-slate-700"
                    : "bg-white border border-slate-200 shadow-sm"
                }`}
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className={`w-full flex items-center justify-between p-5 text-left transition-colors ${
                    isDark ? "hover:bg-slate-700/50" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center text-white shadow-lg`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3
                      className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {section.title}
                    </h3>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    } ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div
                    className={`px-5 pb-5 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                  >
                    {section.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function PaymentGuidePage() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ncwu-theme">
      <PaymentContent />
    </ThemeProvider>
  );
}
