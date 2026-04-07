import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { marketApi } from "@/lib/api";
import type { MarketPost } from "@/types/market";
import { MARKET_CATEGORIES } from "@/types/market";
import {
  ShoppingCart,
  ChevronRight,
  Loader2,
  Heart,
  MessageCircle,
  Eye,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { formatDistanceToNow, differenceInHours } from "date-fns";

interface HomeMarketSectionProps {
  isDark: boolean;
}

export default function HomeMarketSection({ isDark }: HomeMarketSectionProps) {
  const [posts, setPosts] = useState<MarketPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLatestPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await marketApi.getLatestPosts(6);
      if (response.success && response.data) {
        setPosts(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch market posts");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchLatestPosts();
  }, [fetchLatestPosts]);

  const isNewPost = (createdAt: string) => {
    return differenceInHours(new Date(), new Date(createdAt)) < 24;
  };

  const getCategoryLabel = (value: string) => {
    return MARKET_CATEGORIES.find((c) => c.value === value)?.label || value;
  };

  return (
    <div className="mb-16">
      <div
        className={`rounded-3xl p-6 mb-6 ${
          isDark
            ? "bg-gradient-to-br from-emerald-900/50 via-teal-900/50 to-cyan-900/50 border border-emerald-800/50"
            : "bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100 border border-emerald-200"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
              <ShoppingCart className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2
                className={`text-2xl sm:text-3xl font-bold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Second-Hand Market
              </h2>
              <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Buy and sell items within the NCWU community
              </p>
            </div>
          </div>
          <Link
            to="/market"
            className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark
                ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                : "bg-emerald-500/20 text-emerald-700 hover:bg-emerald-500/30"
            }`}
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        </div>
      ) : posts.length === 0 ? (
        <div
          className={`text-center py-16 rounded-2xl ${
            isDark
              ? "bg-slate-800/50 border border-slate-700"
              : "bg-white/70 border border-slate-200"
          }`}
        >
          <ShoppingCart
            className={`w-16 h-16 mx-auto mb-4 ${
              isDark ? "text-slate-600" : "text-slate-300"
            }`}
          />
          <p className={isDark ? "text-slate-400" : "text-slate-500"}>
            No items for sale yet. Be the first to post!
          </p>
          <Link
            to="/market/create"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/30"
          >
            <ShoppingCart className="w-5 h-5" />
            Post Your First Item
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              to={`/market/${post.id}`}
              className={`group relative overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${
                isDark
                  ? "bg-slate-800/70 border border-slate-700 hover:bg-slate-800/90"
                  : "bg-white/80 border border-slate-200 hover:bg-white/95 shadow-lg"
              } ${isNewPost(post.created_at) ? "ring-2 ring-emerald-500" : ""}`}
            >
              {isNewPost(post.created_at) && (
                <div className="absolute top-3 left-3 z-10">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-lg">
                    <Sparkles className="w-3 h-3" />
                    NEW
                  </span>
                </div>
              )}

              {post.is_sold && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex items-center justify-center rounded-2xl">
                  <span className="bg-red-500 text-white px-6 py-2 rounded-xl text-lg font-bold flex items-center gap-2 shadow-xl">
                    <CheckCircle className="w-6 h-6" />
                    SOLD
                  </span>
                </div>
              )}

              <div className="relative h-56 overflow-hidden">
                {post.images && post.images.length > 0 ? (
                  <img
                    src={post.images[0]}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <ShoppingCart className="w-16 h-16 text-white/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                <div className="absolute bottom-4 left-4 right-4">
                  <div className="text-3xl font-black text-white mb-1 drop-shadow-lg">
                    ¥{post.price.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="p-5">
                <h3
                  className={`font-bold text-lg line-clamp-1 mb-2 ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {post.title}
                </h3>

                <p
                  className={`text-sm line-clamp-2 mb-3 ${
                    isDark ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  {post.description}
                </p>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex items-center gap-1 ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      {post.views || 0}
                    </span>
                    <span
                      className={`flex items-center gap-1 ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      <Heart className="w-4 h-4" />
                      {post.like_count || 0}
                    </span>
                    <span
                      className={`flex items-center gap-1 ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      {post.comment_count || 0}
                    </span>
                  </div>
                  <span
                    className={`${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex justify-center mt-8">
        <Link
          to="/market"
          className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
            isDark
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50"
              : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50"
          }`}
        >
          <ShoppingCart className="w-6 h-6" />
          Browse All Items in Market
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
