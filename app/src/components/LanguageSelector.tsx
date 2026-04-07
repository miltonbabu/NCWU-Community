import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check, ChevronDown } from "lucide-react";

const languages = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇵🇰" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
];

interface LanguageSelectorProps {
  isDark?: boolean;
}

export function LanguageSelector({ isDark = false }: LanguageSelectorProps) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 ${
          isDark
            ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
            : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm"
        }`}
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">
          {currentLanguage.nativeName}
        </span>
        <span className="text-lg">{currentLanguage.flag}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full right-0 mt-2 min-w-[200px] rounded-xl overflow-hidden shadow-xl z-50 ${
            isDark
              ? "bg-slate-800 border border-slate-700"
              : "bg-white border border-slate-200"
          }`}
        >
          <div
            className={`px-3 py-2 border-b ${isDark ? "border-slate-700" : "border-slate-100"}`}
          >
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Select Language
            </span>
          </div>
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${
                  i18n.language === lang.code
                    ? isDark
                      ? "bg-red-500/20 text-red-300"
                      : "bg-red-50 text-red-600"
                    : isDark
                      ? "hover:bg-slate-700 text-slate-300"
                      : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                    isDark ? "bg-slate-700" : "bg-slate-100"
                  }`}
                >
                  {lang.flag}
                </span>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">{lang.nativeName}</div>
                  <div
                    className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    {lang.name}
                  </div>
                </div>
                {i18n.language === lang.code && (
                  <Check
                    className={`w-4 h-4 ${isDark ? "text-red-400" : "text-red-500"}`}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
