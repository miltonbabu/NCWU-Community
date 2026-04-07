export interface MarketPost {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category: string;
  tags: string[];
  condition: string;
  phone_number: string | null;
  reference_links: string[];
  is_sold: boolean;
  sold_at: string | null;
  auto_remove_at: string | null;
  status: string;
  views: number;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_avatar?: string;
  like_count?: number;
  comment_count?: number;
  is_new?: boolean;
  user_liked?: boolean;
}

export interface MarketComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
  replies?: MarketComment[];
  parent_reply_to_name?: string;
}

export interface MarketBuyRequest {
  id: string;
  post_id: string;
  buyer_id: string;
  seller_id: string;
  original_price: number;
  platform_fee: number;
  total_amount: number;
  status: "pending" | "approved" | "rejected" | "completed";
  admin_notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  buyer_name?: string;
  seller_name?: string;
  post_title?: string;
}

export interface MarketStats {
  totalPosts: number;
  activePosts: number;
  soldPosts: number;
  totalBuyRequests: number;
  pendingBuyRequests: number;
  totalRevenue: number;
}

export const MARKET_CATEGORIES = [
  { value: "electronics", label: "Electronics" },
  { value: "books", label: "Books & Stationery" },
  { value: "clothing", label: "Clothing & Accessories" },
  { value: "furniture", label: "Furniture" },
  { value: "sports", label: "Sports & Outdoors" },
  { value: "appliances", label: "Appliances" },
  { value: "others", label: "Others" },
];

export const MARKET_CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];
