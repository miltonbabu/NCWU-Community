import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import {
  Globe,
  ChevronDown,
  Utensils,
  Hospital,
  GraduationCap,
  Home,
  Lightbulb,
  MapPin,
  Smartphone,
  CurrencyIcon,
  Award,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface GuideSection {
  id: string;
  icon: React.ElementType;
  title: string;
  emoji: string;
  content: React.ReactNode;
}

function StudentGuidesContent() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [openSections, setOpenSections] = useState<string[]>(["life-ncwu"]);

  useEffect(() => {
    document.title = "Student Guides - NCWU International";
  }, []);

  const toggleSection = (id: string) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const sections: GuideSection[] = [
    {
      id: "life-ncwu",
      icon: Globe,
      emoji: "🏫",
      title: "Life at NCWU as an International Student",
      content: (
        <div className="space-y-4">
          <p className="text-base leading-relaxed">
            Studying at North China University of Water Resources and Electric
            Power is a unique experience for international students. Campus life
            is generally safe and convenient, with access to food, dormitories,
            and essential services nearby.
          </p>
          <div
            className={`p-4 rounded-xl ${isDark ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-emerald-50 border border-emerald-200"}`}
          >
            <div className="flex items-start gap-3">
              <CheckCircle
                className={`w-5 h-5 mt-0.5 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
              />
              <p
                className={`text-sm ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
              >
                Adjusting may take some time, but once you settle in, daily life
                becomes quite manageable.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "halal-food",
      icon: Utensils,
      emoji: "🥗",
      title: "Halal Food on Campus & Nearby",
      content: (
        <div className="space-y-6">
          <div
            className={`p-5 rounded-xl ${isDark ? "bg-orange-500/10 border border-orange-500/30" : "bg-orange-50 border border-orange-200"}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <MapPin
                className={`w-5 h-5 ${isDark ? "text-orange-400" : "text-orange-600"}`}
              />
              <h4
                className={`font-semibold ${isDark ? "text-orange-300" : "text-orange-700"}`}
              >
                On Campus (Life Square)
              </h4>
            </div>
            <p
              className={`text-sm ${isDark ? "text-orange-200/80" : "text-orange-600"}`}
            >
              On the first floor of Life Square, go up using the escalator and
              turn left. Shops No. 5 and 6 are{" "}
              <span className="font-semibold">Lanzhou Halal (清真兰州拉面)</span>{" "}
              restaurants.
            </p>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-blue-500/10 border border-blue-500/30" : "bg-blue-50 border border-blue-200"}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <MapPin
                className={`w-5 h-5 ${isDark ? "text-blue-400" : "text-blue-600"}`}
              />
              <h4
                className={`font-semibold ${isDark ? "text-blue-300" : "text-blue-700"}`}
              >
                Near North Gate (Business Street)
              </h4>
            </div>
            <p
              className={`text-sm ${isDark ? "text-blue-200/80" : "text-blue-600"}`}
            >
              Close to the north gate, near 7/11, you can find another Lanzhou
              Lamian restaurant. You can simply ask anyone for{" "}
              <span className="font-semibold">"Lanzhou Lamian" (兰州拉面)</span>,
              and they will guide you.
            </p>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-purple-500/10 border border-purple-500/30" : "bg-purple-50 border border-purple-200"}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Smartphone
                className={`w-5 h-5 ${isDark ? "text-purple-400" : "text-purple-600"}`}
              />
              <h4
                className={`font-semibold ${isDark ? "text-purple-300" : "text-purple-700"}`}
              >
                Online Takeout
              </h4>
            </div>
            <ul
              className={`text-sm space-y-2 ${isDark ? "text-purple-200/80" : "text-purple-600"}`}
            >
              <li className="flex items-start gap-2">
                <span className="font-semibold">•</span>
                <span>
                  Use the <span className="font-semibold">Meituan app</span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold">•</span>
                <span>
                  Search using the Chinese word{" "}
                  <span className="font-semibold">"清真 (Qingzhen)"</span> to
                  find halal restaurants nearby
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold">•</span>
                <span>
                  Delivery usually takes around{" "}
                  <span className="font-semibold">20–30 minutes</span>
                </span>
              </li>
            </ul>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-green-500/10 border border-green-500/30" : "bg-green-50 border border-green-200"}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Utensils
                className={`w-5 h-5 ${isDark ? "text-green-400" : "text-green-600"}`}
              />
              <h4
                className={`font-semibold ${isDark ? "text-green-300" : "text-green-700"}`}
              >
                Halal Canteens
              </h4>
            </div>
            <p
              className={`text-sm ${isDark ? "text-green-200/80" : "text-green-600"}`}
            >
              Halal canteens are also available on campus. Check campus maps for
              exact locations.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "hospital-pharmacy",
      icon: Hospital,
      emoji: "🏥",
      title: "Hospital & Pharmacy Guide",
      content: (
        <div className="space-y-6">
          <div
            className={`p-5 rounded-xl ${isDark ? "bg-red-500/10 border border-red-500/30" : "bg-red-50 border border-red-200"}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Hospital
                className={`w-5 h-5 ${isDark ? "text-red-400" : "text-red-600"}`}
              />
              <h4
                className={`font-semibold ${isDark ? "text-red-300" : "text-red-700"}`}
              >
                Campus Hospital
              </h4>
            </div>
            <ul
              className={`text-sm space-y-2 ${isDark ? "text-red-200/80" : "text-red-600"}`}
            >
              <li className="flex items-start gap-2">
                <span className="font-semibold">•</span>
                <span>
                  Near the <span className="font-semibold">2nd canteen</span>,
                  you can find the NCWU school hospital
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold">•</span>
                <span>
                  You can also search using apps like{" "}
                  <span className="font-semibold">Amap</span> or{" "}
                  <span className="font-semibold">Baidu Maps</span> in Chinese
                </span>
              </li>
            </ul>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-teal-500/10 border border-teal-500/30" : "bg-teal-50 border border-teal-200"}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <MapPin
                className={`w-5 h-5 ${isDark ? "text-teal-400" : "text-teal-600"}`}
              />
              <h4
                className={`font-semibold ${isDark ? "text-teal-300" : "text-teal-700"}`}
              >
                Pharmacies
              </h4>
            </div>
            <ul
              className={`text-sm space-y-2 ${isDark ? "text-teal-200/80" : "text-teal-600"}`}
            >
              <li className="flex items-start gap-2">
                <span className="font-semibold">•</span>
                <span>
                  One pharmacy is located near{" "}
                  <span className="font-semibold">Life Square</span> (close to
                  Chapanda area)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold">•</span>
                <span>
                  Another is near the{" "}
                  <span className="font-semibold">north gate</span>, close to
                  7/11
                </span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "senior-tips",
      icon: Lightbulb,
      emoji: "🎓",
      title: "Things Seniors Wish They Knew",
      content: (
        <div className="space-y-6">
          <div
            className={`p-5 rounded-xl ${isDark ? "bg-amber-500/10 border border-amber-500/30" : "bg-amber-50 border border-amber-200"}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle
                className={`w-5 h-5 ${isDark ? "text-amber-400" : "text-amber-600"}`}
              />
              <h4
                className={`font-semibold ${isDark ? "text-amber-300" : "text-amber-700"}`}
              >
                Campus Rules
              </h4>
            </div>
            <ul
              className={`text-sm space-y-2 ${isDark ? "text-amber-200/80" : "text-amber-600"}`}
            >
              <li className="flex items-start gap-2">
                <span className="font-semibold">•</span>
                <span>
                  Follow campus rules strictly (e.g., avoid going out late at
                  night)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold">•</span>
                <span>
                  <span className="font-semibold text-red-500">No smoking</span>{" "}
                  in dormitories or on campus
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold">•</span>
                <span>
                  Attend classes regularly and always be on time (no absence
                  without permission)
                </span>
              </li>
            </ul>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-cyan-500/10 border border-cyan-500/30" : "bg-cyan-50 border border-cyan-200"}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap
                className={`w-5 h-5 ${isDark ? "text-cyan-400" : "text-cyan-600"}`}
              />
              <h4
                className={`font-semibold ${isDark ? "text-cyan-300" : "text-cyan-700"}`}
              >
                Grading System
              </h4>
            </div>
            <ul
              className={`text-sm space-y-2 ${isDark ? "text-cyan-200/80" : "text-cyan-600"}`}
            >
              <li className="flex items-start gap-2">
                <span className="font-semibold">•</span>
                <span>
                  Passing mark is{" "}
                  <span className="font-semibold">50/100</span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold">•</span>
                <span>
                  If you fail, you can take a makeup exam, but the maximum
                  score will be <span className="font-semibold">60</span>, even
                  if you perform better
                </span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "academic-scholarship",
      icon: Award,
      emoji: "📚",
      title: "Academic & Scholarship Info",
      content: (
        <div className="space-y-6">
          <div
            className={`p-5 rounded-xl ${isDark ? "bg-indigo-500/10 border border-indigo-500/30" : "bg-indigo-50 border border-indigo-200"}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap
                className={`w-5 h-5 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
              />
              <h4
                className={`font-semibold ${isDark ? "text-indigo-300" : "text-indigo-700"}`}
              >
                Chinese Language Learning
              </h4>
            </div>
            <p
              className={`text-sm ${isDark ? "text-indigo-200/80" : "text-indigo-600"}`}
            >
              Study Chinese and aim for{" "}
              <span className="font-semibold">HSK (Chinese Proficiency Test)</span>{" "}
              levels 1–4 for certification.
            </p>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-emerald-50 border border-emerald-200"}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <CurrencyIcon
                className={`w-5 h-5 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
              />
              <h4
                className={`font-semibold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
              >
                Financial Information
              </h4>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div
                className={`p-3 rounded-lg ${isDark ? "bg-emerald-500/20" : "bg-white"}`}
              >
                <p
                  className={`text-xs ${isDark ? "text-emerald-400" : "text-emerald-500"}`}
                >
                  Government Scholarship
                </p>
                <p
                  className={`text-lg font-bold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                >
                  ~15,000 RMB/year
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${isDark ? "bg-emerald-500/20" : "bg-white"}`}
              >
                <p
                  className={`text-xs ${isDark ? "text-emerald-400" : "text-emerald-500"}`}
                >
                  Accommodation
                </p>
                <p
                  className={`text-lg font-bold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                >
                  ~2,000 RMB/year
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-violet-500/10 border border-violet-500/30" : "bg-violet-50 border border-violet-200"}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Award
                className={`w-5 h-5 ${isDark ? "text-violet-400" : "text-violet-600"}`}
              />
              <h4
                className={`font-semibold ${isDark ? "text-violet-300" : "text-violet-700"}`}
              >
                Tuition Fees
              </h4>
            </div>
            <div className="space-y-3">
              <div
                className={`flex justify-between items-center p-3 rounded-lg ${isDark ? "bg-violet-500/20" : "bg-white"}`}
              >
                <span
                  className={`text-sm ${isDark ? "text-violet-200" : "text-violet-600"}`}
                >
                  Economics
                </span>
                <span
                  className={`font-bold ${isDark ? "text-violet-300" : "text-violet-700"}`}
                >
                  ~14,000 RMB/year
                </span>
              </div>
              <div
                className={`flex justify-between items-center p-3 rounded-lg ${isDark ? "bg-violet-500/20" : "bg-white"}`}
              >
                <span
                  className={`text-sm ${isDark ? "text-violet-200" : "text-violet-600"}`}
                >
                  Science & Engineering
                </span>
                <span
                  className={`font-bold ${isDark ? "text-violet-300" : "text-violet-700"}`}
                >
                  ~16,000 RMB/year
                </span>
              </div>
            </div>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-rose-500/10 border border-rose-500/30" : "bg-rose-50 border border-rose-200"}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle
                className={`w-5 h-5 ${isDark ? "text-rose-400" : "text-rose-600"}`}
              />
              <h4
                className={`font-semibold ${isDark ? "text-rose-300" : "text-rose-700"}`}
              >
                Scholarship Requirements
              </h4>
            </div>
            <ul
              className={`text-sm space-y-2 ${isDark ? "text-rose-200/80" : "text-rose-600"}`}
            >
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5" />
                <span>No disciplinary records</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5" />
                <span>Good academic performance</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "dormitory-life",
      icon: Home,
      emoji: "🏠",
      title: "Dormitory Life",
      content: (
        <div className="space-y-6">
          <div
            className={`p-5 rounded-xl ${isDark ? "bg-sky-500/10 border border-sky-500/30" : "bg-sky-50 border border-sky-200"}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Home
                className={`w-5 h-5 ${isDark ? "text-sky-400" : "text-sky-600"}`}
              />
              <h4
                className={`font-semibold ${isDark ? "text-sky-300" : "text-sky-700"}`}
              >
                Room Amenities
              </h4>
            </div>
            <p
              className={`text-sm mb-3 ${isDark ? "text-sky-200/80" : "text-sky-600"}`}
            >
              You can cook in your dorm room. Rooms usually include:
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div
                className={`p-3 rounded-lg text-center ${isDark ? "bg-sky-500/20" : "bg-white"}`}
              >
                <span className="text-2xl">❄️</span>
                <p
                  className={`text-xs mt-1 ${isDark ? "text-sky-300" : "text-sky-600"}`}
                >
                  Air Conditioner
                </p>
              </div>
              <div
                className={`p-3 rounded-lg text-center ${isDark ? "bg-sky-500/20" : "bg-white"}`}
              >
                <span className="text-2xl">🧊</span>
                <p
                  className={`text-xs mt-1 ${isDark ? "text-sky-300" : "text-sky-600"}`}
                >
                  Refrigerator
                </p>
              </div>
              <div
                className={`p-3 rounded-lg text-center ${isDark ? "bg-sky-500/20" : "bg-white"}`}
              >
                <span className="text-2xl">🚿</span>
                <p
                  className={`text-xs mt-1 ${isDark ? "text-sky-300" : "text-sky-600"}`}
                >
                  Hot Water
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-yellow-500/10 border border-yellow-500/30" : "bg-yellow-50 border border-yellow-200"}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb
                className={`w-5 h-5 ${isDark ? "text-yellow-400" : "text-yellow-600"}`}
              />
              <h4
                className={`font-semibold ${isDark ? "text-yellow-300" : "text-yellow-700"}`}
              >
                Electricity
              </h4>
            </div>
            <div className="space-y-3">
              <div
                className={`p-3 rounded-lg ${isDark ? "bg-yellow-500/20" : "bg-white"}`}
              >
                <p
                  className={`text-sm font-semibold ${isDark ? "text-yellow-300" : "text-yellow-700"}`}
                >
                  New Campus
                </p>
                <p
                  className={`text-sm ${isDark ? "text-yellow-200/80" : "text-yellow-600"}`}
                >
                  Pay mainly for AC and lighting
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${isDark ? "bg-yellow-500/20" : "bg-white"}`}
              >
                <p
                  className={`text-sm font-semibold ${isDark ? "text-yellow-300" : "text-yellow-700"}`}
                >
                  Old Campus
                </p>
                <p
                  className={`text-sm ${isDark ? "text-yellow-200/80" : "text-yellow-600"}`}
                >
                  Students pay for all electricity usage
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 mb-4">
            <Globe className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">
              Real Student Guides
            </span>
          </div>
          <h1
            className={`text-3xl sm:text-4xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Everything You Need to Know
          </h1>
          <p
            className={`text-lg ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            Practical guides from senior students to help you navigate life at
            NCWU
          </p>
        </div>

        <div className="space-y-4">
          {sections.map((section) => {
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
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                        isDark ? "bg-slate-700" : "bg-slate-100"
                      }`}
                    >
                      {section.emoji}
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
                    isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
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

export default function StudentGuidesPage() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ncwu-theme">
      <StudentGuidesContent />
    </ThemeProvider>
  );
}
