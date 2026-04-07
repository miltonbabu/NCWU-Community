import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudFog,
  Wind,
  Droplets,
  CloudSun,
  CloudLightning,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
  location: string;
  lastUpdated: string;
}

const getWeatherIcon = (condition: string, isDark: boolean) => {
  const lowerCondition = condition.toLowerCase();
  const iconClass = `w-8 h-8 ${isDark ? "text-amber-400" : "text-amber-500"}`;

  if (lowerCondition.includes("clear") || lowerCondition.includes("sunny")) {
    return <Sun className={iconClass} />;
  }
  if (
    lowerCondition.includes("partly cloudy") ||
    lowerCondition.includes("mostly sunny")
  ) {
    return <CloudSun className={iconClass} />;
  }
  if (lowerCondition.includes("cloud") || lowerCondition.includes("overcast")) {
    return (
      <Cloud
        className={isDark ? "w-8 h-8 text-slate-400" : "w-8 h-8 text-slate-500"}
      />
    );
  }
  if (
    lowerCondition.includes("rain") ||
    lowerCondition.includes("drizzle") ||
    lowerCondition.includes("shower")
  ) {
    return (
      <CloudRain
        className={isDark ? "w-8 h-8 text-blue-400" : "w-8 h-8 text-blue-500"}
      />
    );
  }
  if (lowerCondition.includes("snow") || lowerCondition.includes("sleet")) {
    return (
      <CloudSnow
        className={isDark ? "w-8 h-8 text-cyan-400" : "w-8 h-8 text-cyan-500"}
      />
    );
  }
  if (
    lowerCondition.includes("fog") ||
    lowerCondition.includes("mist") ||
    lowerCondition.includes("haze")
  ) {
    return (
      <CloudFog
        className={isDark ? "w-8 h-8 text-slate-400" : "w-8 h-8 text-slate-500"}
      />
    );
  }
  if (lowerCondition.includes("thunder") || lowerCondition.includes("storm")) {
    return (
      <CloudLightning
        className={
          isDark ? "w-8 h-8 text-yellow-400" : "w-8 h-8 text-yellow-500"
        }
      />
    );
  }
  return <Sun className={iconClass} />;
};

export function WeatherWidget() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=34.75&longitude=113.65&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Asia/Shanghai",
      );

      if (!response.ok) {
        throw new Error("Failed to fetch weather");
      }

      const data = await response.json();

      const weatherCodes: Record<number, string> = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Foggy",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        71: "Slight snow",
        73: "Moderate snow",
        75: "Heavy snow",
        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        95: "Thunderstorm",
        96: "Thunderstorm with slight hail",
        99: "Thunderstorm with heavy hail",
      };

      const weatherCode = data.current.weather_code;
      const condition = weatherCodes[weatherCode] || "Clear";

      setWeather({
        temperature: Math.round(data.current.temperature_2m),
        condition,
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        feelsLike: Math.round(data.current.apparent_temperature),
        location: "Jinshui, Zhengzhou",
        lastUpdated: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    } catch (err) {
      setError("Unable to load weather");
      console.error("Weather fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();

    const interval = setInterval(fetchWeather, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
          isDark ? "bg-slate-800/50" : "bg-slate-100"
        }`}
      >
        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
        <span
          className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
        >
          Loading...
        </span>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <button
        onClick={fetchWeather}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
          isDark
            ? "bg-slate-800/50 hover:bg-slate-700/50 text-slate-400"
            : "bg-slate-100 hover:bg-slate-200 text-slate-500"
        }`}
        title="Click to retry"
      >
        <RefreshCw className="w-4 h-4" />
        <span className="text-sm">Retry</span>
      </button>
    );
  }

  return (
    <div
      className={`group relative flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all ${
        isDark
          ? "bg-gradient-to-r from-slate-800/80 to-indigo-900/30 hover:from-slate-800 hover:to-indigo-900/50"
          : "bg-gradient-to-r from-slate-100 to-indigo-100/50 hover:from-slate-100 hover:to-indigo-100"
      }`}
    >
      <div className="flex items-center gap-2">
        {getWeatherIcon(weather.condition, isDark)}
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <span
              className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {weather.temperature}
            </span>
            <span
              className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              °C
            </span>
          </div>
          <span
            className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            {weather.location}
          </span>
        </div>
      </div>

      <div className={`h-8 w-px ${isDark ? "bg-slate-700" : "bg-slate-300"}`} />

      <div className="flex flex-col gap-0.5">
        <span
          className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
        >
          {weather.condition}
        </span>
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            <Droplets className="w-3 h-3" />
            {weather.humidity}%
          </span>
          <span
            className={`flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            <Wind className="w-3 h-3" />
            {weather.windSpeed} km/h
          </span>
        </div>
      </div>

      <div
        className={`absolute bottom-0.5 right-2 text-[10px] ${isDark ? "text-slate-600" : "text-slate-400"}`}
      >
        {weather.lastUpdated}
      </div>
    </div>
  );
}

export function WeatherWidgetCompact() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [weather, setWeather] = useState<{
    temp: number;
    condition: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=34.75&longitude=113.65&current=temperature_2m,weather_code&timezone=Asia/Shanghai",
        );

        if (response.ok) {
          const data = await response.json();
          const weatherCodes: Record<number, string> = {
            0: "Clear",
            1: "Clear",
            2: "Cloudy",
            3: "Overcast",
            45: "Fog",
            48: "Fog",
            51: "Drizzle",
            53: "Drizzle",
            55: "Drizzle",
            61: "Rain",
            63: "Rain",
            65: "Rain",
            71: "Snow",
            73: "Snow",
            75: "Snow",
            80: "Showers",
            81: "Showers",
            82: "Showers",
            95: "Storm",
            96: "Storm",
            99: "Storm",
          };

          setWeather({
            temp: Math.round(data.current.temperature_2m),
            condition: weatherCodes[data.current.weather_code] || "Clear",
          });
        }
      } catch (err) {
        console.error("Weather error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !weather) {
    return (
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded-md ${
          isDark ? "bg-slate-800/50" : "bg-slate-100"
        }`}
      >
        <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors cursor-default ${
        isDark
          ? "bg-slate-800/50 hover:bg-slate-700/50"
          : "bg-slate-100 hover:bg-slate-200"
      }`}
      title={`${weather.condition} - Jinshui, Zhengzhou`}
    >
      {getWeatherIcon(weather.condition, isDark)}
      <span
        className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}
      >
        {weather.temp}°C
      </span>
    </div>
  );
}
