const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Array<{ msg: string; param: string }>;
  pagination?: {
    hasMore?: boolean;
    nextCursor?: string;
    total?: number;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    const token = localStorage.getItem("auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      }
      return {
        success: false,
        message: data.message || "An error occurred",
        error: data.error,
        errors: data.errors,
      };
    }

    return data;
  }

  async downloadUsersExcel(): Promise<ApiResponse<Blob>> {
    const response = await fetch(`${this.baseUrl}/admin/download/users`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    return this.handleResponse<Blob>(response);
  }

  async downloadUsersPDF(): Promise<ApiResponse<Blob>> {
    const response = await fetch(`${this.baseUrl}/admin/download/users/pdf`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    return this.handleResponse<Blob>(response);
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, unknown>,
  ): Promise<ApiResponse<T>> {
    try {
      let url = `${this.baseUrl}${endpoint}`;
      if (params && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        }
        url += `?${searchParams.toString()}`;
      }
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    try {
      const headers: HeadersInit = this.getHeaders();

      // Don't set Content-Type for FormData - browser will set it with boundary
      if (body instanceof FormData && "Content-Type" in headers) {
        delete (headers as Record<string, string>)["Content-Type"];
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers,
        body:
          body instanceof FormData
            ? body
            : body
              ? JSON.stringify(body)
              : undefined,
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "PUT",
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async delete<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "DELETE",
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async uploadFile<T>(
    endpoint: string,
    file: File,
    fieldName: string = "file",
  ): Promise<ApiResponse<T>> {
    try {
      const formData = new FormData();
      formData.append(fieldName, file);

      const headers: HeadersInit = {};
      const token = localStorage.getItem("auth_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers,
        body: formData,
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }
}

export const api = new ApiClient(API_BASE_URL);

export const authApi = {
  login: (login: string, password: string) =>
    api.post<{ user: import("../types/auth").User; token: string }>(
      "/auth/login",
      { login, password },
    ),

  signup: (data: import("../types/auth").SignupData) =>
    api.post<{ user: import("../types/auth").User; token: string }>(
      "/auth/signup",
      data,
    ),

  logout: () => api.post("/auth/logout"),

  getMe: () => api.get<{ user: import("../types/auth").User }>("/auth/me"),

  updateProfile: (data: import("../types/auth").UpdateProfileData) =>
    api.put<{ user: import("../types/auth").User }>("/auth/profile", data),

  changePassword: (current_password: string, new_password: string) =>
    api.put("/auth/password", { current_password, new_password }),

  getMyRestrictions: () =>
    api.get<
      {
        id: string;
        flag_type: string;
        reason: string;
        source: string;
        restriction_type: string;
        restriction_days: number;
        restricted_features: string[];
        restricted_at: string;
        restriction_ends_at: string | null;
        is_active: number;
        is_expired: boolean;
        created_at: string;
        appeal_message: string | null;
        appeal_submitted_at: string | null;
        appeal_status: string;
      }[]
    >("/auth/my-restrictions"),

  submitAppeal: (flagId: string, message: string) =>
    api.post(`/auth/appeal/${flagId}`, { message }),

  forgotPassword: (
    email: string,
    student_id: string,
    recovery_email?: string,
  ) => api.post("/auth/forgot-password", { email, student_id, recovery_email }),

  googleLogin: (idToken: string) =>
    api.post<{
      user: import("../types/auth").User;
      token: string;
      isNewUser: boolean;
    }>("/auth/google-login", { idToken }),
};

export const uploadApi = {
  uploadAvatar: (file: File) =>
    api.uploadFile<{ url: string; publicId: string; format: string }>(
      "/upload/avatar",
      file,
      "avatar",
    ),

  uploadPostImages: (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    const headers: HeadersInit = {};
    const token = localStorage.getItem("auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return fetch(`${API_BASE_URL}/upload/post-image`, {
      method: "POST",
      headers,
      body: formData,
    }).then((res) => res.json());
  },
};

export const adminApi = {
  getDashboard: () =>
    api.get<{
      stats: import("../types/auth").AdminDashboardStats;
      recentLogins: unknown[];
      recentUsers: unknown[];
    }>("/admin/dashboard"),

  getUsers: (page = 1, limit = 20, search = "") =>
    api.get<{
      users: import("../types/auth").User[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(
      `/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
    ),

  getUser: (id: string) =>
    api.get<{
      user: import("../types/auth").User;
      loginHistory: import("../types/auth").LoginLog[];
    }>(`/admin/users/${id}`),

  createUser: (data: {
    student_id: string;
    email: string;
    password: string;
    role?: import("../types/auth").UserRole;
  }) => api.post<{ user: import("../types/auth").User }>("/admin/users", data),

  updateUser: (id: string, data: Partial<import("../types/auth").User>) =>
    api.put<{ user: import("../types/auth").User }>(`/admin/users/${id}`, data),

  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

  banUser: (id: string) => api.post(`/admin/users/${id}/ban`),

  unbanUser: (id: string) => api.post(`/admin/users/${id}/unban`),

  resetUserPassword: (id: string, new_password: string) =>
    api.post(`/admin/users/${id}/reset-password`, { new_password }),

  deleteUserHSKData: (id: string) => api.delete(`/admin/users/${id}/hsk-data`),

  deleteUserProfileData: (id: string) =>
    api.delete(`/admin/users/${id}/profile-data`),

  getLoginLogs: (page = 1, limit = 50, userId?: string, status?: string) => {
    let url = `/admin/login-logs?page=${page}&limit=${limit}`;
    if (userId) url += `&userId=${userId}`;
    if (status) url += `&status=${status}`;
    return api.get<{
      logs: import("../types/auth").LoginLog[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(url);
  },

  deleteLoginLog: (id: string) => api.delete(`/admin/login-logs/${id}`),

  deleteAllLoginLogs: () =>
    api.delete<{ deletedCount: number }>("/admin/login-logs"),

  getVisitors: (page = 1, limit = 50) =>
    api.get<{
      visitors: import("../types/auth").VisitorWithUser[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/admin/visitors?page=${page}&limit=${limit}`),

  deleteVisitor: (id: string) => api.delete(`/admin/visitors/${id}`),

  deleteUserVisitors: (userId: string) =>
    api.delete<{ deletedCount: number }>(`/admin/visitors/user/${userId}`),

  deleteAllVisitors: () =>
    api.delete<{ deletedCount: number }>("/admin/visitors"),

  getVisitorStats: (days = 30) =>
    api.get<{
      dailyStats: unknown[];
      totalStats: { total_visits: number; unique_visitors: number };
      pageStats: unknown[];
    }>(`/admin/visitor-stats?days=${days}`),

  getSettings: () => api.get<{ settings: unknown[] }>("/admin/settings"),

  updateSetting: (key: string, value: string) =>
    api.put(`/admin/settings/${key}`, { value }),

  getAllUsers: (page = 1, limit = 10000) =>
    api.get<{
      users: import("../types/auth").User[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/admin/users?page=${page}&limit=${limit}`),

  getSystemHealth: () =>
    api.get<{
      status: string;
      timestamp: string;
      database: {
        connected: boolean;
        latency: number;
        size: number;
        tables: Array<{ name: string; count: number }>;
      };
      errors: { lastHour: number };
      uptime: number;
    }>("/admin/system-health"),

  getActivityFeed: (limit = 20) =>
    api.get<{
      activities: Array<{
        id: string;
        type: string;
        user_id: string;
        user_name: string;
        content: string;
        created_at: string;
      }>;
      total: number;
    }>(`/admin/activity-feed?limit=${limit}`),

  getModerationQueue: () =>
    api.get<{
      queue: Array<{
        id: string;
        type: string;
        content: string;
        author_id: string;
        author_name: string;
        reason: string;
        created_at: string;
      }>;
      counts: {
        flaggedPosts: number;
        recentComments: number;
        bannedUsers: number;
        total: number;
      };
    }>("/admin/moderation-queue"),

  getAnalytics: (days = 7) =>
    api.get<{
      userGrowth: Array<{ date: string; count: number }>;
      postActivity: Array<{ date: string; count: number }>;
      loginActivity: Array<{ date: string; count: number }>;
      engagementStats: Array<{ date: string; likes: number; comments: number }>;
      topUsers: Array<{
        id: string;
        full_name: string;
        post_count: number;
        comment_count: number;
        like_count: number;
      }>;
      departmentStats: Array<{ department: string; count: number }>;
    }>(`/admin/analytics?days=${days}`),

  getFlags: (params: string) =>
    api.get<{
      flags: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/admin/flags?${params}`),

  getFlagStats: () =>
    api.get<{
      totalFlags: number;
      activeRestrictions: number;
      expiredRestrictions: number;
      bySource: { source: string; count: number }[];
    }>("/admin/flags/stats"),

  getFlag: (id: string) => api.get<any>(`/admin/flags/${id}`),

  extendBan: (flagId: string, days: number) =>
    api.post(`/admin/flags/${flagId}/ban`, { days }),

  unbanUserFlag: (flagId: string) => api.post(`/admin/flags/${flagId}/unban`),

  deleteFlag: (flagId: string) => api.delete(`/admin/flags/${flagId}`),

  approveAppeal: (flagId: string) =>
    api.post(`/admin/flags/${flagId}/appeal/approve`),

  rejectAppeal: (flagId: string) =>
    api.post(`/admin/flags/${flagId}/appeal/reject`),

  getUserRestriction: (userId: string) =>
    api.get<{
      is_restricted: boolean;
      restriction?: any;
      restricted_features: string[];
    }>(`/admin/user/${userId}/restriction`),

  getPasswordRecoveryRequests: (page = 1, limit = 20, status = "all") =>
    api.get<{
      requests: Array<{
        id: string;
        user_id: string;
        email: string;
        student_id: string;
        recovery_email: string;
        status: string;
        new_password: string | null;
        resolved_at: string | null;
        resolved_by: string | null;
        created_at: string;
        user_name: string;
        user_full_name: string;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/admin/password-recovery?page=${page}&limit=${limit}&status=${status}`),

  resolvePasswordRecovery: (id: string, new_password: string) =>
    api.post<{ recovery_email: string }>(
      `/admin/password-recovery/${id}/resolve`,
      { new_password },
    ),

  rejectPasswordRecovery: (id: string) =>
    api.post(`/admin/password-recovery/${id}/reject`),

  deletePasswordRecovery: (id: string) =>
    api.delete(`/admin/password-recovery/${id}`),

  clearLoginLogs: () => api.delete("/admin/login-logs/all"),

  clearAdminAuditLogs: () => api.delete("/admin/admin-audit-logs/all"),

  getActivityLogsStats: () =>
    api.get<{
      loginLogs: number;
      adminAuditLogs: number;
    }>("/admin/activity-logs/stats"),

  getGalleryPosts: (page = 1, filters?: { search?: string }) => {
    let url = `/admin/gallery-posts?page=${page}`;
    if (filters?.search) url += `&search=${encodeURIComponent(filters.search)}`;
    return api.get(url);
  },

  createPost: (data: {
    content: string;
    title?: string;
    images?: string[];
    tags?: string[];
    visibility?: string;
    is_pinned?: boolean;
    is_emergency?: boolean;
    location?: string;
    post_type?: string;
  }) => api.post("/admin/social/posts", data),

  uploadImages: (formData: FormData) => {
    return api.post<{ urls: string[] }>("/upload/gallery-image", formData);
  },
};

export const adminDeletedContentApi = {
  getDeletedContent: (
    type?: string,
    search?: string,
    page?: number,
    limit?: number,
  ) => {
    let url = "/admin/deleted-content?";
    if (type) url += `type=${type}&`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (page) url += `page=${page}&`;
    if (limit) url += `limit=${limit}&`;
    return api.get<{
      items: Array<{
        id: string;
        type: string;
        content?: string;
        title?: string;
        description?: string;
        author_name?: string;
        author_id?: string;
        deleted_at?: string;
        created_at?: string;
        [key: string]: unknown;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
      };
    }>(url);
  },

  getStorageStats: () =>
    api.get<{
      posts: { active: number; deleted: number };
      comments: { active: number; deleted: number };
      discordMessages: { active: number; deleted: number };
      languageExchangeMessages: { active: number; deleted: number };
      marketPosts: { active: number; deleted: number };
      totalDeleted: number;
    }>("/admin/storage-stats"),

  hardDeletePost: (id: string) => api.delete(`/admin/posts/${id}/hard`),

  hardDeleteComment: (id: string) => api.delete(`/admin/comments/${id}/hard`),

  hardDeleteMarketPost: (id: string) =>
    api.delete(`/admin/market-posts/${id}/hard`),

  hardDeleteDiscordMessage: (id: string) =>
    api.delete(`/admin/discord-messages/${id}/hard`),

  hardDeleteLanguageExchangeMessage: (id: string) =>
    api.delete(`/admin/language-exchange-messages/${id}/hard`),

  bulkCleanup: (days: number) =>
    api.post<{ deletedCount: number }>("/admin/cleanup", { days }),

  restorePost: (id: string) => api.post(`/admin/posts/${id}/restore`),

  restoreComment: (id: string) => api.post(`/admin/comments/${id}/restore`),

  restoreMarketPost: (id: string) =>
    api.post(`/admin/market-posts/${id}/restore`),

  restoreDiscordMessage: (id: string) =>
    api.post(`/admin/discord-messages/${id}/restore`),

  restoreLanguageExchangeMessage: (id: string) =>
    api.post(`/admin/language-exchange-messages/${id}/restore`),

  clearLoginLogs: () => api.delete("/admin/login-logs/all"),

  clearAdminAuditLogs: () => api.delete("/admin/admin-audit-logs/all"),

  getActivityLogsStats: () =>
    api.get<{
      loginLogs: number;
      adminAuditLogs: number;
    }>("/admin/activity-logs/stats"),
};

export const visitorApi = {
  track: (page_visited: string, referrer?: string, visit_type?: string) =>
    api.post("/visitors/track", { page_visited, referrer, visit_type }),

  getStats: () =>
    api.get<import("../types/auth").VisitorStats>("/visitors/stats"),
};

export const hskApi = {
  // Vocabulary (HSK 2026)
  getVocabulary: (level: number | string) =>
    api.get(`/hsk/vocabulary/${level}`),

  // Progress
  getProgress: () => api.get("/hsk/progress"),

  getLevelProgress: (level: number) => api.get(`/hsk/progress/${level}`),

  updateProgress: (data: any) => api.put("/hsk/progress", data),

  // Quiz results
  getQuizResults: () => api.get("/hsk/quiz-results"),

  addQuizResult: (data: any) => api.post("/hsk/quiz-results", data),

  // Bookmarks
  getBookmarks: () => api.get("/hsk/bookmarks"),

  addBookmark: (resource_id: string) =>
    api.post("/hsk/bookmarks", { resource_id }),

  removeBookmark: (resource_id: string) =>
    api.delete(`/hsk/bookmarks/${resource_id}`),

  // Favorite partners
  getFavoritePartners: () => api.get("/hsk/favorite-partners"),

  addFavoritePartner: (partner_id: string) =>
    api.post("/hsk/favorite-partners", { partner_id }),

  removeFavoritePartner: (partner_id: string) =>
    api.delete(`/hsk/favorite-partners/${partner_id}`),

  // Word lists
  getWordLists: () => api.get("/hsk/word-lists"),

  addWordList: (data: any) => api.post("/hsk/word-lists", data),

  removeWordList: (id: string) => api.delete(`/hsk/word-lists/${id}`),

  // Data management
  clearData: () => api.delete("/hsk/clear-data"),

  // HSK 2026 Learned Words
  getLearnedWords: () => api.get("/hsk/learned-words"),
  toggleLearnedWord: (word: {
    word_id: number;
    word: string;
    pinyin: string;
    english: string;
    pos?: string;
    level: number;
  }) => api.post("/hsk/learned-words", word),

  // HSK 2026 Saved Words
  getSavedWords: () => api.get("/hsk/saved-words"),
  toggleSavedWord: (word: {
    word_id: number;
    word: string;
    pinyin: string;
    english: string;
    pos?: string;
    level: number;
  }) => api.post("/hsk/saved-words", word),
  removeSavedWord: (wordId: number) => api.delete(`/hsk/saved-words/${wordId}`),

  // Global search - search across all HSK levels
  searchAllWords: async (
    query: string,
    level?: number,
    limit: number = 100,
  ) => {
    let url = `/hsk/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    if (level) {
      url += `&level=${level}`;
    }
    const response = await api.get(url);
    return response.data || [];
  },
};

export const hskGrammarApi = {
  getGrammarByLevel: (level: number, page = 1, limit = 50, topic?: string) => {
    let url = `/hsk/grammar/${level}?page=${page}&limit=${limit}`;
    if (topic) url += `&topic=${encodeURIComponent(topic)}`;
    return api.get<import("../types/hsk").GrammarDataResponse>(url);
  },

  searchGrammar: (query: string, level?: number, page = 1, limit = 50) => {
    let url = `/hsk/grammar/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
    if (level) url += `&level=${level}`;
    return api.get<import("../types/hsk").GrammarDataResponse>(url);
  },

  getTopics: (level: number) =>
    api.get<import("../types/hsk").GrammarTopic[]>(
      `/hsk/grammar/topics/${level}`,
    ),

  getStats: () =>
    api.get<import("../types/hsk").GrammarStats[]>("/hsk/grammar/stats"),

  getAudioUrl: (level: number, filename: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
    return `${baseUrl}/hsk/audio/${level}/${filename}`;
  },
};

export const galleryApi = {
  getPosts: (
    page = 1,
    limit = 20,
    filters?: { tag?: string; search?: string },
  ) => {
    let url = `/social/gallery?page=${page}&limit=${limit}`;
    if (filters?.tag) url += `&tag=${encodeURIComponent(filters.tag)}`;
    if (filters?.search) url += `&search=${encodeURIComponent(filters.search)}`;
    return api.get(url);
  },

  getPost: (id: string) => api.get(`/social/gallery/${id}`),

  uploadImages: (formData: FormData) => {
    return api.post<{ urls: string[] }>("/upload/gallery-image", formData);
  },

  createPost: (data: {
    content: string;
    images: string[];
    title: string;
    location?: string;
    tags?: string[];
    mentions?: string[];
  }) =>
    api.post("/social/posts", {
      ...data,
      post_type: "gallery",
      visibility: "public",
    }),

  updatePost: (
    id: string,
    data: {
      title?: string;
      content?: string;
      images?: string[];
      location?: string;
      tags?: string[];
    },
  ) => api.put(`/social/posts/${id}`, data),

  likePost: (postId: string) => api.post(`/social/posts/${postId}/like`),
  unlikePost: (postId: string) => api.post(`/social/posts/${postId}/like`),
  addComment: (postId: string, content: string) =>
    api.post(`/social/posts/${postId}/comments`, { content }),
  deletePost: (postId: string) => api.delete(`/social/posts/${postId}`),
  incrementView: (postId: string) => api.post(`/social/posts/${postId}/view`),
};

export const socialApi = {
  getFeed: (page = 1, limit = 20, emergencyOnly = false) => {
    let url = `/social/feed?page=${page}&limit=${limit}`;
    if (emergencyOnly) url += "&emergency_only=true";
    return api.get<import("../types/social").FeedResponse>(url);
  },

  getPost: (id: string) =>
    api.get<import("../types/social").Post>(`/social/posts/${id}`),

  createPost: (data: import("../types/social").CreatePostData) =>
    api.post<import("../types/social").Post>("/social/posts", data),

  updatePost: (id: string, data: import("../types/social").UpdatePostData) =>
    api.put<import("../types/social").Post>(`/social/posts/${id}`, data),

  deletePost: (id: string) => api.delete(`/social/posts/${id}`),

  getMyPosts: (page = 1, limit = 20) =>
    api.get<import("../types/social").FeedResponse>(
      `/social/my-posts?page=${page}&limit=${limit}`,
    ),

  likePost: (id: string) =>
    api.post<{ liked: boolean }>(`/social/posts/${id}/like`),

  sharePost: (id: string) =>
    api.post<{ shareId: string }>(`/social/posts/${id}/share`),

  incrementView: (id: string) => api.post(`/social/posts/${id}/view`),

  getComments: (postId: string, page = 1, limit = 20) =>
    api.get<import("../types/social").CommentsResponse>(
      `/social/posts/${postId}/comments?page=${page}&limit=${limit}`,
    ),

  createComment: (
    postId: string,
    data: import("../types/social").CreateCommentData,
  ) =>
    api.post<import("../types/social").Comment>(
      `/social/posts/${postId}/comments`,
      data,
    ),

  updateComment: (id: string, content: string) =>
    api.put<import("../types/social").Comment>(`/social/comments/${id}`, {
      content,
    }),

  deleteComment: (id: string) => api.delete(`/social/comments/${id}`),

  likeComment: (id: string) =>
    api.post<{ liked: boolean }>(`/social/comments/${id}/like`),

  getNotifications: (page = 1, limit = 20, unreadOnly = false) => {
    let url = `/social/notifications?page=${page}&limit=${limit}`;
    if (unreadOnly) url += "&unread_only=true";
    return api.get<import("../types/social").NotificationsResponse>(url);
  },

  markNotificationRead: (id: string) =>
    api.post(`/social/notifications/${id}/read`),

  markAllNotificationsRead: () => api.post("/social/notifications/read-all"),

  getMyPostsWithInteractions: () =>
    api.get<{
      posts: Array<
        import("../types/social").Post & {
          likers: Array<{
            id: string;
            full_name: string;
            avatar_url: string | null;
            liked_at: string;
          }>;
          commenters: Array<{
            id: string;
            full_name: string;
            avatar_url: string | null;
            comment_id: string;
            comment_preview: string;
            commented_at: string;
          }>;
          total_likes: number;
          total_comments: number;
        }
      >;
      total_posts: number;
    }>("/social/my-posts/with-interactions"),

  getPostsByTag: (tag: string, page = 1, limit = 20) =>
    api.get<{
      posts: import("../types/social").Post[];
      tag: string;
      pagination: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
      };
    }>(
      `/social/posts/tag/${encodeURIComponent(tag)}?page=${page}&limit=${limit}`,
    ),
};

export const adminSocialApi = {
  getPosts: (page = 1, limit = 20, visibility?: string, search?: string) => {
    let url = `/admin/social/posts?page=${page}&limit=${limit}`;
    if (visibility) url += `&visibility=${visibility}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return api.get<{
      posts: import("../types/social").Post[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(url);
  },

  deletePost: (id: string) => api.delete(`/admin/social/posts/${id}`),

  lockPost: (id: string) =>
    api.post<{ is_locked: boolean }>(`/admin/social/posts/${id}/lock`),

  pinPost: (id: string) =>
    api.post<{ is_pinned: boolean }>(`/admin/social/posts/${id}/pin`),

  unpinPost: (id: string) =>
    api.post<{ is_pinned: boolean }>(`/admin/social/posts/${id}/pin`),

  getComments: (page = 1, limit = 20, postId?: string) => {
    let url = `/admin/social/comments?page=${page}&limit=${limit}`;
    if (postId) url += `&postId=${postId}`;
    return api.get<{
      comments: (import("../types/social").Comment & {
        author_name: string | null;
        author_student_id: string | null;
        post_content: string | null;
      })[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(url);
  },

  deleteComment: (id: string) => api.delete(`/admin/social/comments/${id}`),

  getAuditLogs: (page = 1, limit = 50, action?: string) => {
    let url = `/admin/social/audit-logs?page=${page}&limit=${limit}`;
    if (action) url += `&action=${encodeURIComponent(action)}`;
    return api.get<{
      logs: import("../types/social").AdminAuditLog[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(url);
  },

  getStats: () =>
    api.get<import("../types/social").AdminPostStats>("/admin/social/stats"),

  getHiddenAndMutedData: () =>
    api.get<{
      hiddenPosts: {
        postId: string;
        userId: string;
        userName: string;
        postContent: string;
        hiddenAt: string;
      }[];
      mutedUsers: {
        mutedUserId: string;
        mutedUserName: string;
        mutedByUserId: string;
        mutedByUserName: string;
        mutedAt: string;
      }[];
    }>("/admin/social/hidden-muted"),
};

export const discordApi = {
  getGroups: () =>
    api.get<import("../types/discord").DiscordGroup[]>("/discord/groups"),

  getGroup: (id: string) =>
    api.get<import("../types/discord").DiscordGroup>(`/discord/groups/${id}`),

  joinGroup: (id: string) => api.post(`/discord/groups/${id}/join`),

  leaveGroup: (id: string) => api.post(`/discord/groups/${id}/leave`),

  getMessages: (groupId: string, page = 1, limit = 50, before?: string) => {
    let url = `/discord/groups/${groupId}/messages?page=${page}&limit=${limit}`;
    if (before) url += `&before=${before}`;
    return api.get<import("../types/discord").DiscordMessage[]>(url);
  },

  sendMessage: (
    groupId: string,
    content: string,
    isAnonymous: boolean = false,
    replyTo?: string,
    imageUrl?: string | null,
  ) =>
    api.post<import("../types/discord").DiscordMessage>(
      `/discord/groups/${groupId}/messages`,
      {
        content,
        is_anonymous: isAnonymous,
        reply_to: replyTo,
        image_url: imageUrl,
      },
    ),

  deleteMessage: (id: string) => api.delete(`/discord/messages/${id}`),

  markMessageViewed: (id: string) =>
    api.post<{ view_count: number }>(`/discord/messages/${id}/view`),

  markMessagesViewedBatch: (messageIds: string[]) =>
    api.post("/discord/messages/views/batch", { messageIds }),

  updatePresence: (status: "online" | "offline" | "away") =>
    api.post("/discord/presence", { status }),

  getOnlineUsers: () =>
    api.get<import("../types/discord").DiscordUserPresence[]>(
      "/discord/presence/online",
    ),

  getGroupMembers: (groupId: string) =>
    api.get<import("../types/discord").DiscordGroupMember[]>(
      `/discord/groups/${groupId}/members`,
    ),

  getMembers: (groupId: string) =>
    api.get<import("../types/discord").DiscordGroupMember[]>(
      `/discord/groups/${groupId}/members`,
    ),

  updateNickname: (
    groupId: string,
    nickname: string,
    displayStudentId: boolean,
  ) =>
    api.put(`/discord/groups/${groupId}/nickname`, {
      nickname,
      display_student_id: displayStudentId,
    }),

  markAsRead: (groupId: string) => api.post(`/discord/groups/${groupId}/read`),
};

export const adminDiscordApi = {
  getStats: () =>
    api.get<import("../types/discord").DiscordGroupStats>(
      "/admin/discord/stats",
    ),

  getGroups: (page = 1, limit = 20, type?: string, search?: string) => {
    let url = `/admin/discord/groups?page=${page}&limit=${limit}`;
    if (type) url += `&type=${type}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return api.get<{
      groups: import("../types/discord").DiscordGroup[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(url);
  },

  createGroup: (data: {
    name: string;
    type: string;
    department?: string;
    year?: number;
    description?: string;
    icon_url?: string;
  }) =>
    api.post<import("../types/discord").DiscordGroup>(
      "/admin/discord/groups",
      data,
    ),

  deleteGroup: (id: string) => api.delete(`/admin/discord/groups/${id}`),

  deleteGroupMessages: (id: string) =>
    api.delete(`/admin/discord/groups/${id}/messages`),

  getMessages: (
    page = 1,
    limit = 50,
    groupId?: string,
    anonymous?: boolean,
    search?: string,
  ) => {
    let url = `/admin/discord/messages?page=${page}&limit=${limit}`;
    if (groupId) url += `&groupId=${groupId}`;
    if (anonymous !== undefined) url += `&anonymous=${anonymous}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return api.get<{
      messages: import("../types/discord").AdminDiscordMessage[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(url);
  },

  deleteMessage: (id: string) => api.delete(`/admin/discord/messages/${id}`),

  getUsers: (page = 1, limit = 50, online?: boolean, search?: string) => {
    let url = `/admin/discord/users?page=${page}&limit=${limit}`;
    if (online !== undefined) url += `&online=${online}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return api.get<{
      users: import("../types/discord").AdminDiscordUser[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(url);
  },

  getBans: () =>
    api.get<import("../types/discord").DiscordBan[]>("/admin/discord/bans"),

  createBan: (data: {
    user_id: string;
    group_id?: string;
    reason: string;
    expires_at?: string;
  }) => api.post("/admin/discord/bans", data),

  deleteBan: (userId: string, groupId?: string) => {
    let url = `/admin/discord/bans/${userId}`;
    if (groupId) url += `?group_id=${groupId}`;
    return api.delete(url);
  },

  getGroupMembers: (groupId: string) =>
    api.get<import("../types/discord").DiscordGroupMember[]>(
      `/discord/groups/${groupId}/members`,
    ),
};

export const eventsApi = {
  // Admin endpoints
  getAllEvents: () =>
    api.get<import("../types/events").Event[]>("/admin/events"),

  createEvent: (data: import("../types/events").CreateEventData) =>
    api.post<import("../types/events").Event>("/admin/events", data),

  updateEvent: (id: string, data: import("../types/events").UpdateEventData) =>
    api.put<import("../types/events").Event>(`/admin/events/${id}`, data),

  deleteEvent: (id: string) => api.delete(`/admin/events/${id}`),

  getInterestedUsers: (eventId: string) =>
    api.get<import("../types/events").EventInterest[]>(
      `/admin/events/${eventId}/interested`,
    ),

  getGoingUsers: (eventId: string) =>
    api.get<import("../types/events").EventGoing[]>(
      `/admin/events/${eventId}/going`,
    ),

  exportEventData: (
    eventId: string,
    type: "all" | "interested" | "going" = "all",
  ) =>
    api.get(`/admin/events/${eventId}/export?type=${type}`, {
      responseType: "blob",
    }),

  // Public endpoints
  getEvents: (limit = 10, offset = 0) =>
    api.get<import("../types/events").Event[]>(
      `/events?limit=${limit}&offset=${offset}`,
    ),

  getLatestEvents: (count = 3) =>
    api.get<import("../types/events").Event[]>(`/events/latest/${count}`),

  getEvent: (id: string) =>
    api.get<
      import("../types/events").Event & {
        user_interested: boolean;
        user_going: boolean;
      }
    >(`/events/${id}`),

  registerInterest: (eventId: string) =>
    api.post(`/events/${eventId}/interest`),

  removeInterest: (eventId: string) =>
    api.delete(`/events/${eventId}/interest`),

  registerGoing: (eventId: string) => api.post(`/events/${eventId}/going`),

  removeGoing: (eventId: string) => api.delete(`/events/${eventId}/going`),

  // Image upload - using direct fetch like social posts
  uploadImage: (formData: FormData) => {
    const headers: HeadersInit = {};
    const token = localStorage.getItem("auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return fetch(`${API_BASE_URL}/upload/image`, {
      method: "POST",
      headers,
      body: formData,
    }).then((res) => res.json());
  },
};

export const marketApi = {
  getPosts: (
    options: {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      search?: string;
      page?: number;
      limit?: number;
    } = {},
  ) => {
    const {
      category,
      minPrice,
      maxPrice,
      search,
      page = 1,
      limit = 12,
    } = options;
    let url = `/market/posts?limit=${limit}&offset=${(page - 1) * limit}`;
    if (category) url += `&category=${category}`;
    if (minPrice !== undefined) url += `&minPrice=${minPrice}`;
    if (maxPrice !== undefined) url += `&maxPrice=${maxPrice}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return api.get<
      import("../types/market").MarketPost[] & {
        total: number;
        page: number;
        totalPages: number;
      }
    >(url);
  },

  getLatestPosts: (count = 4) =>
    api.get<import("../types/market").MarketPost[]>(
      `/market/posts/latest/${count}`,
    ),

  getMyPosts: () =>
    api.get<import("../types/market").MarketPost[]>("/market/my-posts"),

  getPost: (id: string) =>
    api.get<import("../types/market").MarketPost>(`/market/posts/${id}`),

  createPost: (data: {
    title: string;
    description: string;
    price: number;
    category: string;
    condition: string;
    images?: string[];
    tags?: string[];
    phone_number?: string;
    reference_links?: string[];
  }) => api.post<import("../types/market").MarketPost>("/market/posts", data),

  updatePost: (
    id: string,
    data: Partial<{
      title: string;
      description: string;
      price: number;
      category: string;
      condition: string;
      images?: string[];
      tags?: string[];
      phone_number?: string;
      reference_links?: string[];
    }>,
  ) =>
    api.put<import("../types/market").MarketPost>(`/market/posts/${id}`, data),

  deletePost: (id: string) => api.delete(`/market/posts/${id}`),

  markAsSold: (id: string) =>
    api.post<import("../types/market").MarketPost>(`/market/posts/${id}/sold`),

  downloadPosts: (status?: string) => {
    let url = "/admin/market/posts/export?";
    if (status) url += `status=${status}&`;
    return api.get<{
      posts: import("../types/market").MarketPost[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(url);
  },

  likePost: (id: string) =>
    api.post<{ liked: boolean }>(`/market/posts/${id}/like`),

  unlikePost: (id: string) =>
    api.delete<{ liked: boolean }>(`/market/posts/${id}/like`),

  getComments: (postId: string) =>
    api.get<import("../types/market").MarketComment[]>(
      `/market/posts/${postId}/comments`,
    ),

  addComment: (postId: string, content: string, parentId?: string) =>
    api.post<import("../types/market").MarketComment>(
      `/market/posts/${postId}/comments`,
      { content, parent_id: parentId },
    ),

  deleteComment: (postId: string, commentId: string) =>
    api.delete<{ success: boolean }>(
      `/market/posts/${postId}/comments/${commentId}`,
    ),

  createBuyRequest: (postId: string) =>
    api.post<import("../types/market").MarketBuyRequest>(
      `/market/posts/${postId}/buy-request`,
    ),

  uploadImages: (formData: FormData) => {
    const headers: HeadersInit = {};
    const token = localStorage.getItem("auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return fetch(`${API_BASE_URL}/upload/market-image`, {
      method: "POST",
      headers,
      body: formData,
    }).then((res) => res.json());
  },
};

export const adminMarketApi = {
  getPosts: (status?: string, category?: string) => {
    let url = "/admin/market/posts?";
    if (status) url += `status=${status}&`;
    if (category) url += `category=${category}&`;
    return api.get<{
      posts: import("../types/market").MarketPost[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(url);
  },

  createPost: (data: {
    title: string;
    description: string;
    price: number;
    category: string;
    condition: string;
    phone_number?: string;
    images?: string[];
  }) =>
    api.post<import("../types/market").MarketPost>("/admin/market/posts", data),

  deletePost: (id: string) => api.delete(`/admin/market/posts/${id}`),

  getBuyRequests: (status?: string) => {
    let url = "/admin/market/buy-requests?";
    if (status) url += `status=${status}&`;
    return api.get<{
      requests: import("../types/market").MarketBuyRequest[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(url);
  },

  processBuyRequest: (
    id: string,
    status: "approved" | "rejected" | "completed",
    adminNotes?: string,
  ) =>
    api.put<import("../types/market").MarketBuyRequest>(
      `/admin/market/buy-requests/${id}`,
      { status, admin_notes: adminNotes },
    ),

  getStats: () =>
    api.get<import("../types/market").MarketStats>("/admin/market/stats"),
};

export const marketChatApi = {
  // User endpoints
  createSession: (postId: string) =>
    api.post<{
      session: {
        id: string;
        post_id: string;
        buyer_id: string;
        seller_id: string;
        status: string;
        created_at: string;
        post_title: string;
      };
      participants: {
        buyer: { id: string; name: string; avatar: string | null };
        seller: { id: string; name: string; avatar: string | null };
      };
    }>("/market/chat/session", { postId }),

  getSessions: () =>
    api.get<
      Array<{
        id: string;
        post_id: string;
        buyer_id: string;
        seller_id: string;
        status: string;
        post_title: string;
        post_price: number;
        post_images: string[];
        other_user_id: string;
        other_user_name: string;
        other_user_avatar: string | null;
        unread_count: number;
        last_message: string | null;
        last_message_time: string | null;
        created_at: string;
      }>
    >("/market/chat/sessions"),

  getMessages: (sessionId: string, limit = 50, offset = 0) =>
    api.get<
      Array<{
        id: string;
        session_id: string;
        sender_id: string;
        sender_name: string;
        sender_avatar: string | null;
        content: string;
        is_read: number;
        read_at: string | null;
        created_at: string;
      }>
    >(
      `/market/chat/sessions/${sessionId}/messages?limit=${limit}&offset=${offset}`,
    ),

  sendMessage: (sessionId: string, content: string) =>
    api.post<{
      id: string;
      session_id: string;
      sender_id: string;
      sender_name: string;
      sender_avatar: string | null;
      content: string;
      is_read: number;
      created_at: string;
    }>(`/market/chat/sessions/${sessionId}/messages`, { content }),

  getUnreadCount: () =>
    api.get<{ unreadCount: number }>("/market/chat/unread-count"),

  getPostSessions: (postId: string) =>
    api.get<
      Array<{
        id: string;
        post_id: string;
        buyer_id: string;
        seller_id: string;
        status: string;
        buyer_name: string;
        buyer_avatar: string | null;
        last_message: string;
        last_message_time: string;
        unread_count: number;
        created_at: string;
      }>
    >(`/market/chat/post/${postId}/sessions`),

  deleteSession: (sessionId: string) =>
    api.delete(`/market/chat/sessions/${sessionId}`),
};

export const adminMarketChatApi = {
  // Admin endpoints
  getSessions: (filters?: {
    postId?: string;
    status?: string;
    isDeleted?: boolean;
  }) => {
    let url = "/admin/market/chat/sessions?";
    if (filters?.postId) url += `postId=${filters.postId}&`;
    if (filters?.status) url += `status=${filters.status}&`;
    if (filters?.isDeleted !== undefined)
      url += `isDeleted=${filters.isDeleted}&`;
    return api.get<
      Array<{
        id: string;
        post_id: string;
        buyer_id: string;
        seller_id: string;
        status: string;
        is_deleted: number;
        deleted_at: string | null;
        deleted_by: string | null;
        created_at: string;
        post_title: string;
        post_price: number;
        buyer_name: string;
        buyer_avatar: string | null;
        seller_name: string;
        seller_avatar: string | null;
        message_count: number;
        deleted_by_name: string | null;
      }>
    >(url);
  },

  getSessionDetails: (sessionId: string) =>
    api.get<{
      session: {
        id: string;
        post_id: string;
        buyer_id: string;
        seller_id: string;
        status: string;
        is_deleted: number;
        deleted_at: string | null;
        deleted_by: string | null;
        created_at: string;
        post_title: string;
        post_price: number;
        post_images: string[];
        buyer_name: string;
        buyer_avatar: string | null;
        seller_name: string;
        seller_avatar: string | null;
        deleted_by_name: string | null;
      };
      messages: Array<{
        id: string;
        session_id: string;
        sender_id: string;
        sender_name: string;
        sender_avatar: string | null;
        content: string;
        is_read: number;
        read_at: string | null;
        created_at: string;
      }>;
      auditLog: Array<{
        id: string;
        action: string;
        performed_by: string;
        performer_name: string;
        details: string;
        ip_address: string;
        created_at: string;
      }>;
    }>(`/admin/market/chat/sessions/${sessionId}`),

  softDeleteSession: (sessionId: string, reason?: string) =>
    api.delete(`/admin/market/chat/sessions/${sessionId}`, { reason }),

  hardDeleteSession: (sessionId: string, reason?: string) =>
    api.delete(`/admin/market/chat/sessions/${sessionId}/permanent`, {
      reason,
    }),

  restoreSession: (sessionId: string) =>
    api.post(`/admin/market/chat/sessions/${sessionId}/restore`),

  getStats: () =>
    api.get<{
      totalSessions: number;
      activeSessions: number;
      deletedSessions: number;
      totalMessages: number;
      unreadMessages: number;
      sessionsToday: number;
      messagesToday: number;
      inactiveSessions: number;
    }>("/admin/market/chat/stats"),

  cleanupInactive: (daysInactive = 7) =>
    api.post<{ cleanedCount: number }>("/admin/market/chat/cleanup", {
      daysInactive,
    }),
};

export const chatbotApi = {
  sendMessage: (message: string) =>
    api.post<{
      message: string;
      link?: string;
      linkText?: string;
      confidence: number;
      suggestions?: string[];
    }>("/chatbot/chat", { message }),

  getSuggestions: () => api.get<string[]>("/chatbot/suggestions"),
};

export const xingyuanAdminApi = {
  getStats: () =>
    api.get<{
      success: boolean;
      data: {
        totalChats: number;
        activeChats: number;
        deletedChats: number;
        totalMessages: number;
        totalTokens: number;
        userChats: number;
        guestChats: number;
        uniqueUsers: number;
        uniqueGuests: number;
        imagesWithContent: number;
        todayMessages: number;
        todayTokens: number;
      };
    }>("/admin/xingyuan/stats"),

  getChats: (params?: {
    page?: number;
    limit?: number;
    filter?: string;
    search?: string;
  }) => api.get("/admin/xingyuan/chats", params as Record<string, unknown>),

  getChatMessages: (chatId: string) =>
    api.get<
      Array<{
        id: string;
        chat_id: string;
        user_id: string | null;
        role: string;
        content: string | null;
        images: string;
        thinking: string | null;
        is_deleted: number;
        token_count: number;
        created_at: string;
      }>
    >(`/admin/xingyuan/chats/${chatId}/messages`),

  getUsers: () =>
    api.get<
      Array<{
        user_id: string;
        full_name: string | null;
        email: string | null;
        student_id: string | null;
        total_chats: number;
        active_chats: number;
        total_messages: number;
        total_tokens: number;
        image_uploads: number;
        last_active: string | null;
      }>
    >("/admin/xingyuan/users"),

  getGuests: () =>
    api.get<
      Array<{
        ip_address: string;
        user_agent: string | null;
        session_count: number;
        total_messages: number;
        total_tokens: number;
        first_seen: string;
        last_seen: string;
      }>
    >("/admin/xingyuan/guests"),

  hardDeleteChat: (chatId: string) =>
    api.delete(`/admin/xingyuan/chats/${chatId}/hard`),

  hardDeleteMessage: (messageId: string) =>
    api.delete(`/admin/xingyuan/messages/${messageId}/hard`),

  hardDeleteGuestData: (ipAddress: string) =>
    api.delete(`/admin/xingyuan/guest/${encodeURIComponent(ipAddress)}/hard`),

  getUserChats: (userId: string) =>
    api.get<
      Array<{
        id: string;
        session_id: string;
        title: string | null;
        model: string;
        is_deleted: number;
        created_at: string;
        updated_at: string;
        message_count: number;
      }>
    >(`/admin/xingyuan/users/${userId}/chats`),

  hardDeleteUserData: (userId: string) =>
    api.delete(`/admin/xingyuan/users/${userId}/hard`),

  hardDeleteAllData: () =>
    api.delete<{
      success: boolean;
      message: string;
      deleted: { chats: number; messages: number };
    }>("/admin/xingyuan/all/hard"),
};
