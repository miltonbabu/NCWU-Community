import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Shield, Lock, Database, Eye, Users, Bell, Mail, ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    document.title = "Privacy Policy - NCWU International Community";
  }, []);

  return (
    <div
      className={`min-h-screen ${
        isDark
          ? "bg-slate-950 text-white"
          : "bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 text-slate-900"
      }`}
    >
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <Link
          to="/"
          className={`inline-flex items-center gap-2 mb-8 text-sm transition-colors ${
            isDark
              ? "text-slate-400 hover:text-indigo-400"
              : "text-slate-600 hover:text-indigo-600"
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div
          className={`rounded-2xl p-8 ${
            isDark
              ? "bg-slate-900/80 border border-slate-800"
              : "bg-white/80 border border-slate-200"
          } shadow-xl`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className={`p-3 rounded-xl ${
                isDark ? "bg-indigo-500/20" : "bg-indigo-100"
              }`}
            >
              <Shield
                className={`w-6 h-6 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Privacy Policy</h1>
              <p
                className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                Last updated: January 2025
              </p>
            </div>
          </div>

          <div
            className={`mb-6 p-4 rounded-xl ${
              isDark
                ? "bg-amber-500/10 border border-amber-500/30"
                : "bg-amber-50 border border-amber-200"
            }`}
          >
            <p
              className={`flex items-start gap-2 text-sm ${
                isDark ? "text-amber-400" : "text-amber-700"
              }`}
            >
              <span className="text-lg">⚠️</span>
              <span>
                <strong>Important Notice:</strong> This is an unofficial,
                student-run community platform. We are NOT affiliated with,
                endorsed by, or connected to North China University of Water
                Resources and Electric Power (NCWU) in any official capacity.
              </span>
            </p>
          </div>

          <div className="space-y-8">
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Database
                  className={`w-5 h-5 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                />
                <h2 className="text-lg font-semibold">
                  1. Information We Collect
                </h2>
              </div>
              <div
                className={`space-y-3 text-sm ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                <p>We collect the following information when you register:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    <strong>Account Information:</strong> Student ID, email
                    address, full name, department, enrollment year, current
                    year, and country.
                  </li>
                  <li>
                    <strong>Profile Data:</strong> Avatar, bio, nickname,
                    interests, and other optional profile information.
                  </li>
                  <li>
                    <strong>Activity Data:</strong> Posts, comments, likes,
                    HSK progress, quiz results, and other interactions within
                    the platform.
                  </li>
                  <li>
                    <strong>Technical Data:</strong> IP address, browser type,
                    device information, and login history for security
                    purposes.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <Eye
                  className={`w-5 h-5 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                />
                <h2 className="text-lg font-semibold">
                  2. How We Use Your Information
                </h2>
              </div>
              <div
                className={`space-y-3 text-sm ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                <p>Your information is used to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Provide and maintain your account and profile.</li>
                  <li>
                    Enable social features like posts, comments, and
                    messaging.
                  </li>
                  <li>Track HSK learning progress and quiz results.</li>
                  <li>
                    Communicate important updates about the platform.
                  </li>
                  <li>
                    Ensure platform security and prevent abuse.
                  </li>
                  <li>
                    Improve user experience through analytics.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <Lock
                  className={`w-5 h-5 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                />
                <h2 className="text-lg font-semibold">
                  3. Data Security
                </h2>
              </div>
              <div
                className={`space-y-3 text-sm ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                <p>
                  We implement reasonable security measures to protect your
                  data:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    Passwords are securely hashed and never stored in plain
                    text.
                  </li>
                  <li>
                    All data transmissions are encrypted using HTTPS/TLS.
                  </li>
                  <li>
                    Access to user data is restricted to authorized
                    administrators only.
                  </li>
                  <li>
                    Regular security reviews and updates are performed.
                  </li>
                </ul>
                <p className="mt-3">
                  However, no method of transmission over the internet is 100%
                  secure. We cannot guarantee absolute security of your data.
                </p>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <Users
                  className={`w-5 h-5 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                />
                <h2 className="text-lg font-semibold">
                  4. Information Sharing
                </h2>
              </div>
              <div
                className={`space-y-3 text-sm ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                <p>We do NOT sell or rent your personal information. We may share data:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    With other users as part of platform features (e.g., your
                    public profile, posts, comments).
                  </li>
                  <li>
                    With service providers who assist in operating the
                    platform (e.g., cloud hosting, image storage).
                  </li>
                  <li>
                    When required by law or to protect the rights and safety
                    of users.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <Bell
                  className={`w-5 h-5 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                />
                <h2 className="text-lg font-semibold">
                  5. Your Rights
                </h2>
              </div>
              <div
                className={`space-y-3 text-sm ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                <p>You have the right to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    Access and update your personal information through your
                    profile settings.
                  </li>
                  <li>
                    Request deletion of your account and associated data.
                  </li>
                  <li>
                    Export your data in a portable format upon request.
                  </li>
                  <li>
                    Opt-out of non-essential communications.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <Mail
                  className={`w-5 h-5 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                />
                <h2 className="text-lg font-semibold">6. Contact Us</h2>
              </div>
              <div
                className={`space-y-3 text-sm ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                <p>
                  If you have questions about this Privacy Policy or wish to
                  exercise your rights, please contact the platform
                  administrators through:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>The Discord community channels</li>
                  <li>The in-platform messaging system</li>
                  <li>Email contact (if provided by administrators)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">
                7. Changes to This Policy
              </h2>
              <div
                className={`space-y-3 text-sm ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                <p>
                  We may update this Privacy Policy from time to time. We will
                  notify users of significant changes through the platform.
                  Continued use of the platform after changes constitutes
                  acceptance of the updated policy.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
