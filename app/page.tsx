"use client";

import { useState, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════ */
interface Account {
  id: string;
  name: string;
  platform: string;
  username: string;
  persona: string;
  tone: string;
  target_audience: string;
  posting_frequency: string;
  avatar_url: string | null;
  buffer_profile_id: string | null;
  is_active: boolean;
  created_at: string;
}

interface Post {
  id: string;
  account_id: string;
  caption: string;
  image_url: string | null;
  image_prompt: string | null;
  theme: string | null;
  hashtags: string[];
  status: string;
  scheduled_at: string | null;
  posted_at: string | null;
  created_at: string;
  accounts?: { name: string; platform: string };
}

interface BufferProfile {
  id: string;
  service: string;
  service_username: string;
  formatted_username: string;
}

interface TrendItem {
  title: string;
  description: string;
  hashtags: string[];
  post_theme: string;
  source: string;
  source_url: string;
  image_url: string;
  image_keywords: string;
}

type View = "dashboard" | "create" | "accounts" | "history" | "trends" | "settings";

interface OnboardingData {
  geminiKey: string;
  bufferKey: string;
  firstAccount: {
    name: string;
    platform: string;
    username: string;
    persona: string;
    tone: string;
    target_audience: string;
  };
}

/* ═══════════════════════════════════════════════════
   Icons (inline SVG)
   ═══════════════════════════════════════════════════ */
const Icon = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  create: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  accounts: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  history: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  plus: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  sparkle: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
    </svg>
  ),
  send: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  trash: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  image: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  upload: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  arrow: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  refresh: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
  trends: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  fire: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1 0 12 0c0-1.532-1.056-3.94-2-5-1.786 3-2.791 3-4 2z" />
    </svg>
  ),
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E1306C",
  twitter: "#1DA1F2",
  tiktok: "#00f2ea",
  facebook: "#1877F2",
  linkedin: "#0A66C2",
  threads: "#000000",
  bluesky: "#0085FF",
  youtube: "#FF0000",
  mastodon: "#6364FF",
  pinterest: "#E60023",
  googlebusiness: "#4285F4",
  startpage: "#6366f1",
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  twitter: "X (Twitter)",
  tiktok: "TikTok",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  threads: "Threads",
  bluesky: "Bluesky",
  youtube: "YouTube",
  mastodon: "Mastodon",
  pinterest: "Pinterest",
  googlebusiness: "Google Business",
  startpage: "Start Page",
};

/* ═══════════════════════════════════════════════════
   Helper: Fetch wrapper
   ═══════════════════════════════════════════════════ */
async function api<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API Error ${res.status}: ${body}`);
  }
  return res.json();
}

/* ═══════════════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════════════ */
const s = {
  // Layout
  shell: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    background: "#08080c",
  } as React.CSSProperties,
  sidebar: {
    width: 260,
    minWidth: 260,
    background: "#0c0c12",
    borderRight: "1px solid #1a1a24",
    display: "flex",
    flexDirection: "column",
    padding: "20px 0",
  } as React.CSSProperties,
  sidebarLogo: {
    padding: "0 24px 24px",
    borderBottom: "1px solid #1a1a24",
    marginBottom: 8,
  } as React.CSSProperties,
  sidebarNav: {
    flex: 1,
    padding: "8px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  } as React.CSSProperties,
  navItem: (active: boolean) =>
    ({
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 14px",
      borderRadius: 10,
      cursor: "pointer",
      fontSize: 14,
      fontWeight: active ? 600 : 400,
      color: active ? "#fff" : "#71717a",
      background: active ? "#18182a" : "transparent",
      border: "none",
      width: "100%",
      textAlign: "left",
      transition: "all 0.15s",
    }) as React.CSSProperties,
  main: {
    flex: 1,
    overflow: "auto",
    padding: "32px 40px",
  } as React.CSSProperties,

  // Cards
  card: {
    background: "#0f0f18",
    border: "1px solid #1a1a24",
    borderRadius: 14,
    padding: 24,
    marginBottom: 20,
  } as React.CSSProperties,
  cardHeader: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 16,
    color: "#f4f4f5",
  } as React.CSSProperties,

  // Stats
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 16,
    marginBottom: 28,
  } as React.CSSProperties,
  statCard: (color: string) =>
    ({
      background: `linear-gradient(135deg, ${color}12, ${color}06)`,
      border: `1px solid ${color}25`,
      borderRadius: 14,
      padding: "20px 22px",
    }) as React.CSSProperties,
  statValue: {
    fontSize: 32,
    fontWeight: 800,
    color: "#f4f4f5",
    lineHeight: 1,
  } as React.CSSProperties,
  statLabel: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 6,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  } as React.CSSProperties,

  // Forms
  formGroup: {
    marginBottom: 18,
  } as React.CSSProperties,
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#a1a1aa",
    marginBottom: 6,
  } as React.CSSProperties,
  input: {
    width: "100%",
    padding: "10px 14px",
    background: "#14141e",
    border: "1px solid #27273a",
    borderRadius: 10,
    color: "#e4e4e7",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  } as React.CSSProperties,
  textarea: {
    width: "100%",
    padding: "10px 14px",
    background: "#14141e",
    border: "1px solid #27273a",
    borderRadius: 10,
    color: "#e4e4e7",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    minHeight: 100,
    resize: "vertical" as const,
    fontFamily: "inherit",
  } as React.CSSProperties,
  select: {
    width: "100%",
    padding: "10px 14px",
    background: "#14141e",
    border: "1px solid #27273a",
    borderRadius: 10,
    color: "#e4e4e7",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    cursor: "pointer",
  } as React.CSSProperties,

  // Buttons
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 22px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  } as React.CSSProperties,
  btnSecondary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 22px",
    background: "#1a1a2e",
    color: "#e4e4e7",
    border: "1px solid #27273a",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
  } as React.CSSProperties,
  btnDanger: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 16px",
    background: "transparent",
    color: "#ef4444",
    border: "1px solid #ef444440",
    borderRadius: 8,
    fontSize: 13,
    cursor: "pointer",
  } as React.CSSProperties,
  btnSmall: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    background: "#1a1a2e",
    color: "#a1a1aa",
    border: "1px solid #27273a",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
  } as React.CSSProperties,

  // Tags
  tag: (color: string) =>
    ({
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      background: `${color}18`,
      color: color,
      border: `1px solid ${color}30`,
    }) as React.CSSProperties,

  // Table
  table: {
    width: "100%",
    borderCollapse: "collapse",
  } as React.CSSProperties,
  th: {
    textAlign: "left" as const,
    padding: "10px 14px",
    fontSize: 12,
    fontWeight: 600,
    color: "#71717a",
    borderBottom: "1px solid #1a1a24",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  td: {
    padding: "14px",
    fontSize: 14,
    color: "#d4d4d8",
    borderBottom: "1px solid #1a1a240a",
  },

  // Onboarding
  onboardingOverlay: {
    position: "fixed",
    inset: 0,
    background: "#08080c",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  } as React.CSSProperties,
  onboardingCard: {
    width: "100%",
    maxWidth: 560,
    background: "#0f0f18",
    border: "1px solid #1a1a24",
    borderRadius: 20,
    padding: "40px 44px",
  } as React.CSSProperties,
  stepIndicator: {
    display: "flex",
    gap: 8,
    marginBottom: 32,
  } as React.CSSProperties,
  stepDot: (active: boolean, done: boolean) =>
    ({
      flex: 1,
      height: 4,
      borderRadius: 2,
      background: done ? "#6366f1" : active ? "#6366f180" : "#27273a",
      transition: "all 0.3s",
    }) as React.CSSProperties,

  // Spinner
  spinner: {
    display: "inline-block",
    width: 18,
    height: 18,
    border: "2px solid #6366f140",
    borderTopColor: "#6366f1",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite",
  } as React.CSSProperties,

  // Empty state
  empty: {
    textAlign: "center" as const,
    padding: "60px 20px",
    color: "#52525b",
  },

  // Preview image
  previewImage: {
    width: "100%",
    maxHeight: 300,
    objectFit: "cover" as const,
    borderRadius: 12,
    marginTop: 12,
    border: "1px solid #27273a",
  },
};

/* ═══════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════ */
export default function Dashboard() {
  // State
  const [view, setView] = useState<View>("dashboard");
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    geminiKey: "",
    bufferKey: "",
    firstAccount: {
      name: "",
      platform: "instagram",
      username: "",
      persona: "",
      tone: "casual",
      target_audience: "",
    },
  });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [bufferProfiles, setBufferProfiles] = useState<BufferProfile[]>([]);

  // Create post state
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [theme, setTheme] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [imageCount, setImageCount] = useState(1);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [generatedCaption, setGeneratedCaption] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generatedImageUrls, setGeneratedImageUrls] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [generatedPostId, setGeneratedPostId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);

  // Auto-post settings
  const [autoPostEnabled, setAutoPostEnabled] = useState(false);
  const [autoPostUseTrends, setAutoPostUseTrends] = useState(false);
  const [autoPostThemes, setAutoPostThemes] = useState("");
  const [savingAutoPost, setSavingAutoPost] = useState(false);

  // Trends state
  const [trendCategory, setTrendCategory] = useState("beauty");
  const [trendCustomQuery, setTrendCustomQuery] = useState("");
  const [trendResults, setTrendResults] = useState<TrendItem[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendFetchedAt, setTrendFetchedAt] = useState<string | null>(null);

  // Account form state
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Partial<Account> | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);

  // Settings
  const [settingsGemini, setSettingsGemini] = useState("");
  const [settingsBuffer, setSettingsBuffer] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  /* ─── Init (一括取得で高速化) ─── */
  const fetchAll = useCallback(async () => {
    try {
      const data = await api<{
        accounts: Account[];
        posts: Post[];
        bufferProfiles: BufferProfile[];
        status: {
          onboarding_completed: boolean;
          gemini_configured: boolean;
          buffer_configured: boolean;
          account_count: number;
        };
      }>("/api/init");
      if (!data.status.onboarding_completed) {
        setShowOnboarding(true);
      } else {
        setAccounts(data.accounts || []);
        setPosts(data.posts || []);
        setBufferProfiles(data.bufferProfiles || []);
      }
    } catch {
      setShowOnboarding(true);
    }
    setLoading(false);
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await api<Account[]>("/api/accounts");
      setAccounts(data);
    } catch {}
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      const data = await api<Post[]>("/api/posts?limit=50");
      setPosts(data);
    } catch {}
  }, []);

  const fetchProfiles = useCallback(async () => {
    try {
      const data = await api<{ bufferProfiles: BufferProfile[] }>("/api/profiles");
      setBufferProfiles(data.bufferProfiles || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ─── Onboarding ─── */
  const handleOnboardingNext = async () => {
    if (onboardingStep < 2) {
      setOnboardingStep((s) => s + 1);
      return;
    }
    // Final step - save everything
    try {
      // Save settings
      await api("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "gemini_api_key", value: onboardingData.geminiKey }),
      });
      await api("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "buffer_api_key", value: onboardingData.bufferKey }),
      });

      // Create first account
      const acc = onboardingData.firstAccount;
      if (acc.name && acc.username) {
        await api("/api/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: acc.name,
            platform: acc.platform,
            username: acc.username,
            persona: acc.persona,
            tone: acc.tone,
            target_audience: acc.target_audience,
          }),
        });
      }

      // Mark onboarding done
      await api("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "onboarding_completed", value: true }),
      });

      setShowOnboarding(false);
    } catch (e) {
      showToast("セットアップ中にエラーが発生しました。もう一度お試しください。", "error");
    }
  };

  /* ─── Generate ─── */
  const handleGenerate = async () => {
    if (!selectedAccountId) return;
    setGenerating(true);
    setGeneratedCaption("");
    setGeneratedImage(null);
    setGeneratedImages([]);
    setGeneratedImageUrls([]);
    setSelectedImageIndex(0);
    setGeneratedPostId(null);
    try {
      const data = await api<{
        post_text: string;
        image_prompt: string;
        image_data: string | null;
        images: string[];
        image_urls: string[];
        image_count: number;
        post_id: string;
      }>("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: selectedAccountId,
          theme,
          image_count: imageCount,
          reference_image: referenceImage,
        }),
      });
      // ハッシュタグが指定されていて生成テキストに含まれていなければ追加
      let caption = data.post_text;
      if (hashtags.trim() && !caption.includes(hashtags.trim())) {
        caption = caption.trimEnd() + "\n\n" + hashtags.trim();
      }
      setGeneratedCaption(caption);
      setGeneratedImages(data.images || []);
      setGeneratedImageUrls(data.image_urls || []);
      setGeneratedImage(data.images?.[0] || data.image_data);
      setSelectedImageIndex(0);
      setGeneratedPostId(data.post_id);
      if (data.image_count > 0) {
        showToast(`${data.image_count}枚の画像を生成しました`, "success");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "生成に失敗しました";
      showToast(msg, "error");
    }
    setGenerating(false);
  };

  /* ─── Reference Image ─── */
  const handleReferenceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("画像ファイルを選択してください", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReferenceImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  /* ─── Post ─── */
  const handlePost = async () => {
    if (!generatedPostId) return;
    setPosting(true);
    try {
      // Storage URLがあればそれを使用、なければbase64を送信
      const urlsToSend = generatedImageUrls.length > 0
        ? generatedImageUrls
        : generatedImages.length > 0
          ? generatedImages
          : undefined;
      await api("/api/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: generatedPostId,
          image_urls: urlsToSend,
        }),
      });
      const imgCount = generatedImageUrls.length || generatedImages.length;
      showToast(`投稿が完了しました！${imgCount > 1 ? `（${imgCount}枚の画像付き）` : ""}`, "success");
      setGeneratedCaption("");
      setGeneratedImage(null);
      setGeneratedImages([]);
      setGeneratedImageUrls([]);
      setSelectedImageIndex(0);
      setGeneratedPostId(null);
      fetchPosts();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "投稿に失敗しました";
      showToast(msg, "error");
    }
    setPosting(false);
  };

  /* ─── Account CRUD ─── */
  const handleSaveAccount = async () => {
    if (!editingAccount?.name) {
      showToast("アカウント名を入力してください", "error");
      return;
    }
    if (savingAccount) return;
    setSavingAccount(true);
    try {
      await api("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingAccount),
      });
      setShowAccountForm(false);
      setEditingAccount(null);
      fetchAccounts();
      showToast("アカウントを保存しました", "success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "保存に失敗しました";
      showToast(msg, "error");
    } finally {
      setSavingAccount(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm("このアカウントを削除しますか？")) return;
    try {
      await api(`/api/accounts?id=${id}`, { method: "DELETE" });
      fetchAccounts();
    } catch {}
  };

  /* ─── Settings ─── */
  const fetchSettings = useCallback(async () => {
    try {
      const data = await api<{ settings: Record<string, unknown> }>("/api/settings");
      const s = data.settings;
      if (s.gemini_api_key && typeof s.gemini_api_key === "string") setSettingsGemini(s.gemini_api_key);
      if (s.buffer_api_key && typeof s.buffer_api_key === "string") setSettingsBuffer(s.buffer_api_key);
      // Auto-post settings
      if (s.auto_post_enabled !== undefined) {
        setAutoPostEnabled(s.auto_post_enabled === true || s.auto_post_enabled === "true");
      }
      if (s.auto_post_use_trends !== undefined) {
        setAutoPostUseTrends(s.auto_post_use_trends === true || s.auto_post_use_trends === "true");
      }
      if (s.auto_post_themes) {
        try {
          const themes = typeof s.auto_post_themes === "string"
            ? JSON.parse(s.auto_post_themes as string)
            : s.auto_post_themes;
          if (Array.isArray(themes)) setAutoPostThemes(themes.join("\n"));
        } catch {
          if (typeof s.auto_post_themes === "string") setAutoPostThemes(s.auto_post_themes as string);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (view === "settings") fetchSettings();
  }, [view, fetchSettings]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      if (settingsGemini) {
        await api("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "gemini_api_key", value: settingsGemini }),
        });
      }
      if (settingsBuffer) {
        await api("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "buffer_api_key", value: settingsBuffer }),
        });
      }
      showToast("設定を保存しました", "success");
    } catch {
      showToast("保存に失敗しました", "error");
    }
    setSavingSettings(false);
  };

  const handleSaveAutoPost = async () => {
    setSavingAutoPost(true);
    try {
      await api("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "auto_post_enabled", value: autoPostEnabled }),
      });
      await api("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "auto_post_use_trends", value: autoPostUseTrends }),
      });
      const themesArray = autoPostThemes
        .split("\n")
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 0);
      await api("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "auto_post_themes", value: JSON.stringify(themesArray) }),
      });
      showToast("自動投稿設定を保存しました", "success");
    } catch {
      showToast("保存に失敗しました", "error");
    }
    setSavingAutoPost(false);
  };

  /* ─── Trends ─── */
  const handleFetchTrends = async () => {
    setTrendLoading(true);
    setTrendResults([]);
    try {
      const data = await api<{
        trends: TrendItem[];
        fetched_at: string;
      }>("/api/trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: trendCategory,
          custom_query: trendCustomQuery || undefined,
        }),
      });
      setTrendResults(data.trends || []);
      setTrendFetchedAt(data.fetched_at);
      showToast(`${data.trends?.length || 0}件のトレンドを取得しました`, "success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "トレンド取得に失敗しました";
      showToast(msg, "error");
    }
    setTrendLoading(false);
  };

  const handleUseTrendForPost = (trend: TrendItem) => {
    setTheme(trend.post_theme);
    setHashtags(trend.hashtags.join(" "));
    if (trend.image_url) {
      setReferenceImage(trend.image_url);
    }
    setView("create");
    showToast(`テーマ「${trend.title}」を投稿作成に反映しました${trend.image_url ? "（参照画像も設定済み）" : ""}`, "info");
  };

  /* ═══════════════════════════════════════════════════
     Render: Loading
     ═══════════════════════════════════════════════════ */
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div style={s.spinner} />
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════
     Render: Onboarding
     ═══════════════════════════════════════════════════ */
  if (showOnboarding) {
    const steps = [
      // Step 0: Welcome + API Keys
      <div key="step0">
        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, color: "#f4f4f5" }}>
          Influencer AI へようこそ
        </h2>
        <p style={{ color: "#71717a", marginBottom: 28, lineHeight: 1.6 }}>
          AIを使ったSNS自動投稿システムです。<br />
          まずはAPIキーを設定しましょう。
        </p>
        <div style={s.formGroup}>
          <label style={s.label}>Gemini API Key</label>
          <input
            style={s.input}
            type="password"
            placeholder="AIzaSy..."
            value={onboardingData.geminiKey}
            onChange={(e) =>
              setOnboardingData((d) => ({ ...d, geminiKey: e.target.value }))
            }
          />
          <p style={{ fontSize: 12, color: "#52525b", marginTop: 4 }}>
            テキスト・画像生成に使用します
          </p>
        </div>
        <div style={s.formGroup}>
          <label style={s.label}>Buffer Access Token</label>
          <input
            style={s.input}
            type="password"
            placeholder="アクセストークン"
            value={onboardingData.bufferKey}
            onChange={(e) =>
              setOnboardingData((d) => ({ ...d, bufferKey: e.target.value }))
            }
          />
          <p style={{ fontSize: 12, color: "#52525b", marginTop: 4 }}>
            SNSへの投稿に使用します（オプション）
          </p>
        </div>
      </div>,

      // Step 1: First Account
      <div key="step1">
        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, color: "#f4f4f5" }}>
          最初のアカウントを作成
        </h2>
        <p style={{ color: "#71717a", marginBottom: 28, lineHeight: 1.6 }}>
          AIインフルエンサーのペルソナを設定します。
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={s.formGroup}>
            <label style={s.label}>アカウント名</label>
            <input
              style={s.input}
              placeholder="例: Yuki"
              value={onboardingData.firstAccount.name}
              onChange={(e) =>
                setOnboardingData((d) => ({
                  ...d,
                  firstAccount: { ...d.firstAccount, name: e.target.value },
                }))
              }
            />
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>プラットフォーム</label>
            <select
              style={s.select as React.CSSProperties}
              value={onboardingData.firstAccount.platform}
              onChange={(e) =>
                setOnboardingData((d) => ({
                  ...d,
                  firstAccount: { ...d.firstAccount, platform: e.target.value },
                }))
              }
            >
              {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={s.formGroup}>
          <label style={s.label}>ユーザー名</label>
          <input
            style={s.input}
            placeholder="@username"
            value={onboardingData.firstAccount.username}
            onChange={(e) =>
              setOnboardingData((d) => ({
                ...d,
                firstAccount: { ...d.firstAccount, username: e.target.value },
              }))
            }
          />
        </div>
        <div style={s.formGroup}>
          <label style={s.label}>ペルソナ設定</label>
          <textarea
            style={s.textarea}
            placeholder="例: 東京在住の25歳女性。カフェ巡りとファッションが好き。フレンドリーで親しみやすい語り口。"
            value={onboardingData.firstAccount.persona}
            onChange={(e) =>
              setOnboardingData((d) => ({
                ...d,
                firstAccount: { ...d.firstAccount, persona: e.target.value },
              }))
            }
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={s.formGroup}>
            <label style={s.label}>トーン</label>
            <select
              style={s.select as React.CSSProperties}
              value={onboardingData.firstAccount.tone}
              onChange={(e) =>
                setOnboardingData((d) => ({
                  ...d,
                  firstAccount: { ...d.firstAccount, tone: e.target.value },
                }))
              }
            >
              <option value="casual">カジュアル</option>
              <option value="professional">プロフェッショナル</option>
              <option value="friendly">フレンドリー</option>
              <option value="formal">フォーマル</option>
              <option value="humorous">ユーモラス</option>
            </select>
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>ターゲット層</label>
            <input
              style={s.input}
              placeholder="例: 20〜30代女性"
              value={onboardingData.firstAccount.target_audience}
              onChange={(e) =>
                setOnboardingData((d) => ({
                  ...d,
                  firstAccount: { ...d.firstAccount, target_audience: e.target.value },
                }))
              }
            />
          </div>
        </div>
      </div>,

      // Step 2: Confirmation
      <div key="step2">
        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, color: "#f4f4f5" }}>
          セットアップ確認
        </h2>
        <p style={{ color: "#71717a", marginBottom: 28, lineHeight: 1.6 }}>
          以下の内容で初期設定を完了します。
        </p>
        <div style={{ ...s.card, background: "#14141e" }}>
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: "#71717a" }}>API設定</span>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <span style={s.tag(onboardingData.geminiKey ? "#22c55e" : "#ef4444")}>
                {Icon.check} Gemini {onboardingData.geminiKey ? "設定済み" : "未設定"}
              </span>
              <span style={s.tag(onboardingData.bufferKey ? "#22c55e" : "#f59e0b")}>
                {Icon.check} Buffer {onboardingData.bufferKey ? "設定済み" : "スキップ"}
              </span>
            </div>
          </div>
          {onboardingData.firstAccount.name && (
            <div>
              <span style={{ fontSize: 12, color: "#71717a" }}>アカウント</span>
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `${PLATFORM_COLORS[onboardingData.firstAccount.platform]}25`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: 700,
                    color: PLATFORM_COLORS[onboardingData.firstAccount.platform],
                  }}
                >
                  {onboardingData.firstAccount.name[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "#f4f4f5" }}>
                    {onboardingData.firstAccount.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#71717a" }}>
                    {PLATFORM_LABELS[onboardingData.firstAccount.platform]} ·{" "}
                    @{onboardingData.firstAccount.username}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>,
    ];

    return (
      <div style={s.onboardingOverlay}>
        <div style={s.onboardingCard}>
          {/* Step indicator */}
          <div style={s.stepIndicator}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={s.stepDot(i === onboardingStep, i < onboardingStep)} />
            ))}
          </div>

          {steps[onboardingStep]}

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
            {onboardingStep > 0 ? (
              <button style={s.btnSecondary} onClick={() => setOnboardingStep((s) => s - 1)}>
                戻る
              </button>
            ) : (
              <div />
            )}
            <button style={s.btnPrimary} onClick={handleOnboardingNext}>
              {onboardingStep === 2 ? "セットアップ完了" : "次へ"} {Icon.arrow}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════
     Render: Main Dashboard
     ═══════════════════════════════════════════════════ */
  const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "ダッシュボード", icon: Icon.dashboard },
    { id: "create", label: "投稿を作成", icon: Icon.create },
    { id: "trends", label: "トレンドリサーチ", icon: Icon.trends },
    { id: "accounts", label: "アカウント管理", icon: Icon.accounts },
    { id: "history", label: "投稿履歴", icon: Icon.history },
    { id: "settings", label: "設定", icon: Icon.settings },
  ];

  const recentPosts = posts.slice(0, 5);
  const postedCount = posts.filter((p) => p.status === "posted").length;
  const draftCount = posts.filter((p) => p.status === "draft").length;

  return (
    <div style={s.shell}>
      {/* ─── Sidebar ─── */}
      <aside style={s.sidebar}>
        <div style={s.sidebarLogo}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#f4f4f5", letterSpacing: "-0.02em" }}>
            Influencer<span style={{ color: "#6366f1" }}>AI</span>
          </div>
          <div style={{ fontSize: 11, color: "#52525b", marginTop: 4 }}>
            SNS自動投稿システム
          </div>
        </div>
        <nav style={s.sidebarNav}>
          {navItems.map((item) => (
            <button
              key={item.id}
              style={s.navItem(view === item.id)}
              onClick={() => setView(item.id)}
              onMouseEnter={(e) => {
                if (view !== item.id) e.currentTarget.style.color = "#d4d4d8";
              }}
              onMouseLeave={(e) => {
                if (view !== item.id) e.currentTarget.style.color = "#71717a";
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "16px 20px", borderTop: "1px solid #1a1a24" }}>
          <div style={{ fontSize: 11, color: "#3f3f46" }}>
            {accounts.length} アカウント · {posts.length} 投稿
          </div>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main style={s.main}>
        {/* ─── Dashboard View ─── */}
        {view === "dashboard" && (
          <>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4, color: "#f4f4f5" }}>
              ダッシュボード
            </h1>
            <p style={{ color: "#71717a", marginBottom: 28 }}>システム全体の概要</p>

            <div style={s.statGrid}>
              <div style={s.statCard("#6366f1")}>
                <div style={s.statValue}>{accounts.length}</div>
                <div style={s.statLabel}>アカウント数</div>
              </div>
              <div style={s.statCard("#22c55e")}>
                <div style={s.statValue}>{postedCount}</div>
                <div style={s.statLabel}>投稿済み</div>
              </div>
              <div style={s.statCard("#f59e0b")}>
                <div style={s.statValue}>{draftCount}</div>
                <div style={s.statLabel}>下書き</div>
              </div>
              <div style={s.statCard("#ec4899")}>
                <div style={s.statValue}>{accounts.filter((a) => a.is_active).length}</div>
                <div style={s.statLabel}>アクティブ</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
              <button style={s.btnPrimary} onClick={() => setView("create")}>
                {Icon.sparkle} 投稿を生成
              </button>
              <button style={s.btnSecondary} onClick={() => setView("accounts")}>
                {Icon.plus} アカウント追加
              </button>
            </div>

            {/* Recent Posts */}
            <div style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f4f4f5" }}>最近の投稿</h3>
                <button style={s.btnSmall} onClick={() => setView("history")}>
                  すべて表示 {Icon.arrow}
                </button>
              </div>
              {recentPosts.length === 0 ? (
                <div style={s.empty}>
                  <p style={{ fontSize: 14 }}>まだ投稿がありません</p>
                  <p style={{ fontSize: 12, marginTop: 4 }}>「投稿を作成」から最初の投稿を生成しましょう</p>
                </div>
              ) : (
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>アカウント</th>
                      <th style={s.th}>キャプション</th>
                      <th style={s.th}>ステータス</th>
                      <th style={s.th}>日時</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPosts.map((p) => (
                      <tr key={p.id}>
                        <td style={s.td}>{p.accounts?.name || "—"}</td>
                        <td style={{ ...s.td, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.caption.slice(0, 60)}
                        </td>
                        <td style={s.td}>
                          <span
                            style={s.tag(
                              p.status === "posted" ? "#22c55e" : p.status === "draft" ? "#f59e0b" : p.status === "failed" ? "#ef4444" : "#6366f1"
                            )}
                          >
                            {p.status === "posted" ? "投稿済み" : p.status === "draft" ? "下書き" : p.status === "scheduled" ? "予約" : "失敗"}
                          </span>
                        </td>
                        <td style={{ ...s.td, fontSize: 12, color: "#71717a" }}>
                          {new Date(p.created_at).toLocaleString("ja-JP")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Accounts overview */}
            <div style={s.card}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f4f4f5", marginBottom: 16 }}>アカウント一覧</h3>
              {accounts.length === 0 ? (
                <div style={s.empty}>
                  <p style={{ fontSize: 14 }}>アカウントが登録されていません</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        background: "#14141e",
                        border: "1px solid #1e1e2e",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      {acc.avatar_url ? (
                        <img
                          src={acc.avatar_url}
                          alt={acc.name}
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 10,
                            objectFit: "cover",
                            flexShrink: 0,
                            border: `2px solid ${PLATFORM_COLORS[acc.platform] || "#6366f1"}40`,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 10,
                            background: `${PLATFORM_COLORS[acc.platform] || "#6366f1"}20`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18,
                            fontWeight: 700,
                            color: PLATFORM_COLORS[acc.platform] || "#6366f1",
                            flexShrink: 0,
                          }}
                        >
                          {acc.name[0]}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#f4f4f5" }}>{acc.name}</div>
                        <div style={{ fontSize: 12, color: "#71717a" }}>
                          {PLATFORM_LABELS[acc.platform]} · @{acc.username}
                        </div>
                      </div>
                      <div style={{ marginLeft: "auto" }}>
                        <span style={s.tag(acc.is_active ? "#22c55e" : "#71717a")}>
                          {acc.is_active ? "ON" : "OFF"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── Create Post View ─── */}
        {view === "create" && (
          <>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4, color: "#f4f4f5" }}>
              投稿を作成
            </h1>
            <p style={{ color: "#71717a", marginBottom: 28 }}>AIでキャプションと画像を生成</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Left: Generation form */}
              <div style={s.card}>
                <h3 style={s.cardHeader}>生成設定</h3>
                <div style={s.formGroup}>
                  <label style={s.label}>アカウント</label>
                  <select
                    style={s.select as React.CSSProperties}
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                  >
                    <option value="">アカウントを選択...</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({PLATFORM_LABELS[acc.platform]})
                      </option>
                    ))}
                  </select>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>テーマ（オプション）</label>
                  <input
                    style={s.input}
                    placeholder="例: 春のカフェ巡り、新作コスメレビュー..."
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                  />
                  <p style={{ fontSize: 12, color: "#52525b", marginTop: 4 }}>
                    空欄の場合、AIが自動でテーマを選びます
                  </p>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>ハッシュタグ（オプション）</label>
                  <input
                    style={s.input}
                    placeholder="例: #カフェ巡り #東京グルメ #おしゃれ"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                  />
                  <p style={{ fontSize: 12, color: "#52525b", marginTop: 4 }}>
                    指定すると生成テキストに追加されます。空欄ならAIが自動生成
                  </p>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>商品画像（オプション）</label>
                  <div
                    style={{
                      border: "2px dashed #2a2a3a",
                      borderRadius: 10,
                      padding: referenceImage ? 8 : 24,
                      textAlign: "center",
                      cursor: "pointer",
                      background: "#0c0c12",
                      position: "relative",
                    }}
                    onClick={() => document.getElementById("ref-image-input")?.click()}
                  >
                    <input
                      id="ref-image-input"
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleReferenceImageUpload}
                    />
                    {referenceImage ? (
                      <div style={{ position: "relative" }}>
                        <img
                          src={referenceImage}
                          alt="参照画像"
                          style={{ maxWidth: "100%", maxHeight: 120, borderRadius: 8, objectFit: "cover" }}
                        />
                        <button
                          style={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            background: "#ef4444",
                            border: "none",
                            borderRadius: 6,
                            color: "#fff",
                            padding: "2px 8px",
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setReferenceImage(null);
                          }}
                        >
                          削除
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ color: "#52525b", marginBottom: 4 }}>{Icon.upload}</div>
                        <p style={{ fontSize: 13, color: "#52525b" }}>
                          クリックして画像をアップロード
                        </p>
                      </>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: "#52525b", marginTop: 4 }}>
                    商品画像をアップロードすると、インフルエンサーがその商品を使っている様子を生成します
                  </p>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>生成画像枚数</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        style={{
                          flex: 1,
                          padding: "8px 0",
                          borderRadius: 8,
                          border: imageCount === n ? "2px solid #6366f1" : "1px solid #2a2a3a",
                          background: imageCount === n ? "#6366f120" : "#0c0c12",
                          color: imageCount === n ? "#a5b4fc" : "#71717a",
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onClick={() => setImageCount(n)}
                      >
                        {n}枚
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  style={{
                    ...s.btnPrimary,
                    width: "100%",
                    justifyContent: "center",
                    opacity: generating || !selectedAccountId ? 0.5 : 1,
                    pointerEvents: generating || !selectedAccountId ? "none" : "auto",
                  }}
                  onClick={handleGenerate}
                  disabled={generating || !selectedAccountId}
                >
                  {generating ? <div style={s.spinner} /> : Icon.sparkle}
                  {generating ? `生成中...（${imageCount}枚）` : `AIで生成（${imageCount}枚）`}
                </button>
              </div>

              {/* Right: Preview */}
              <div style={s.card}>
                <h3 style={s.cardHeader}>プレビュー</h3>
                {!generatedCaption && !generating ? (
                  <div style={s.empty}>
                    <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>{Icon.image}</div>
                    <p style={{ fontSize: 14 }}>生成結果がここに表示されます</p>
                  </div>
                ) : generating ? (
                  <div style={{ ...s.empty, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <div style={s.spinner} />
                    <p style={{ fontSize: 14, color: "#71717a" }}>AIが投稿を生成しています...</p>
                  </div>
                ) : (
                  <>
                    {/* 画像ギャラリー */}
                    {generatedImages.length > 0 && (
                      <div>
                        <img
                          src={generatedImages[selectedImageIndex] || generatedImage || ""}
                          alt="Generated"
                          style={s.previewImage}
                        />
                        {generatedImages.length > 1 && (
                          <div style={{
                            display: "flex",
                            gap: 8,
                            marginTop: 10,
                            overflowX: "auto",
                            paddingBottom: 4,
                          }}>
                            {generatedImages.map((img, i) => (
                              <div
                                key={i}
                                onClick={() => setSelectedImageIndex(i)}
                                style={{
                                  width: 64,
                                  height: 64,
                                  borderRadius: 8,
                                  overflow: "hidden",
                                  border: selectedImageIndex === i
                                    ? "2px solid #6366f1"
                                    : "2px solid transparent",
                                  cursor: "pointer",
                                  flexShrink: 0,
                                  opacity: selectedImageIndex === i ? 1 : 0.6,
                                  transition: "all 0.15s",
                                }}
                              >
                                <img
                                  src={img}
                                  alt={`候補 ${i + 1}`}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        {generatedImages.length > 1 && (
                          <p style={{ fontSize: 12, color: "#52525b", marginTop: 4, textAlign: "center" }}>
                            {selectedImageIndex + 1} / {generatedImages.length} 枚目を選択中
                          </p>
                        )}
                      </div>
                    )}
                    {/* 単一画像（後方互換） */}
                    {generatedImages.length === 0 && generatedImage && (
                      <img src={generatedImage} alt="Generated" style={s.previewImage} />
                    )}
                    <div
                      style={{
                        marginTop: 16,
                        padding: 16,
                        background: "#14141e",
                        borderRadius: 10,
                        whiteSpace: "pre-wrap",
                        fontSize: 14,
                        lineHeight: 1.7,
                        color: "#d4d4d8",
                      }}
                    >
                      {generatedCaption}
                    </div>
                    <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                      <button
                        style={{
                          ...s.btnPrimary,
                          flex: 1,
                          justifyContent: "center",
                          opacity: posting ? 0.5 : 1,
                        }}
                        onClick={handlePost}
                        disabled={posting}
                      >
                        {posting ? <div style={s.spinner} /> : Icon.send}
                        {posting ? "投稿中..." : "Bufferで投稿"}
                      </button>
                      <button style={s.btnSecondary} onClick={handleGenerate}>
                        {Icon.refresh} 再生成
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* ─── Accounts View ─── */}
        {view === "accounts" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4, color: "#f4f4f5" }}>
                  アカウント管理
                </h1>
                <p style={{ color: "#71717a" }}>インフルエンサーアカウントの管理</p>
              </div>
              <button
                style={s.btnPrimary}
                onClick={() => {
                  setEditingAccount({
                    name: "",
                    platform: "instagram",
                    username: "",
                    persona: "",
                    tone: "casual",
                    target_audience: "",
                    posting_frequency: "daily",
                    is_active: true,
                  });
                  setShowAccountForm(true);
                }}
              >
                {Icon.plus} 新規アカウント
              </button>
            </div>

            {/* Account Form Modal */}
            {showAccountForm && editingAccount && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "#000000aa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 100,
                }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setShowAccountForm(false);
                    setEditingAccount(null);
                  }
                }}
              >
                <div style={{ ...s.onboardingCard, maxWidth: 580, maxHeight: "80vh", overflow: "auto" }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, color: "#f4f4f5" }}>
                    {editingAccount.id ? "アカウント編集" : "新規アカウント"}
                  </h2>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div style={s.formGroup}>
                      <label style={s.label}>アカウント名</label>
                      <input
                        style={s.input}
                        value={editingAccount.name || ""}
                        onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                      />
                    </div>
                    <div style={s.formGroup}>
                      <label style={s.label}>プラットフォーム</label>
                      <select
                        style={s.select as React.CSSProperties}
                        value={editingAccount.platform || "instagram"}
                        onChange={(e) => setEditingAccount({ ...editingAccount, platform: e.target.value })}
                      >
                        {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>ユーザー名</label>
                    <input
                      style={s.input}
                      placeholder="@username"
                      value={editingAccount.username || ""}
                      onChange={(e) => setEditingAccount({ ...editingAccount, username: e.target.value })}
                    />
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>ペルソナ設定</label>
                    <textarea
                      style={s.textarea}
                      placeholder="このアカウントのキャラクター、話し方、興味関心を記述..."
                      value={editingAccount.persona || ""}
                      onChange={(e) => setEditingAccount({ ...editingAccount, persona: e.target.value })}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div style={s.formGroup}>
                      <label style={s.label}>トーン</label>
                      <select
                        style={s.select as React.CSSProperties}
                        value={editingAccount.tone || "casual"}
                        onChange={(e) => setEditingAccount({ ...editingAccount, tone: e.target.value })}
                      >
                        <option value="casual">カジュアル</option>
                        <option value="professional">プロフェッショナル</option>
                        <option value="friendly">フレンドリー</option>
                        <option value="formal">フォーマル</option>
                        <option value="humorous">ユーモラス</option>
                      </select>
                    </div>
                    <div style={s.formGroup}>
                      <label style={s.label}>ターゲット層</label>
                      <input
                        style={s.input}
                        placeholder="例: 20〜30代女性"
                        value={editingAccount.target_audience || ""}
                        onChange={(e) => setEditingAccount({ ...editingAccount, target_audience: e.target.value })}
                      />
                    </div>
                  </div>
                  {/* アバター画像（インフルエンサーの参考画像） */}
                  <div style={s.formGroup}>
                    <label style={s.label}>インフルエンサー画像（投稿画像のベースに使用）</label>
                    <p style={{ fontSize: 12, color: "#71717a", marginBottom: 8 }}>
                      設定するとこの人物をベースにした投稿画像が生成されます
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      {editingAccount.avatar_url ? (
                        <div style={{ position: "relative" }}>
                          <img
                            src={editingAccount.avatar_url}
                            alt="Avatar"
                            style={{
                              width: 80,
                              height: 80,
                              borderRadius: 12,
                              objectFit: "cover",
                              border: "2px solid #7c3aed",
                            }}
                          />
                          <button
                            style={{
                              position: "absolute",
                              top: -6,
                              right: -6,
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              background: "#ef4444",
                              border: "none",
                              color: "#fff",
                              fontSize: 12,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            onClick={() => setEditingAccount({ ...editingAccount, avatar_url: null })}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div
                          style={{
                            width: 80,
                            height: 80,
                            borderRadius: 12,
                            border: "2px dashed #3f3f46",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#71717a",
                            fontSize: 24,
                          }}
                        >
                          {Icon.image}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <label
                          style={{
                            ...s.btnSecondary,
                            display: "inline-flex",
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          {Icon.upload} 画像を選択
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 5 * 1024 * 1024) {
                                showToast("画像は5MB以下にしてください", "error");
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = () => {
                                setEditingAccount({ ...editingAccount, avatar_url: reader.result as string });
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>
                        <p style={{ fontSize: 11, color: "#52525b", marginTop: 4 }}>
                          JPG/PNG 5MB以下
                        </p>
                      </div>
                    </div>
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>SNS連携（Buffer）</label>
                    {bufferProfiles.length > 0 ? (
                      <>
                        <select
                          style={s.select as React.CSSProperties}
                          value={editingAccount.buffer_profile_id || ""}
                          onChange={(e) => {
                            const selectedId = e.target.value || null;
                            const selectedProfile = bufferProfiles.find((p) => p.id === selectedId);
                            const updates: Partial<Account> = {
                              ...editingAccount,
                              buffer_profile_id: selectedId,
                            };
                            if (selectedProfile) {
                              // Bufferのサービス名をそのままプラットフォームに使用
                              updates.platform = selectedProfile.service;
                              updates.username = selectedProfile.service_username;
                              // アカウント名が未入力の場合は自動設定
                              if (!updates.name) {
                                updates.name = selectedProfile.service_username;
                              }
                            }
                            setEditingAccount(updates);
                          }}
                        >
                          <option value="">未連携</option>
                          {bufferProfiles.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.service_username} ({PLATFORM_LABELS[p.service] || p.service})
                            </option>
                          ))}
                        </select>
                        {editingAccount.buffer_profile_id && (() => {
                          const linked = bufferProfiles.find((p) => p.id === editingAccount.buffer_profile_id);
                          return linked ? (
                            <div style={{
                              marginTop: 8,
                              padding: "10px 14px",
                              background: "#052e16",
                              border: "1px solid #166534",
                              borderRadius: 10,
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}>
                              <span style={{ color: "#4ade80", fontSize: 18 }}>✓</span>
                              <div>
                                <div style={{ color: "#4ade80", fontWeight: 600, fontSize: 13 }}>
                                  {linked.service_username}
                                </div>
                                <div style={{ color: "#86efac", fontSize: 11 }}>
                                  {linked.service.toUpperCase()} アカウント連携済み
                                </div>
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </>
                    ) : (
                      <div style={{
                        padding: "12px 14px",
                        background: "#1c1917",
                        border: "1px solid #292524",
                        borderRadius: 10,
                        color: "#a8a29e",
                        fontSize: 13,
                      }}>
                        <div style={{ marginBottom: 6 }}>Bufferにチャンネルが見つかりません</div>
                        <div style={{ fontSize: 11, color: "#78716c" }}>
                          Buffer（buffer.com）でSNSアカウントを連携してからリロードしてください
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
                    <button
                      style={s.btnSecondary}
                      onClick={() => {
                        setShowAccountForm(false);
                        setEditingAccount(null);
                      }}
                    >
                      キャンセル
                    </button>
                    <button style={{ ...s.btnPrimary, opacity: savingAccount ? 0.6 : 1 }} onClick={handleSaveAccount} disabled={savingAccount}>
                      {savingAccount ? "保存中..." : `${Icon.check} 保存`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Account List */}
            {accounts.length === 0 ? (
              <div style={{ ...s.card, ...s.empty }}>
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.2 }}>{Icon.accounts}</div>
                <p style={{ fontSize: 16, color: "#71717a" }}>アカウントがまだありません</p>
                <p style={{ fontSize: 13, color: "#52525b", marginTop: 4 }}>
                  「新規アカウント」ボタンで最初のインフルエンサーを追加しましょう
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {accounts.map((acc) => (
                  <div
                    key={acc.id}
                    style={{
                      ...s.card,
                      display: "flex",
                      alignItems: "center",
                      gap: 20,
                      marginBottom: 0,
                      padding: "18px 24px",
                    }}
                  >
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 12,
                        background: `${PLATFORM_COLORS[acc.platform] || "#6366f1"}20`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22,
                        fontWeight: 800,
                        color: PLATFORM_COLORS[acc.platform] || "#6366f1",
                        flexShrink: 0,
                      }}
                    >
                      {acc.name[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontWeight: 700, fontSize: 16, color: "#f4f4f5" }}>
                          {acc.name}
                        </span>
                        <span style={s.tag(PLATFORM_COLORS[acc.platform] || "#6366f1")}>
                          {PLATFORM_LABELS[acc.platform]}
                        </span>
                        <span style={s.tag(acc.is_active ? "#22c55e" : "#71717a")}>
                          {acc.is_active ? "アクティブ" : "無効"}
                        </span>
                        {acc.buffer_profile_id ? (
                          <span style={{
                            ...s.tag("#10b981"),
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}>
                            ✓ Buffer連携
                          </span>
                        ) : (
                          <span style={s.tag("#f59e0b")}>
                            未連携
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: "#71717a", marginTop: 4 }}>
                        @{acc.username}
                        {acc.persona && ` · ${acc.persona.slice(0, 50)}...`}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        style={s.btnSmall}
                        onClick={() => {
                          setEditingAccount(acc);
                          setShowAccountForm(true);
                        }}
                      >
                        編集
                      </button>
                      <button style={s.btnDanger} onClick={() => handleDeleteAccount(acc.id)}>
                        {Icon.trash}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── History View ─── */}
        {view === "history" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4, color: "#f4f4f5" }}>
                  投稿履歴
                </h1>
                <p style={{ color: "#71717a" }}>過去の投稿一覧</p>
              </div>
              <button style={s.btnSmall} onClick={fetchPosts}>
                {Icon.refresh} 更新
              </button>
            </div>

            {posts.length === 0 ? (
              <div style={{ ...s.card, ...s.empty }}>
                <p style={{ fontSize: 16, color: "#71717a" }}>投稿履歴がありません</p>
              </div>
            ) : (
              <div style={s.card}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>アカウント</th>
                      <th style={s.th}>キャプション</th>
                      <th style={s.th}>テーマ</th>
                      <th style={s.th}>ステータス</th>
                      <th style={s.th}>作成日時</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((p) => (
                      <tr key={p.id}>
                        <td style={s.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 500 }}>{p.accounts?.name || "—"}</span>
                          </div>
                        </td>
                        <td style={{ ...s.td, maxWidth: 350, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.caption.slice(0, 80)}
                        </td>
                        <td style={{ ...s.td, color: "#71717a" }}>{p.theme || "—"}</td>
                        <td style={s.td}>
                          <span
                            style={s.tag(
                              p.status === "posted"
                                ? "#22c55e"
                                : p.status === "draft"
                                ? "#f59e0b"
                                : p.status === "failed"
                                ? "#ef4444"
                                : "#6366f1"
                            )}
                          >
                            {p.status === "posted"
                              ? "投稿済み"
                              : p.status === "draft"
                              ? "下書き"
                              : p.status === "scheduled"
                              ? "予約済み"
                              : "失敗"}
                          </span>
                        </td>
                        <td style={{ ...s.td, fontSize: 12, color: "#71717a", whiteSpace: "nowrap" }}>
                          {new Date(p.created_at).toLocaleString("ja-JP")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ─── Trends View ─── */}
        {view === "trends" && (
          <>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4, color: "#f4f4f5" }}>
              トレンドリサーチ
            </h1>
            <p style={{ color: "#71717a", marginBottom: 28 }}>
              リアルタイムのSNSトレンドを調査して投稿テーマに活用
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 24 }}>
              {/* Left: Search form */}
              <div style={s.card}>
                <h3 style={s.cardHeader}>リサーチ設定</h3>
                <div style={s.formGroup}>
                  <label style={s.label}>カテゴリ</label>
                  <select
                    style={s.select as React.CSSProperties}
                    value={trendCategory}
                    onChange={(e) => setTrendCategory(e.target.value)}
                  >
                    <option value="beauty">美容・コスメ</option>
                    <option value="fashion">ファッション</option>
                    <option value="food">グルメ・料理</option>
                    <option value="fitness">フィットネス・健康</option>
                    <option value="tech">テクノロジー</option>
                    <option value="travel">旅行</option>
                    <option value="lifestyle">ライフスタイル</option>
                    <option value="entertainment">エンタメ</option>
                  </select>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>カスタムキーワード（オプション）</label>
                  <input
                    style={s.input}
                    placeholder="例: 韓国コスメ 2024春、プロテイン おすすめ..."
                    value={trendCustomQuery}
                    onChange={(e) => setTrendCustomQuery(e.target.value)}
                  />
                  <p style={{ fontSize: 12, color: "#52525b", marginTop: 4 }}>
                    入力するとカテゴリの代わりにこのキーワードで検索します
                  </p>
                </div>
                <button
                  style={{
                    ...s.btnPrimary,
                    width: "100%",
                    justifyContent: "center",
                    opacity: trendLoading ? 0.5 : 1,
                    pointerEvents: trendLoading ? "none" : "auto",
                  }}
                  onClick={handleFetchTrends}
                  disabled={trendLoading}
                >
                  {trendLoading ? <div style={s.spinner} /> : Icon.trends}
                  {trendLoading ? "リサーチ中..." : "トレンドをリサーチ"}
                </button>
                {trendFetchedAt && (
                  <p style={{ fontSize: 11, color: "#52525b", marginTop: 8, textAlign: "center" }}>
                    最終取得: {new Date(trendFetchedAt).toLocaleString("ja-JP")}
                  </p>
                )}
              </div>

              {/* Right: Results */}
              <div>
                {trendResults.length === 0 && !trendLoading ? (
                  <div style={{ ...s.card, ...s.empty }}>
                    <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.2 }}>{Icon.trends}</div>
                    <p style={{ fontSize: 16, color: "#71717a" }}>
                      カテゴリを選んで「トレンドをリサーチ」を押してください
                    </p>
                    <p style={{ fontSize: 13, color: "#52525b", marginTop: 4 }}>
                      Gemini AIがリアルタイムのSNSトレンドを検索・分析します
                    </p>
                  </div>
                ) : trendLoading ? (
                  <div style={{ ...s.card, ...s.empty, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <div style={s.spinner} />
                    <p style={{ fontSize: 14, color: "#71717a" }}>AIがリアルタイムトレンドをリサーチしています...</p>
                    <p style={{ fontSize: 12, color: "#52525b" }}>Google検索で最新情報を取得中（10〜20秒）</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {trendResults.map((trend, i) => (
                      <div
                        key={i}
                        style={{
                          ...s.card,
                          marginBottom: 0,
                          padding: "20px 24px",
                          transition: "border-color 0.15s",
                          cursor: "default",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                          {/* Trend Image */}
                          {trend.image_url && (
                            <div style={{
                              flexShrink: 0,
                              width: 100,
                              height: 100,
                              borderRadius: 10,
                              overflow: "hidden",
                              background: "#1a1a2e",
                              border: "1px solid #27272a",
                            }}>
                              <img
                                src={trend.image_url}
                                alt={trend.title}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                              <span style={{ color: "#f59e0b", flexShrink: 0 }}>{Icon.fire}</span>
                              <h4 style={{ fontSize: 16, fontWeight: 700, color: "#f4f4f5", margin: 0 }}>
                                {trend.title}
                              </h4>
                              {trend.source && (
                                <span style={{
                                  fontSize: 11,
                                  color: "#6366f1",
                                  background: "#6366f115",
                                  padding: "2px 8px",
                                  borderRadius: 6,
                                  flexShrink: 0,
                                }}>
                                  {trend.source}
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.6, marginBottom: 10 }}>
                              {trend.description}
                            </p>
                            {/* Source URL */}
                            {trend.source_url && (
                              <div style={{ marginBottom: 10 }}>
                                <a
                                  href={trend.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    fontSize: 12,
                                    color: "#818cf8",
                                    textDecoration: "none",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    padding: "3px 10px",
                                    background: "#6366f110",
                                    borderRadius: 6,
                                    border: "1px solid #6366f130",
                                    transition: "background 0.15s",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = "#6366f125")}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = "#6366f110")}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                  </svg>
                                  参照元を開く
                                </a>
                              </div>
                            )}
                            {trend.hashtags.length > 0 && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                                {trend.hashtags.map((tag, j) => (
                                  <span
                                    key={j}
                                    style={{
                                      fontSize: 12,
                                      color: "#818cf8",
                                      background: "#6366f115",
                                      padding: "3px 10px",
                                      borderRadius: 6,
                                    }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            {trend.post_theme && (
                              <div style={{
                                fontSize: 13,
                                color: "#d4d4d8",
                                background: "#14141e",
                                padding: "10px 14px",
                                borderRadius: 8,
                                borderLeft: "3px solid #6366f1",
                              }}>
                                <span style={{ fontSize: 11, color: "#71717a" }}>投稿テーマ案: </span>
                                {trend.post_theme}
                              </div>
                            )}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                            <button
                              style={{
                                ...s.btnPrimary,
                                fontSize: 13,
                                padding: "8px 16px",
                              }}
                              onClick={() => handleUseTrendForPost(trend)}
                            >
                              {Icon.create} 投稿に使う
                            </button>
                            {trend.image_url && (
                              <button
                                style={{
                                  fontSize: 11,
                                  padding: "6px 12px",
                                  color: "#f59e0b",
                                  background: "transparent",
                                  border: "1px solid #f59e0b40",
                                  borderRadius: 8,
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                }}
                                onClick={() => {
                                  setReferenceImage(trend.image_url);
                                  showToast("参照画像に設定しました", "info");
                                }}
                              >
                                📷 参照画像に設定
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ─── Settings View ─── */}
        {view === "settings" && (
          <>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4, color: "#f4f4f5" }}>
              設定
            </h1>
            <p style={{ color: "#71717a", marginBottom: 28 }}>APIキーとシステム設定</p>

            <div style={s.card}>
              <h3 style={s.cardHeader}>API設定</h3>
              <div style={s.formGroup}>
                <label style={s.label}>Gemini API Key</label>
                <input
                  style={s.input}
                  type="password"
                  placeholder="新しいキーを入力して更新..."
                  value={settingsGemini}
                  onChange={(e) => setSettingsGemini(e.target.value)}
                />
                <p style={{ fontSize: 12, color: "#52525b", marginTop: 4 }}>
                  テキスト生成・画像生成に使用（Gemini 3.1 Flash）
                </p>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Buffer Access Token</label>
                <input
                  style={s.input}
                  type="password"
                  placeholder="新しいトークンを入力して更新..."
                  value={settingsBuffer}
                  onChange={(e) => setSettingsBuffer(e.target.value)}
                />
                <p style={{ fontSize: 12, color: "#52525b", marginTop: 4 }}>
                  SNSプラットフォームへの投稿に使用
                </p>
              </div>
              <button
                style={{ ...s.btnPrimary, opacity: savingSettings ? 0.5 : 1 }}
                onClick={handleSaveSettings}
                disabled={savingSettings}
              >
                {savingSettings ? <div style={s.spinner} /> : Icon.check}
                {savingSettings ? "保存中..." : "設定を保存"}
              </button>
            </div>

            <div style={s.card}>
              <h3 style={s.cardHeader}>Buffer連携プロフィール</h3>
              {bufferProfiles.length === 0 ? (
                <div style={s.empty}>
                  <p style={{ fontSize: 14 }}>Buffer APIトークンを設定するとプロフィールが表示されます</p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {bufferProfiles.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        padding: "12px 16px",
                        borderRadius: 10,
                        background: "#14141e",
                        border: "1px solid #1e1e2e",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600, color: "#f4f4f5" }}>{p.formatted_username}</span>
                        <span style={{ ...s.tag(PLATFORM_COLORS[p.service] || "#6366f1"), marginLeft: 8 }}>
                          {PLATFORM_LABELS[p.service] || p.service}
                        </span>
                      </div>
                      <code style={{ fontSize: 11, color: "#52525b" }}>{p.id}</code>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={s.card}>
              <h3 style={s.cardHeader}>自動投稿設定</h3>
              <p style={{ fontSize: 13, color: "#71717a", marginBottom: 16 }}>
                有効にすると、毎日3回（9:00 / 13:00 / 19:00 JST）AIが自動でテーマを選んで投稿します。
                アクティブな全アカウントが対象です。
              </p>
              <div style={s.formGroup}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    background: "#14141e",
                    borderRadius: 10,
                    border: "1px solid #1e1e2e",
                    cursor: "pointer",
                  }}
                  onClick={() => setAutoPostEnabled(!autoPostEnabled)}
                >
                  <div
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 12,
                      background: autoPostEnabled ? "#6366f1" : "#2a2a3a",
                      position: "relative",
                      transition: "background 0.2s",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        background: "#fff",
                        position: "absolute",
                        top: 2,
                        left: autoPostEnabled ? 22 : 2,
                        transition: "left 0.2s",
                      }}
                    />
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, color: "#f4f4f5", fontSize: 14 }}>
                      自動投稿を{autoPostEnabled ? "有効" : "無効"}
                    </span>
                    <p style={{ fontSize: 12, color: "#52525b", marginTop: 2 }}>
                      {autoPostEnabled
                        ? "毎日3回自動で投稿されます"
                        : "手動投稿のみ"}
                    </p>
                  </div>
                </div>
              </div>
              <div style={s.formGroup}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    background: "#14141e",
                    borderRadius: 10,
                    border: "1px solid #1e1e2e",
                    cursor: "pointer",
                  }}
                  onClick={() => setAutoPostUseTrends(!autoPostUseTrends)}
                >
                  <div
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 12,
                      background: autoPostUseTrends ? "#f59e0b" : "#2a2a3a",
                      position: "relative",
                      transition: "background 0.2s",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        background: "#fff",
                        position: "absolute",
                        top: 2,
                        left: autoPostUseTrends ? 22 : 2,
                        transition: "left 0.2s",
                      }}
                    />
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, color: "#f4f4f5", fontSize: 14 }}>
                      トレンド自動取得を{autoPostUseTrends ? "有効" : "無効"}
                    </span>
                    <p style={{ fontSize: 12, color: "#52525b", marginTop: 2 }}>
                      {autoPostUseTrends
                        ? "各アカウントのペルソナに合ったリアルタイムトレンドを自動で取得してテーマにします"
                        : "下のテーマリストからランダムに選択（トレンド取得しない）"}
                    </p>
                  </div>
                </div>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>投稿テーマリスト（1行1テーマ・トレンド取得失敗時のフォールバック）</label>
                <textarea
                  style={{
                    ...s.input,
                    minHeight: 120,
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                  placeholder={"例:\n春のカフェ巡り\n新作コスメレビュー\n朝のルーティン\n休日のお出かけ\nお気に入りのレストラン"}
                  value={autoPostThemes}
                  onChange={(e) => setAutoPostThemes(e.target.value)}
                />
                <p style={{ fontSize: 12, color: "#52525b", marginTop: 4 }}>
                  テーマからランダムに選んで投稿します。空欄の場合はAIが自由にテーマを決めます
                </p>
              </div>
              <button
                style={{ ...s.btnPrimary, opacity: savingAutoPost ? 0.5 : 1 }}
                onClick={handleSaveAutoPost}
                disabled={savingAutoPost}
              >
                {savingAutoPost ? <div style={s.spinner} /> : Icon.check}
                {savingAutoPost ? "保存中..." : "自動投稿設定を保存"}
              </button>
            </div>

            <div style={s.card}>
              <h3 style={s.cardHeader}>システム情報</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#71717a", marginBottom: 4 }}>バージョン</div>
                  <div style={{ fontSize: 14, color: "#d4d4d8" }}>1.0.0</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#71717a", marginBottom: 4 }}>データベース</div>
                  <div style={{ fontSize: 14, color: "#d4d4d8" }}>Supabase (PostgreSQL)</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#71717a", marginBottom: 4 }}>テキスト生成</div>
                  <div style={{ fontSize: 14, color: "#d4d4d8" }}>Gemini 3.1 Flash</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#71717a", marginBottom: 4 }}>投稿連携</div>
                  <div style={{ fontSize: 14, color: "#d4d4d8" }}>Buffer API</div>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div style={{ ...s.card, borderColor: "#ef444430" }}>
              <h3 style={{ ...s.cardHeader, color: "#ef4444" }}>デンジャーゾーン</h3>
              <p style={{ fontSize: 13, color: "#71717a", marginBottom: 16 }}>
                オンボーディングをリセットすると初期設定画面が再表示されます。
              </p>
              <button
                style={s.btnDanger}
                onClick={async () => {
                  if (!confirm("オンボーディングをリセットしますか？")) return;
                  await api("/api/settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ key: "onboarding_completed", value: false }),
                  });
                  window.location.reload();
                }}
              >
                オンボーディングをリセット
              </button>
            </div>
          </>
        )}
      </main>

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 10000,
            padding: "14px 20px",
            borderRadius: 12,
            background: toast.type === "success" ? "#065f46" : toast.type === "error" ? "#7f1d1d" : "#1e293b",
            border: `1px solid ${toast.type === "success" ? "#10b981" : toast.type === "error" ? "#ef4444" : "#475569"}`,
            color: "#fff",
            fontSize: 14,
            fontWeight: 500,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            maxWidth: 420,
            animation: "slideIn 0.3s ease-out",
          }}
          onClick={() => setToast(null)}
        >
          <span style={{ fontSize: 18 }}>
            {toast.type === "success" ? "\u2705" : toast.type === "error" ? "\u274c" : "\u2139\ufe0f"}
          </span>
          {toast.message}
        </div>
      )}
      <style>{`
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
