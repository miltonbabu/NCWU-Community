import { useXingyuanChat } from "../../contexts/ChatContext";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { cn } from "../../lib/utils";
import {
  MessageSquare,
  Trash2,
  Settings,
  User,
  Atom,
  Plus,
  LogOut,
} from "lucide-react";

export function ChatSidebar() {
  const navigate = useNavigate();
  const {
    state: { chats, currentChatId, sidebarOpen, settings },
    createChat,
    selectChat,
    deleteChat,
    toggleSidebar,
    toggleSettings,
    getCurrentChat,
  } = useXingyuanChat();
  const { user, logout } = useAuth();

  if (!sidebarOpen) return null;

  const initials = settings.displayName
    ? settings.displayName.charAt(0).toUpperCase()
    : user?.full_name?.charAt(0).toUpperCase() || "U";

  const currentChat = getCurrentChat();
  const hasMessages = currentChat && currentChat.messages.length > 0;
  const canCreateNewChat = hasMessages;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };
  if (!sidebarOpen) return null;

  return (
    <aside
      className={cn(
        "w-72 h-full bg-card border-r border-border flex flex-col md:relative fixed md:static z-40 top-0 left-0 transition-transform duration-300 ease-in-out",
        "md:translate-x-0",
      )}
    >
      {" "}
      <div className="p-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <Atom className="size-7 text-primary" />
          <span className="font-semibold">Xing Yuan AI</span>
        </div>
      </div>
      <div className="p-3">
        <Button
          onClick={() => createChat()}
          className="w-full justify-center gap-2"
          variant="outline"
          disabled={!canCreateNewChat}
          title={
            !canCreateNewChat
              ? "Send a message first before creating a new chat"
              : "New Chat"
          }
        >
          <Plus className="size-4" />
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1 min-h-0 px-3">
        <div className="space-y-1 pb-4">
          {chats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No conversations yet
            </p>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  "group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                  chat.id === currentChatId
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50",
                )}
                onClick={() => selectChat(chat.id)}
              >
                <MessageSquare className="size-4 shrink-0" />
                <span className="flex-1 truncate text-sm">{chat.title}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="opacity-0 group-hover:opacity-100 size-7 hover:bg-destructive/20 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      {/* User Profile Footer */}
      <div className="p-3 border-t border-border">
        <div
          className={`flex items-center gap-3 rounded-lg p-2 transition-colors ${
            user ? "cursor-default" : "hover:bg-accent/50 cursor-pointer"
          }`}
          onClick={() =>
            !user &&
            navigate("/login", {
              state: { from: { pathname: "/xingyuan-ai" } },
            })
          }
        >
          {user ? (
            <button
              onClick={() => navigate("/profile")}
              className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-full"
              title="View Profile"
            >
              <Avatar className="size-10 ring-2 ring-primary/20 hover:ring-primary/50 transition-colors">
                <AvatarImage
                  src={user?.avatar_url || user?.google_photo_url || undefined}
                  alt={settings.displayName || user?.full_name || "User"}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          ) : (
            <Avatar className="size-10 ring-2 ring-primary/20 shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {settings.displayName || user?.full_name || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.student_id || user?.email || "Not signed in"}
            </p>
          </div>

          {user && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0 size-8 hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="size-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 size-8 hover:bg-accent"
            onClick={toggleSettings}
            title="Settings"
          >
            <Settings className="size-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
