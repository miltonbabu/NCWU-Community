import { useTheme } from "@/components/ThemeProvider";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  Heart,
  Server,
  Globe,
  Shield,
  Coffee,
  GraduationCap,
  ArrowRightLeft,
  Bot,
  Users,
  BookOpen,
  Gift,
  Sparkles,
  ExternalLink,
  Home,
  MessageCircle,
  ShoppingBag,
  Database,
  Share2,
  Bug,
  QrCode,
  Download,
  X,
  Link2,
  Check,
  Copy,
} from "lucide-react";

export default function SupportPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { t } = useTranslation();
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  useEffect(() => {
    if (selectedAmount !== null) {
      setTimeout(() => {
        document
          .getElementById("payment-methods")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [selectedAmount]);

  const features = [
    {
      icon: ArrowRightLeft,
      title: t("support.featPdf", "PDF Converter"),
      desc: t(
        "support.featPdfDesc",
        "Convert PDF to DOCX, PNG, JPG — free, unlimited, no sign-up needed.",
      ),
    },
    {
      icon: Bot,
      title: t("support.featAi", "AI Assistant"),
      desc: t(
        "support.featAiDesc",
        "Smart AI chatbot to help with studies and daily questions.",
      ),
    },
    {
      icon: Users,
      title: t("support.featSocial", "Social Feed"),
      desc: t(
        "support.featSocialDesc",
        "Connect, share photos, and build community together.",
      ),
    },
    {
      icon: BookOpen,
      title: t("support.featHsk", "HSK Learning"),
      desc: t(
        "support.featHskDesc",
        "Complete HSK grammar database and learning resources.",
      ),
    },
    {
      icon: MessageCircle,
      title: t("support.featDiscord", "Discord Hub"),
      desc: t(
        "support.featDiscordDesc",
        "Real-time chat and language exchange platform.",
      ),
    },
    {
      icon: ShoppingBag,
      title: t("support.featMarket", "Student Market"),
      desc: t(
        "support.featMarketDesc",
        "Buy, sell, and trade items within the community.",
      ),
    },
  ];

  const costs = [
    {
      icon: Globe,
      label: t("support.costDomain", "Domain Name"),
      price: t("support.costDomainPrice", "~$10-15 / year"),
      detail: t(
        "support.costDomainDetail",
        "Custom domain for professional access (ncwu-intl.com or similar)",
      ),
    },
    {
      icon: Server,
      label: t("support.costHosting", "Server Hosting"),
      price: t("support.costHostingPrice", "~$5-20 / month"),
      detail: t(
        "support.costHostingDetail",
        "Backend server for API, auth, database, real-time features (Socket.io)",
      ),
    },
    {
      icon: Shield,
      label: t("support.costSecurity", "SSL & Security"),
      price: t("support.costSecurityPrice", "~$5-10 / month"),
      detail: t(
        "support.costSecurityDetail",
        "HTTPS certificate, DDoS protection, firewall, backups",
      ),
    },
    {
      icon: Database,
      label: t("support.costDatabase", "Database & Storage"),
      price: t("support.costDatabasePrice", "~$5-15 / month"),
      detail: t(
        "support.costDatabaseDetail",
        "PostgreSQL/MongoDB, file storage for images, PDFs, user data",
      ),
    },
  ];

  return (
    <div className={`min-h-screen ${isDark ? "" : "bg-slate-50"}`}>
      <nav
        className={
          "sticky top-0 z-50 border-b backdrop-blur-md " +
          (isDark
            ? "bg-slate-900/90 border-slate-700"
            : "bg-white/90 border-slate-200")
        }
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 h-12 overflow-x-auto no-scrollbar">
            {[
              { icon: Home, label: t("nav.home", "Home"), to: "/" },
              { icon: Bot, label: t("nav.ai", "AI"), to: "/xingyuan-ai" },
              { icon: Users, label: t("nav.social", "Social"), to: "/social" },
              {
                icon: MessageCircle,
                label: t("nav.discord", "Discord"),
                to: "/discord",
              },
              {
                icon: BookOpen,
                label: t("nav.hsk2026", "HSK 2026"),
                to: "/hsk-2026",
              },
              {
                icon: Heart,
                label: t("nav.support", "Support Us"),
                to: "/support",
              },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all " +
                  (item.to === "/support"
                    ? isDark
                      ? "bg-red-500/20 text-red-400"
                      : "bg-red-100 text-red-600"
                    : isDark
                      ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div
            className={
              "inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 " +
              (isDark
                ? "bg-gradient-to-br from-pink-500/20 to-red-500/20"
                : "bg-gradient-to-br from-pink-50 to-red-50")
            }
          >
            <Heart
              className={`w-8 h-8 ${isDark ? "text-pink-400" : "text-pink-500"}`}
            />
          </div>
          <h1
            className={`text-3xl sm:text-4xl font-bold mb-3 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            {t("support.title", "Support This Project")}
          </h1>
          <p
            className={`text-lg max-w-2xl mx-auto ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
          >
            {t(
              "support.subtitle",
              "This website is built by students, for students — completely free. Help us keep it alive!",
            )}
          </p>
        </div>

        <div
          className={
            "rounded-2xl p-6 sm:p-8 mb-12 border " +
            (isDark
              ? "bg-gradient-to-br from-emerald-900/30 via-teal-900/20 to-cyan-900/10 border-emerald-700/30"
              : "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-emerald-200")
          }
        >
          <h2
            className={`text-xl font-bold mb-3 text-center ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            {t("support.whyTitle", "Why Your Support Matters")}
          </h2>
          <p
            className={`text-base text-center max-w-2xl mx-auto mb-8 leading-relaxed ${
              isDark ? "text-emerald-200/80" : "text-emerald-800/80"
            }`}
          >
            {t(
              "support.whyDesc",
              "Every feature on this website — PDF converter, AI assistant, HSK learning tools, social feed, Discord integration, marketplace — is 100% free for all international students at NCWU. We don't show ads, we don't charge subscriptions, and we don't force sign-ups. But running a website isn't free. We pay for domain names, hosting servers, databases, security certificates, and more — every single month out of our own pockets as students. If this platform has helped you in any way, consider supporting us so we can keep improving it for everyone.",
            )}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className={
                  "p-4 rounded-xl border transition-all hover:scale-[1.02] " +
                  (isDark
                    ? "bg-white/5 border-white/10 hover:border-emerald-500/30"
                    : "bg-white border-slate-200 hover:border-emerald-300 shadow-sm")
                }
              >
                <f.icon
                  className={
                    "w-5 h-5 mb-2 " +
                    (isDark ? "text-emerald-400" : "text-emerald-600")
                  }
                />
                <h3
                  className={`font-semibold text-sm mb-1 ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {f.title}
                </h3>
                <p
                  className={`text-xs leading-relaxed ${
                    isDark ? "text-white/60" : "text-slate-500"
                  }`}
                >
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <h2
            className={`text-2xl font-bold mb-6 text-center ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            {t("support.costsTitle", "What It Costs to Keep This Running")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {costs.map((c) => (
              <div
                key={c.label}
                className={
                  "p-5 rounded-xl border " +
                  (isDark
                    ? "bg-slate-800/50 border-slate-700"
                    : "bg-white border-slate-200 shadow-sm")
                }
              >
                <div className="flex items-start gap-3">
                  <div
                    className={
                      "p-2 rounded-lg flex-shrink-0 " +
                      (isDark
                        ? "bg-blue-500/10 text-blue-400"
                        : "bg-blue-50 text-blue-600")
                    }
                  >
                    <c.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={`font-semibold text-sm ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {c.label}
                      </h3>
                      <span
                        className={
                          "text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 " +
                          (isDark
                            ? "bg-orange-500/20 text-orange-400"
                            : "bg-orange-100 text-orange-600")
                        }
                      >
                        {c.price}
                      </span>
                    </div>
                    <p
                      className={`text-xs mt-1 ${
                        isDark ? "text-white/50" : "text-slate-500"
                      }`}
                    >
                      {c.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className={
            "rounded-2xl p-8 mb-12 text-center border " +
            (isDark
              ? "bg-gradient-to-r from-pink-900/30 via-purple-900/20 to-indigo-900/20 border-pink-700/30"
              : "bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50 border-pink-200")
          }
        >
          <Gift
            className={
              "w-12 h-12 mx-auto mb-4 " +
              (isDark ? "text-pink-400" : "text-pink-500")
            }
          />
          <h2
            className={`text-2xl font-bold mb-3 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            {t("support.donateTitle", "How You Can Help")}
          </h2>
          <p
            className={`text-sm max-w-xl mx-auto mb-8 ${
              isDark ? "text-white/60" : "text-slate-500"
            }`}
          >
            {t(
              "support.donateDesc",
              "Even a small contribution goes a long way. Every yuan helps cover hosting costs and keeps all features free for every student. Choose an amount that works for you — no pressure, ever.",
            )}
          </p>

          <p
            className={`text-sm mb-4 flex items-center justify-center gap-2 ${
              isDark ? "text-pink-300/80" : "text-pink-600"
            }`}
          >
            <span className="inline-block animate-bounce">👆</span>
            {t(
              "support.selectAmountHint",
              "Click an amount below to reveal payment QR codes",
            )}
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {[5, 10, 15, 20, 30, 50].map((amt) => (
              <button
                key={amt}
                onClick={() => setSelectedAmount(amt)}
                className={
                  "px-7 py-2.5 rounded-xl text-sm font-semibold transition-all border " +
                  (selectedAmount === amt
                    ? isDark
                      ? "border-pink-400 bg-pink-500/30 text-pink-200 shadow-md scale-[1.05]"
                      : "border-pink-500 bg-pink-100 text-pink-700 shadow-md scale-[1.05]"
                    : isDark
                      ? "border-pink-500/30 bg-pink-500/10 text-pink-300 hover:bg-pink-500/20 hover:border-pink-500/50"
                      : "border-pink-200 bg-white text-pink-600 hover:bg-pink-50 hover:border-pink-300 shadow-sm")
                }
              >
                <span className="mr-0.5">¥</span>
                {amt}
              </button>
            ))}
          </div>
          <div className="flex justify-center gap-3 mb-6">
            <button
              onClick={() => setSelectedAmount(-1)}
              className={
                "px-7 py-2.5 rounded-xl text-sm font-semibold transition-all border " +
                (selectedAmount === -1
                  ? isDark
                    ? "border-pink-400 bg-pink-500/30 text-pink-200 shadow-md scale-[1.05]"
                    : "border-pink-500 bg-pink-100 text-pink-700 shadow-md scale-[1.05]"
                  : isDark
                    ? "border-pink-500/30 bg-pink-500/10 text-pink-300 hover:bg-pink-500/20 hover:border-pink-500/50"
                    : "border-pink-200 bg-white text-pink-600 hover:bg-pink-50 hover:border-pink-300 shadow-sm")
              }
            >
              <span className="mr-0.5">¥</span>
              {t("support.customBtn", "Custom")}
            </button>
          </div>

          {selectedAmount === -1 && (
            <div className="flex justify-center mb-6">
              <div className="relative">
                <span
                  className={
                    "absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold " +
                    (isDark ? "text-pink-300" : "text-pink-600")
                  }
                >
                  ¥
                </span>
                <input
                  type="number"
                  min="1"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder={t("support.customPlaceholder", "Enter amount")}
                  className={
                    "w-48 pl-8 pr-4 py-2.5 rounded-xl text-sm font-semibold text-center border-2 transition-all outline-none " +
                    (isDark
                      ? "bg-pink-500/10 border-pink-500/50 text-pink-200 placeholder-pink-400/50 focus:border-pink-400 focus:bg-pink-500/20"
                      : "bg-white border-pink-300 text-pink-700 placeholder-pink-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-200")
                  }
                />
              </div>
            </div>
          )}

          {selectedAmount !== null && (
            <div
              id="payment-methods"
              className={
                "mt-8 rounded-2xl p-6 sm:p-8 border " +
                (isDark
                  ? "bg-gradient-to-br from-blue-900/20 via-green-900/15 to-cyan-900/10 border-blue-700/30"
                  : "bg-gradient-to-br from-blue-50 via-green-50 to-cyan-50 border-blue-200")
              }
            >
              <h3
                className={`text-lg font-bold mb-4 text-center ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {t("support.paymentTitle", "支付方式 / Payment Methods")}
              </h3>
              <p
                className={`text-xs text-center mb-6 max-w-md mx-auto ${
                  isDark ? "text-white/50" : "text-slate-500"
                }`}
              >
                {t(
                  "support.paymentDesc",
                  "Scan the QR code with Alipay or WeChat to donate directly. Every yuan helps keep this platform free for all students.",
                )}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div
                  className={
                    "p-5 rounded-xl border text-center " +
                    (isDark
                      ? "bg-white/5 border-blue-500/30"
                      : "bg-white border-blue-200 shadow-sm")
                  }
                >
                  <div
                    className={
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-3 " +
                      (isDark
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-blue-100 text-blue-600")
                    }
                  >
                    <span className="text-sm">支付宝</span> Alipay
                  </div>
                  <div
                    className={
                      "w-56 h-56 mx-auto rounded-xl flex items-center justify-center border-2 border-dashed mb-3 " +
                      (isDark
                        ? "border-blue-500/30 bg-blue-500/5"
                        : "border-blue-300 bg-blue-50")
                    }
                  >
                    {selectedAmount !== null ? (
                      <img
                        src="/alipay-custom.png"
                        alt="Alipay QR Code"
                        loading="lazy"
                        decoding="async"
                        className="w-52 h-52 object-contain rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="text-center">
                        <QrCode
                          className={
                            "w-14 h-14 mx-auto mb-1 " +
                            (isDark ? "text-blue-400" : "text-blue-500")
                          }
                        />
                        <p
                          className={`text-xs mt-1 ${
                            isDark ? "text-blue-400/60" : "text-blue-500/70"
                          }`}
                        >
                          {t(
                            "support.alipayPlaceholder",
                            "Select amount above",
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                  <p
                    className={`text-xs ${
                      isDark ? "text-white/40" : "text-slate-400"
                    }`}
                  >
                    {selectedAmount !== null
                      ? t(
                          "support.alipayHint",
                          "Open Alipay \u2192 Scan \u2192 Pay ¥{{amount}}",
                          {
                            amount:
                              selectedAmount === -1
                                ? customAmount || "Custom"
                                : selectedAmount,
                          },
                        )
                      : t(
                          "support.alipayHint",
                          "Select an amount above \u2192",
                        )}
                  </p>
                  {selectedAmount !== null && (
                    <a
                      href="/alipay-custom.png"
                      download
                      className={
                        "inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-lg text-xs font-semibold transition-all " +
                        (isDark
                          ? "bg-blue-500/15 text-blue-300 hover:bg-blue-500/25 border border-blue-500/30"
                          : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200")
                      }
                    >
                      <Download className="w-3.5 h-3.5" />
                      {t("support.downloadQr", "Save QR Code")}
                    </a>
                  )}
                </div>

                <div
                  className={
                    "p-5 rounded-xl border text-center " +
                    (isDark
                      ? "bg-white/5 border-green-500/30"
                      : "bg-white border-green-200 shadow-sm")
                  }
                >
                  <div
                    className={
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-3 " +
                      (isDark
                        ? "bg-green-500/20 text-green-400"
                        : "bg-green-100 text-green-600")
                    }
                  >
                    <span className="text-sm">微信支付</span> WeChat Pay
                  </div>
                  <div
                    className={
                      "w-56 h-56 mx-auto rounded-xl flex items-center justify-center border-2 border-dashed mb-3 " +
                      (isDark
                        ? "border-green-500/30 bg-green-500/5"
                        : "border-green-300 bg-green-50")
                    }
                  >
                    {selectedAmount !== null ? (
                      <img
                        src="/wechat payments.png"
                        alt="WeChat Pay QR Code"
                        loading="lazy"
                        decoding="async"
                        className="w-52 h-52 object-contain rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="text-center">
                        <MessageCircle
                          className={
                            "w-14 h-14 mx-auto mb-1 " +
                            (isDark ? "text-green-400" : "text-green-500")
                          }
                        />
                        <p
                          className={`text-xs mt-1 ${
                            isDark ? "text-green-400/60" : "text-green-500/70"
                          }`}
                        >
                          {t("support.wechatPlaceholder", "WeChat QR Code")}
                        </p>
                      </div>
                    )}
                  </div>
                  <p
                    className={`text-xs ${
                      isDark ? "text-white/40" : "text-slate-400"
                    }`}
                  >
                    {selectedAmount !== null
                      ? t(
                          "support.wechatHint",
                          "Open WeChat \u2192 + \u2192 Scan \u2192 Pay ¥{{amount}}",
                          {
                            amount:
                              selectedAmount === -1 ? "Custom" : selectedAmount,
                          },
                        )
                      : t(
                          "support.wechatHint",
                          "Select an amount above \u2192",
                        )}
                  </p>
                  {selectedAmount !== null && (
                    <a
                      href="/wechat payments.png"
                      download
                      className={
                        "inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-lg text-xs font-semibold transition-all " +
                        (isDark
                          ? "bg-green-500/15 text-green-300 hover:bg-green-500/25 border border-green-500/30"
                          : "bg-green-50 text-green-600 hover:bg-green-100 border border-green-200")
                      }
                    >
                      <Download className="w-3.5 h-3.5" />
                      {t("support.downloadQr", "Save QR Code")}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className={
            "rounded-2xl p-6 sm:p-8 border " +
            (isDark
              ? "bg-slate-800/50 border-slate-700"
              : "bg-white border-slate-200 shadow-sm")
          }
        >
          <h2
            className={`text-xl font-bold mb-4 text-center ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            {t("support.otherWays", "Other Ways to Support")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setShowSharePopup(true)}
              className={
                "p-4 rounded-xl text-center cursor-pointer transition-all hover:scale-[1.02] border-2 " +
                (isDark
                  ? "bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/50 hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                  : "bg-gradient-to-br from-blue-50 to-purple-50 border-blue-300 hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.25)]")
              }
            >
              <Share2
                className={
                  "w-6 h-6 mx-auto mb-2 " +
                  (isDark ? "text-blue-400" : "text-blue-500")
                }
              />
              <h3
                className={`font-semibold text-sm mb-1 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {t("support.shareTitle", "Share This Site")}
              </h3>
              <p
                className={`text-xs ${
                  isDark ? "text-white/50" : "text-slate-500"
                }`}
              >
                {t(
                  "support.shareDesc",
                  "Tell classmates about these free tools. Word of mouth is the best promotion!",
                )}
              </p>
            </button>
            <div
              className={
                "p-4 rounded-xl text-center " +
                (isDark ? "bg-white/5" : "bg-slate-50")
              }
            >
              <Bug
                className={
                  "w-6 h-6 mx-auto mb-2 " +
                  (isDark ? "text-blue-400" : "text-blue-500")
                }
              />
              <h3
                className={`font-semibold text-sm mb-1 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {t("support.reportTitle", "Report Bugs")}
              </h3>
              <p
                className={`text-xs ${
                  isDark ? "text-white/50" : "text-slate-500"
                }`}
              >
                {t(
                  "support.reportDesc",
                  "Found a glitch? Let us know so we can fix it and make things better.",
                )}
              </p>
            </div>
            <div
              className={
                "p-4 rounded-xl text-center " +
                (isDark ? "bg-white/5" : "bg-slate-50")
              }
            >
              <Coffee
                className={
                  "w-6 h-6 mx-auto mb-2 " +
                  (isDark ? "text-blue-400" : "text-blue-500")
                }
              />
              <h3
                className={`font-semibold text-sm mb-1 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {t("support.coffeeTitle", "Buy Us a Coffee")}
              </h3>
              <p
                className={`text-xs ${
                  isDark ? "text-white/50" : "text-slate-500"
                }`}
              >
                {t(
                  "support.coffeeDesc",
                  "A small treat keeps us coding late into the night building new features.",
                )}
              </p>
            </div>
          </div>
        </div>

        {showSharePopup && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSharePopup(false)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
              className={
                "relative w-full max-w-sm rounded-2xl p-6 border shadow-xl " +
                (isDark
                  ? "bg-slate-800 border-slate-700"
                  : "bg-white border-slate-200")
              }
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowSharePopup(false)}
                className={
                  "absolute top-3 right-3 p-1.5 rounded-lg transition-colors " +
                  (isDark
                    ? "text-white/60 hover:text-white hover:bg-white/10"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100")
                }
              >
                <X className="w-5 h-5" />
              </button>
              <h3
                className={`text-lg font-bold mb-4 text-center ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {t("support.sharePopupTitle", "Share This Site")}
              </h3>
              <div className="flex justify-center gap-3 mb-5">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("Check out NCWU International Community - Free tools for students!")}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    "p-3 rounded-xl transition-all hover:scale-110 " +
                    (isDark
                      ? "bg-sky-500/20 text-sky-400 hover:bg-sky-500/30"
                      : "bg-sky-100 text-sky-600 hover:bg-sky-200")
                  }
                >
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    "p-3 rounded-xl transition-all hover:scale-110 " +
                    (isDark
                      ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                      : "bg-blue-100 text-blue-600 hover:bg-blue-200")
                  }
                >
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent("Check out NCWU International Community - Free tools for students! " + shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    "p-3 rounded-xl transition-all hover:scale-110 " +
                    (isDark
                      ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      : "bg-green-100 text-green-600 hover:bg-green-200")
                  }
                >
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent("Check out NCWU International Community - Free tools for students!")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    "p-3 rounded-xl transition-all hover:scale-110 " +
                    (isDark
                      ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                      : "bg-cyan-100 text-cyan-600 hover:bg-cyan-200")
                  }
                >
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                </a>
              </div>
              <div
                className={
                  "flex items-center gap-2 p-3 rounded-xl " +
                  (isDark ? "bg-white/5" : "bg-slate-100")
                }
              >
                <Link2
                  className={`w-4 h-4 flex-shrink-0 ${isDark ? "text-white/50" : "text-slate-400"}`}
                />
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className={
                    "flex-1 bg-transparent text-sm outline-none " +
                    (isDark ? "text-white/80" : "text-slate-700")
                  }
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all " +
                    (copied
                      ? isDark
                        ? "bg-green-500/20 text-green-400"
                        : "bg-green-100 text-green-600"
                      : isDark
                        ? "bg-white/10 text-white/80 hover:bg-white/20"
                        : "bg-white text-slate-600 hover:bg-slate-50 shadow-sm")
                  }
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      {t("support.copied", "Copied!")}
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      {t("support.copy", "Copy")}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <p
            className={`text-sm flex items-center justify-center gap-1.5 ${
              isDark ? "text-white/40" : "text-slate-400"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {t(
              "support.footerNote",
              "Made with love by NCWU international students. Thank you for being part of our community.",
            )}
            <Heart className="w-4 h-4 text-red-500 inline" />
          </p>
        </div>
      </div>
    </div>
  );
}
