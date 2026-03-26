import { supabase } from "./supabase";

const BUFFER_GRAPHQL_ENDPOINT = "https://api.buffer.com";
const MAX_RETRIES = 3;
const RETRY_DELAY = 3000;

/* ─── Token ─── */
async function getToken(): Promise<string> {
  // Try Supabase app_settings first
  try {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "buffer_api_key")
      .limit(1);
    if (data?.[0]?.value) return String(data[0].value);
  } catch {
    // fall through
  }
  return process.env.BUFFER_ACCESS_TOKEN || "";
}

/* ─── GraphQL Helper ─── */
async function graphql<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const token = await getToken();
  if (!token) throw new Error("Buffer APIトークンが設定されていません");

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(BUFFER_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });

    if (res.status === 429 && attempt < MAX_RETRIES - 1) {
      const wait = RETRY_DELAY * (attempt + 1);
      console.warn(
        `Buffer レートリミット。${wait}ms後にリトライ (${attempt + 1}/${MAX_RETRIES})`
      );
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }

    if (!res.ok) {
      throw new Error(`Buffer API error: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    if (json.errors) {
      throw new Error(
        `Buffer GraphQL error: ${json.errors.map((e: { message: string }) => e.message).join(", ")}`
      );
    }
    return json.data as T;
  }

  throw lastError || new Error(`${MAX_RETRIES}回リトライしましたが失敗しました`);
}

/* ─── Types ─── */
export interface BufferChannel {
  id: string;
  name: string;
  service: string;
  type: string;
  isDisconnected?: boolean;
}

export interface BufferOrganization {
  id: string;
  name: string;
  channels: BufferChannel[];
}

export interface BufferProfile {
  id: string;
  service: string;
  service_username: string;
  formatted_username: string;
}

/* ─── Queries ─── */

/** Get all organizations and channels */
export async function getOrganizations(): Promise<BufferOrganization[]> {
  const data = await graphql<{
    account: { organizations: BufferOrganization[] };
  }>(`{
    account {
      organizations {
        id
        name
        channels {
          id
          name
          service
          type
          isDisconnected
        }
      }
    }
  }`);

  // 切断されたチャンネルを除外して返す
  return data.account.organizations.map((org) => ({
    ...org,
    channels: org.channels.filter((ch) => !ch.isDisconnected),
  }));
}

/** Get channels (profiles) - backward compatible */
export async function getProfiles(): Promise<BufferProfile[]> {
  const orgs = await getOrganizations();
  const profiles: BufferProfile[] = [];
  for (const org of orgs) {
    for (const ch of org.channels) {
      profiles.push({
        id: ch.id,
        service: ch.service,
        service_username: ch.name,
        formatted_username: `${ch.name} (${ch.service})`,
      });
    }
  }
  return profiles;
}

/** Get channels for a specific organization */
export async function getChannels(
  organizationId?: string
): Promise<BufferChannel[]> {
  const orgs = await getOrganizations();
  if (organizationId) {
    const org = orgs.find((o) => o.id === organizationId);
    return org?.channels || [];
  }
  return orgs.flatMap((o) => o.channels);
}

/* ─── Helpers ─── */

/** チャンネルのサービスタイプに応じたmetadataを生成 */
async function getMetadataForChannel(
  channelId: string,
  options?: { isVideo?: boolean }
): Promise<Record<string, unknown> | undefined> {
  try {
    const channels = await getChannels();
    const channel = channels.find((c) => c.id === channelId);
    if (!channel) return undefined;

    switch (channel.service) {
      case "instagram":
        if (options?.isVideo) {
          return {
            instagram: { type: "reel", shouldShareToFeed: true },
          };
        }
        return {
          instagram: { type: "post", shouldShareToFeed: true },
        };
      case "tiktok":
        return {
          tiktok: { type: "video" },
        };
      case "youtube":
        return {
          youtube: { type: "short" },
        };
      // twitter, linkedin, facebook, threads, bluesky,
      // mastodon, pinterest, googlebusiness, startpage は
      // metadata不要（Buffer側で自動処理）
      default:
        return undefined;
    }
  } catch {
    return undefined;
  }
}

/* ─── Mutations ─── */

const POST_MUTATION = `
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      ... on PostActionSuccess {
        post {
          id
          text
          assets {
            id
            mimeType
          }
        }
      }
      ... on MutationError {
        message
      }
    }
  }
`;

type PostResult =
  | { post: { id: string; text: string; assets?: { id: string; mimeType: string }[] } }
  | { message: string };

/** Create a text post (Instagram requires image, so this is mainly for other platforms) */
export async function createPost(
  channelId: string,
  text: string,
  scheduledAt?: string
): Promise<{ success: boolean; postId?: string; message?: string }> {
  const dueAt = scheduledAt || new Date(Date.now() + 60000).toISOString();
  const metadata = await getMetadataForChannel(channelId);

  const input: Record<string, unknown> = {
    text,
    channelId,
    schedulingType: "automatic",
    mode: "customScheduled",
    dueAt,
  };
  if (metadata) input.metadata = metadata;

  const data = await graphql<{ createPost: PostResult }>(POST_MUTATION, { input });

  if ("post" in data.createPost) {
    return { success: true, postId: data.createPost.post.id };
  }
  return {
    success: false,
    message: (data.createPost as { message: string }).message,
  };
}

/** Create a post with image(s) - supports single URL or array of URLs */
export async function createImagePost(
  channelId: string,
  text: string,
  imageUrls: string | string[],
  scheduledAt?: string
): Promise<{ success: boolean; postId?: string; message?: string }> {
  const dueAt = scheduledAt || new Date(Date.now() + 60000).toISOString();
  const metadata = await getMetadataForChannel(channelId);

  // 複数画像対応: 文字列なら配列に変換
  const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
  const images = urls.map((url) => ({ url }));

  const input: Record<string, unknown> = {
    text,
    channelId,
    schedulingType: "automatic",
    mode: "customScheduled",
    dueAt,
    assets: {
      images,
    },
  };
  if (metadata) input.metadata = metadata;

  const data = await graphql<{ createPost: PostResult }>(POST_MUTATION, { input });

  if ("post" in data.createPost) {
    return { success: true, postId: data.createPost.post.id };
  }
  return {
    success: false,
    message: (data.createPost as { message: string }).message,
  };
}

/** Create a post with video */
export async function createVideoPost(
  channelId: string,
  text: string,
  videoUrl: string,
  scheduledAt?: string
): Promise<{ success: boolean; postId?: string; message?: string }> {
  const dueAt = scheduledAt || new Date(Date.now() + 60000).toISOString();
  const metadata = await getMetadataForChannel(channelId, { isVideo: true });

  const input: Record<string, unknown> = {
    text,
    channelId,
    schedulingType: "automatic",
    mode: "customScheduled",
    dueAt,
    assets: {
      videos: [{ url: videoUrl }],  // videos は配列
    },
  };
  if (metadata) input.metadata = metadata;

  const data = await graphql<{ createPost: PostResult }>(POST_MUTATION, { input });

  if ("post" in data.createPost) {
    return { success: true, postId: data.createPost.post.id };
  }
  return {
    success: false,
    message: (data.createPost as { message: string }).message,
  };
}

/** Test the connection */
export async function testConnection(): Promise<{
  connected: boolean;
  accountId?: string;
  organizations?: BufferOrganization[];
  error?: string;
}> {
  try {
    const orgs = await getOrganizations();
    const data = await graphql<{
      account: { id: string };
    }>(`{ account { id } }`);
    return {
      connected: true,
      accountId: data.account.id,
      organizations: orgs,
    };
  } catch (e) {
    return {
      connected: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
