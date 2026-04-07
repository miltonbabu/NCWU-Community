import { useXingyuanChat } from "../../contexts/ChatContext";
import { useTheme } from "../ThemeProvider";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  User,
  Moon,
  Sun,
  Monitor,
  Bot,
  Volume2,
  VolumeX,
  Keyboard,
  Pencil,
  Sparkles,
} from "lucide-react";

export function SettingsDialog() {
  const {
    state: { settingsOpen, settings },
    toggleSettings,
    updateSettings,
  } = useXingyuanChat();
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Dialog open={settingsOpen} onOpenChange={toggleSettings}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Settings</DialogTitle>
          <DialogDescription>
            Customize your profile and preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Appearance - Moved to Top */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              {resolvedTheme === "dark" ? (
                <Moon className="size-4" />
              ) : (
                <Sun className="size-4" />
              )}
              Appearance
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={resolvedTheme === "light" ? "default" : "outline"}
                className="flex flex-col gap-1 h-auto py-3"
                onClick={() => setTheme("light")}
              >
                <Sun className="size-5" />
                <span className="text-xs">Light</span>
              </Button>
              <Button
                variant={resolvedTheme === "dark" ? "default" : "outline"}
                className="flex flex-col gap-1 h-auto py-3"
                onClick={() => setTheme("dark")}
              >
                <Moon className="size-5" />
                <span className="text-xs">Dark</span>
              </Button>
              <Button
                variant={resolvedTheme === "system" ? "default" : "outline"}
                className="flex flex-col gap-1 h-auto py-3"
                onClick={() => setTheme("system")}
              >
                <Monitor className="size-5" />
                <span className="text-xs">System</span>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Profile Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <User className="size-4" />
              Profile
            </h3>

            <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
              {/* Avatar & Name */}
              <div className="flex items-center gap-4">
                <Avatar className="size-16 ring-2 ring-primary/20">
                  <AvatarFallback className="text-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold">
                    {settings.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1.5">
                  <Label
                    htmlFor="displayName"
                    className="text-xs text-muted-foreground"
                  >
                    Display Name
                  </Label>
                  <Input
                    id="displayName"
                    value={settings.displayName}
                    onChange={(e) =>
                      updateSettings({ displayName: e.target.value })
                    }
                    className="mt-0"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="bio"
                  className="text-xs text-muted-foreground flex items-center gap-1.5"
                >
                  <Pencil className="size-3" />
                  Bio / Status
                </Label>
                <Textarea
                  id="bio"
                  value={settings.bio || ""}
                  onChange={(e) => updateSettings({ bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  className="min-h-[60px] resize-none text-sm"
                  maxLength={120}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Chat Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="size-4" />
              Chat Settings
            </h3>

            <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
              {/* Send on Enter */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Keyboard className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Send on Enter</p>
                    <p className="text-xs text-muted-foreground">
                      Press Enter to send message
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.sendOnEnter ?? true}
                  onCheckedChange={(checked) =>
                    updateSettings({ sendOnEnter: checked })
                  }
                />
              </div>

              {/* Sound */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {settings.soundEnabled !== false ? (
                    <Volume2 className="size-4 text-muted-foreground" />
                  ) : (
                    <VolumeX className="size-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium">Sound Effects</p>
                    <p className="text-xs text-muted-foreground">
                      Play sounds for messages
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.soundEnabled ?? true}
                  onCheckedChange={(checked) =>
                    updateSettings({ soundEnabled: checked })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* AI Model */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Bot className="size-4" />
              AI Model
            </h3>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200 dark:border-indigo-800">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                <Bot className="size-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                  Xing Yuan AI
                </p>
                <p className="text-xs text-muted-foreground">
                  Ready to assist you
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
