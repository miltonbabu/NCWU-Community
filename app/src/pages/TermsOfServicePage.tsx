import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { FileText, AlertTriangle, CheckCircle, XCircle, Users, Scale, ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    document.title = "Terms of Service - NCWU International Community";
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
              <FileText
                className={`w-6 h-6 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Terms of Service</h1>
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
                This platform is maintained by students for students.
              </span>
            </p>
          </div>

          <div className="space-y-8">
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Scale
                  className={`w-5 h-5 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                />
                <h2 className="text-lg font-semibold">
                  1. Acceptance of Terms
                </h2>
              </div>
              <div
                className={`space-y-3 text-sm ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                <p>
                  By registering for and using this platform, you acknowledge
                  that you have read, understood, and agree to be bound by these
                  Terms of Service. If you do not agree with any part of these
                  terms, you must not use this platform.
                </p>
                <p>
                  You also acknowledge that this is an unofficial community
                  platform created by students, and it has no official
                  relationship with NCWU.
                </p>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <Users
                  className={`w-5 h-5 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                />
                <h2 className="text-lg font-semibold">
                  2. User Eligibility
                </h2>
              </div>
              <div
                className={`space-y-3 text-sm ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                <p>To use this platform, you must:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Be a current or former NCWU international student.</li>
                  <li>
                    Provide accurate and truthful information during
                    registration.
                  </li>
                  <li>
                    Be at least 18 years old or have parental/guardian consent.
                  </li>
                  <li>
                    Not be previously banned for violating these terms.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle
                  className={`w-5 h-5 ${isDark ? "text-green-400" : "text-green-600"}`}
                />
                <h2 className="text-lg font-semibold">
                  3. Acceptable Use
                </h2>
              </div>
              <div
                className={`space-y-3 text-sm ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                <p>You agree to use this platform responsibly:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    Share content that is helpful, respectful, and relevant to
                    the community.
                  </li>
                  <li>
                    Respect other users and their opinions, even when you
                    disagree.
                  </li>
                  <li>
                    Use the HSK learning features for educational purposes.
                  </li>
                  <li>
                    Report inappropriate content or behavior to administrators.
                  </li>
                  <li>
                    Protect your account credentials and not share them with
                    others.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <XCircle
                  className={`w-5 h-5 ${isDark ? "text-red-400" : "text-red-600"}`}
                />
                <h2 className="text-lg font-semibold">
                  4. Prohibited Conduct
                </h2>
              </div>
              <div
                className={`space-y-3 text-sm ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                <p>The following activities are strictly prohibited:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    Posting spam, advertisements, or promotional content without
                    permission.
                  </li>
                  <li>
                    Sharing illegal, harmful, or offensive content including
                    hate speech, harassment, or discrimination.
                  </li>
                  <li>
                    Impersonating other users or providing false identity
                    information.
                  </li>
                  <li>
                    Attempting to hack, disrupt, or damage the platform or its
                    users.
                  </li>
                  <li>
                    Sharing copyrighted material without proper authorization.
                  </li>
                  <li>
                    Using the platform for commercial purposes without
                    approval.
                  </li>
                  <li>
                    Sharing personal information of others without their
                    consent.
                  </li>
                  <li>
                    Creating multiple accounts to circumvent restrictions.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle
                  className={`w-5 h-5 ${isDark ? "text-amber-400" : "text-amber-600"}`}
                />
                <h2 className="text-lg font-semibold">
                  5. Content Guidelines
                </h2>
              </div>
              <div
                className={`space-y-3 text-sm ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                <p>
                  You are responsible for all content you post. By posting
                  content, you grant us a non-exclusive license to display,
                  distribute, and use that content within the platform.
                </p>
                <p>We reserve the right to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Remove any content that violates these terms.</li>
                  <li>
                    Moderate posts, comments, and messages for inappropriate
                    content.
                  </li>
                  <li>
                    Issue warnings, temporary restrictions, or permanent bans
                    for violations.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">
                6. Privacy
              </h2>
              <div
                className={`space-y-3 text-sm ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                <p>
                  Your use of this platform is also governed by our{" "}
                  <Link
                    to="/privacy"
                    className="text-indigo-500 hover:text-indigo-400 underline font-medium"
                  >
                    Privacy Policy
                  </Link>
                  . Please review it to understand how we collect, use, and
                  protect your personal information.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">
                7. Disclaimer of Warranties
              </h2>
              <div
                className={`space-y-3 text-sm ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                <p>
                  This platform is provided "as is" without warranties of any
                  kind, either express or implied. We do not guarantee:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Uninterrupted or error-free service.</li>
                  <li>
                    The accuracy, completeness, or usefulness of any content.
                  </li>
                  <li>
                    That the platform will meet your specific requirements.
                  </li>
                  <li>
                    The security of any information transmitted through the
                    platform.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">
                8. Limitation of Liability
              </h2>
              <div
                className={`space-y-3 text-sm ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                <p>
                  To the fullest extent permitted by law, we shall not be
                  liable for any direct, indirect, incidental, special,
                  consequential, or punitive damages arising from your use of
                  this platform, including but not limited to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Loss of data or content.</li>
                  <li>Loss of profits or revenue.</li>
                  <li>
                    Any reliance on information or content obtained from the
                    platform.
                  </li>
                  <li>
                    Unauthorized access to your account or personal
                    information.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">
                9. Account Termination
              </h2>
              <div
                className={`space-y-3 text-sm ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                <p>We reserve the right to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    Suspend or terminate accounts that violate these terms.
                  </li>
                  <li>
                    Delete content associated with terminated accounts.
                  </li>
                  <li>
                    Ban users who repeatedly violate community guidelines.
                  </li>
                </ul>
                <p>
                  You may request account deletion at any time by contacting
                  administrators.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">
                10. Changes to Terms
              </h2>
              <div
                className={`space-y-3 text-sm ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                <p>
                  We may modify these terms at any time. Significant changes
                  will be announced through the platform. Continued use after
                  changes constitutes acceptance of the modified terms.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">
                11. Contact Information
              </h2>
              <div
                className={`space-y-3 text-sm ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                <p>
                  For questions about these Terms of Service, please contact
                  the platform administrators through:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>The Discord community channels</li>
                  <li>The in-platform messaging system</li>
                  <li>Email contact (if provided by administrators)</li>
                </ul>
              </div>
            </section>
          </div>

          <div
            className={`mt-8 p-4 rounded-xl ${
              isDark
                ? "bg-slate-800/50 border border-slate-700"
                : "bg-slate-50 border border-slate-200"
            }`}
          >
            <p
              className={`text-sm text-center ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              By using this platform, you acknowledge that you have read,
              understood, and agree to these Terms of Service and our{" "}
              <Link
                to="/privacy"
                className="text-indigo-500 hover:text-indigo-400 underline font-medium"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
