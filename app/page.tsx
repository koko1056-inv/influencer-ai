"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════════════
   Image Style Definitions
   ═══════════════════════════════════════════════════ */
const IMAGE_STYLES = [
  {
    id: "natural",
    label: "ナチュラル",
    emoji: "📷",
    desc: "自然な日常感",
    prompt: "Photorealistic, natural lighting, candid lifestyle photography, authentic and genuine feel. Shot as if by a friend with a high-end smartphone.",
  },
  {
    id: "magazine",
    label: "マガジン風",
    emoji: "📰",
    desc: "雑誌表紙のような洗練されたレイアウト",
    prompt: "High-fashion magazine editorial style. Bold large text overlay with headline, clean layout with strong typography, professional studio lighting, polished and aspirational. Include stylish text overlay as part of the image design.",
  },
  {
    id: "text-overlay",
    label: "字幕・テキスト付き",
    emoji: "💬",
    desc: "キャッチコピー入り画像",
    prompt: "Social media post with prominent stylish text overlay in Japanese. Large readable caption text integrated into the image design, like a motivational quote card or tip card. Bold sans-serif font, high contrast text with subtle background.",
  },
  {
    id: "infographic",
    label: "インフォグラフィック",
    emoji: "📊",
    desc: "情報整理・ランキング形式",
    prompt: "Clean infographic style with numbered list or ranking format. Organized layout with icons, numbered steps, or comparison cards. Modern flat design with bold colors and clear hierarchy. Data visualization feel.",
  },
  {
    id: "scrapbook",
    label: "スクラップブック",
    emoji: "🎨",
    desc: "コラージュ・手作り感",
    prompt: "Vintage scrapbook collage style with ripped paper edges, polaroid frames, sticky tape, handwritten annotations, doodles, and stickers. Warm nostalgic aesthetic with layered textures and depth.",
  },
  {
    id: "cinematic",
    label: "シネマティック",
    emoji: "🎬",
    desc: "映画のワンシーン風",
    prompt: "Cinematic movie still aesthetic. Wide aspect feel, dramatic lighting with lens flare or bokeh, color graded with teal-orange or moody tones, shallow depth of field. Film grain texture.",
  },
  {
    id: "minimal",
    label: "ミニマル",
    emoji: "⬜",
    desc: "余白を活かしたシンプル",
    prompt: "Minimalist clean design with abundant white space. Simple composition, muted color palette, elegant and sophisticated. Product-focused with clean background. Less is more aesthetic.",
  },
  {
    id: "meme",
    label: "ミーム・ネタ系",
    emoji: "😂",
    desc: "共感・シェアされやすい",
    prompt: "Internet meme style with bold Impact-style text overlay (top and bottom text format). Humorous, relatable, shareable. Exaggerated expressions or situations. Bright saturated colors, attention-grabbing.",
  },
  {
    id: "aesthetic",
    label: "エモ・エステティック",
    emoji: "✨",
    desc: "Y2K/韓国風おしゃれ",
    prompt: "Y2K aesthetic or Korean-inspired (Hallyu) dreamy style. Soft pastel gradients, sparkles, holographic elements, blurred backgrounds, ethereal glow effects. Trendy and aspirational for Gen Z audience.",
  },
] as const;

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
  character_voice: string;
  writing_style: string;
  expertise_areas: string;
  affiliate_info: string;
  cta_goal: string;
  reference_accounts: string;
  reference_posts: string;
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

interface LinkedInCachedPost {
  id: string;
  buffer_post_id: string;
  text: string;
  sent_at: string | null;
  impressions: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  engagement_rate: number;
  is_top_performer: boolean;
  style_tags: string[];
}

interface InstagramCachedPost {
  id: string;
  buffer_post_id: string;
  text: string;
  sent_at: string | null;
  media_type: string;
  media_url: string | null;
  impressions: number;
  reach: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagement_rate: number;
  is_top_performer: boolean;
  style_tags: string[];
}

type View = "dashboard" | "create" | "instagram" | "tiktok" | "x" | "linkedin" | "accounts" | "history" | "trends" | "settings";

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
  linkedin: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  ),
  instagram: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),
  tiktok: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  ),
  x: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l11.733 16h4.267l-11.733-16z" />
      <path d="M4 20l6.768-6.768M20 4l-6.768 6.768" />
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

const VIDEO_PLATFORMS = ["instagram", "tiktok", "youtube", "facebook", "threads", "linkedin"];

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
  const [textOnly, setTextOnly] = useState(false);
  const [imageStyle, setImageStyle] = useState("natural");
  const [overlayTextTop, setOverlayTextTop] = useState("");
  const [overlayTextMiddle, setOverlayTextMiddle] = useState("");
  const [overlayTextBottom, setOverlayTextBottom] = useState("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [generatedCaption, setGeneratedCaption] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generatedImageUrls, setGeneratedImageUrls] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [generatedPostId, setGeneratedPostId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);
  // A/Bテスト
  const [abTestEnabled, setAbTestEnabled] = useState(false);
  const [abCaptions, setAbCaptions] = useState<string[]>([]);
  const [abSelectedIndex, setAbSelectedIndex] = useState(0);
  // カルーセルスライド
  const [carouselSlides, setCarouselSlides] = useState<{ slide_text: string; slide_image_prompt: string }[]>([]);

  // Video generation state
  const [videoMode, setVideoMode] = useState(false);
  const [videoModel, setVideoModel] = useState("KLING_V3_0_STA");
  const [videoAspectRatio, setVideoAspectRatio] = useState("9:16");
  const [videoDuration, setVideoDuration] = useState(5);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [videoProgress, setVideoProgress] = useState("");
  const [referenceVideo, setReferenceVideo] = useState<string | null>(null);
  const [referenceVideoMime, setReferenceVideoMime] = useState("video/mp4");
  const [videoAnalysis, setVideoAnalysis] = useState<any | null>(null);
  const [analyzingVideo, setAnalyzingVideo] = useState(false);

  // ── プラットフォーム別の状態保存 ──
  interface PlatformSnapshot {
    selectedAccountId: string;
    theme: string;
    hashtags: string;
    imageCount: number;
    textOnly: boolean;
    imageStyle: string;
    overlayTextTop: string;
    overlayTextMiddle: string;
    overlayTextBottom: string;
    referenceImage: string | null;
    generatedCaption: string;
    generatedImage: string | null;
    generatedImages: string[];
    generatedImageUrls: string[];
    selectedImageIndex: number;
    generatedPostId: string | null;
    videoMode: boolean;
    videoModel: string;
    videoAspectRatio: string;
    videoDuration: number;
    generatedVideoUrl: string | null;
    referenceVideo: string | null;
    referenceVideoMime: string;
    videoAnalysis: any | null;
    abTestEnabled: boolean;
    abCaptions: string[];
    abSelectedIndex: number;
    carouselSlides: { slide_text: string; slide_image_prompt: string }[];
  }

  const platformSnapshots = useRef<Record<string, PlatformSnapshot>>({});

  const savePlatformState = useCallback((viewId: string) => {
    const platformViews = ["instagram", "tiktok", "x", "linkedin", "create"];
    if (!platformViews.includes(viewId)) return;
    platformSnapshots.current[viewId] = {
      selectedAccountId, theme, hashtags, imageCount, textOnly, imageStyle,
      overlayTextTop, overlayTextMiddle, overlayTextBottom, referenceImage,
      generatedCaption, generatedImage, generatedImages, generatedImageUrls,
      selectedImageIndex, generatedPostId,
      videoMode, videoModel, videoAspectRatio, videoDuration, generatedVideoUrl,
      referenceVideo, referenceVideoMime, videoAnalysis,
      abTestEnabled, abCaptions, abSelectedIndex, carouselSlides,
    };
  }, [selectedAccountId, theme, hashtags, imageCount, textOnly, imageStyle,
    overlayTextTop, overlayTextMiddle, overlayTextBottom, referenceImage,
    generatedCaption, generatedImage, generatedImages, generatedImageUrls,
    selectedImageIndex, generatedPostId,
    videoMode, videoModel, videoAspectRatio, videoDuration, generatedVideoUrl,
    referenceVideo, referenceVideoMime, videoAnalysis,
    abTestEnabled, abCaptions, abSelectedIndex, carouselSlides]);

  const restorePlatformState = useCallback((viewId: string) => {
    const snap = platformSnapshots.current[viewId];
    if (snap) {
      setSelectedAccountId(snap.selectedAccountId);
      setTheme(snap.theme);
      setHashtags(snap.hashtags);
      setImageCount(snap.imageCount);
      setTextOnly(snap.textOnly);
      setImageStyle(snap.imageStyle);
      setOverlayTextTop(snap.overlayTextTop);
      setOverlayTextMiddle(snap.overlayTextMiddle);
      setOverlayTextBottom(snap.overlayTextBottom);
      setReferenceImage(snap.referenceImage);
      setGeneratedCaption(snap.generatedCaption);
      setGeneratedImage(snap.generatedImage);
      setGeneratedImages(snap.generatedImages);
      setGeneratedImageUrls(snap.generatedImageUrls);
      setSelectedImageIndex(snap.selectedImageIndex);
      setGeneratedPostId(snap.generatedPostId);
      setVideoMode(snap.videoMode);
      setVideoModel(snap.videoModel);
      setVideoAspectRatio(snap.videoAspectRatio);
      setVideoDuration(snap.videoDuration);
      setGeneratedVideoUrl(snap.generatedVideoUrl);
      setReferenceVideo(snap.referenceVideo);
      setReferenceVideoMime(snap.referenceVideoMime);
      setVideoAnalysis(snap.videoAnalysis);
      setAbTestEnabled(snap.abTestEnabled);
      setAbCaptions(snap.abCaptions);
      setAbSelectedIndex(snap.abSelectedIndex);
      setCarouselSlides(snap.carouselSlides);
    } else {
      // スナップショットがなければ初期状態にリセット
      setTheme("");
      setHashtags("");
      setImageCount(1);
      setTextOnly(false);
      setImageStyle("natural");
      setOverlayTextTop("");
      setOverlayTextMiddle("");
      setOverlayTextBottom("");
      setReferenceImage(null);
      setGeneratedCaption("");
      setGeneratedImage(null);
      setGeneratedImages([]);
      setGeneratedImageUrls([]);
      setSelectedImageIndex(0);
      setGeneratedPostId(null);
      setVideoMode(false);
      setVideoModel("KLING_V3_0_STA");
      setVideoAspectRatio("9:16");
      setVideoDuration(5);
      setGeneratedVideoUrl(null);
      setReferenceVideo(null);
      setReferenceVideoMime("video/mp4");
      setVideoAnalysis(null);
      setAbTestEnabled(false);
      setAbCaptions([]);
      setAbSelectedIndex(0);
      setCarouselSlides([]);
      // アカウントは自動選択に任せる（呼び出し元で処理）
    }
  }, []);

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

  // LinkedIn post state
  const [liTopic, setLiTopic] = useState("");
  const [liStyle, setLiStyle] = useState("thought_leadership");
  const [liRefImage, setLiRefImage] = useState<string | null>(null);
  const [liCaption, setLiCaption] = useState("");
  const [liHeadline, setLiHeadline] = useState("");
  const [liImage, setLiImage] = useState<string | null>(null);
  const [liImageUrl, setLiImageUrl] = useState<string | null>(null);
  const [liPostId, setLiPostId] = useState<string | null>(null);
  const [liGenerating, setLiGenerating] = useState(false);
  const [liPosting, setLiPosting] = useState(false);
  const [liTab, setLiTab] = useState<"create" | "analytics">("create");
  const [liPastPosts, setLiPastPosts] = useState<LinkedInCachedPost[]>([]);
  const [liSyncing, setLiSyncing] = useState(false);
  const [liEditingPost, setLiEditingPost] = useState<LinkedInCachedPost | null>(null);
  const [liSavingMetrics, setLiSavingMetrics] = useState(false);

  // Instagram analytics state
  const [igTab, setIgTab] = useState<"create" | "analytics">("create");
  const [igPastPosts, setIgPastPosts] = useState<InstagramCachedPost[]>([]);
  const [igSyncing, setIgSyncing] = useState(false);
  const [igEditingPost, setIgEditingPost] = useState<InstagramCachedPost | null>(null);
  const [igSavingMetrics, setIgSavingMetrics] = useState(false);

  // Analytics report state (shared)
  const [igReport, setIgReport] = useState<string | null>(null);
  const [igReportLoading, setIgReportLoading] = useState(false);
  const [liReport, setLiReport] = useState<string | null>(null);
  const [liReportLoading, setLiReportLoading] = useState(false);

  // Account form state
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Partial<Account> | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);

  // Settings
  const [settingsGemini, setSettingsGemini] = useState("");
  const [settingsBuffer, setSettingsBuffer] = useState("");
  const [settingsOpenAI, setSettingsOpenAI] = useState("");
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
    setAbCaptions([]);
    setAbSelectedIndex(0);
    setCarouselSlides([]);
    try {
      const reqBody = {
        account_id: selectedAccountId,
        theme,
        image_count: textOnly ? 0 : imageCount,
        image_style: textOnly ? undefined : imageStyle,
        overlay_text: textOnly ? undefined : {
          top: overlayTextTop.trim() || undefined,
          middle: overlayTextMiddle.trim() || undefined,
          bottom: overlayTextBottom.trim() || undefined,
        },
        reference_image: textOnly ? null : referenceImage,
      };
      const data = await api<{
        post_text: string;
        image_prompt: string;
        image_data: string | null;
        images: string[];
        image_urls: string[];
        image_count: number;
        carousel_slides: { slide_text: string; slide_image_prompt: string }[];
        post_id: string;
      }>("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
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
      setCarouselSlides(data.carousel_slides || []);

      // A/Bテスト: 有効なら追加でキャプション2パターン生成
      if (abTestEnabled) {
        const captions = [caption];
        for (let v = 0; v < 2; v++) {
          try {
            const alt = await api<{ post_text: string }>("/api/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...reqBody, image_count: 0 }),
            });
            let altCaption = alt.post_text;
            if (hashtags.trim() && !altCaption.includes(hashtags.trim())) {
              altCaption = altCaption.trimEnd() + "\n\n" + hashtags.trim();
            }
            captions.push(altCaption);
          } catch { /* skip */ }
        }
        setAbCaptions(captions);
        showToast(`${captions.length}パターンのキャプションを生成しました`, "success");
      }

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

  /* ─── Reference Video Upload & Analysis ─── */
  const handleReferenceVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      showToast("動画ファイルを選択してください", "error");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      showToast("動画ファイルは50MB以下にしてください", "error");
      return;
    }
    setReferenceVideoMime(file.type);
    setVideoAnalysis(null);
    const reader = new FileReader();
    reader.onload = () => {
      setReferenceVideo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeVideo = async () => {
    if (!referenceVideo) return;
    setAnalyzingVideo(true);
    try {
      const data = await api<{ analysis: any; success: boolean }>("/api/analyze-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_data: referenceVideo,
          mime_type: referenceVideoMime,
        }),
      });
      setVideoAnalysis(data.analysis);
      showToast("動画の分析が完了しました！", "success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "動画の分析に失敗しました";
      showToast(msg, "error");
    }
    setAnalyzingVideo(false);
  };

  /* ─── Generate Video ─── */
  const handleGenerateVideo = async () => {
    if (!selectedAccountId) return;
    setVideoGenerating(true);
    setVideoProgress("動画プロンプト生成中...");
    setGeneratedVideoUrl(null);
    setGeneratedCaption("");
    setGeneratedPostId(null);
    try {
      // Step 1: Geminiでテキスト生成 + WeryAIジョブ作成（すぐ返る）
      const data = await api<{
        task_id: string;
        post_id: string;
        post_text: string;
      }>("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: selectedAccountId,
          theme,
          model: videoModel,
          aspect_ratio: videoAspectRatio,
          duration: videoDuration,
          reference_image: referenceImage,
          video_analysis: videoAnalysis,
        }),
      });

      let caption = data.post_text;
      if (hashtags.trim() && !caption.includes(hashtags.trim())) {
        caption = caption.trimEnd() + "\n\n" + hashtags.trim();
      }
      setGeneratedCaption(caption);
      setGeneratedPostId(data.post_id);

      // Step 2: ポーリングで動画完了を待つ（最大15分）
      setVideoProgress("動画生成中...");
      const maxPoll = 180; // 5秒×180 = 15分
      let videoCompleted = false;
      let completedVideoUrl: string | null = null;
      for (let i = 0; i < maxPoll; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        const elapsed = (i + 1) * 5;
        const min = Math.floor(elapsed / 60);
        const sec = elapsed % 60;
        const timeStr = min > 0 ? `${min}分${sec > 0 ? sec + "秒" : ""}` : `${sec}秒`;
        try {
          const status = await api<{
            status: string;
            video_url: string | null;
            error?: string;
          }>(`/api/video-status?task_id=${data.task_id}`);

          if (elapsed >= 600) {
            setVideoProgress(`動画生成中...（${timeStr}経過）通常より時間がかかっています`);
          } else {
            setVideoProgress(`動画生成中...（${timeStr}経過）`);
          }

          if (status.status === "succeed" && status.video_url) {
            videoCompleted = true;
            completedVideoUrl = status.video_url;
            break;
          }
          if (status.status === "failed") {
            throw new Error(status.error || "動画生成に失敗しました");
          }
        } catch (pollErr: unknown) {
          if (pollErr instanceof Error && pollErr.message.includes("失敗")) {
            throw pollErr;
          }
          setVideoProgress(`動画生成中...（${timeStr}経過）`);
        }
      }

      if (!videoCompleted || !completedVideoUrl) {
        throw new Error("動画生成がタイムアウトしました（15分）。しばらく待ってからもう一度お試しください。");
      }

      // Step 3: 動画をダウンロード＆Supabaseにアップロード
      setVideoProgress("動画をダウンロード中...");
      const dlResult = await api<{
        status: string;
        video_url: string;
        error?: string;
      }>("/api/video-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_url: completedVideoUrl,
          post_id: data.post_id || null,
        }),
      });

      if (dlResult.video_url) {
        setGeneratedVideoUrl(dlResult.video_url);
        showToast("動画を生成しました！", "success");
        setVideoGenerating(false);
        setVideoProgress("");
        return;
      }
      throw new Error(dlResult.error || "動画のダウンロードに失敗しました");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "動画生成に失敗しました";
      showToast(msg, "error");
    }
    setVideoGenerating(false);
    setVideoProgress("");
  };

  /* ─── Post Video ─── */
  const handlePostVideo = async () => {
    if (!generatedPostId || !generatedVideoUrl) return;
    setPosting(true);
    try {
      await api("/api/post-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: generatedPostId,
          video_url: generatedVideoUrl,
        }),
      });
      showToast("動画を投稿しました！", "success");
      setGeneratedCaption("");
      setGeneratedVideoUrl(null);
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
      if (s.weryai_api_key && typeof s.weryai_api_key === "string") setSettingsOpenAI(s.weryai_api_key);
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
      if (settingsOpenAI) {
        await api("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "weryai_api_key", value: settingsOpenAI }),
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

  /* ─── LinkedIn Post ─── */
  const handleLinkedInGenerate = async () => {
    if (!liTopic.trim()) {
      showToast("トピックを入力してください", "error");
      return;
    }
    setLiGenerating(true);
    setLiCaption("");
    setLiHeadline("");
    setLiImage(null);
    setLiImageUrl(null);
    setLiPostId(null);
    try {
      const data = await api<{
        post_text: string;
        headline: string;
        image_prompt: string;
        image_data: string | null;
        image_url: string | null;
        post_id: string | null;
      }>("/api/generate-linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: liTopic,
          style: liStyle,
          reference_image: liRefImage,
        }),
      });
      setLiCaption(data.post_text);
      setLiHeadline(data.headline);
      setLiImage(data.image_data);
      setLiImageUrl(data.image_url);
      setLiPostId(data.post_id);
      showToast("LinkedIn投稿を生成しました", "success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "生成に失敗しました";
      showToast(msg, "error");
    }
    setLiGenerating(false);
  };

  const handleLinkedInPost = async () => {
    if (!liPostId) return;
    setLiPosting(true);
    try {
      const urlToSend = liImageUrl || liImage || undefined;
      await api("/api/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: liPostId,
          image_urls: urlToSend ? [urlToSend] : undefined,
        }),
      });
      showToast("LinkedInに投稿しました！", "success");
      setLiCaption("");
      setLiHeadline("");
      setLiImage(null);
      setLiImageUrl(null);
      setLiPostId(null);
      fetchPosts();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "投稿に失敗しました";
      showToast(msg, "error");
    }
    setLiPosting(false);
  };

  const handleLiSyncPosts = async () => {
    setLiSyncing(true);
    try {
      await api<{ synced: number }>("/api/linkedin-analytics?action=sync");
      const data = await api<{ posts: LinkedInCachedPost[] }>("/api/linkedin-analytics?action=posts");
      setLiPastPosts(data.posts);
      showToast(`${data.posts.length}件のLinkedIn投稿を同期しました`, "success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "同期に失敗しました";
      showToast(msg, "error");
    }
    setLiSyncing(false);
  };

  const handleLiFetchPosts = async () => {
    try {
      const data = await api<{ posts: LinkedInCachedPost[] }>("/api/linkedin-analytics?action=posts");
      setLiPastPosts(data.posts);
    } catch { /* ignore */ }
  };

  const handleLiSaveMetrics = async (post: LinkedInCachedPost) => {
    setLiSavingMetrics(true);
    try {
      await api("/api/linkedin-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: post.id,
          impressions: post.impressions,
          views: post.views,
          likes: post.likes,
          comments: post.comments,
          shares: post.shares,
          clicks: post.clicks,
          style_tags: post.style_tags,
          is_top_performer: post.is_top_performer,
        }),
      });
      showToast("エンゲージメントデータを保存しました", "success");
      setLiEditingPost(null);
      handleLiFetchPosts();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "保存に失敗しました";
      showToast(msg, "error");
    }
    setLiSavingMetrics(false);
  };

  /* ─── Analytics Report Handler ─── */
  const handleGenerateReport = async (platform: "instagram" | "linkedin") => {
    const setLoading = platform === "instagram" ? setIgReportLoading : setLiReportLoading;
    const setReport = platform === "instagram" ? setIgReport : setLiReport;
    setLoading(true);
    setReport(null);
    try {
      const data = await api<{ report: string }>("/api/analytics-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      setReport(data.report);
      showToast("AIレポートを生成しました", "success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "レポート生成に失敗しました";
      showToast(msg, "error");
    }
    setLoading(false);
  };

  /* ─── Instagram Analytics Handlers ─── */
  const handleIgSyncPosts = async () => {
    setIgSyncing(true);
    try {
      await api<{ synced: number }>("/api/instagram-analytics?action=sync");
      const data = await api<{ posts: InstagramCachedPost[] }>("/api/instagram-analytics?action=posts");
      setIgPastPosts(data.posts);
      showToast(`${data.posts.length}件のInstagram投稿を同期しました`, "success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "同期に失敗しました";
      showToast(msg, "error");
    }
    setIgSyncing(false);
  };

  const handleIgFetchPosts = async () => {
    try {
      const data = await api<{ posts: InstagramCachedPost[] }>("/api/instagram-analytics?action=posts");
      setIgPastPosts(data.posts);
    } catch { /* ignore */ }
  };

  const handleIgSaveMetrics = async (post: InstagramCachedPost) => {
    setIgSavingMetrics(true);
    try {
      await api("/api/instagram-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: post.id,
          impressions: post.impressions,
          reach: post.reach,
          views: post.views,
          likes: post.likes,
          comments: post.comments,
          shares: post.shares,
          saves: post.saves,
          media_type: post.media_type,
          style_tags: post.style_tags,
          is_top_performer: post.is_top_performer,
        }),
      });
      showToast("エンゲージメントデータを保存しました", "success");
      setIgEditingPost(null);
      handleIgFetchPosts();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "保存に失敗しました";
      showToast(msg, "error");
    }
    setIgSavingMetrics(false);
  };

  const handleLiRefImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("画像ファイルを選択してください", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLiRefImage(reader.result as string);
    reader.readAsDataURL(file);
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
    { id: "instagram", label: "Instagram投稿", icon: Icon.instagram },
    { id: "tiktok", label: "TikTok投稿", icon: Icon.tiktok },
    { id: "x", label: "X投稿", icon: Icon.x },
    { id: "linkedin", label: "LinkedIn投稿", icon: Icon.linkedin },
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
              onClick={() => {
                // 現在のプラットフォーム状態を保存
                savePlatformState(view);
                // 新しいビューに切り替え
                setView(item.id);
                // プラットフォーム別の状態を復元
                const platformViews = ["instagram", "tiktok", "x", "linkedin", "create"];
                if (platformViews.includes(item.id)) {
                  restorePlatformState(item.id);
                  // スナップショットにアカウントがなければ自動選択
                  const snap = platformSnapshots.current[item.id];
                  if (!snap || !snap.selectedAccountId) {
                    const platformMap: Record<string, string> = { instagram: "instagram", tiktok: "tiktok", x: "twitter" };
                    const pf = platformMap[item.id];
                    if (pf) {
                      const first = accounts.find((a) => a.platform === pf);
                      if (first) setSelectedAccountId(first.id);
                    }
                  }
                }
              }}
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
        {(view === "create" || view === "instagram" || view === "tiktok" || view === "x") && (() => {
          const platformFilter = view === "instagram" ? "instagram" : view === "tiktok" ? "tiktok" : view === "x" ? "twitter" : null;
          const platformTitle = view === "instagram" ? "Instagram投稿" : view === "tiktok" ? "TikTok投稿" : view === "x" ? "X (Twitter) 投稿" : "投稿を作成";
          const platformColor = view === "instagram" ? "#E1306C" : view === "tiktok" ? "#00f2ea" : view === "x" ? "#1DA1F2" : "#6366f1";
          const filteredAccounts = platformFilter ? accounts.filter((a) => a.platform === platformFilter) : accounts;
          const isIG = view === "instagram";
          const isTT = view === "tiktok";
          const isX = view === "x";
          const platformSubtitle = isIG
            ? "フィード投稿・カルーセル・リールをAIで作成"
            : isTT
            ? "ショート動画をAIで自動生成"
            : isX
            ? "ツイート・スレッドをAIで作成"
            : "AIでキャプションと画像を生成";

          // Platform-specific tips
          const platformTips = isIG ? [
            { icon: "📸", text: "カルーセル投稿はエンゲージメント率が1.4倍高い" },
            { icon: "🎬", text: "リール動画はリーチが最大3倍" },
            { icon: "#", text: "ハッシュタグは20〜30個が最適" },
          ] : isTT ? [
            { icon: "⚡", text: "最初の3秒で視聴者を引きつける" },
            { icon: "🎵", text: "トレンドBGMでリーチ拡大" },
            { icon: "📱", text: "縦型9:16が必須フォーマット" },
          ] : isX ? [
            { icon: "💬", text: "280文字以内で簡潔に" },
            { icon: "🧵", text: "スレッド形式で深い話題を展開" },
            { icon: "📊", text: "画像付きツイートはRT率が150%UP" },
          ] : null;

          return (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4, color: "#f4f4f5", display: "flex", alignItems: "center", gap: 10 }}>
                  {platformFilter && <span style={{ color: platformColor }}>{view === "instagram" ? Icon.instagram : view === "tiktok" ? Icon.tiktok : view === "x" ? Icon.x : null}</span>}
                  {platformTitle}
                </h1>
                <p style={{ color: "#71717a" }}>{platformSubtitle}</p>
              </div>
              {platformFilter && (
                <div style={{ display: "flex", gap: 4, background: "#0f0f18", borderRadius: 10, padding: 4, border: "1px solid #1a1a24" }}>
                  {(isIG ? [
                    { id: "feed", label: "フィード", active: igTab === "create" && !videoMode },
                    { id: "reels", label: "リール", active: igTab === "create" && videoMode },
                    { id: "analytics", label: "分析", active: igTab === "analytics" },
                  ] : isTT ? [
                    { id: "video", label: "動画", active: videoMode },
                  ] : isX ? [
                    { id: "tweet", label: "ツイート", active: textOnly },
                    { id: "media", label: "画像付き", active: !textOnly && !videoMode },
                  ] : []).map((tab) => (
                    <button
                      key={tab.id}
                      style={{
                        padding: "8px 18px",
                        borderRadius: 8,
                        border: "none",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        background: tab.active ? platformColor : "transparent",
                        color: tab.active ? "#fff" : "#71717a",
                        transition: "all 0.15s",
                      }}
                      onClick={() => {
                        if (isIG) {
                          if (tab.id === "analytics") {
                            setIgTab("analytics");
                            if (igPastPosts.length === 0) handleIgFetchPosts();
                          } else {
                            setIgTab("create");
                            setVideoMode(tab.id === "reels");
                            setTextOnly(false);
                          }
                        } else if (isTT) {
                          setVideoMode(true);
                          setTextOnly(false);
                        } else if (isX) {
                          if (tab.id === "tweet") { setTextOnly(true); setVideoMode(false); }
                          else { setTextOnly(false); setVideoMode(false); }
                        }
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Platform Tips */}
            {platformTips && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
                marginBottom: 24,
              }}>
                {platformTips.map((tip, i) => (
                  <div key={i} style={{
                    padding: "12px 14px",
                    background: `${platformColor}08`,
                    border: `1px solid ${platformColor}20`,
                    borderRadius: 10,
                    fontSize: 12,
                    color: "#a1a1aa",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                  }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{tip.icon}</span>
                    <span>{tip.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ─── Instagram Analytics Tab ─── */}
            {isIG && igTab === "analytics" && (
              <div>
                {/* Sync bar */}
                <div style={{ ...s.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#f4f4f5" }}>
                      過去のInstagram投稿 ({igPastPosts.length}件)
                    </span>
                    <span style={{ fontSize: 12, color: "#52525b", marginLeft: 12 }}>
                      エンゲージメントデータを入力して投稿パフォーマンスを可視化
                    </span>
                  </div>
                  <button
                    style={{ ...s.btnPrimary, background: "linear-gradient(135deg, #E1306C, #C13584)" }}
                    onClick={handleIgSyncPosts}
                    disabled={igSyncing}
                  >
                    {igSyncing ? <div style={s.spinner} /> : Icon.refresh}
                    {igSyncing ? "同期中..." : "Bufferから同期"}
                  </button>
                </div>

                {/* Stats summary */}
                {igPastPosts.some((p) => p.impressions > 0) && (
                  <div style={{ ...s.statGrid, marginTop: 0 }}>
                    <div style={s.statCard("#E1306C")}>
                      <div style={{ fontSize: 12, color: "#71717a", marginBottom: 4 }}>平均エンゲージメント率</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: "#f472b6" }}>
                        {(igPastPosts.filter(p => p.engagement_rate > 0).reduce((sm, p) => sm + p.engagement_rate, 0) / Math.max(igPastPosts.filter(p => p.engagement_rate > 0).length, 1)).toFixed(1)}%
                      </div>
                    </div>
                    <div style={s.statCard("#8b5cf6")}>
                      <div style={{ fontSize: 12, color: "#71717a", marginBottom: 4 }}>合計リーチ</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: "#a78bfa" }}>
                        {igPastPosts.reduce((sm, p) => sm + (p.reach || 0), 0).toLocaleString()}
                      </div>
                    </div>
                    <div style={s.statCard("#22c55e")}>
                      <div style={{ fontSize: 12, color: "#71717a", marginBottom: 4 }}>合計いいね</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: "#4ade80" }}>
                        {igPastPosts.reduce((sm, p) => sm + (p.likes || 0), 0).toLocaleString()}
                      </div>
                    </div>
                    <div style={s.statCard("#f59e0b")}>
                      <div style={{ fontSize: 12, color: "#71717a", marginBottom: 4 }}>保存数</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: "#fbbf24" }}>
                        {igPastPosts.reduce((sm, p) => sm + (p.saves || 0), 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Media type breakdown */}
                {igPastPosts.length > 0 && igPastPosts.some((p) => p.impressions > 0) && (() => {
                  const reels = igPastPosts.filter(p => p.media_type === "reel" && p.engagement_rate > 0);
                  const images = igPastPosts.filter(p => p.media_type === "image" && p.engagement_rate > 0);
                  const carousels = igPastPosts.filter(p => p.media_type === "carousel" && p.engagement_rate > 0);
                  const avgRate = (arr: InstagramCachedPost[]) => arr.length > 0
                    ? (arr.reduce((sm, p) => sm + p.engagement_rate, 0) / arr.length).toFixed(1) : "—";
                  return (
                    <div style={{ ...s.card, marginTop: 0 }}>
                      <h3 style={{ ...s.cardHeader, fontSize: 14 }}>メディアタイプ別パフォーマンス</h3>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                        {[
                          { label: "リール", count: reels.length, avg: avgRate(reels), color: "#E1306C", icon: "🎬" },
                          { label: "画像", count: images.length, avg: avgRate(images), color: "#8b5cf6", icon: "📸" },
                          { label: "カルーセル", count: carousels.length, avg: avgRate(carousels), color: "#f59e0b", icon: "📋" },
                        ].map((mt) => (
                          <div key={mt.label} style={{
                            padding: 16,
                            background: `${mt.color}08`,
                            border: `1px solid ${mt.color}20`,
                            borderRadius: 10,
                            textAlign: "center",
                          }}>
                            <div style={{ fontSize: 24, marginBottom: 4 }}>{mt.icon}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5" }}>{mt.label}</div>
                            <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>{mt.count}件</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: mt.color, marginTop: 4 }}>
                              {mt.avg}%
                            </div>
                            <div style={{ fontSize: 10, color: "#52525b" }}>平均ER</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Editing modal */}
                {igEditingPost && (
                  <div style={{ ...s.card, border: "2px solid #E1306C", marginBottom: 20 }}>
                    <h3 style={{ ...s.cardHeader, fontSize: 15 }}>エンゲージメントデータ入力</h3>
                    <div style={{
                      padding: 12,
                      background: "#0c0c12",
                      borderRadius: 8,
                      fontSize: 13,
                      color: "#a1a1aa",
                      marginBottom: 16,
                      maxHeight: 100,
                      overflow: "hidden",
                      lineHeight: 1.6,
                    }}>
                      {igEditingPost.text.substring(0, 200)}{igEditingPost.text.length > 200 ? "..." : ""}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ ...s.label, fontSize: 12 }}>メディアタイプ</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        {[
                          { id: "image", label: "画像" },
                          { id: "reel", label: "リール" },
                          { id: "carousel", label: "カルーセル" },
                        ].map((mt) => (
                          <button
                            key={mt.id}
                            style={{
                              padding: "6px 14px",
                              borderRadius: 8,
                              border: igEditingPost.media_type === mt.id ? "2px solid #E1306C" : "1px solid #2a2a3a",
                              background: igEditingPost.media_type === mt.id ? "#E1306C18" : "#0c0c12",
                              color: igEditingPost.media_type === mt.id ? "#f472b6" : "#71717a",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                            onClick={() => setIgEditingPost({ ...igEditingPost, media_type: mt.id })}
                          >
                            {mt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
                      {[
                        { key: "impressions", label: "インプレッション", icon: "👀" },
                        { key: "reach", label: "リーチ", icon: "📡" },
                        { key: "likes", label: "いいね", icon: "❤️" },
                        { key: "comments", label: "コメント", icon: "💬" },
                        { key: "shares", label: "シェア", icon: "🔄" },
                        { key: "saves", label: "保存", icon: "🔖" },
                        { key: "views", label: "再生回数", icon: "▶️" },
                      ].map((field) => (
                        <div key={field.key} style={s.formGroup}>
                          <label style={{ ...s.label, fontSize: 11 }}>{field.icon} {field.label}</label>
                          <input
                            type="number"
                            style={{ ...s.input, fontSize: 14 }}
                            value={(igEditingPost as any)[field.key] || 0}
                            onChange={(e) => setIgEditingPost({
                              ...igEditingPost,
                              [field.key]: parseInt(e.target.value) || 0,
                            })}
                          />
                        </div>
                      ))}
                    </div>
                    <div style={s.formGroup}>
                      <label style={{ ...s.label, fontSize: 12 }}>スタイルタグ（カンマ区切り）</label>
                      <input
                        style={s.input}
                        placeholder="例: リール, ビフォーアフター, チュートリアル, Vlog"
                        value={(igEditingPost.style_tags || []).join(", ")}
                        onChange={(e) => setIgEditingPost({
                          ...igEditingPost,
                          style_tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                        })}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button
                        style={{ ...s.btnPrimary, background: "linear-gradient(135deg, #E1306C, #C13584)" }}
                        onClick={() => handleIgSaveMetrics(igEditingPost)}
                        disabled={igSavingMetrics}
                      >
                        {igSavingMetrics ? <div style={s.spinner} /> : Icon.check}
                        保存
                      </button>
                      <button style={s.btnSecondary} onClick={() => setIgEditingPost(null)}>
                        キャンセル
                      </button>
                    </div>
                  </div>
                )}

                {/* Posts list */}
                {igPastPosts.length === 0 ? (
                  <div style={{ ...s.card, ...s.empty }}>
                    <p style={{ fontSize: 14, marginBottom: 12 }}>まだ投稿データがありません</p>
                    <p style={{ fontSize: 12 }}>「Bufferから同期」ボタンでInstagramの過去投稿を取得してください</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {igPastPosts.map((post) => (
                      <div
                        key={post.id}
                        style={{
                          ...s.card,
                          marginBottom: 0,
                          cursor: "pointer",
                          border: post.is_top_performer ? "1px solid #E1306C40" : "1px solid #1a1a24",
                          background: post.is_top_performer ? "#E1306C08" : "#0f0f18",
                        }}
                        onClick={() => setIgEditingPost({ ...post })}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                              <span style={{
                                ...s.tag(post.media_type === "reel" ? "#E1306C" : post.media_type === "carousel" ? "#f59e0b" : "#8b5cf6"),
                                fontSize: 10,
                              }}>
                                {post.media_type === "reel" ? "🎬 リール" : post.media_type === "carousel" ? "📋 カルーセル" : "📸 画像"}
                              </span>
                              {post.is_top_performer && (
                                <span style={{ ...s.tag("#22c55e"), fontSize: 10 }}>🏆 トップ</span>
                              )}
                            </div>
                            <div style={{
                              fontSize: 13,
                              color: "#d4d4d8",
                              lineHeight: 1.6,
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical" as any,
                            }}>
                              {post.text}
                            </div>
                            <div style={{ fontSize: 11, color: "#52525b", marginTop: 6 }}>
                              {post.sent_at ? new Date(post.sent_at).toLocaleDateString("ja-JP") : "日付不明"}
                              {post.style_tags && post.style_tags.length > 0 && (
                                <span style={{ marginLeft: 8 }}>
                                  {post.style_tags.map((tag, i) => (
                                    <span key={i} style={{
                                      ...s.tag("#E1306C"),
                                      marginLeft: 4,
                                      fontSize: 10,
                                    }}>{tag}</span>
                                  ))}
                                </span>
                              )}
                            </div>
                          </div>
                          {post.impressions > 0 ? (
                            <div style={{ marginLeft: 16, textAlign: "right", flexShrink: 0 }}>
                              <div style={{ fontSize: 20, fontWeight: 800, color: post.engagement_rate > 5 ? "#4ade80" : post.engagement_rate > 2 ? "#fbbf24" : "#f4f4f5" }}>
                                {post.engagement_rate.toFixed(1)}%
                              </div>
                              <div style={{ fontSize: 10, color: "#71717a" }}>エンゲージメント率</div>
                              <div style={{ fontSize: 11, color: "#52525b", marginTop: 4 }}>
                                ❤️{post.likes} 💬{post.comments} 🔖{post.saves}
                              </div>
                            </div>
                          ) : (
                            <div style={{ marginLeft: 16, flexShrink: 0 }}>
                              <span style={s.tag("#6366f1")}>データ未入力</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Report Section */}
                <div style={{ ...s.card, marginTop: 16, borderTop: "2px solid #E1306C40" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: igReport ? 16 : 0 }}>
                    <div>
                      <h3 style={{ ...s.cardHeader, marginBottom: 2 }}>AI分析レポート</h3>
                      <p style={{ fontSize: 12, color: "#52525b" }}>
                        入力済みデータをもとにAIが投稿戦略を提案します
                      </p>
                    </div>
                    <button
                      style={{
                        ...s.btnPrimary,
                        background: "linear-gradient(135deg, #E1306C, #C13584, #833AB4)",
                        opacity: igReportLoading || igPastPosts.filter(p => p.impressions > 0).length === 0 ? 0.5 : 1,
                        pointerEvents: igReportLoading || igPastPosts.filter(p => p.impressions > 0).length === 0 ? "none" : "auto",
                      }}
                      onClick={() => handleGenerateReport("instagram")}
                      disabled={igReportLoading}
                    >
                      {igReportLoading ? <div style={s.spinner} /> : Icon.sparkle}
                      {igReportLoading ? "分析中..." : "AIレポート生成"}
                    </button>
                  </div>
                  {igPastPosts.filter(p => p.impressions > 0).length === 0 && (
                    <p style={{ fontSize: 12, color: "#71717a", marginTop: 8 }}>
                      ※ レポート生成にはエンゲージメントデータが入力された投稿が必要です
                    </p>
                  )}
                  {igReportLoading && (
                    <div style={{ padding: 40, textAlign: "center" }}>
                      <div style={s.spinner} />
                      <p style={{ fontSize: 13, color: "#71717a", marginTop: 12 }}>
                        投稿データを分析してレポートを生成しています...
                      </p>
                    </div>
                  )}
                  {igReport && !igReportLoading && (
                    <div style={{
                      background: "#0c0c14",
                      border: "1px solid #1a1a24",
                      borderRadius: 12,
                      padding: 24,
                      fontSize: 13,
                      lineHeight: 1.8,
                      color: "#d4d4d8",
                      whiteSpace: "pre-wrap",
                      maxHeight: 600,
                      overflow: "auto",
                    }}>
                      {igReport.split("\n").map((line, i) => {
                        if (line.startsWith("## ")) return <h3 key={i} style={{ fontSize: 16, fontWeight: 700, color: "#f4f4f5", marginTop: 20, marginBottom: 8 }}>{line.replace("## ", "")}</h3>;
                        if (line.startsWith("### ")) return <h4 key={i} style={{ fontSize: 14, fontWeight: 600, color: "#e4e4e7", marginTop: 14, marginBottom: 6 }}>{line.replace("### ", "")}</h4>;
                        if (line.startsWith("**") && line.endsWith("**")) return <p key={i} style={{ fontWeight: 700, color: "#f4f4f5", marginTop: 8 }}>{line.replace(/\*\*/g, "")}</p>;
                        if (line.startsWith("- ") || line.startsWith("* ")) return <div key={i} style={{ paddingLeft: 16, position: "relative" }}><span style={{ position: "absolute", left: 0, color: "#E1306C" }}>•</span>{line.replace(/^[-*] /, "")}</div>;
                        if (line.match(/^\d+\./)) return <div key={i} style={{ paddingLeft: 8, marginTop: 4 }}><span style={{ color: "#E1306C", fontWeight: 700 }}>{line.match(/^\d+\./)?.[0]}</span> {line.replace(/^\d+\.\s*/, "")}</div>;
                        if (line.trim() === "") return <div key={i} style={{ height: 8 }} />;
                        return <p key={i}>{line}</p>;
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── Create Content (hidden when IG analytics tab is active) ─── */}
            {!(isIG && igTab === "analytics") && platformFilter && filteredAccounts.length === 0 && (
              <div style={{ ...s.card, textAlign: "center", padding: 40, marginBottom: 24 }}>
                <p style={{ fontSize: 16, color: "#71717a", marginBottom: 16 }}>
                  {PLATFORM_LABELS[platformFilter]}のアカウントがまだ登録されていません
                </p>
                <button style={{ ...s.btnPrimary, background: `linear-gradient(135deg, ${platformColor}, ${platformColor}cc)` }} onClick={() => setView("accounts")}>
                  {Icon.plus} アカウントを追加
                </button>
              </div>
            )}

            {!(isIG && igTab === "analytics") && (<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Left: Generation form */}
              <div style={{ ...s.card, borderTop: platformFilter ? `2px solid ${platformColor}40` : undefined }}>
                <h3 style={s.cardHeader}>
                  {isIG ? "フィード / リール設定" : isTT ? "ショート動画設定" : isX ? "ツイート設定" : "生成設定"}
                </h3>
                {/* メディアタイプ切り替え（汎用ページのみ表示） */}
                {!platformFilter && (
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  <button
                    style={{
                      ...s.btnSmall,
                      background: !videoMode ? "#6366f120" : "#1a1a2e",
                      color: !videoMode ? "#818cf8" : "#71717a",
                      border: `1px solid ${!videoMode ? "#6366f140" : "#27273a"}`,
                    }}
                    onClick={() => setVideoMode(false)}
                  >
                    {Icon.image} 画像投稿
                  </button>
                  <button
                    style={{
                      ...s.btnSmall,
                      background: videoMode ? "#f43f5e20" : "#1a1a2e",
                      color: videoMode ? "#fb7185" : "#71717a",
                      border: `1px solid ${videoMode ? "#f43f5e40" : "#27273a"}`,
                    }}
                    onClick={() => setVideoMode(true)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                    動画投稿
                  </button>
                </div>
                )}
                <div style={s.formGroup}>
                  <label style={s.label}>アカウント</label>
                  <select
                    style={s.select as React.CSSProperties}
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                  >
                    <option value="">アカウントを選択...</option>
                    {filteredAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({PLATFORM_LABELS[acc.platform]})
                      </option>
                    ))}
                  </select>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>
                    {isX ? "ツイート内容・テーマ" : isTT ? "動画テーマ" : isIG ? "投稿テーマ" : "テーマ"}（オプション）
                  </label>
                  {isX ? (
                    <textarea
                      style={{ ...s.input, minHeight: 80, resize: "vertical" } as React.CSSProperties}
                      placeholder="例: 最新のAIトレンドについて意見を述べたい..."
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      maxLength={500}
                    />
                  ) : (
                    <input
                      style={s.input}
                      placeholder={isTT ? "例: ダンスチャレンジ、料理レシピ..." : isIG ? "例: 春のカフェ巡り、新作コスメレビュー..." : "例: 春のカフェ巡り、新作コスメレビュー..."}
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                    />
                  )}
                  {isX && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      <p style={{ fontSize: 12, color: "#52525b" }}>AIが280文字以内に最適化します</p>
                      <p style={{ fontSize: 12, color: theme.length > 400 ? "#ef4444" : "#52525b" }}>{theme.length}/500</p>
                    </div>
                  )}
                  {!isX && (
                    <p style={{ fontSize: 12, color: "#52525b", marginTop: 4 }}>
                      空欄の場合、AIが自動でテーマを選びます
                    </p>
                  )}
                </div>
                {/* Instagram: ハッシュタグ重要 */}
                <div style={s.formGroup}>
                  <label style={s.label}>
                    {isIG ? "ハッシュタグ（重要）" : isX ? "ハッシュタグ" : "ハッシュタグ（オプション）"}
                  </label>
                  <input
                    style={s.input}
                    placeholder={isIG ? "例: #カフェ巡り #東京グルメ #おしゃれ #instagood" : isX ? "例: #AI #テック" : "例: #カフェ巡り #東京グルメ #おしゃれ"}
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                  />
                  <p style={{ fontSize: 12, color: isIG ? platformColor : "#52525b", marginTop: 4 }}>
                    {isIG
                      ? "20〜30個のハッシュタグでリーチを最大化。空欄ならAIが自動生成"
                      : "指定すると生成テキストに追加されます。空欄ならAIが自動生成"}
                  </p>
                </div>
                {videoMode ? (
                  <>
                    <div style={s.formGroup}>
                      <label style={s.label}>動画モデル</label>
                      <select style={s.select as React.CSSProperties} value={videoModel} onChange={(e) => setVideoModel(e.target.value)}>
                        <optgroup label="高速">
                          <option value="KLING_V3_0_STA">Kling 3.0 Standard</option>
                          <option value="WERYAI_VIDEO_1_0">WeryAI Video 1.0</option>
                          <option value="VEO_3_1_FAST">Veo 3.1 Fast</option>
                          <option value="HAILUO_2_3_STA">Hailuo 2.3 Standard</option>
                          <option value="PIKA_2_2">Pika 2.2</option>
                        </optgroup>
                        <optgroup label="高品質">
                          <option value="KLING_V3_0_PRO">Kling 3.0 Pro</option>
                          <option value="SEEDANCE_2_0">Seedance 2.0</option>
                          <option value="VEO_3_1">Veo 3.1</option>
                          <option value="HAILUO_2_3_PRO">Hailuo 2.3 Pro</option>
                          <option value="WAN_2_6">Wan 2.6</option>
                          <option value="DOUBAO_1_5_PRO">Seedance 1.5 Pro</option>
                        </optgroup>
                        <optgroup label="その他">
                          <option value="SORA_2">Sora 2</option>
                        </optgroup>
                      </select>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div style={s.formGroup}>
                        <label style={s.label}>アスペクト比</label>
                        <select style={s.select as React.CSSProperties} value={videoAspectRatio} onChange={(e) => setVideoAspectRatio(e.target.value)}>
                          <option value="9:16">縦型 9:16（Reels/TikTok）</option>
                          <option value="16:9">横型 16:9（YouTube）</option>
                          <option value="1:1">正方形 1:1</option>
                        </select>
                      </div>
                      <div style={s.formGroup}>
                        <label style={s.label}>長さ</label>
                        <select style={s.select as React.CSSProperties} value={videoDuration} onChange={(e) => setVideoDuration(Number(e.target.value))}>
                          <option value={5}>5秒</option>
                          <option value={10}>10秒</option>
                        </select>
                      </div>
                    </div>
                    <div style={s.formGroup}>
                      <label style={s.label}>参照画像（オプション）</label>
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
                        onClick={() => document.getElementById("ref-image-input-video")?.click()}
                      >
                        <input
                          id="ref-image-input-video"
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
                        参照画像をアップロードすると、その画像をベースにした動画を生成します
                      </p>
                    </div>
                    {/* 参考動画アップロード */}
                    <div style={s.formGroup}>
                      <label style={s.label}>参考動画（オプション）</label>
                      <div
                        style={{
                          border: "2px dashed #2a2a3a",
                          borderRadius: 10,
                          padding: referenceVideo ? 8 : 24,
                          textAlign: "center",
                          cursor: "pointer",
                          background: "#0c0c12",
                          position: "relative",
                        }}
                        onClick={() => document.getElementById("ref-video-input")?.click()}
                      >
                        <input
                          id="ref-video-input"
                          type="file"
                          accept="video/*"
                          style={{ display: "none" }}
                          onChange={handleReferenceVideoUpload}
                        />
                        {referenceVideo ? (
                          <div style={{ position: "relative" }}>
                            <video
                              src={referenceVideo}
                              style={{ maxWidth: "100%", maxHeight: 120, borderRadius: 8 }}
                              muted
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
                                setReferenceVideo(null);
                                setVideoAnalysis(null);
                              }}
                            >
                              削除
                            </button>
                          </div>
                        ) : (
                          <>
                            <div style={{ color: "#52525b", marginBottom: 4 }}>{Icon.upload}</div>
                            <p style={{ fontSize: 13, color: "#52525b" }}>
                              クリックして参考動画をアップロード（50MB以下）
                            </p>
                          </>
                        )}
                      </div>
                      {referenceVideo && !videoAnalysis && (
                        <button
                          style={{
                            ...s.btnPrimary,
                            width: "100%",
                            justifyContent: "center",
                            marginTop: 8,
                            background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                            opacity: analyzingVideo ? 0.6 : 1,
                            pointerEvents: analyzingVideo ? "none" : "auto",
                          }}
                          onClick={handleAnalyzeVideo}
                          disabled={analyzingVideo}
                        >
                          {analyzingVideo ? <><div style={s.spinner} /> Geminiで動画を分析中...</> : <>🔍 動画をAIで分析</>}
                        </button>
                      )}
                      {videoAnalysis && (
                        <div style={{
                          marginTop: 8,
                          padding: 12,
                          background: "#0f0f1a",
                          borderRadius: 10,
                          border: "1px solid #27273a",
                          fontSize: 13,
                          color: "#a1a1aa",
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <span style={{ color: "#a5b4fc", fontWeight: 600, fontSize: 14 }}>分析結果</span>
                            <button
                              style={{ background: "none", border: "none", color: "#71717a", cursor: "pointer", fontSize: 12 }}
                              onClick={() => setVideoAnalysis(null)}
                            >
                              クリア
                            </button>
                          </div>
                          <div style={{ display: "grid", gap: 6 }}>
                            <div><span style={{ color: "#818cf8" }}>スタイル:</span> {videoAnalysis.style}</div>
                            <div><span style={{ color: "#818cf8" }}>ムード:</span> {videoAnalysis.overall_mood}</div>
                            <div><span style={{ color: "#818cf8" }}>カラー:</span> {videoAnalysis.color_palette}</div>
                            <div><span style={{ color: "#818cf8" }}>被写体:</span> {videoAnalysis.subject}</div>
                            <div><span style={{ color: "#818cf8" }}>遷移:</span> {videoAnalysis.transitions}</div>
                            {videoAnalysis.scenes?.length > 0 && (
                              <div>
                                <span style={{ color: "#818cf8" }}>シーン ({videoAnalysis.scenes.length}):</span>
                                <div style={{ marginTop: 4, paddingLeft: 8 }}>
                                  {videoAnalysis.scenes.map((scene: any, i: number) => (
                                    <div key={i} style={{ marginBottom: 4, fontSize: 12 }}>
                                      <span style={{ color: "#6366f1" }}>[{scene.camera_movement}]</span> {scene.description} <span style={{ color: "#52525b" }}>({scene.duration_hint})</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <p style={{ marginTop: 8, fontSize: 11, color: "#52525b" }}>
                            この分析データが動画生成のプロンプトに自動反映されます
                          </p>
                        </div>
                      )}
                      <p style={{ fontSize: 12, color: "#52525b", marginTop: 4 }}>
                        参考動画をアップロード→分析すると、スタイルや構成を再現した動画を生成します
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                {/* テキストのみ投稿トグル（Instagram以外で表示） */}
                {(() => {
                  const selectedAcc = accounts.find((a) => a.id === selectedAccountId);
                  return selectedAcc && selectedAcc.platform !== "instagram" ? (
                    <div style={{ ...s.formGroup, display: "flex", alignItems: "center", gap: 12 }}>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          cursor: "pointer",
                          fontSize: 14,
                          color: textOnly ? "#a5b4fc" : "#a1a1aa",
                          userSelect: "none",
                        }}
                        onClick={() => {
                          setTextOnly(!textOnly);
                          if (!textOnly) {
                            setImageCount(1); // reset when toggling off later
                          }
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 22,
                            borderRadius: 11,
                            background: textOnly ? "#6366f1" : "#3f3f46",
                            position: "relative",
                            transition: "background 0.2s",
                            flexShrink: 0,
                          }}
                        >
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              background: "#fff",
                              position: "absolute",
                              top: 2,
                              left: textOnly ? 20 : 2,
                              transition: "left 0.2s",
                            }}
                          />
                        </div>
                        テキストのみ投稿（画像なし）
                      </label>
                    </div>
                  ) : null;
                })()}
                {!textOnly && (<>
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
                <div style={s.formGroup}>
                  <label style={s.label}>画像スタイル</label>
                  <p style={{ fontSize: 12, color: "#52525b", marginTop: -4, marginBottom: 8 }}>
                    投稿の目的に合ったスタイルを選択
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                    {IMAGE_STYLES.map((st) => (
                      <button
                        key={st.id}
                        style={{
                          padding: "10px 6px",
                          borderRadius: 10,
                          border: imageStyle === st.id ? "2px solid #6366f1" : "1px solid #2a2a3a",
                          background: imageStyle === st.id ? "#6366f115" : "#0c0c12",
                          color: imageStyle === st.id ? "#e0e7ff" : "#a1a1aa",
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 0.15s",
                          textAlign: "center",
                          lineHeight: 1.3,
                        }}
                        onClick={() => setImageStyle(st.id)}
                        title={st.desc}
                      >
                        <span style={{ fontSize: 18, display: "block", marginBottom: 2 }}>{st.emoji}</span>
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>テキストオーバーレイ（オプション）</label>
                  <p style={{ fontSize: 12, color: "#52525b", marginTop: -4, marginBottom: 8 }}>
                    各位置にテキストを入力。空欄ならAIが自動生成します
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "#71717a", minWidth: 24, textAlign: "center" }}>上</span>
                      <input
                        type="text"
                        style={{ ...(s.input as React.CSSProperties), flex: 1, margin: 0 }}
                        placeholder="例: 知らないと損する"
                        value={overlayTextTop}
                        onChange={(e) => setOverlayTextTop(e.target.value)}
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "#71717a", minWidth: 24, textAlign: "center" }}>中</span>
                      <input
                        type="text"
                        style={{ ...(s.input as React.CSSProperties), flex: 1, margin: 0 }}
                        placeholder="例: カフェ巡り3選"
                        value={overlayTextMiddle}
                        onChange={(e) => setOverlayTextMiddle(e.target.value)}
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "#71717a", minWidth: 24, textAlign: "center" }}>下</span>
                      <input
                        type="text"
                        style={{ ...(s.input as React.CSSProperties), flex: 1, margin: 0 }}
                        placeholder="例: 保存して見返してね！"
                        value={overlayTextBottom}
                        onChange={(e) => setOverlayTextBottom(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                </>)}
                  </>
                )}
                {videoMode ? (
                  <button
                    style={{
                      ...s.btnPrimary,
                      width: "100%",
                      justifyContent: "center",
                      background: platformFilter ? `linear-gradient(135deg, ${platformColor}, ${platformColor}cc)` : "linear-gradient(135deg, #f43f5e, #e11d48)",
                      opacity: videoGenerating || !selectedAccountId ? 0.6 : 1,
                      pointerEvents: videoGenerating || !selectedAccountId ? "none" : "auto",
                    }}
                    onClick={handleGenerateVideo}
                    disabled={videoGenerating || !selectedAccountId}
                  >
                    {videoGenerating
                      ? <><div style={s.spinner} /> {videoProgress || "動画生成中..."}</>
                      : <>{Icon.sparkle} {isTT ? "TikTok動画を生成" : isIG ? "リール動画を生成" : "動画を生成"}</>}
                  </button>
                ) : (
                <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: abTestEnabled ? "#a5b4fc" : "#71717a" }}>
                    <input
                      type="checkbox"
                      checked={abTestEnabled}
                      onChange={(e) => setAbTestEnabled(e.target.checked)}
                      style={{ accentColor: "#6366f1" }}
                    />
                    A/Bテスト（3パターン生成）
                  </label>
                </div>
                <button
                  style={{
                    ...s.btnPrimary,
                    width: "100%",
                    justifyContent: "center",
                    background: platformFilter ? `linear-gradient(135deg, ${platformColor}, ${platformColor}cc)` : undefined,
                    opacity: generating || !selectedAccountId ? 0.5 : 1,
                    pointerEvents: generating || !selectedAccountId ? "none" : "auto",
                  }}
                  onClick={handleGenerate}
                  disabled={generating || !selectedAccountId}
                >
                  {generating ? <div style={s.spinner} /> : Icon.sparkle}
                  {generating
                    ? (textOnly ? "生成中..." : `生成中...（${imageCount}枚）`)
                    : isX
                    ? (textOnly ? "ツイートを生成" : `画像付きツイートを生成（${imageCount}枚）`)
                    : isIG
                    ? `Instagram投稿を生成（${imageCount}枚）`
                    : (textOnly ? "AIで生成（テキストのみ）" : `AIで生成（${imageCount}枚）`)}
                </button>
                </>
                )}
              </div>

              {/* Right: Preview */}
              <div style={{ ...s.card, borderTop: platformFilter ? `2px solid ${platformColor}40` : undefined }}>
                <h3 style={s.cardHeader}>
                  {isIG ? "Instagramプレビュー" : isTT ? "TikTokプレビュー" : isX ? "ツイートプレビュー" : "プレビュー"}
                </h3>
                {!generatedCaption && !generating && !videoGenerating ? (
                  <div style={s.empty}>
                    <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>
                      {isIG ? Icon.instagram : isTT ? Icon.tiktok : isX ? Icon.x : Icon.image}
                    </div>
                    <p style={{ fontSize: 14 }}>
                      {isIG ? "Instagram投稿のプレビュー" : isTT ? "TikTok動画のプレビュー" : isX ? "ツイートのプレビュー" : "生成結果がここに表示されます"}
                    </p>
                  </div>
                ) : (generating || videoGenerating) ? (
                  <div style={{ ...s.empty, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <div style={s.spinner} />
                    <p style={{ fontSize: 14, color: "#71717a" }}>
                      {videoGenerating ? (videoProgress || "動画を生成しています...") : "AIが投稿を生成しています..."}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* 動画プレビュー */}
                    {generatedVideoUrl && (
                      <div style={{ marginTop: 12 }}>
                        <video
                          src={generatedVideoUrl}
                          controls
                          autoPlay
                          muted
                          loop
                          style={{
                            width: "100%",
                            maxHeight: 400,
                            borderRadius: 12,
                            border: "1px solid #27273a",
                            background: "#000",
                          }}
                        />
                      </div>
                    )}
                    {/* 画像ギャラリー */}
                    {!generatedVideoUrl && generatedImages.length > 0 && (
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
                    {!generatedVideoUrl && generatedImages.length === 0 && generatedImage && (
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
                      {abCaptions.length > 1 ? abCaptions[abSelectedIndex] : generatedCaption}
                    </div>
                    {abCaptions.length > 1 && (
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        {abCaptions.map((_, idx) => (
                          <button
                            key={idx}
                            style={{
                              flex: 1,
                              padding: "6px 0",
                              borderRadius: 6,
                              border: abSelectedIndex === idx ? "2px solid #6366f1" : "1px solid #2a2a3a",
                              background: abSelectedIndex === idx ? "#6366f120" : "#0c0c12",
                              color: abSelectedIndex === idx ? "#a5b4fc" : "#71717a",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              setAbSelectedIndex(idx);
                              setGeneratedCaption(abCaptions[idx]);
                            }}
                          >
                            {idx === 0 ? "A" : idx === 1 ? "B" : "C"}パターン
                          </button>
                        ))}
                      </div>
                    )}
                    {carouselSlides.length > 0 && (
                      <div style={{ marginTop: 12, padding: 12, background: "#1a1a2e", borderRadius: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#6366f1", marginBottom: 8 }}>カルーセル構成</div>
                        {carouselSlides.map((slide, idx) => (
                          <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 11, color: "#6366f1", fontWeight: 700, minWidth: 20 }}>{idx + 1}</span>
                            <span style={{ fontSize: 13, color: "#d4d4d8" }}>{slide.slide_text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                      <button
                        style={{
                          ...s.btnPrimary,
                          flex: 1,
                          justifyContent: "center",
                          opacity: posting ? 0.5 : 1,
                          ...(platformFilter
                            ? { background: `linear-gradient(135deg, ${platformColor}, ${platformColor}cc)` }
                            : generatedVideoUrl ? { background: "linear-gradient(135deg, #f43f5e, #e11d48)" } : {}),
                        }}
                        onClick={generatedVideoUrl ? handlePostVideo : handlePost}
                        disabled={posting}
                      >
                        {posting ? <div style={s.spinner} /> : Icon.send}
                        {posting ? "投稿中..." : isIG ? "Instagramに投稿" : isTT ? "TikTokに投稿" : isX ? "Xに投稿" : "Bufferで投稿"}
                      </button>
                      <button style={s.btnSecondary} onClick={generatedVideoUrl ? handleGenerateVideo : handleGenerate}>
                        {Icon.refresh} 再生成
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* 投稿タイミング推奨 */}
              <div style={{ ...s.card, gridColumn: "1 / -1" }}>
                <h3 style={s.cardHeader}>投稿タイミング推奨</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ padding: 12, background: "#14141e", borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: "#6366f1", fontWeight: 600, marginBottom: 8 }}>
                      {isIG ? "Instagram" : isTT ? "TikTok" : isX ? "X" : "SNS"} ベストタイム
                    </div>
                    {(isIG ? [
                      { day: "平日", times: "7:00-9:00, 12:00-13:00, 19:00-21:00", best: "19:00-21:00" },
                      { day: "土日", times: "10:00-12:00, 14:00-16:00, 20:00-22:00", best: "10:00-12:00" },
                    ] : isTT ? [
                      { day: "平日", times: "6:00-8:00, 12:00-13:00, 19:00-23:00", best: "19:00-22:00" },
                      { day: "土日", times: "9:00-12:00, 15:00-17:00, 20:00-23:00", best: "20:00-23:00" },
                    ] : isX ? [
                      { day: "平日", times: "7:00-9:00, 12:00-13:00, 17:00-19:00", best: "12:00-13:00" },
                      { day: "土日", times: "8:00-10:00, 14:00-16:00, 20:00-22:00", best: "14:00-16:00" },
                    ] : [
                      { day: "平日", times: "7:00-9:00, 12:00-13:00, 19:00-21:00", best: "19:00-21:00" },
                      { day: "土日", times: "10:00-12:00, 14:00-16:00, 20:00-22:00", best: "10:00-12:00" },
                    ]).map((row) => (
                      <div key={row.day} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: "#a1a1aa" }}>{row.day}</span>
                        <span style={{ fontSize: 12, color: "#d4d4d8" }}>{row.times}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: 12, background: "#14141e", borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600, marginBottom: 8 }}>
                      今すぐ投稿？
                    </div>
                    {(() => {
                      const now = new Date();
                      const hour = now.getHours();
                      const day = now.getDay();
                      const isWeekend = day === 0 || day === 6;
                      const goodTimes = isIG
                        ? (isWeekend ? [10,11,14,15,20,21] : [7,8,12,19,20])
                        : isTT
                        ? (isWeekend ? [9,10,11,15,16,20,21,22] : [6,7,12,19,20,21,22])
                        : (isWeekend ? [8,9,14,15,20,21] : [7,8,12,17,18]);
                      const isGoodTime = goodTimes.includes(hour);
                      return (
                        <div>
                          <div style={{ fontSize: 24, marginBottom: 4 }}>{isGoodTime ? "🟢" : "🟡"}</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: isGoodTime ? "#10b981" : "#f59e0b" }}>
                            {isGoodTime ? "今が投稿チャンス！" : "もう少し待つのがベター"}
                          </div>
                          <div style={{ fontSize: 12, color: "#71717a", marginTop: 4 }}>
                            {isGoodTime
                              ? "現在はエンゲージメントが高い時間帯です"
                              : `次のゴールデンタイム: ${goodTimes.find(t => t > hour) || goodTimes[0]}:00`}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>)}
          </>
          );
        })()}

        {/* ─── LinkedIn Post View ─── */}
        {view === "linkedin" && (
          <>
            {/* LinkedIn Tips */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              marginBottom: 24,
            }}>
              {[
                { icon: "📝", text: "1,300文字以内の長文投稿が最もエンゲージメントが高い" },
                { icon: "🤝", text: "ストーリー形式の投稿はシェア率が3倍" },
                { icon: "📊", text: "データや実績を含む投稿はインプレッション2倍" },
              ].map((tip, i) => (
                <div key={i} style={{
                  padding: "12px 14px",
                  background: "#0A66C208",
                  border: "1px solid #0A66C220",
                  borderRadius: 10,
                  fontSize: 12,
                  color: "#a1a1aa",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{tip.icon}</span>
                  <span>{tip.text}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4, color: "#f4f4f5", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#0A66C2" }}>{Icon.linkedin}</span>
                  LinkedIn投稿
                </h1>
                <p style={{ color: "#71717a" }}>
                  過去の投稿データを分析し、パフォーマンスを改善
                </p>
              </div>
              <div style={{ display: "flex", gap: 4, background: "#0f0f18", borderRadius: 10, padding: 4, border: "1px solid #1a1a24" }}>
                {[
                  { id: "create" as const, label: "投稿作成" },
                  { id: "analytics" as const, label: "分析・改善" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    style={{
                      padding: "8px 18px",
                      borderRadius: 8,
                      border: "none",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      background: liTab === tab.id ? "#0A66C2" : "transparent",
                      color: liTab === tab.id ? "#fff" : "#71717a",
                      transition: "all 0.15s",
                    }}
                    onClick={() => {
                      setLiTab(tab.id);
                      if (tab.id === "analytics" && liPastPosts.length === 0) handleLiFetchPosts();
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Analytics Tab */}
            {liTab === "analytics" && (
              <div>
                {/* Sync bar */}
                <div style={{ ...s.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#f4f4f5" }}>
                      過去のLinkedIn投稿 ({liPastPosts.length}件)
                    </span>
                    <span style={{ fontSize: 12, color: "#52525b", marginLeft: 12 }}>
                      エンゲージメントデータを入力すると、AIが高パフォーマンスの傾向を学習します
                    </span>
                  </div>
                  <button
                    style={{ ...s.btnPrimary, background: "linear-gradient(135deg, #0A66C2, #004182)" }}
                    onClick={handleLiSyncPosts}
                    disabled={liSyncing}
                  >
                    {liSyncing ? <div style={s.spinner} /> : Icon.refresh}
                    {liSyncing ? "同期中..." : "Bufferから同期"}
                  </button>
                </div>

                {/* Stats summary */}
                {liPastPosts.some((p) => p.impressions > 0) && (
                  <div style={{ ...s.statGrid, marginTop: 0 }}>
                    <div style={s.statCard("#0A66C2")}>
                      <div style={{ fontSize: 12, color: "#71717a", marginBottom: 4 }}>平均エンゲージメント率</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: "#60a5fa" }}>
                        {(liPastPosts.filter(p => p.engagement_rate > 0).reduce((s, p) => s + p.engagement_rate, 0) / Math.max(liPastPosts.filter(p => p.engagement_rate > 0).length, 1)).toFixed(1)}%
                      </div>
                    </div>
                    <div style={s.statCard("#22c55e")}>
                      <div style={{ fontSize: 12, color: "#71717a", marginBottom: 4 }}>合計インプレッション</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: "#4ade80" }}>
                        {liPastPosts.reduce((s, p) => s + p.impressions, 0).toLocaleString()}
                      </div>
                    </div>
                    <div style={s.statCard("#f59e0b")}>
                      <div style={{ fontSize: 12, color: "#71717a", marginBottom: 4 }}>合計エンゲージメント</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: "#fbbf24" }}>
                        {liPastPosts.reduce((s, p) => s + p.likes + p.comments + p.shares, 0).toLocaleString()}
                      </div>
                    </div>
                    <div style={s.statCard("#8b5cf6")}>
                      <div style={{ fontSize: 12, color: "#71717a", marginBottom: 4 }}>データ入力済み</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: "#a78bfa" }}>
                        {liPastPosts.filter(p => p.impressions > 0).length}/{liPastPosts.length}
                      </div>
                    </div>
                  </div>
                )}

                {/* Editing modal */}
                {liEditingPost && (
                  <div style={{ ...s.card, border: "2px solid #0A66C2", marginBottom: 20 }}>
                    <h3 style={{ ...s.cardHeader, fontSize: 15 }}>エンゲージメントデータ入力</h3>
                    <div style={{
                      padding: 12,
                      background: "#0c0c12",
                      borderRadius: 8,
                      fontSize: 13,
                      color: "#a1a1aa",
                      marginBottom: 16,
                      maxHeight: 100,
                      overflow: "hidden",
                      lineHeight: 1.6,
                    }}>
                      {liEditingPost.text.substring(0, 200)}...
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
                      {[
                        { key: "impressions", label: "インプレッション", icon: "👀" },
                        { key: "likes", label: "いいね", icon: "👍" },
                        { key: "comments", label: "コメント", icon: "💬" },
                        { key: "shares", label: "シェア", icon: "🔄" },
                        { key: "clicks", label: "クリック", icon: "🔗" },
                        { key: "views", label: "閲覧数", icon: "📊" },
                      ].map((field) => (
                        <div key={field.key} style={s.formGroup}>
                          <label style={{ ...s.label, fontSize: 12 }}>{field.icon} {field.label}</label>
                          <input
                            type="number"
                            style={{ ...s.input, fontSize: 14 }}
                            value={(liEditingPost as any)[field.key] || 0}
                            onChange={(e) => setLiEditingPost({
                              ...liEditingPost,
                              [field.key]: parseInt(e.target.value) || 0,
                            })}
                          />
                        </div>
                      ))}
                    </div>
                    <div style={s.formGroup}>
                      <label style={{ ...s.label, fontSize: 12 }}>スタイルタグ（カンマ区切り）</label>
                      <input
                        style={s.input}
                        placeholder="例: ストーリー, AI, Before/After, 箇条書き"
                        value={(liEditingPost.style_tags || []).join(", ")}
                        onChange={(e) => setLiEditingPost({
                          ...liEditingPost,
                          style_tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                        })}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button
                        style={{ ...s.btnPrimary, background: "linear-gradient(135deg, #0A66C2, #004182)" }}
                        onClick={() => handleLiSaveMetrics(liEditingPost)}
                        disabled={liSavingMetrics}
                      >
                        {liSavingMetrics ? <div style={s.spinner} /> : Icon.check}
                        保存
                      </button>
                      <button style={s.btnSecondary} onClick={() => setLiEditingPost(null)}>
                        キャンセル
                      </button>
                    </div>
                  </div>
                )}

                {/* Posts list */}
                {liPastPosts.length === 0 ? (
                  <div style={{ ...s.card, ...s.empty }}>
                    <p style={{ fontSize: 14, marginBottom: 12 }}>まだ投稿データがありません</p>
                    <p style={{ fontSize: 12 }}>「Bufferから同期」ボタンでLinkedInの過去投稿を取得してください</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {liPastPosts.map((post) => (
                      <div
                        key={post.id}
                        style={{
                          ...s.card,
                          marginBottom: 0,
                          cursor: "pointer",
                          border: post.is_top_performer ? "1px solid #0A66C240" : "1px solid #1a1a24",
                          background: post.is_top_performer ? "#0A66C208" : "#0f0f18",
                        }}
                        onClick={() => setLiEditingPost({ ...post })}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 13,
                              color: "#d4d4d8",
                              lineHeight: 1.6,
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical" as any,
                            }}>
                              {post.text}
                            </div>
                            <div style={{ fontSize: 11, color: "#52525b", marginTop: 8 }}>
                              {post.sent_at ? new Date(post.sent_at).toLocaleDateString("ja-JP") : "日付不明"}
                              {post.style_tags && post.style_tags.length > 0 && (
                                <span style={{ marginLeft: 8 }}>
                                  {post.style_tags.map((tag, i) => (
                                    <span key={i} style={{
                                      ...s.tag("#0A66C2"),
                                      marginLeft: 4,
                                      fontSize: 10,
                                    }}>{tag}</span>
                                  ))}
                                </span>
                              )}
                            </div>
                          </div>
                          {post.impressions > 0 ? (
                            <div style={{ marginLeft: 16, textAlign: "right", flexShrink: 0 }}>
                              <div style={{ fontSize: 20, fontWeight: 800, color: post.engagement_rate > 3 ? "#4ade80" : post.engagement_rate > 1 ? "#fbbf24" : "#f4f4f5" }}>
                                {post.engagement_rate.toFixed(1)}%
                              </div>
                              <div style={{ fontSize: 10, color: "#71717a" }}>エンゲージメント率</div>
                              <div style={{ fontSize: 11, color: "#52525b", marginTop: 4 }}>
                                👀{post.impressions} 👍{post.likes} 💬{post.comments}
                              </div>
                            </div>
                          ) : (
                            <div style={{ marginLeft: 16, flexShrink: 0 }}>
                              <span style={s.tag("#6366f1")}>データ未入力</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Report Section */}
                <div style={{ ...s.card, marginTop: 16, borderTop: "2px solid #0A66C240" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: liReport ? 16 : 0 }}>
                    <div>
                      <h3 style={{ ...s.cardHeader, marginBottom: 2 }}>AI分析レポート</h3>
                      <p style={{ fontSize: 12, color: "#52525b" }}>
                        入力済みデータをもとにAIが投稿戦略を提案します
                      </p>
                    </div>
                    <button
                      style={{
                        ...s.btnPrimary,
                        background: "linear-gradient(135deg, #0A66C2, #004182)",
                        opacity: liReportLoading || liPastPosts.filter(p => p.impressions > 0).length === 0 ? 0.5 : 1,
                        pointerEvents: liReportLoading || liPastPosts.filter(p => p.impressions > 0).length === 0 ? "none" : "auto",
                      }}
                      onClick={() => handleGenerateReport("linkedin")}
                      disabled={liReportLoading}
                    >
                      {liReportLoading ? <div style={s.spinner} /> : Icon.sparkle}
                      {liReportLoading ? "分析中..." : "AIレポート生成"}
                    </button>
                  </div>
                  {liPastPosts.filter(p => p.impressions > 0).length === 0 && (
                    <p style={{ fontSize: 12, color: "#71717a", marginTop: 8 }}>
                      ※ レポート生成にはエンゲージメントデータが入力された投稿が必要です
                    </p>
                  )}
                  {liReportLoading && (
                    <div style={{ padding: 40, textAlign: "center" }}>
                      <div style={s.spinner} />
                      <p style={{ fontSize: 13, color: "#71717a", marginTop: 12 }}>
                        投稿データを分析してレポートを生成しています...
                      </p>
                    </div>
                  )}
                  {liReport && !liReportLoading && (
                    <div style={{
                      background: "#0c0c14",
                      border: "1px solid #1a1a24",
                      borderRadius: 12,
                      padding: 24,
                      fontSize: 13,
                      lineHeight: 1.8,
                      color: "#d4d4d8",
                      whiteSpace: "pre-wrap",
                      maxHeight: 600,
                      overflow: "auto",
                    }}>
                      {liReport.split("\n").map((line, i) => {
                        if (line.startsWith("## ")) return <h3 key={i} style={{ fontSize: 16, fontWeight: 700, color: "#f4f4f5", marginTop: 20, marginBottom: 8 }}>{line.replace("## ", "")}</h3>;
                        if (line.startsWith("### ")) return <h4 key={i} style={{ fontSize: 14, fontWeight: 600, color: "#e4e4e7", marginTop: 14, marginBottom: 6 }}>{line.replace("### ", "")}</h4>;
                        if (line.startsWith("**") && line.endsWith("**")) return <p key={i} style={{ fontWeight: 700, color: "#f4f4f5", marginTop: 8 }}>{line.replace(/\*\*/g, "")}</p>;
                        if (line.startsWith("- ") || line.startsWith("* ")) return <div key={i} style={{ paddingLeft: 16, position: "relative" }}><span style={{ position: "absolute", left: 0, color: "#0A66C2" }}>•</span>{line.replace(/^[-*] /, "")}</div>;
                        if (line.match(/^\d+\./)) return <div key={i} style={{ paddingLeft: 8, marginTop: 4 }}><span style={{ color: "#0A66C2", fontWeight: 700 }}>{line.match(/^\d+\./)?.[0]}</span> {line.replace(/^\d+\.\s*/, "")}</div>;
                        if (line.trim() === "") return <div key={i} style={{ height: 8 }} />;
                        return <p key={i}>{line}</p>;
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Create Tab */}
            {liTab === "create" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Left: Generation form */}
              <div style={{ ...s.card, borderTop: "2px solid #0A66C240" }}>
                <h3 style={s.cardHeader}>
                  <span style={{ color: "#0A66C2" }}>LinkedIn</span> 投稿設定
                </h3>
                <div style={s.formGroup}>
                  <label style={s.label}>投稿トピック</label>
                  <textarea
                    style={{ ...s.input, minHeight: 80, resize: "vertical" as const }}
                    placeholder="例: GPT-4oの登場でAIアプリ開発はどう変わるか、AIスタートアップの資金調達トレンド..."
                    value={liTopic}
                    onChange={(e) => setLiTopic(e.target.value)}
                  />
                  <p style={{ fontSize: 12, color: "#52525b", marginTop: 4 }}>
                    AI関連のニュースやビジネストピックを入力してください
                  </p>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>投稿スタイル</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { id: "thought_leadership", label: "ソートリーダーシップ", desc: "洞察・意見" },
                      { id: "news_commentary", label: "ニュース解説", desc: "最新動向" },
                      { id: "case_study", label: "ケーススタディ", desc: "事例・実績" },
                      { id: "tips_howto", label: "Tips・ハウツー", desc: "実践的ノウハウ" },
                    ].map((st) => (
                      <button
                        key={st.id}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: liStyle === st.id ? "2px solid #0A66C2" : "1px solid #2a2a3a",
                          background: liStyle === st.id ? "#0A66C210" : "#0c0c12",
                          color: liStyle === st.id ? "#60a5fa" : "#a1a1aa",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          textAlign: "left" as const,
                          transition: "all 0.15s",
                        }}
                        onClick={() => setLiStyle(st.id)}
                      >
                        <div>{st.label}</div>
                        <div style={{ fontSize: 11, fontWeight: 400, color: "#52525b", marginTop: 2 }}>{st.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>参照画像（オプション）</label>
                  <div
                    style={{
                      border: "2px dashed #2a2a3a",
                      borderRadius: 10,
                      padding: liRefImage ? 8 : 24,
                      textAlign: "center",
                      cursor: "pointer",
                      background: "#0c0c12",
                    }}
                    onClick={() => document.getElementById("li-ref-image-input")?.click()}
                  >
                    <input
                      id="li-ref-image-input"
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleLiRefImageUpload}
                    />
                    {liRefImage ? (
                      <div style={{ position: "relative" }}>
                        <img
                          src={liRefImage}
                          alt="参照画像"
                          style={{ maxWidth: "100%", maxHeight: 120, borderRadius: 8, objectFit: "cover" as const }}
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
                          onClick={(e) => { e.stopPropagation(); setLiRefImage(null); }}
                        >
                          削除
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ color: "#52525b", marginBottom: 4 }}>{Icon.upload}</div>
                        <p style={{ fontSize: 13, color: "#52525b" }}>クリックして画像をアップロード</p>
                      </>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: "#52525b", marginTop: 4 }}>
                    スクリーンショットやプレゼン資料の画像など、投稿に関連する画像
                  </p>
                </div>
                <button
                  style={{
                    ...s.btnPrimary,
                    width: "100%",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #0A66C2, #004182)",
                    opacity: liGenerating || !liTopic.trim() ? 0.5 : 1,
                    pointerEvents: liGenerating || !liTopic.trim() ? "none" : "auto",
                  }}
                  onClick={handleLinkedInGenerate}
                  disabled={liGenerating || !liTopic.trim()}
                >
                  {liGenerating ? <div style={s.spinner} /> : Icon.sparkle}
                  {liGenerating ? "生成中..." : "LinkedIn投稿を生成"}
                </button>
              </div>

              {/* Right: Preview */}
              <div style={{ ...s.card, borderTop: "2px solid #0A66C240" }}>
                <h3 style={s.cardHeader}>LinkedInプレビュー</h3>
                {!liCaption && !liGenerating ? (
                  <div style={s.empty}>
                    <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>{Icon.linkedin}</div>
                    <p style={{ fontSize: 14 }}>LinkedIn投稿のプレビューがここに表示されます</p>
                    <p style={{ fontSize: 12, color: "#3f3f46", marginTop: 8 }}>
                      プロフェッショナルな長文投稿 + AI関連画像を生成
                    </p>
                  </div>
                ) : liGenerating ? (
                  <div style={{ ...s.empty, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <div style={s.spinner} />
                    <p style={{ fontSize: 14, color: "#71717a" }}>LinkedIn投稿を生成しています...</p>
                  </div>
                ) : (
                  <>
                    {/* LinkedIn風プレビュー */}
                    <div style={{
                      background: "#14141e",
                      borderRadius: 12,
                      border: "1px solid #1a1a24",
                      overflow: "hidden",
                    }}>
                      {/* Header */}
                      <div style={{ padding: "16px 16px 12px", display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          background: "linear-gradient(135deg, #0A66C2, #004182)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#fff",
                        }}>
                          心
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#f4f4f5" }}>心夢 松尾</div>
                          <div style={{ fontSize: 12, color: "#71717a" }}>AI & Technology | Startup Founder</div>
                        </div>
                      </div>
                      {/* Content */}
                      <div style={{
                        padding: "0 16px 16px",
                        whiteSpace: "pre-wrap",
                        fontSize: 13,
                        lineHeight: 1.8,
                        color: "#d4d4d8",
                        maxHeight: 400,
                        overflowY: "auto" as const,
                      }}>
                        {liCaption}
                      </div>
                      {/* Image */}
                      {(liImage || liImageUrl) && (
                        <img
                          src={liImageUrl || liImage || ""}
                          alt="LinkedIn post"
                          style={{ width: "100%", maxHeight: 300, objectFit: "cover" as const }}
                        />
                      )}
                      {/* Engagement bar */}
                      <div style={{
                        padding: "12px 16px",
                        borderTop: "1px solid #1a1a24",
                        display: "flex",
                        gap: 24,
                        fontSize: 12,
                        color: "#71717a",
                      }}>
                        <span>👍 いいね!</span>
                        <span>💬 コメント</span>
                        <span>🔄 シェア</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                      <button
                        style={{
                          ...s.btnPrimary,
                          flex: 1,
                          justifyContent: "center",
                          background: "linear-gradient(135deg, #0A66C2, #004182)",
                          opacity: liPosting ? 0.5 : 1,
                        }}
                        onClick={handleLinkedInPost}
                        disabled={liPosting}
                      >
                        {liPosting ? <div style={s.spinner} /> : Icon.send}
                        {liPosting ? "投稿中..." : "LinkedInに投稿"}
                      </button>
                      <button
                        style={s.btnSecondary}
                        onClick={handleLinkedInGenerate}
                      >
                        {Icon.refresh} 再生成
                      </button>
                    </div>

                    {/* Copy button */}
                    <button
                      style={{
                        ...s.btnSmall,
                        width: "100%",
                        justifyContent: "center",
                        marginTop: 8,
                      }}
                      onClick={() => {
                        navigator.clipboard.writeText(liCaption);
                        showToast("テキストをコピーしました", "info");
                      }}
                    >
                      テキストをコピー
                    </button>
                  </>
                )}
              </div>
            </div>
            )}
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
                    character_voice: "",
                    writing_style: "",
                    expertise_areas: "",
                    affiliate_info: "",
                    cta_goal: "",
                    reference_accounts: "",
                    reference_posts: "",
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
                  {/* 参考アカウント設定 */}
                  <div style={{ borderTop: "1px solid #1e1e2e", paddingTop: 20, marginTop: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#3b82f6", marginBottom: 16 }}>
                      参考アカウント設定
                    </h3>
                    <div style={s.formGroup}>
                      <label style={s.label}>参考アカウント</label>
                      <input
                        style={s.input}
                        placeholder="例: @account1, @account2（カンマ区切り）"
                        value={editingAccount.reference_accounts || ""}
                        onChange={(e) => setEditingAccount({ ...editingAccount, reference_accounts: e.target.value })}
                      />
                      <p style={{ fontSize: 12, color: "#52525b", marginTop: 4 }}>
                        このアカウントの投稿スタイルを参考にします
                      </p>
                    </div>
                    <div style={s.formGroup}>
                      <label style={s.label}>参考にする投稿例</label>
                      <textarea
                        style={{ ...s.textarea, minHeight: 150 }}
                        placeholder={"参考にしたいアカウントの投稿をコピペしてください。\n複数の投稿を貼り付けると、よりスタイルを正確に再現できます。\n\n例:\n---投稿1---\n今日はカフェで新作ラテ☕️\nやっぱりここのラテが一番好き！\n#カフェ巡り #ラテアート\n\n---投稿2---\n春の新作コスメ届いた！🌸\n発色が神すぎる…\n#コスメレビュー #春メイク"}
                        value={editingAccount.reference_posts || ""}
                        onChange={(e) => setEditingAccount({ ...editingAccount, reference_posts: e.target.value })}
                      />
                      <p style={{ fontSize: 12, color: "#52525b", marginTop: 4 }}>
                        参考アカウントの投稿をコピーペーストすると、その文体やスタイルを学習して投稿を生成します
                      </p>
                    </div>
                  </div>
                  {/* 人格・キャラクター設定 */}
                  <div style={{ marginTop: 8, marginBottom: 4 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: "#a5b4fc", marginBottom: 12, paddingTop: 12, borderTop: "1px solid #27272a" }}>
                      人格・キャラクター設定
                    </h4>
                    <div style={s.formGroup}>
                      <label style={s.label}>口癖・言い回し</label>
                      <textarea
                        style={s.textarea}
                        placeholder="例: 〜だよね！、マジで、正直に言うと..."
                        value={editingAccount.character_voice || ""}
                        onChange={(e) => setEditingAccount({ ...editingAccount, character_voice: e.target.value })}
                      />
                    </div>
                    <div style={s.formGroup}>
                      <label style={s.label}>投稿スタイル</label>
                      <textarea
                        style={s.textarea}
                        placeholder="例: 短文＋改行多め、絵文字多用、ストーリー仕立て"
                        value={editingAccount.writing_style || ""}
                        onChange={(e) => setEditingAccount({ ...editingAccount, writing_style: e.target.value })}
                      />
                    </div>
                    <div style={s.formGroup}>
                      <label style={s.label}>専門分野</label>
                      <input
                        style={s.input}
                        placeholder="例: AI、テクノロジー、スタートアップ"
                        value={editingAccount.expertise_areas || ""}
                        onChange={(e) => setEditingAccount({ ...editingAccount, expertise_areas: e.target.value })}
                      />
                    </div>
                  </div>
                  {/* 収益化設定 */}
                  <div style={{ marginTop: 8, marginBottom: 4 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: "#a5b4fc", marginBottom: 12, paddingTop: 12, borderTop: "1px solid #27272a" }}>
                      収益化設定
                    </h4>
                    <div style={s.formGroup}>
                      <label style={s.label}>商品・アフィリエイト情報</label>
                      <textarea
                        style={s.textarea}
                        placeholder="例: 商品名、LP URL、アフィリエイトリンク..."
                        value={editingAccount.affiliate_info || ""}
                        onChange={(e) => setEditingAccount({ ...editingAccount, affiliate_info: e.target.value })}
                      />
                    </div>
                    <div style={s.formGroup}>
                      <label style={s.label}>投稿のゴール</label>
                      <input
                        style={s.input}
                        placeholder="例: LP誘導、LINE登録、商品購入、ブランド認知"
                        value={editingAccount.cta_goal || ""}
                        onChange={(e) => setEditingAccount({ ...editingAccount, cta_goal: e.target.value })}
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
                      {savingAccount ? "保存中..." : <>{Icon.check} 保存</>}
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
                <label style={s.label}>WeryAI API Key (動画生成)</label>
                <input
                  style={s.input}
                  type="password"
                  placeholder="sk-..."
                  value={settingsOpenAI}
                  onChange={(e) => setSettingsOpenAI(e.target.value)}
                />
                <p style={{ fontSize: 12, color: "#52525b", marginTop: 4 }}>
                  Kling 3.0, Veo 3.1, Seedance 2.0等の動画生成に使用
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
                <div>
                  <div style={{ fontSize: 12, color: "#71717a", marginBottom: 4 }}>動画生成</div>
                  <div style={{ fontSize: 14, color: "#d4d4d8" }}>WeryAI (Kling, Veo, Seedance等)</div>
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
