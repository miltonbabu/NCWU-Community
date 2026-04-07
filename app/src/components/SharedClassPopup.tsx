import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, User, Calendar, Share2, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import type { ClassSession } from '@/types/schedule';
import { useTheme } from './ThemeProvider';

interface SharedClassPopupProps {
  classSession: ClassSession | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SharedClassPopup({ classSession, isOpen, onClose }: SharedClassPopupProps) {
  const [copied, setCopied] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    if (isOpen && classSession) {
      toast.success('Shared class loaded!', { duration: 3000 });
    }
  }, [isOpen, classSession]);

  if (!classSession) return null;

  const handleCopy = async () => {
    const info = `${classSession.subject}
📅 ${classSession.day}, Week ${classSession.week}
⏰ ${classSession.startTime} - ${classSession.endTime}
👤 ${classSession.instructor}
📍 ${classSession.room}`;

    try {
      await navigator.clipboard.writeText(info);
      setCopied(true);
      toast.success('Class info copied!', { duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: classSession.subject,
      text: `${classSession.subject} - ${classSession.day}, Week ${classSession.week}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-lg ${isDark ? 'bg-slate-900/95 border-white/20' : 'bg-white/95 border-slate-200'} backdrop-blur-xl overflow-hidden`}>
        <DialogHeader>
          <DialogTitle className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-3`}>
            <Share2 className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
            Shared Class
          </DialogTitle>
        </DialogHeader>

        {/* Animated Card */}
        <div className="mt-4 space-y-6">
          {/* Main Class Card */}
          <div
            className={`
              relative overflow-hidden rounded-3xl border-2
              ${classSession.bg} ${classSession.border}
              shadow-2xl ${classSession.glow}
              transform transition-all duration-500
              animate-in zoom-in-95 slide-in-from-bottom-4
            `}
          >
            {/* Shimmer effect */}
            <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${isDark ? 'via-white/10' : 'via-white/30'} to-transparent animate-shimmer`} />

            {/* Content */}
            <div className="relative p-6">
              {/* Subject */}
              <h2 className={`text-2xl font-bold mb-4 ${classSession.text}`}>
                {classSession.subject}
              </h2>

              {/* Details Grid */}
              <div className="space-y-3">
                <div className={`flex items-center gap-3 ${classSession.text}`}>
                  <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-white/20' : 'bg-white/40'} flex items-center justify-center`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm opacity-70">Day & Week</p>
                    <p className="font-semibold">{classSession.day}, Week {classSession.week}</p>
                  </div>
                </div>

                <div className={`flex items-center gap-3 ${classSession.text}`}>
                  <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-white/20' : 'bg-white/40'} flex items-center justify-center`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm opacity-70">Time ({classSession.shift})</p>
                    <p className="font-semibold">{classSession.startTime} - {classSession.endTime}</p>
                  </div>
                </div>

                <div className={`flex items-center gap-3 ${classSession.text}`}>
                  <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-white/20' : 'bg-white/40'} flex items-center justify-center`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm opacity-70">Instructor</p>
                    <p className="font-semibold">{classSession.instructor}</p>
                  </div>
                </div>

                <div className={`flex items-center gap-3 ${classSession.text}`}>
                  <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-white/20' : 'bg-white/40'} flex items-center justify-center`}>
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm opacity-70">Location</p>
                    <p className="font-semibold">{classSession.room}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleCopy}
              variant="outline"
              className={`flex-1 ${isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100'} rounded-xl py-3`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
            <Button
              onClick={handleShare}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>

          {/* View Full Schedule Button */}
          <Button
            onClick={onClose}
            variant="ghost"
            className={`w-full ${isDark ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'} rounded-xl`}
          >
            View Full Schedule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
