import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { LogIn, Sparkles, Camera, MessageSquare } from "lucide-react";

interface LoginPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: () => void;
  messageCount?: number;
  imageCount?: number;
  msgLimit?: number;
  imageLimit?: number;
}

export function LoginPrompt({
  open,
  onOpenChange,
  onLogin,
  messageCount = 0,
  imageCount = 0,
  msgLimit = 10,
  imageLimit = 4,
}: LoginPromptProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[90vw] mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Sparkles className="size-5 text-primary" />
            Sign In to Continue
          </DialogTitle>
          <DialogDescription>
            You&apos;ve reached your free usage limit as a guest user. Sign in
            to unlock unlimited access!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div
              className={`rounded-lg border p-3 text-center ${
                messageCount >= msgLimit
                  ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
                  : "border-border bg-muted/30"
              }`}
            >
              <MessageSquare
                className={`size-5 mx-auto mb-1 ${
                  messageCount >= msgLimit
                    ? "text-red-500"
                    : "text-muted-foreground"
                }`}
              />
              <p className="text-xs font-medium">Messages</p>
              <p className="text-lg font-bold">
                {messageCount}
                <span className="text-sm font-normal text-muted-foreground">
                  /{msgLimit}
                </span>
              </p>
            </div>

            <div
              className={`rounded-lg border p-3 text-center ${
                imageCount >= imageLimit
                  ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
                  : "border-border bg-muted/30"
              }`}
            >
              <Camera
                className={`size-5 mx-auto mb-1 ${
                  imageCount >= imageLimit
                    ? "text-red-500"
                    : "text-muted-foreground"
                }`}
              />
              <p className="text-xs font-medium">Images</p>
              <p className="text-lg font-bold">
                {imageCount}
                <span className="text-sm font-normal text-muted-foreground">
                  /{imageLimit}
                </span>
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 rounded-lg p-4 border">
            <p className="text-sm font-semibold mb-1">
              ✨ What you get when you sign in:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Unlimited messages to Xing Yuan AI</li>
              <li>• Up to 10 images per day</li>
              <li>• Chat history saved across devices</li>
              <li>• Access to all community features</li>
            </ul>
          </div>

          <Button onClick={onLogin} className="w-full" size="lg">
            <LogIn className="size-4 mr-2" />
            Sign In Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DailyLimitPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count?: number;
  limit?: number;
}

export function DailyLimitPopup({
  open,
  onOpenChange,
  count = 10,
  limit = 10,
}: DailyLimitPopupProps) {
  const hoursUntilReset = 24 - new Date().getHours();
  const minutesUntilReset = 60 - new Date().getMinutes();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[90vw] mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Camera className="size-5 text-orange-500" />
            Daily Image Limit Reached
          </DialogTitle>
          <DialogDescription>
            You&apos;ve uploaded your daily quota of images.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950 p-4 text-center">
            <Camera className="size-6 sm:size-8 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400">
              {count}/{limit}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              images used today
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm font-medium mb-1">
              ⏰ Your limit resets in approximately:
            </p>
            <p className="text-xl sm:text-2xl font-bold text-primary">
              {hoursUntilReset}h {minutesUntilReset}m
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              (resets at midnight local time)
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Got it, I&apos;ll try again later!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
