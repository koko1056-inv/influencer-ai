import { supabase, DBAccount } from "./supabase";

// Re-export for backward compatibility
export type Account = DBAccount;

export async function getAccounts(): Promise<DBAccount[]> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("アカウント取得エラー:", error);
    return [];
  }
  return data || [];
}

export async function getActiveAccounts(): Promise<DBAccount[]> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("アクティブアカウント取得エラー:", error);
    return [];
  }
  return data || [];
}

export async function getAccount(id: string): Promise<DBAccount | null> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("アカウント取得エラー:", error);
    return null;
  }
  return data;
}

export async function createAccount(
  account: Omit<DBAccount, "id" | "created_at" | "updated_at">
): Promise<DBAccount | null> {
  const { data, error } = await supabase
    .from("accounts")
    .insert(account)
    .select()
    .single();

  if (error) {
    console.error("アカウント作成エラー:", error);
    throw new Error(error.message);
  }
  return data;
}

export async function updateAccount(
  id: string,
  updates: Partial<Omit<DBAccount, "id" | "created_at">>
): Promise<DBAccount | null> {
  const { data, error } = await supabase
    .from("accounts")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("アカウント更新エラー:", error);
    throw new Error(error.message);
  }
  return data;
}

export async function deleteAccount(id: string): Promise<boolean> {
  const { error } = await supabase.from("accounts").delete().eq("id", id);

  if (error) {
    console.error("アカウント削除エラー:", error);
    throw new Error(error.message);
  }
  return true;
}
