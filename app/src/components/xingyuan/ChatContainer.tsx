import { useXingyuanChat } from "../../contexts/ChatContext";
import { ChatSidebar } from "./ChatSidebar";
import { ChatMain } from "./ChatMain";
import { SettingsDialog } from "./SettingsDialog";
import { PanelLeft } from "lucide-react";

export function ChatContainer() {
  const {
    state: { sidebarOpen },
    toggleSidebar,
  } = useXingyuanChat();

  return (
    <div className="h-screen flex overflow-hidden relative">
      <ChatSidebar />

      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}

      {sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 z-40 size-9 rounded-lg bg-card border border-border shadow-sm flex items-center justify-center hover:bg-accent transition-all duration-200 md:left-[284px] left-[264px]"
          title="Close Sidebar"
        >
          <PanelLeft className="size-5" />
        </button>
      )}

      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-40 size-10 rounded-lg bg-card border border-border shadow-sm flex items-center justify-center hover:bg-accent transition-colors"
          title="Open Sidebar"
        >
          <PanelLeft className="size-5" />
        </button>
      )}

      <ChatMain />
      <SettingsDialog />
    </div>
  );
}
