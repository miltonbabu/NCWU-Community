import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import {
  Smartphone,
  MessageCircle,
  CreditCard,
  Utensils,
  Car,
  Map,
  Languages,
  ShoppingCart,
  Gamepad2,
  ChevronDown,
  CheckCircle,
} from "lucide-react";

interface App {
  id: string;
  name: string;
  nameZh: string;
  category: string;
  description: string;
  features: string[];
  tips: string[];
  icon: React.ElementType;
  color: string;
  downloadUrl?: string;
}

function AppsGuideContent() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [expandedApp, setExpandedApp] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Essential Apps Guide - NCWU International";
  }, []);

  const categories = [
    { id: "communication", name: "Communication", icon: MessageCircle },
    { id: "payment", name: "Payment", icon: CreditCard },
    { id: "food", name: "Food Delivery", icon: Utensils },
    { id: "transport", name: "Transportation", icon: Car },
    { id: "navigation", name: "Navigation", icon: Map },
    { id: "translation", name: "Translation", icon: Languages },
    { id: "shopping", name: "Shopping", icon: ShoppingCart },
    { id: "entertainment", name: "Entertainment", icon: Gamepad2 },
  ];

  const apps: App[] = [
    {
      id: "wechat",
      name: "WeChat",
      nameZh: "微信",
      category: "communication",
      description: "The most essential app in China for messaging, payments, and everything.",
      features: [
        "Messaging and video calls",
        "WeChat Pay for payments",
        "Mini-programs for various services",
        "Moments (social feed)",
        "Official accounts for news",
      ],
      tips: [
        "Link your bank card for WeChat Pay",
        "Join your class WeChat group",
        "Use 'Shake' or 'People Nearby' to meet people",
        "Scan QR codes to add friends",
      ],
      icon: MessageCircle,
      color: "from-green-500 to-green-600",
    },
    {
      id: "alipay",
      name: "Alipay",
      nameZh: "支付宝",
      category: "payment",
      description: "China's leading payment platform with many financial services.",
      features: [
        "Mobile payments everywhere",
        "Bill payments (utilities, phone)",
        "Money transfers",
        "Investment features",
        "Credit score (Zhima Credit)",
      ],
      tips: [
        "Set up with your Chinese bank account",
        "Use for campus payments",
        "Check for discounts and coupons",
        "International version available",
      ],
      icon: CreditCard,
      color: "from-blue-500 to-blue-600",
    },
    {
      id: "meituan",
      name: "Meituan",
      nameZh: "美团",
      category: "food",
      description: "Popular app for food delivery, hotel booking, and local services.",
      features: [
        "Food delivery from restaurants",
        "Grocery delivery",
        "Hotel and travel booking",
        "Movie tickets",
        "Discounts and deals",
      ],
      tips: [
        "Search '清真' (Qingzhen) for halal food",
        "Check delivery time before ordering",
        "Use Chinese addresses for accuracy",
        "Compare prices with Eleme",
      ],
      icon: Utensils,
      color: "from-yellow-500 to-orange-500",
    },
    {
      id: "eleme",
      name: "Eleme",
      nameZh: "饿了么",
      category: "food",
      description: "Major food delivery platform owned by Alibaba.",
      features: [
        "Food delivery",
        "Grocery shopping",
        "Pharmacy delivery",
        "Flower delivery",
        "Membership benefits",
      ],
      tips: [
        "Linked with Alipay",
        "Good for campus delivery",
        "Check for new user discounts",
        "Search in Chinese for better results",
      ],
      icon: Utensils,
      color: "from-blue-400 to-blue-500",
    },
    {
      id: "didi",
      name: "Didi",
      nameZh: "滴滴出行",
      category: "transport",
      description: "China's equivalent to Uber for ride-hailing.",
      features: [
        "Car rides (Express, Premier)",
        "Taxi booking",
        "Bike sharing",
        "Carpooling options",
        "Scheduled rides",
      ],
      tips: [
        "Link with Alipay or WeChat Pay",
        "Set pickup location in Chinese",
        "Share ride status with friends",
        "Check driver rating before ride",
      ],
      icon: Car,
      color: "from-orange-500 to-orange-600",
    },
    {
      id: "amap",
      name: "Amap (Gaode Maps)",
      nameZh: "高德地图",
      category: "navigation",
      description: "Most accurate map app for China with real-time traffic.",
      features: [
        "Detailed maps of China",
        "Real-time traffic updates",
        "Public transit directions",
        "Voice navigation",
        "Nearby places search",
      ],
      tips: [
        "Better than Google Maps in China",
        "Download offline maps",
        "Use Chinese for location names",
        "Check bus/metro routes",
      ],
      icon: Map,
      color: "from-blue-600 to-blue-700",
    },
    {
      id: "baidu-maps",
      name: "Baidu Maps",
      nameZh: "百度地图",
      category: "navigation",
      description: "Alternative map app with comprehensive coverage.",
      features: [
        "Street-level maps",
        "Panoramic views",
        "Public transport info",
        "Walking directions",
        "Location sharing",
      ],
      tips: [
        "Good for finding local businesses",
        "Use with Chinese addresses",
        "Check opening hours",
        "Save favorite locations",
      ],
      icon: Map,
      color: "from-red-500 to-red-600",
    },
    {
      id: "google-translate",
      name: "Google Translate",
      nameZh: "谷歌翻译",
      category: "translation",
      description: "Essential translation app with offline support.",
      features: [
        "Text translation",
        "Camera translation (scan text)",
        "Voice translation",
        "Offline language packs",
        "Conversation mode",
      ],
      tips: [
        "Download Chinese offline pack",
        "Use camera for menus and signs",
        "Voice input works well",
        "Save common phrases",
      ],
      icon: Languages,
      color: "from-blue-400 to-indigo-500",
    },
    {
      id: "baidu-translate",
      name: "Baidu Translate",
      nameZh: "百度翻译",
      category: "translation",
      description: "Chinese translation app with good accuracy.",
      features: [
        "Multi-language support",
        "Document translation",
        "Image translation",
        "Voice input",
        "Phrasebook",
      ],
      tips: [
        "Good for Chinese-English translation",
        "Works well in China",
        "Use for official documents",
        "Available without VPN",
      ],
      icon: Languages,
      color: "from-blue-500 to-blue-600",
    },
    {
      id: "pleco",
      name: "Pleco",
      nameZh: "Pleco词典",
      category: "translation",
      description: "The ultimate Chinese dictionary app for learners.",
      features: [
        "Chinese-English dictionary",
        "Handwriting recognition",
        "OCR (camera lookup)",
        "Flashcard system",
        "Example sentences",
      ],
      tips: [
        "Essential for HSK study",
        "Use camera to look up characters",
        "Create custom flashcards",
        "Download additional dictionaries",
      ],
      icon: Languages,
      color: "from-green-600 to-green-700",
    },
    {
      id: "taobao",
      name: "Taobao",
      nameZh: "淘宝",
      category: "shopping",
      description: "China's largest e-commerce platform.",
      features: [
        "Millions of products",
        "Competitive prices",
        "Clothing, electronics, everything",
        "Buyer protection",
        "Live shopping streams",
      ],
      tips: [
        "Use Chinese for better search",
        "Check seller ratings",
        "Compare prices before buying",
        "Use Alipay for payment",
      ],
      icon: ShoppingCart,
      color: "from-orange-500 to-red-500",
    },
    {
      id: "jd",
      name: "JD.com",
      nameZh: "京东",
      category: "shopping",
      description: "Reliable e-commerce with fast delivery.",
      features: [
        "Authentic products guaranteed",
        "Fast delivery (1-2 days)",
        "Electronics specialist",
        "Grocery delivery",
        "JD Finance",
      ],
      tips: [
        "Good for electronics",
        "Reliable quality",
        "Fast delivery to campus",
        "Check for student discounts",
      ],
      icon: ShoppingCart,
      color: "from-red-500 to-red-600",
    },
  ];

  const toggleApp = (id: string) => {
    setExpandedApp(expandedApp === id ? null : id);
  };

  const getCategoryApps = (categoryId: string) => {
    return apps.filter((app) => app.category === categoryId);
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${isDark ? "from-slate-900 via-slate-800 to-slate-900" : "from-slate-50 via-white to-slate-50"}`}
    >
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 mb-4">
            <Smartphone className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium text-green-400">
              Essential Apps
            </span>
          </div>
          <h1
            className={`text-3xl sm:text-4xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Must-Have Apps in China
          </h1>
          <p
            className={`text-lg ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            Essential apps every international student needs for daily life in
            China
          </p>
        </div>

        <div className="space-y-8">
          {categories.map((category) => {
            const categoryApps = getCategoryApps(category.id);
            if (categoryApps.length === 0) return null;

            const CategoryIcon = category.icon;

            return (
              <div key={category.id}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
                  >
                    <CategoryIcon
                      className={`w-5 h-5 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                    />
                  </div>
                  <h2
                    className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {category.name}
                  </h2>
                </div>

                <div className="space-y-3">
                  {categoryApps.map((app) => {
                    const Icon = app.icon;
                    const isExpanded = expandedApp === app.id;

                    return (
                      <div
                        key={app.id}
                        className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                          isDark
                            ? "bg-slate-800/50 border border-slate-700"
                            : "bg-white border border-slate-200 shadow-sm"
                        }`}
                      >
                        <button
                          onClick={() => toggleApp(app.id)}
                          className={`w-full p-5 text-left transition-colors ${isDark ? "hover:bg-slate-700/50" : "hover:bg-slate-50"}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center text-white shadow-lg`}
                              >
                                <Icon className="w-7 h-7" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3
                                    className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                                  >
                                    {app.name}
                                  </h3>
                                  <span
                                    className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                  >
                                    {app.nameZh}
                                  </span>
                                </div>
                                <p
                                  className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                >
                                  {app.description}
                                </p>
                              </div>
                            </div>
                            <ChevronDown
                              className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""} ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            />
                          </div>
                        </button>

                        <div
                          className={`overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
                        >
                          <div
                            className={`px-5 pb-5 border-t ${isDark ? "border-slate-700" : "border-slate-100"}`}
                          >
                            <div className="grid sm:grid-cols-2 gap-6 pt-5">
                              <div>
                                <h4
                                  className={`font-semibold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
                                >
                                  Features
                                </h4>
                                <ul className="space-y-2">
                                  {app.features.map((feature, index) => (
                                    <li
                                      key={index}
                                      className={`flex items-start gap-2 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                                    >
                                      <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                                      {feature}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4
                                  className={`font-semibold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
                                >
                                  Tips
                                </h4>
                                <ul className="space-y-2">
                                  {app.tips.map((tip, index) => (
                                    <li
                                      key={index}
                                      className={`flex items-start gap-2 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                                    >
                                      <span className="text-amber-500">💡</span>
                                      {tip}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div
          className={`mt-12 rounded-2xl p-6 ${isDark ? "bg-amber-500/10 border border-amber-500/30" : "bg-amber-50 border border-amber-200"}`}
        >
          <div className="flex items-start gap-4">
            <Smartphone
              className={`w-6 h-6 mt-0.5 ${isDark ? "text-amber-400" : "text-amber-600"}`}
            />
            <div>
              <h3
                className={`font-semibold mb-2 ${isDark ? "text-amber-300" : "text-amber-700"}`}
              >
                Pro Tips
              </h3>
              <ul
                className={`text-sm space-y-1 ${isDark ? "text-amber-200/80" : "text-amber-600"}`}
              >
                <li>• Download apps before arriving in China</li>
                <li>• Set up WeChat first - it's essential for everything</li>
                <li>• Link your Chinese bank account to payment apps</li>
                <li>• Keep apps updated for best performance</li>
                <li>• Ask classmates for help with app setup</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function AppsGuidePage() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ncwu-theme">
      <AppsGuideContent />
    </ThemeProvider>
  );
}
