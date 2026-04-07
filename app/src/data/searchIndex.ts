import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  BookOpen,
  GraduationCap,
  Globe,
  MessageCircle,
  Users,
  ShoppingCart,
  MapPin,
  AlertTriangle,
  Car,
  CreditCard,
  Smartphone,
  Bell,
  Sparkles,
  FileText,
  Languages,
  Building2,
  Zap,
  Cog,
  HelpCircle,
  Image,
  LogIn,
  UserPlus,
  User,
} from "lucide-react";

export interface SearchResult {
  title: string;
  description: string;
  path: string;
  category: string;
  icon: LucideIcon;
}

type Category = {
  name: string;
  icon: LucideIcon;
};

export const searchCategories: Category[] = [
  { name: "Schedules", icon: Calendar },
  { name: "Learning", icon: GraduationCap },
  { name: "Community", icon: Users },
  { name: "Resources", icon: BookOpen },
  { name: "AI Tools", icon: Sparkles },
  { name: "Account", icon: User },
];

export const searchIndex: SearchResult[] = [
  // Schedules
  {
    title: "CST Schedule",
    description:
      "Computer Science & Technology class schedules, resources, and academic information",
    path: "/cst/class-schedule",
    category: "Schedules",
    icon: Calendar,
  },
  {
    title: "Economics 2025 Schedule",
    description:
      "Economics department class timetables, exam schedules, and academic materials",
    path: "/economics-2025/class-schedule",
    category: "Schedules",
    icon: Calendar,
  },
  {
    title: "Civil Engineering 2023",
    description: "Civil Engineering 2023 class schedules, lab sessions, and department resources",
    path: "/civil-engineering-2023",
    category: "Schedules",
    icon: Calendar,
  },
  {
    title: "Civil Engineering 2024",
    description: "Civil Engineering 2024 class schedules, lab sessions, and department resources",
    path: "/civil-engineering-2024",
    category: "Schedules",
    icon: Calendar,
  },
  {
    title: "Civil Engineering 2025",
    description: "Civil Engineering 2025 class schedules, lab sessions, and department resources",
    path: "/civil-engineering-2025",
    category: "Schedules",
    icon: Calendar,
  },
  {
    title: "Electrical Engineering 2023",
    description:
      "Electrical Engineering 2023 class schedules, lab sessions, and department resources",
    path: "/electrical-engineering-2023",
    category: "Schedules",
    icon: Calendar,
  },
  {
    title: "Electrical Engineering 2024",
    description:
      "Electrical Engineering 2024 class schedules, lab sessions, and department resources",
    path: "/electrical-engineering-2024",
    category: "Schedules",
    icon: Calendar,
  },
  {
    title: "Electrical Engineering 2025",
    description:
      "Electrical Engineering 2025 class schedules, lab sessions, and department resources",
    path: "/electrical-engineering-2025",
    category: "Schedules",
    icon: Calendar,
  },
  {
    title: "Mechanical Engineering 2023",
    description:
      "Mechanical Engineering 2023 class schedules, lab sessions, and department resources",
    path: "/mechanical-engineering-2023",
    category: "Schedules",
    icon: Calendar,
  },
  {
    title: "Mechanical Engineering 2024",
    description:
      "Mechanical Engineering 2024 class schedules, lab sessions, and department resources",
    path: "/mechanical-engineering-2024",
    category: "Schedules",
    icon: Calendar,
  },
  {
    title: "Mechanical Engineering 2025",
    description:
      "Mechanical Engineering 2025 class schedules, lab sessions, and department resources",
    path: "/mechanical-engineering-2025",
    category: "Schedules",
    icon: Calendar,
  },

  // Learning
  {
    title: "HSK 2026",
    description: "HSK Chinese proficiency test preparation and vocabulary practice",
    path: "/hsk-2026",
    category: "Learning",
    icon: GraduationCap,
  },
  {
    title: "HSK Grammar",
    description: "Chinese grammar patterns, sentence structures, and grammar exercises",
    path: "/hsk/grammar",
    category: "Learning",
    icon: GraduationCap,
  },
  {
    title: "Language Exchange",
    description:
      "Practice languages with other international students through chat and exchange",
    path: "/language-exchange",
    category: "Learning",
    icon: Languages,
  },

  // Community
  {
    title: "Social Feed",
    description: "Connect with fellow international students, share posts and updates",
    path: "/social",
    category: "Community",
    icon: Users,
  },
  {
    title: "Discord",
    description: "Join the NCWU Discord community for real-time conversations",
    path: "/discord",
    category: "Community",
    icon: MessageCircle,
  },
  {
    title: "Market",
    description: "Buy, sell, and trade items within the NCWU international student community",
    path: "/market",
    category: "Community",
    icon: ShoppingCart,
  },
  {
    title: "Events",
    description: "Campus events, announcements, and upcoming activities",
    path: "/events",
    category: "Community",
    icon: Bell,
  },
  {
    title: "Photo Gallery",
    description: "Browse campus photos, events, and community memories",
    path: "/gallery",
    category: "Community",
    icon: Image,
  },

  // Resources
  {
    title: "Student Guides",
    description: "Essential guides and resources for international students at NCWU",
    path: "/student-guides",
    category: "Resources",
    icon: BookOpen,
  },
  {
    title: "Emergency Contacts",
    description: "Important emergency numbers, safety tips, and who to contact in crisis",
    path: "/emergency",
    category: "Resources",
    icon: AlertTriangle,
  },
  {
    title: "Campus Map",
    description: "Find your way around the NCWU campus with interactive maps",
    path: "/campus-map",
    category: "Resources",
    icon: MapPin,
  },
  {
    title: "Transportation",
    description: "Getting around Zhengzhou - buses, taxis, metro, and travel tips",
    path: "/transportation",
    category: "Resources",
    icon: Car,
  },
  {
    title: "Payment Guide",
    description: "WeChat Pay, Alipay, banking, and how to make payments in China",
    path: "/payment-guide",
    category: "Resources",
    icon: CreditCard,
  },
  {
    title: "Essential Apps",
    description: "Must-have apps for living and studying in China",
    path: "/apps-guide",
    category: "Resources",
    icon: Smartphone,
  },
  {
    title: "PDF Tools",
    description: "Convert, merge, split, and manage PDF documents online",
    path: "/pdf-tools",
    category: "Resources",
    icon: FileText,
  },
  {
    title: "Support",
    description: "Get help, FAQs, and contact support for any issues",
    path: "/support",
    category: "Resources",
    icon: HelpCircle,
  },

  // AI Tools
  {
    title: "Huashui AI (Xingyuan)",
    description:
      "AI-powered assistant for homework help, translations, and academic support",
    path: "/xingyuan-ai",
    category: "AI Tools",
    icon: Sparkles,
  },

  // Account
  {
    title: "Login",
    description: "Sign in to your NCWU International account",
    path: "/login",
    category: "Account",
    icon: LogIn,
  },
  {
    title: "Signup",
    description: "Create a new account to join the NCWU International community",
    path: "/signup",
    category: "Account",
    icon: UserPlus,
  },
  {
    title: "Profile",
    description: "View and manage your profile settings and preferences",
    path: "/profile",
    category: "Account",
    icon: User,
  },
];
