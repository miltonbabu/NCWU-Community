import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import {
  Bus,
  Train,
  Car,
  Bike,
  Plane,
  ChevronDown,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface TransportSection {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  content: React.ReactNode;
}

function TransportationContent() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [openSections, setOpenSections] = useState<string[]>(["did"]);

  useEffect(() => {
    document.title = "Transportation Guide - NCWU International";
  }, []);

  const toggleSection = (id: string) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const sections: TransportSection[] = [
    {
      id: "did",
      title: "Didi (Ride-Hailing)",
      icon: Car,
      color: "from-orange-500 to-orange-600",
      content: (
        <div className="space-y-6">
          <div
            className={`p-5 rounded-xl ${isDark ? "bg-orange-500/10 border border-orange-500/30" : "bg-orange-50 border border-orange-200"}`}
          >
            <h4
              className={`font-semibold mb-3 ${isDark ? "text-orange-300" : "text-orange-700"}`}
            >
              What is Didi?
            </h4>
            <p
              className={`text-sm ${isDark ? "text-orange-200/80" : "text-orange-600"}`}
            >
              Didi (滴滴出行) is China's largest ride-hailing platform, similar
              to Uber. It's essential for getting around Zhengzhou and traveling
              to other cities.
            </p>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
          >
            <h4
              className={`font-semibold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Service Types
            </h4>
            <div className="grid sm:grid-cols-2 gap-3">
              <div
                className={`p-3 rounded-lg ${isDark ? "bg-slate-600/50" : "bg-white"}`}
              >
                <p
                  className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Express (快车)
                </p>
                <p
                  className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  Affordable everyday rides
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${isDark ? "bg-slate-600/50" : "bg-white"}`}
              >
                <p
                  className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Premier (专车)
                </p>
                <p
                  className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  Higher-end vehicles
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${isDark ? "bg-slate-600/50" : "bg-white"}`}
              >
                <p
                  className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Taxi (出租车)
                </p>
                <p
                  className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  Book regular taxis
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${isDark ? "bg-slate-600/50" : "bg-white"}`}
              >
                <p
                  className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Hitch (顺风车)
                </p>
                <p
                  className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  Carpooling for longer trips
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
              How to Use
            </h4>
            <ul
              className={`text-sm space-y-2 ${isDark ? "text-emerald-200/80" : "text-emerald-600"}`}
            >
              <li className="flex items-start gap-2">
                <span className="font-semibold text-emerald-500">1.</span>
                Download Didi app or use WeChat mini-program
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-emerald-500">2.</span>
                Link payment method (WeChat Pay or Alipay)
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-emerald-500">3.</span>
                Enter pickup location (use Chinese address)
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-emerald-500">4.</span>
                Enter destination in Chinese
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-emerald-500">5.</span>
                Confirm and wait for driver
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "bus",
      title: "Bus Transportation",
      icon: Bus,
      color: "from-blue-500 to-blue-600",
      content: (
        <div className="space-y-6">
          <div
            className={`p-5 rounded-xl ${isDark ? "bg-blue-500/10 border border-blue-500/30" : "bg-blue-50 border border-blue-200"}`}
          >
            <h4
              className={`font-semibold mb-3 ${isDark ? "text-blue-300" : "text-blue-700"}`}
            >
              City Buses
            </h4>
            <p
              className={`text-sm mb-3 ${isDark ? "text-blue-200/80" : "text-blue-600"}`}
            >
              Zhengzhou has an extensive bus network. Buses are cheap (1-2 RMB)
              and cover most of the city.
            </p>
            <ul
              className={`text-sm space-y-2 ${isDark ? "text-blue-200/80" : "text-blue-600"}`}
            >
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-blue-400" />
                Pay with WeChat/Alipay QR code
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-blue-400" />
                Use Amap or Baidu Maps for routes
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-blue-400" />
                Bus stops have route information
              </li>
            </ul>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
          >
            <h4
              className={`font-semibold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Useful Chinese Phrases
            </h4>
            <div className="space-y-3">
              <div
                className={`p-3 rounded-lg ${isDark ? "bg-slate-600/50" : "bg-white"}`}
              >
                <p
                  className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  这路车去...吗？
                </p>
                <p
                  className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  Does this bus go to...?
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${isDark ? "bg-slate-600/50" : "bg-white"}`}
              >
                <p
                  className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  请问...站在哪里？
                </p>
                <p
                  className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  Where is the... bus stop?
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "metro",
      title: "Metro/Subway",
      icon: Train,
      color: "from-purple-500 to-purple-600",
      content: (
        <div className="space-y-6">
          <div
            className={`p-5 rounded-xl ${isDark ? "bg-purple-500/10 border border-purple-500/30" : "bg-purple-50 border border-purple-200"}`}
          >
            <h4
              className={`font-semibold mb-3 ${isDark ? "text-purple-300" : "text-purple-700"}`}
            >
              Zhengzhou Metro
            </h4>
            <p
              className={`text-sm ${isDark ? "text-purple-200/80" : "text-purple-600"}`}
            >
              Zhengzhou has a modern metro system that's fast, clean, and
              affordable. It's the best way to travel longer distances in the
              city.
            </p>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
          >
            <h4
              className={`font-semibold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Ticket Options
            </h4>
            <div className="space-y-3">
              <div
                className={`p-3 rounded-lg ${isDark ? "bg-slate-600/50" : "bg-white"}`}
              >
                <p
                  className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Single Journey Ticket
                </p>
                <p
                  className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  Buy at station machines (2-7 RMB)
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${isDark ? "bg-slate-600/50" : "bg-white"}`}
              >
                <p
                  className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  QR Code
                </p>
                <p
                  className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  Use WeChat/Alipay metro mini-program
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${isDark ? "bg-slate-600/50" : "bg-white"}`}
              >
                <p
                  className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Transport Card
                </p>
                <p
                  className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  Get a reloadable card for convenience
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "train",
      title: "Train Travel",
      icon: Train,
      color: "from-red-500 to-red-600",
      content: (
        <div className="space-y-6">
          <div
            className={`p-5 rounded-xl ${isDark ? "bg-red-500/10 border border-red-500/30" : "bg-red-50 border border-red-200"}`}
          >
            <h4
              className={`font-semibold mb-3 ${isDark ? "text-red-300" : "text-red-700"}`}
            >
              High-Speed Rail (Gaotie)
            </h4>
            <p
              className={`text-sm ${isDark ? "text-red-200/80" : "text-red-600"}`}
            >
              China's high-speed rail network is fast, comfortable, and
              affordable. Zhengzhou is a major hub with connections to most
              major cities.
            </p>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
          >
            <h4
              className={`font-semibold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Booking Tickets
            </h4>
            <ul
              className={`text-sm space-y-2 ${isDark ? "text-slate-300" : "text-slate-600"}`}
            >
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500" />
                Use 12306 app (official) or Trip.com
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500" />
                Book in advance during holidays
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500" />
                Bring passport for ticket collection
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500" />
                Arrive 30 minutes before departure
              </li>
            </ul>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-amber-500/10 border border-amber-500/30" : "bg-amber-50 border border-amber-200"}`}
          >
            <h4
              className={`font-semibold mb-3 ${isDark ? "text-amber-300" : "text-amber-700"}`}
            >
              Nearby Stations
            </h4>
            <div className="space-y-2">
              <p
                className={`text-sm ${isDark ? "text-amber-200/80" : "text-amber-600"}`}
              >
                <strong>Zhengzhou East (郑州东站)</strong> - High-speed rail
              </p>
              <p
                className={`text-sm ${isDark ? "text-amber-200/80" : "text-amber-600"}`}
              >
                <strong>Zhengzhou Station (郑州站)</strong> - Regular trains
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "airport",
      title: "Airport Travel",
      icon: Plane,
      color: "from-cyan-500 to-cyan-600",
      content: (
        <div className="space-y-6">
          <div
            className={`p-5 rounded-xl ${isDark ? "bg-cyan-500/10 border border-cyan-500/30" : "bg-cyan-50 border border-cyan-200"}`}
          >
            <h4
              className={`font-semibold mb-3 ${isDark ? "text-cyan-300" : "text-cyan-700"}`}
            >
              Zhengzhou Xinzheng Airport
            </h4>
            <p
              className={`text-sm ${isDark ? "text-cyan-200/80" : "text-cyan-600"}`}
            >
              The main airport serving Zhengzhou. Located about 30km from the
              city center.
            </p>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
          >
            <h4
              className={`font-semibold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Getting to/from Airport
            </h4>
            <div className="space-y-3">
              <div
                className={`p-3 rounded-lg ${isDark ? "bg-slate-600/50" : "bg-white"}`}
              >
                <p
                  className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Airport Bus (机场大巴)
                </p>
                <p
                  className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  ~25 RMB, various city stops
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${isDark ? "bg-slate-600/50" : "bg-white"}`}
              >
                <p
                  className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Metro Line 2
                </p>
                <p
                  className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  Connects to airport terminal
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${isDark ? "bg-slate-600/50" : "bg-white"}`}
              >
                <p
                  className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Didi/Taxi
                </p>
                <p
                  className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  ~100-150 RMB from campus
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "bike",
      title: "Bike Sharing",
      icon: Bike,
      color: "from-green-500 to-green-600",
      content: (
        <div className="space-y-6">
          <div
            className={`p-5 rounded-xl ${isDark ? "bg-green-500/10 border border-green-500/30" : "bg-green-50 border border-green-200"}`}
          >
            <h4
              className={`font-semibold mb-3 ${isDark ? "text-green-300" : "text-green-700"}`}
            >
              Shared Bikes
            </h4>
            <p
              className={`text-sm ${isDark ? "text-green-200/80" : "text-green-600"}`}
            >
              Bike sharing is very popular in China. You'll see bikes everywhere
              from companies like Meituan (yellow), HelloBike (blue), and
              others.
            </p>
          </div>

          <div
            className={`p-5 rounded-xl ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}
          >
            <h4
              className={`font-semibold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              How to Use
            </h4>
            <ul
              className={`text-sm space-y-2 ${isDark ? "text-slate-300" : "text-slate-600"}`}
            >
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500" />
                Download app (Meituan, HelloBike, etc.)
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500" />
                Scan QR code on bike to unlock
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500" />
                Ride to destination
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500" />
                Lock bike and end ride in app
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500" />
                Usually 1-2 RMB per ride
              </li>
            </ul>
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-500/30 mb-4">
            <Car className="w-5 h-5 text-teal-400" />
            <span className="text-sm font-medium text-teal-400">
              Transportation
            </span>
          </div>
          <h1
            className={`text-3xl sm:text-4xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Getting Around Zhengzhou
          </h1>
          <p
            className={`text-lg ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            Complete guide to transportation options for international students
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

        <div
          className={`mt-12 rounded-2xl p-6 ${isDark ? "bg-amber-500/10 border border-amber-500/30" : "bg-amber-50 border border-amber-200"}`}
        >
          <div className="flex items-start gap-4">
            <AlertCircle
              className={`w-6 h-6 mt-0.5 ${isDark ? "text-amber-400" : "text-amber-600"}`}
            />
            <div>
              <h3
                className={`font-semibold mb-2 ${isDark ? "text-amber-300" : "text-amber-700"}`}
              >
                Important Tips
              </h3>
              <ul
                className={`text-sm space-y-1 ${isDark ? "text-amber-200/80" : "text-amber-600"}`}
              >
                <li>• Always carry your passport for train travel</li>
                <li>• Save your campus address in Chinese for taxis</li>
                <li>• Download offline maps before traveling</li>
                <li>• Keep small cash for emergencies</li>
                <li>• Ask classmates for help with transportation apps</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function TransportationPage() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ncwu-theme">
      <TransportationContent />
    </ThemeProvider>
  );
}
