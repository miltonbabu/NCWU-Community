import { useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import {
  Phone,
  Shield,
  AlertTriangle,
  Building,
  Heart,
  Car,
  Flame,
  MapPin,
  Clock,
} from "lucide-react";

interface EmergencyContact {
  name: string;
  number: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

interface Embassy {
  country: string;
  flag: string;
  phone: string;
  address: string;
}

function EmergencyContent() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    document.title = "Emergency Contacts - NCWU International";
  }, []);

  const emergencyContacts: EmergencyContact[] = [
    {
      name: "Police",
      number: "110",
      icon: Shield,
      color: "from-blue-500 to-blue-600",
      description: "For emergencies, crimes, and security issues",
    },
    {
      name: "Ambulance",
      number: "120",
      icon: Heart,
      color: "from-red-500 to-red-600",
      description: "Medical emergencies and ambulance service",
    },
    {
      name: "Fire Department",
      number: "119",
      icon: Flame,
      color: "from-orange-500 to-orange-600",
      description: "Fire emergencies and rescue services",
    },
    {
      name: "Traffic Police",
      number: "122",
      icon: Car,
      color: "from-yellow-500 to-yellow-600",
      description: "Traffic accidents and road emergencies",
    },
  ];

  const campusContacts = [
    {
      name: "Campus Security",
      phone: "Contact via dormitory manager",
      hours: "24/7",
      location: "Main Gate",
    },
    {
      name: "International Office",
      phone: "Contact via WeChat group",
      hours: "Mon-Fri, 8:00-17:00",
      location: "Administrative Building",
    },
    {
      name: "Campus Hospital",
      phone: "On-site visit",
      hours: "Mon-Fri, 8:00-17:00",
      location: "Near 2nd Canteen",
    },
    {
      name: "Dormitory Manager",
      phone: "Contact building manager",
      hours: "24/7",
      location: "Each dormitory building",
    },
  ];

  const embassies: Embassy[] = [
    {
      country: "Pakistan",
      flag: "🇵🇰",
      phone: "+86-371-6568-0000",
      address: "Contact for Pakistani students",
    },
    {
      country: "Nigeria",
      flag: "🇳🇬",
      phone: "+86-10-6532-4614",
      address: "Beijing Embassy",
    },
    {
      country: "Bangladesh",
      flag: "🇧🇩",
      phone: "+86-10-6532-2584",
      address: "Beijing Embassy",
    },
    {
      country: "India",
      flag: "🇮🇳",
      phone: "+86-10-6532-1908",
      address: "Beijing Embassy",
    },
    {
      country: "Morocco",
      flag: "🇲🇦",
      phone: "+86-10-6532-1496",
      address: "Beijing Embassy",
    },
    {
      country: "Russia",
      flag: "🇷🇺",
      phone: "+86-10-6532-1381",
      address: "Beijing Embassy",
    },
  ];

  const safetyTips = [
    {
      title: "Keep Important Numbers Saved",
      description: "Save all emergency numbers in your phone contacts",
    },
    {
      title: "Know Your Address in Chinese",
      description: "Keep your dormitory address written in Chinese for emergencies",
    },
    {
      title: "Use Campus Security",
      description: "Report any suspicious activity to campus security immediately",
    },
    {
      title: "Travel in Groups at Night",
      description: "Avoid walking alone at night, especially in unfamiliar areas",
    },
    {
      title: "Keep Documents Safe",
      description: "Make copies of your passport, visa, and important documents",
    },
    {
      title: "Stay Connected",
      description: "Keep your phone charged and maintain communication with friends",
    },
  ];

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${isDark ? "from-slate-900 via-slate-800 to-slate-900" : "from-slate-50 via-white to-slate-50"}`}
    >
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-sm font-medium text-red-400">
              Emergency Contacts
            </span>
          </div>
          <h1
            className={`text-3xl sm:text-4xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Stay Safe at NCWU
          </h1>
          <p
            className={`text-lg ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            Important emergency numbers and safety information for international
            students
          </p>
        </div>

        <div className="mb-12">
          <h2
            className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            🚨 Emergency Numbers (China)
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {emergencyContacts.map((contact, index) => {
              const Icon = contact.icon;
              return (
                <a
                  key={index}
                  href={`tel:${contact.number}`}
                  className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-105 bg-gradient-to-br ${contact.color} text-white shadow-lg`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">{contact.name}</h3>
                    <p className="text-4xl font-bold mb-2">{contact.number}</p>
                    <p className="text-sm text-white/80">{contact.description}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        <div className="mb-12">
          <h2
            className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            🏫 Campus Contacts
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {campusContacts.map((contact, index) => (
              <div
                key={index}
                className={`rounded-2xl p-6 ${isDark ? "bg-slate-800/50 border border-slate-700" : "bg-white border border-slate-200 shadow-sm"}`}
              >
                <h3
                  className={`text-lg font-semibold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {contact.name}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone
                      className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    />
                    <span
                      className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                    >
                      {contact.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock
                      className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    />
                    <span
                      className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                    >
                      {contact.hours}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin
                      className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    />
                    <span
                      className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                    >
                      {contact.location}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <h2
            className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            🌍 Embassy Contacts
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {embassies.map((embassy, index) => (
              <div
                key={index}
                className={`rounded-2xl p-5 ${isDark ? "bg-slate-800/50 border border-slate-700" : "bg-white border border-slate-200 shadow-sm"}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{embassy.flag}</span>
                  <h3
                    className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {embassy.country}
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone
                      className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    />
                    <a
                      href={`tel:${embassy.phone}`}
                      className={`text-sm ${isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
                    >
                      {embassy.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building
                      className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    />
                    <span
                      className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                    >
                      {embassy.address}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <h2
            className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            💡 Safety Tips
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {safetyTips.map((tip, index) => (
              <div
                key={index}
                className={`rounded-2xl p-5 ${isDark ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-emerald-50 border border-emerald-200"}`}
              >
                <div className="flex items-start gap-3">
                  <Shield
                    className={`w-5 h-5 mt-0.5 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                  />
                  <div>
                    <h3
                      className={`font-semibold mb-1 ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                    >
                      {tip.title}
                    </h3>
                    <p
                      className={`text-sm ${isDark ? "text-emerald-200/80" : "text-emerald-600"}`}
                    >
                      {tip.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className={`rounded-2xl p-6 ${isDark ? "bg-amber-500/10 border border-amber-500/30" : "bg-amber-50 border border-amber-200"}`}
        >
          <div className="flex items-start gap-4">
            <AlertTriangle
              className={`w-6 h-6 mt-0.5 ${isDark ? "text-amber-400" : "text-amber-600"}`}
            />
            <div>
              <h3
                className={`font-semibold mb-2 ${isDark ? "text-amber-300" : "text-amber-700"}`}
              >
                Important Note
              </h3>
              <p
                className={`text-sm ${isDark ? "text-amber-200/80" : "text-amber-600"}`}
              >
                In case of emergency, stay calm and call the appropriate number.
                If you cannot communicate in Chinese, ask a Chinese friend or
                dormitory manager to help you. Keep this page bookmarked for
                quick access.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function EmergencyPage() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ncwu-theme">
      <EmergencyContent />
    </ThemeProvider>
  );
}
