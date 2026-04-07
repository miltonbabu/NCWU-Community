import { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "./ThemeProvider";
import {
  Shield,
  FileText,
  AlertTriangle,
  ExternalLink,
  Heart,
  ChevronDown,
  ChevronUp,
  Mail,
  Globe,
} from "lucide-react";
import ncwuLogo from "@/assets/ncwu-logo.png";

interface FooterLink {
  label: string;
  href?: string;
  to?: string;
  external?: boolean;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

export function Footer() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [showRules, setShowRules] = useState(false);

  const footerSections: FooterSection[] = [
    {
      title: "Quick Links",
      links: [
        { label: "Home", to: "/" },
        { label: "CST Department", to: "/cst" },
        { label: "Economics", to: "/economics-2025" },
        { label: "HSK Learning", to: "/hsk" },
        { label: "Student Guides", to: "/student-guides" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Class Schedules", to: "/cst/class-schedule" },
        { label: "Campus Map", to: "/campus-map" },
        { label: "Transportation", to: "/transportation" },
        { label: "Payment Guide", to: "/payment-guide" },
      ],
    },
    {
      title: "Community",
      links: [
        { label: "Social Feed", to: "/social" },
        { label: "Discord", to: "/discord" },
        { label: "Events", to: "/events" },
        { label: "Market", to: "/market" },
        { label: "Emergency", to: "/emergency" },
        { label: "Support Us \u2764\uFE0F", to: "/support" },
      ],
    },
  ];

  const rules = [
    {
      title: "Academic Integrity",
      description:
        "All content must adhere to NCWU's academic integrity policies. Plagiarism and cheating are prohibited.",
    },
    {
      title: "Respectful Communication",
      description:
        "Maintain respectful communication. Harassment or offensive language will not be tolerated.",
    },
    {
      title: "Data Privacy",
      description:
        "Do not share sensitive personal data, passwords, or financial information.",
    },
    {
      title: "Content Usage",
      description:
        "Content is for educational purposes only. Commercial use without authorization is prohibited.",
    },
  ];

  return (
    <footer
      className={`relative z-10 border-t ${
        isDark
          ? "border-red-500/20 bg-slate-950"
          : "border-amber-200 bg-amber-50/30"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Compact Disclaimer */}
        <div
          className={`py-3 px-3 rounded-lg my-4 ${
            isDark
              ? "bg-amber-500/10 border border-amber-500/20"
              : "bg-amber-100 border border-amber-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={`w-4 h-4 flex-shrink-0 ${
                isDark ? "text-amber-400" : "text-amber-600"
              }`}
            />
            <p
              className={`text-xs ${
                isDark ? "text-amber-300/80" : "text-amber-700"
              }`}
            >
              <strong>Unofficial</strong> student community website — not
              affiliated with NCWU.
              <a
                href="http://www.ncwu.edu.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className={`underline font-medium ml-1 ${
                  isDark
                    ? "text-amber-400 hover:text-amber-300"
                    : "text-amber-600 hover:text-amber-800"
                }`}
              >
                Official NCWU site
                <ExternalLink className="w-3 h-3 inline ml-0.5" />
              </a>
            </p>
          </div>
        </div>

        {/* Compact Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-4">
          {/* Logo & Description */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <img
                src={ncwuLogo}
                alt="NCWU Logo"
                className="w-8 h-8 rounded-lg object-contain"
              />
              <div>
                <h3
                  className={`font-bold text-sm ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  NCWU International
                </h3>
              </div>
            </div>
            <p
              className={`text-xs mb-3 ${
                isDark ? "text-white/60" : "text-slate-600"
              }`}
            >
              A community platform for international students at NCWU.
            </p>
            <div className="flex items-center gap-2">
              <a
                href="mailto:ncwu.intl@gmail.com"
                className={`p-1.5 rounded-md transition-all ${
                  isDark
                    ? "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900"
                }`}
                title="Email us"
              >
                <Mail className="w-3.5 h-3.5" />
              </a>
              <a
                href="http://www.ncwu.edu.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className={`p-1.5 rounded-md transition-all ${
                  isDark
                    ? "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900"
                }`}
                title="Official NCWU Website"
              >
                <Globe className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h4
                className={`font-semibold text-sm mb-2 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {section.title}
              </h4>
              <ul className="space-y-1">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link
                        to={link.to}
                        className={`text-xs transition-colors ${
                          isDark
                            ? "text-white/60 hover:text-white"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noopener noreferrer" : undefined}
                        className={`text-xs transition-colors inline-flex items-center gap-1 ${
                          isDark
                            ? "text-white/60 hover:text-white"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {link.label}
                        {link.external && <ExternalLink className="w-3 h-3" />}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Compact Rules Section */}
        <div
          className={`border-t ${
            isDark ? "border-white/10" : "border-slate-200"
          }`}
        >
          <button
            onClick={() => setShowRules(!showRules)}
            className={`w-full flex items-center justify-between py-3 px-2 transition-all ${
              isDark ? "hover:bg-white/5" : "hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield
                className={`w-4 h-4 ${
                  isDark ? "text-emerald-400" : "text-emerald-600"
                }`}
              />
              <span
                className={`font-medium text-sm ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Community Rules
              </span>
            </div>
            {showRules ? (
              <ChevronUp
                className={`w-4 h-4 ${
                  isDark ? "text-white/40" : "text-slate-400"
                }`}
              />
            ) : (
              <ChevronDown
                className={`w-4 h-4 ${
                  isDark ? "text-white/40" : "text-slate-400"
                }`}
              />
            )}
          </button>

          {showRules && (
            <div
              className={`pb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 ${
                isDark ? "" : ""
              }`}
            >
              {rules.map((rule, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-lg ${
                    isDark
                      ? "bg-white/5 border border-white/10"
                      : "bg-slate-50 border border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <FileText
                      className={`w-3 h-3 ${
                        isDark ? "text-emerald-400" : "text-emerald-600"
                      }`}
                    />
                    <h5
                      className={`font-medium text-xs ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {rule.title}
                    </h5>
                  </div>
                  <p
                    className={`text-xs leading-relaxed ${
                      isDark ? "text-white/60" : "text-slate-600"
                    }`}
                  >
                    {rule.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compact Copyright */}
        <div
          className={`py-3 border-t ${
            isDark ? "border-white/10" : "border-slate-200"
          }`}
        >
          <p
            className={`text-xs text-center ${
              isDark ? "text-white/50" : "text-slate-500"
            }`}
          >
            © {new Date().getFullYear()} NCWU International Student Community.
            Made with <Heart className="w-3 h-3 inline text-red-500" /> by
            students.
          </p>
        </div>
      </div>
    </footer>
  );
}
