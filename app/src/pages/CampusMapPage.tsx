import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import {
  MapPin,
  Utensils,
  Home,
  Hospital,
  BookOpen,
  Dumbbell,
  ShoppingBag,
  Bus,
  Coffee,
  X,
  Satellite,
  ExternalLink,
  Map,
} from "lucide-react";

interface Location {
  id: string;
  name: string;
  nameZh: string;
  category: string;
  description: string;
  icon: React.ElementType;
  color: string;
  tips?: string[];
}

function CampusMapContent() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Campus Map - NCWU International";
  }, []);

  const categories = [
    {
      id: "food",
      name: "Food & Dining",
      icon: Utensils,
      color: "from-orange-500 to-red-500",
    },
    {
      id: "dormitory",
      name: "Dormitories",
      icon: Home,
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "medical",
      name: "Medical",
      icon: Hospital,
      color: "from-red-500 to-pink-500",
    },
    {
      id: "academic",
      name: "Academic",
      icon: BookOpen,
      color: "from-purple-500 to-violet-500",
    },
    {
      id: "sports",
      name: "Sports",
      icon: Dumbbell,
      color: "from-green-500 to-emerald-500",
    },
    {
      id: "shopping",
      name: "Shopping",
      icon: ShoppingBag,
      color: "from-yellow-500 to-amber-500",
    },
    {
      id: "transport",
      name: "Transport",
      icon: Bus,
      color: "from-teal-500 to-cyan-500",
    },
  ];

  const locations: Location[] = [
    {
      id: "life-square",
      name: "Life Square (Canteen)",
      nameZh: "生活广场",
      category: "food",
      description:
        "Main dining area with multiple food options including halal restaurants on the first floor.",
      icon: Utensils,
      color: "from-orange-500 to-red-500",
      tips: [
        "Shops 5 & 6 are Lanzhou Halal restaurants",
        "Use escalator and turn left for halal food",
        "Open for breakfast, lunch, and dinner",
      ],
    },
    {
      id: "second-canteen",
      name: "2nd Canteen",
      nameZh: "第二食堂",
      category: "food",
      description: "Secondary dining facility near the campus hospital.",
      icon: Utensils,
      color: "from-orange-500 to-red-500",
      tips: ["Less crowded than Life Square", "Campus hospital is nearby"],
    },
    {
      id: "halal-canteen",
      name: "Halal Canteen",
      nameZh: "清真食堂",
      category: "food",
      description: "Dedicated halal dining facility for Muslim students.",
      icon: Coffee,
      color: "from-orange-500 to-red-500",
      tips: [
        "All food is halal certified",
        "Check campus map for exact location",
      ],
    },
    {
      id: "north-gate-food",
      name: "North Gate Food Street",
      nameZh: "北门美食街",
      category: "food",
      description:
        "Street food and restaurants near the north gate, including halal options.",
      icon: Utensils,
      color: "from-orange-500 to-red-500",
      tips: [
        "Lanzhou Lamian restaurant near 7/11",
        "Ask for 'Lanzhou Lamian' (兰州拉面)",
      ],
    },
    {
      id: "dormitory-intl",
      name: "International Student Dormitory",
      nameZh: "留学生宿舍",
      category: "dormitory",
      description:
        "Accommodation for international students with modern amenities.",
      icon: Home,
      color: "from-blue-500 to-cyan-500",
      tips: [
        "Rooms include AC, refrigerator, hot water",
        "Cooking allowed in rooms",
        "Contact dormitory manager for issues",
      ],
    },
    {
      id: "campus-hospital",
      name: "Campus Hospital",
      nameZh: "校医院",
      category: "medical",
      description: "On-campus medical facility for students and staff.",
      icon: Hospital,
      color: "from-red-500 to-pink-500",
      tips: [
        "Located near 2nd canteen",
        "Open Monday-Friday, 8:00-17:00",
        "Search on Amap or Baidu Maps",
      ],
    },
    {
      id: "pharmacy-lifesquare",
      name: "Pharmacy (Life Square)",
      nameZh: "药店",
      category: "medical",
      description: "Pharmacy near Life Square, close to Chapanda area.",
      icon: Hospital,
      color: "from-red-500 to-pink-500",
      tips: ["Over-the-counter medicines available", "Near Life Square"],
    },
    {
      id: "pharmacy-north",
      name: "Pharmacy (North Gate)",
      nameZh: "药店",
      category: "medical",
      description: "Pharmacy near the north gate, close to 7/11.",
      icon: Hospital,
      color: "from-red-500 to-pink-500",
      tips: ["Near 7/11 convenience store", "Extended hours"],
    },
    {
      id: "library",
      name: "University Library",
      nameZh: "图书馆",
      category: "academic",
      description: "Main library with study spaces and digital resources.",
      icon: BookOpen,
      color: "from-purple-500 to-violet-500",
      tips: [
        "Quiet study areas available",
        "Digital resources access",
        "Check opening hours",
      ],
    },
    {
      id: "teaching-building",
      name: "Teaching Buildings",
      nameZh: "教学楼",
      category: "academic",
      description: "Main academic buildings for classes and lectures.",
      icon: BookOpen,
      color: "from-purple-500 to-violet-500",
      tips: [
        "Check your schedule for room numbers",
        "Arrive early to find your classroom",
      ],
    },
    {
      id: "sports-field",
      name: "Sports Field",
      nameZh: "运动场",
      category: "sports",
      description: "Outdoor sports facilities including track and field.",
      icon: Dumbbell,
      color: "from-green-500 to-emerald-500",
      tips: ["Open for student use", "Check for scheduled events"],
    },
    {
      id: "gym",
      name: "Gymnasium",
      nameZh: "体育馆",
      category: "sports",
      description: "Indoor sports facility with gym equipment.",
      icon: Dumbbell,
      color: "from-green-500 to-emerald-500",
      tips: ["Check membership requirements", "Indoor courts available"],
    },
    {
      id: "business-street",
      name: "Business Street",
      nameZh: "商业街",
      category: "shopping",
      description: "Shopping area with various stores and services.",
      icon: ShoppingBag,
      color: "from-yellow-500 to-amber-500",
      tips: ["Near north gate", "Various shops and services"],
    },
    {
      id: "north-gate",
      name: "North Gate",
      nameZh: "北门",
      category: "transport",
      description: "Main gate with access to public transportation.",
      icon: Bus,
      color: "from-teal-500 to-cyan-500",
      tips: [
        "Bus stops nearby",
        "Taxi/Didi pickup point",
        "Food street nearby",
      ],
    },
    {
      id: "main-gate",
      name: "Main Gate",
      nameZh: "正门",
      category: "transport",
      description: "Primary entrance to the university campus.",
      icon: Bus,
      color: "from-teal-500 to-cyan-500",
      tips: ["Main entrance", "Visitor registration"],
    },
  ];

  const filteredLocations = activeCategory
    ? locations.filter((loc) => loc.category === activeCategory)
    : locations;

  const getCategoryInfo = (categoryId: string) => {
    return categories.find((cat) => cat.id === categoryId);
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${isDark ? "from-slate-900 via-slate-800 to-slate-900" : "from-slate-50 via-white to-slate-50"}`}
    >
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 mb-4">
            <MapPin className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">
              Interactive Map
            </span>
          </div>
          <h1
            className={`text-3xl sm:text-4xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            NCWU Campus Guide
          </h1>
          <p
            className={`text-lg ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            Explore campus locations and find your way around
          </p>
        </div>

        <div className="mb-8">
          <h2
            className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Filter by Category
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === null
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                  : isDark
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Locations
            </button>
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    activeCategory === category.id
                      ? `bg-gradient-to-r ${category.color} text-white`
                      : isDark
                        ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Satellite Map View */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2
              className={`text-lg font-semibold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              <Satellite className="w-5 h-5 text-blue-500" />
              NCWU Longzihu Campus - Satellite View
            </h2>
          </div>

          {/* Map App Links */}
          <div className="flex flex-wrap gap-2 mb-4">
            <a
              href="https://www.google.com/maps/place/34.777,113.797/@34.777,113.797,15z"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDark
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <ExternalLink className="w-4 h-4" />
              Google Maps
            </a>
            <a
              href="https://uri.amap.com/marker?position=113.797,34.777&name=华北水利水电大学龙子湖校区"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDark
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Map className="w-4 h-4" />
              Amap
            </a>
            <a
              href="https://api.map.baidu.com/marker?location=34.777,113.797&title=华北水利水电大学龙子湖校区&content=NCWU Longzihu Campus&output=html"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDark
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <MapPin className="w-4 h-4" />
              Baidu Maps
            </a>
          </div>

          <div
            className={`rounded-2xl overflow-hidden border ${
              isDark ? "border-slate-700" : "border-slate-200"
            }`}
          >
            <div className="relative w-full h-[400px] sm:h-[500px]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2400.0!2d113.797!3d34.777!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x35f1a0b0b0b0b0b0%3A0x0!2sNorth%20China%20University%20of%20Water%20Resources%20and%20Electric%20Power%20Longzihu%20Campus!5e0!3m2!1sen!2scn!4v1234567890!5m1!1e1"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="NCWU Longzihu Campus Map"
                className="absolute inset-0"
              />
              <div
                className={`absolute top-3 left-3 px-3 py-1.5 rounded-lg text-xs font-medium ${
                  isDark
                    ? "bg-slate-900/90 text-white border border-slate-700"
                    : "bg-white/90 text-slate-700 border border-slate-200"
                }`}
              >
                📍 NCWU Longzihu Campus (龙子湖校区)
              </div>
            </div>
          </div>

          <p
            className={`mt-3 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            📍 Address: No. 136 Jinshui East Road, Zhengzhou, Henan, China
            <br />
            🏫 华北水利水电大学龙子湖校区 - 河南省郑州市金水区金水东路136号
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {filteredLocations.map((location) => {
            const Icon = location.icon;
            const categoryInfo = getCategoryInfo(location.category);
            return (
              <button
                key={location.id}
                onClick={() => setSelectedLocation(location)}
                className={`group text-left rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] ${
                  isDark
                    ? "bg-slate-800/50 border border-slate-700 hover:border-slate-600"
                    : "bg-white border border-slate-200 shadow-sm hover:shadow-md"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${location.color} flex items-center justify-center text-white shadow-lg`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {location.name}
                    </h3>
                    <p
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {location.nameZh}
                    </p>
                    <span
                      className={`inline-block mt-2 px-2 py-1 rounded-full text-xs ${
                        isDark
                          ? "bg-slate-700 text-slate-300"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {categoryInfo?.name}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div
          className={`rounded-2xl p-6 ${isDark ? "bg-blue-500/10 border border-blue-500/30" : "bg-blue-50 border border-blue-200"}`}
        >
          <div className="flex items-start gap-4">
            <MapPin
              className={`w-6 h-6 mt-0.5 ${isDark ? "text-blue-400" : "text-blue-600"}`}
            />
            <div>
              <h3
                className={`font-semibold mb-2 ${isDark ? "text-blue-300" : "text-blue-700"}`}
              >
                Navigation Tips
              </h3>
              <p
                className={`text-sm ${isDark ? "text-blue-200/80" : "text-blue-600"}`}
              >
                Use apps like Amap (高德地图) or Baidu Maps (百度地图) for
                navigation. Search locations using Chinese names for better
                results. Ask local students or dormitory managers if you need
                help finding a specific location.
              </p>
            </div>
          </div>
        </div>
      </main>

      {selectedLocation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedLocation(null)}
          />
          <div
            className={`relative max-w-md w-full rounded-3xl p-6 shadow-2xl animate-scale-in ${
              isDark
                ? "bg-slate-800 border border-slate-700"
                : "bg-white border border-slate-200"
            }`}
          >
            <button
              onClick={() => setSelectedLocation(null)}
              className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                isDark
                  ? "hover:bg-white/10 text-white/60 hover:text-white"
                  : "hover:bg-black/5 text-slate-400 hover:text-slate-600"
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-4">
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${selectedLocation.color} flex items-center justify-center text-white shadow-lg`}
              >
                <selectedLocation.icon className="w-7 h-7" />
              </div>
              <div>
                <h3
                  className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {selectedLocation.name}
                </h3>
                <p
                  className={`${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  {selectedLocation.nameZh}
                </p>
              </div>
            </div>

            <p
              className={`mb-4 ${isDark ? "text-slate-300" : "text-slate-600"}`}
            >
              {selectedLocation.description}
            </p>

            {selectedLocation.tips && selectedLocation.tips.length > 0 && (
              <div
                className={`rounded-xl p-4 ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
              >
                <h4
                  className={`font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Tips
                </h4>
                <ul className="space-y-2">
                  {selectedLocation.tips.map((tip, index) => (
                    <li
                      key={index}
                      className={`flex items-start gap-2 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                    >
                      <span className="text-emerald-500">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function CampusMapPage() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ncwu-theme">
      <CampusMapContent />
    </ThemeProvider>
  );
}
