import { StrictMode } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { VisitorTracker } from "./components/VisitorTracker";
import HomePage from "./pages/HomePage";
import CSTPage from "./pages/CSTPage";
import ClassSchedulePage from "./pages/ClassSchedulePage";
import EconomicsPage from "./pages/EconomicsPage";
import EconomicsSchedulePage from "./pages/EconomicsSchedulePage";
import HSKPage from "./pages/HSKPage";
import HSKGrammarPage from "./pages/HSKGrammarPage";
import StudentGuidesPage from "./pages/StudentGuidesPage";
import EmergencyPage from "./pages/EmergencyPage";
import CampusMapPage from "./pages/CampusMapPage";
import EventsPage from "./pages/EventsPage";
import AppsGuidePage from "./pages/AppsGuidePage";
import TransportationPage from "./pages/TransportationPage";
import PaymentGuidePage from "./pages/PaymentGuidePage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ProfilePage from "./pages/profile/ProfilePage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminSocialPage from "./pages/admin/AdminSocialPage";
import AdminDiscordPage from "./pages/admin/AdminDiscordPage";
import SocialFeedPage from "./pages/SocialFeedPage";
import PhotoGalleryPage from "./pages/PhotoGalleryPage";
import AdminPhotoGalleryPage from "./pages/admin/AdminPhotoGalleryPage";
import DiscordPage from "./pages/DiscordPage";
import LanguageExchangeChat from "./pages/LanguageExchangeChat";
import LanguageExchangePage from "./pages/LanguageExchangePage";
import AdminLanguageExchange from "./pages/admin/AdminLanguageExchange";
import AdminTopMembers from "./pages/admin/AdminTopMembers";
import AdminFlagsPage from "./pages/admin/AdminFlagsPage";
import AdminPasswordRecovery from "./pages/admin/AdminPasswordRecovery";
import AdminEventsPage from "./pages/admin/AdminEventsPage";
import AdminMarketPage from "./pages/admin/AdminMarketPage";
import AdminDeletedContent from "./pages/admin/AdminDeletedContent";
import MarketPage from "./pages/MarketPage";
import MarketPostDetailPage from "./pages/MarketPostDetailPage";
import CreateMarketPostPage from "./pages/CreateMarketPostPage";
import EditMarketPostPage from "./pages/EditMarketPostPage";
import MarketChatPage from "./pages/MarketChatPage";
import AdminMarketChatPage from "./pages/admin/AdminMarketChatPage";
import CivilEngineering2023Page from "./pages/CivilEngineering2023Page";
import CivilEngineering2024Page from "./pages/CivilEngineering2024Page";
import CivilEngineering2025Page from "./pages/CivilEngineering2025Page";
import ElectricalEngineering2023Page from "./pages/ElectricalEngineering2023Page";
import ElectricalEngineering2024Page from "./pages/ElectricalEngineering2024Page";
import ElectricalEngineering2025Page from "./pages/ElectricalEngineering2025Page";
import MechanicalEngineering2023Page from "./pages/MechanicalEngineering2023Page";
import MechanicalEngineering2024Page from "./pages/MechanicalEngineering2024Page";
import MechanicalEngineering2025Page from "./pages/MechanicalEngineering2025Page";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import HSK2026Page from "./pages/HSK2026Page";
import XingyuanAIPage from "./pages/XingyuanAIPage";
import PdfToolsPage from "./pages/PdfToolsPage";
import SupportPage from "./pages/SupportPage";
import { Chatbot } from "./components/Chatbot";

function AppRouterContent() {
  const location = useLocation();
  const isXingyuanAI = location.pathname === "/xingyuan-ai";

  return (
    <>
      <VisitorTracker />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/Home" element={<Navigate to="/" replace />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/social" element={<AdminSocialPage />} />
        <Route path="/admin/discord" element={<AdminDiscordPage />} />
        <Route
          path="/admin/language-exchange"
          element={<AdminLanguageExchange />}
        />
        <Route path="/admin/top-members" element={<AdminTopMembers />} />
        <Route path="/admin/flags" element={<AdminFlagsPage />} />
        <Route
          path="/admin/password-recovery"
          element={<AdminPasswordRecovery />}
        />
        <Route path="/admin/events" element={<AdminEventsPage />} />
        <Route path="/admin/market" element={<AdminMarketPage />} />
        <Route path="/admin/market/chat" element={<AdminMarketChatPage />} />
        <Route
          path="/admin/deleted-content"
          element={<AdminDeletedContent />}
        />
        <Route path="/admin/*" element={<AdminDashboard />} />

        <Route path="/cst" element={<CSTPage />} />
        <Route path="/cst/class-schedule" element={<ClassSchedulePage />} />

        <Route path="/economics-2025" element={<EconomicsPage />} />
        <Route
          path="/economics-2025/class-schedule"
          element={<EconomicsSchedulePage />}
        />

        {/* Civil Engineering Routes */}
        <Route
          path="/civil-engineering-2023"
          element={<CivilEngineering2023Page />}
        />
        <Route
          path="/civil-engineering-2024"
          element={<CivilEngineering2024Page />}
        />
        <Route
          path="/civil-engineering-2025"
          element={<CivilEngineering2025Page />}
        />

        {/* Electrical Engineering Routes */}
        <Route
          path="/electrical-engineering-2023"
          element={<ElectricalEngineering2023Page />}
        />
        <Route
          path="/electrical-engineering-2024"
          element={<ElectricalEngineering2024Page />}
        />
        <Route
          path="/electrical-engineering-2025"
          element={<ElectricalEngineering2025Page />}
        />

        {/* Mechanical Engineering Routes */}
        <Route
          path="/mechanical-engineering-2023"
          element={<MechanicalEngineering2023Page />}
        />
        <Route
          path="/mechanical-engineering-2024"
          element={<MechanicalEngineering2024Page />}
        />
        <Route
          path="/mechanical-engineering-2025"
          element={<MechanicalEngineering2025Page />}
        />

        <Route path="/hsk" element={<HSKPage />} />
        <Route path="/hsk-2026" element={<HSK2026Page />} />
        <Route path="/hsk/grammar" element={<HSKGrammarPage />} />

        <Route path="/social" element={<SocialFeedPage />} />
        <Route path="/social/feed" element={<SocialFeedPage />} />

        <Route path="/gallery" element={<PhotoGalleryPage />} />
        <Route path="/admin/gallery" element={<AdminPhotoGalleryPage />} />

        <Route path="/discord" element={<DiscordPage />} />

        <Route path="/xingyuan-ai" element={<XingyuanAIPage />} />
        <Route path="/pdf-tools" element={<PdfToolsPage />} />
        <Route path="/support" element={<SupportPage />} />

        <Route path="/language-exchange" element={<LanguageExchangePage />} />
        <Route
          path="/language-exchange/chat/:chatId"
          element={<LanguageExchangeChat />}
        />
        <Route
          path="/language-exchange/chat"
          element={<LanguageExchangeChat />}
        />

        <Route path="/student-guides" element={<StudentGuidesPage />} />

        <Route path="/emergency" element={<EmergencyPage />} />
        <Route path="/campus-map" element={<CampusMapPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/market" element={<MarketPage />} />
        <Route path="/market/create" element={<CreateMarketPostPage />} />
        <Route path="/market/edit/:id" element={<EditMarketPostPage />} />
        <Route path="/market/chat" element={<MarketChatPage />} />
        <Route path="/market/chat/:sessionId" element={<MarketChatPage />} />
        <Route path="/market/:id" element={<MarketPostDetailPage />} />
        <Route path="/apps-guide" element={<AppsGuidePage />} />
        <Route path="/transportation" element={<TransportationPage />} />
        <Route path="/payment-guide" element={<PaymentGuidePage />} />

        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!isXingyuanAI && <Chatbot />}
    </>
  );
}

function AppRouter() {
  return (
    <StrictMode>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <AppRouterContent />
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </StrictMode>
  );
}

export default AppRouter;
