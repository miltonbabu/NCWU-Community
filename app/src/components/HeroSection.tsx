import { type ReactNode, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "./ThemeProvider";
import {
  ArrowRight,
  Globe,
  ExternalLink,
  Sparkles,
  BookOpen,
  MessageCircle,
  Languages,
  Users,
  ShoppingCart,
} from "lucide-react";

interface HeroSectionProps {
  title: ReactNode;
  subtitle?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  tertiaryButtonText?: string;
  tertiaryButtonLink?: string;
  quaternaryButtonText?: string;
  quaternaryButtonLink?: string;
  quinaryButtonText?: string;
  quinaryButtonLink?: string;
  senaryButtonText?: string;
  senaryButtonLink?: string;
  septenaryButtonText?: string;
  septenaryButtonLink?: string;
  octonaryButtonText?: string;
  octonaryButtonLink?: string;
  nonaryButtonText?: string;
  nonaryButtonLink?: string;
  denaryButtonText?: string;
  denaryButtonLink?: string;
  backgroundImage?: string;
  backgroundImages?: string[];
  slideInterval?: number;
  children?: ReactNode;
}

function isExternalLink(link: string | undefined): boolean {
  if (!link) return false;
  return link.startsWith("http://") || link.startsWith("https://");
}

export function HeroSection({
  title,
  subtitle,
  description,
  primaryButtonText,
  primaryButtonLink,
  secondaryButtonText,
  secondaryButtonLink,
  tertiaryButtonText,
  tertiaryButtonLink,
  quaternaryButtonText,
  quaternaryButtonLink,
  quinaryButtonText,
  quinaryButtonLink,
  senaryButtonText,
  senaryButtonLink,
  septenaryButtonText,
  septenaryButtonLink,
  octonaryButtonText,
  octonaryButtonLink,
  nonaryButtonText,
  nonaryButtonLink,
  denaryButtonText,
  denaryButtonLink,
  backgroundImage,
  backgroundImages,
  slideInterval = 3000,
  children,
}: HeroSectionProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const images =
    backgroundImages && backgroundImages.length > 0
      ? backgroundImages
      : backgroundImage
        ? [backgroundImage]
        : [];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const goToNextSlide = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(goToNextSlide, slideInterval);
    return () => clearInterval(interval);
  }, [images.length, slideInterval, goToNextSlide]);

  const renderButton = (
    text: string,
    link: string,
    variant:
      | "primary"
      | "secondary"
      | "tertiary"
      | "quaternary"
      | "quinary"
      | "senary"
      | "septenary"
      | "octonary"
      | "nonary"
      | "denary",
    icon?: ReactNode,
    isExternal?: boolean,
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 hover:scale-105 cursor-pointer";

    const variantClasses = {
      primary:
        "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40",
      secondary:
        "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40",
      tertiary:
        "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40",
      quaternary:
        "bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40",
      quinary:
        "bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40",
      senary:
        "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40",
      septenary:
        "bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40",
      octonary:
        "bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40",
      nonary:
        "bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40",
      denary:
        "bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-400 hover:to-green-500 text-white shadow-lg shadow-lime-500/30 hover:shadow-xl hover:shadow-lime-500/40",
    };

    const className = `${baseClasses} ${variantClasses[variant]}`;

    if (isExternal) {
      return (
        <a
          key={link}
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {icon}
          <span>{text}</span>
          {!icon && <ArrowRight className="w-4 h-4 flex-shrink-0" />}
        </a>
      );
    }

    return (
      <Link key={link} to={link} className={className}>
        {icon}
        <span>{text}</span>
        {!icon && <ArrowRight className="w-4 h-4 flex-shrink-0" />}
      </Link>
    );
  };

  return (
    <section
      className={`relative w-full min-h-[60vh] sm:min-h-[70vh] md:min-h-[80vh] lg:min-h-[90vh] overflow-hidden ${!isDark ? "shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3),0_40px_100px_-20px_rgba(0,0,0,0.2)]" : ""}`}
    >
      {images.length > 0 && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          {images.map((img, index) => (
            <div
              key={index}
              className="absolute inset-0 transition-opacity duration-500 ease-in-out"
              style={{
                backgroundImage: `url(${img})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                filter: isDark ? "blur(1px)" : "none",
                opacity: index === currentImageIndex ? 1 : 0,
              }}
            />
          ))}
        </div>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
               onClick={() => {
                setCurrentImageIndex(index);
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentImageIndex
                  ? "bg-white scale-125 shadow-lg"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      <div
        className={`absolute inset-0 z-[1] pointer-events-none ${isDark ? "bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/70" : "bg-gradient-to-b from-slate-900/50 via-slate-900/30 to-slate-900/40"}`}
      />

      {!isDark && (
        <div
          className="absolute inset-0 z-[2] pointer-events-none"
          style={{
            boxShadow:
              "inset 0 0 100px 20px rgba(0, 0, 0, 0.15), inset 0 0 200px 40px rgba(0, 0, 0, 0.1)",
          }}
        />
      )}

      <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-[60vh] sm:min-h-[70vh] md:min-h-[80vh] lg:min-h-[90vh] px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          {subtitle && (
            <p
              className={`text-xs sm:text-sm md:text-base font-bold tracking-wider uppercase mb-3 sm:mb-4 ${isDark ? "text-amber-400" : "text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"}`}
            >
              {subtitle}
            </p>
          )}

          <div className="mb-4 sm:mb-6">
            <div
              className={`${isDark ? "text-white" : "text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]"}`}
            >
              {title}
            </div>
          </div>

          {description && (
            <p
              className={`text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto mb-6 sm:mb-8 font-medium ${isDark ? "text-white/90" : "text-white/95 drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]"}`}
            >
              {description}
            </p>
          )}

          {children}

          {(primaryButtonText ||
            secondaryButtonText ||
            tertiaryButtonText ||
            quaternaryButtonText ||
            quinaryButtonText ||
            senaryButtonText ||
            septenaryButtonText ||
            octonaryButtonText ||
            nonaryButtonText ||
            denaryButtonText) && (
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center relative z-20">
              {primaryButtonText &&
                primaryButtonLink &&
                renderButton(
                  primaryButtonText,
                  primaryButtonLink,
                  "primary",
                  undefined,
                  isExternalLink(primaryButtonLink),
                )}
              {secondaryButtonText &&
                secondaryButtonLink &&
                renderButton(
                  secondaryButtonText,
                  secondaryButtonLink,
                  "secondary",
                  undefined,
                  isExternalLink(secondaryButtonLink),
                )}
              {tertiaryButtonText &&
                tertiaryButtonLink &&
                renderButton(
                  tertiaryButtonText,
                  tertiaryButtonLink,
                  "tertiary",
                  <BookOpen className="w-4 h-4 flex-shrink-0" />,
                  isExternalLink(tertiaryButtonLink),
                )}
              {quaternaryButtonText &&
                quaternaryButtonLink &&
                renderButton(
                  quaternaryButtonText,
                  quaternaryButtonLink,
                  "quaternary",
                  <Sparkles className="w-4 h-4 flex-shrink-0" />,
                  isExternalLink(quaternaryButtonLink),
                )}
              {quinaryButtonText &&
                quinaryButtonLink &&
                renderButton(
                  quinaryButtonText,
                  quinaryButtonLink,
                  "quinary",
                  <MessageCircle className="w-4 h-4 flex-shrink-0" />,
                  isExternalLink(quinaryButtonLink),
                )}
              {senaryButtonText &&
                senaryButtonLink &&
                renderButton(
                  senaryButtonText,
                  senaryButtonLink,
                  "senary",
                  <Languages className="w-4 h-4 flex-shrink-0" />,
                  isExternalLink(senaryButtonLink),
                )}
              {septenaryButtonText &&
                septenaryButtonLink &&
                renderButton(
                  septenaryButtonText,
                  septenaryButtonLink,
                  "septenary",
                  <Users className="w-4 h-4 flex-shrink-0" />,
                  isExternalLink(septenaryButtonLink),
                )}
              {octonaryButtonText &&
                octonaryButtonLink &&
                renderButton(
                  octonaryButtonText,
                  octonaryButtonLink,
                  "octonary",
                  <ShoppingCart className="w-4 h-4 flex-shrink-0" />,
                  isExternalLink(octonaryButtonLink),
                )}
              {nonaryButtonText &&
                nonaryButtonLink &&
                renderButton(
                  nonaryButtonText,
                  nonaryButtonLink,
                  "nonary",
                  <Globe className="w-4 h-4 flex-shrink-0" />,
                  isExternalLink(nonaryButtonLink),
                )}
              {denaryButtonText &&
                denaryButtonLink &&
                renderButton(
                  denaryButtonText,
                  denaryButtonLink,
                  "denary",
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />,
                  true,
                )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
