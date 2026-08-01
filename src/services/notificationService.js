import { supabase } from "../lib/supabase";

const mapNotification = (notification) => ({
  id: notification.id,
  title: notification.title || "",
  message: notification.message || "",
  type: notification.type || "general",
  isRead: Boolean(notification.is_read),
  createdAt: notification.created_at,
  link: notification.link || "",
});

export async function getNotifications() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;

  const userId = authData.user?.id;
  if (!userId) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("id,title,message,type,is_read,created_at,link")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data || []).map(mapNotification);
}

export async function markNotificationAsRead(notificationId) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .select("id,title,message,type,is_read,created_at,link")
    .single();

  if (error) throw error;
  return mapNotification(data);
}

export async function markAllNotificationsAsRead() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;

  const userId = authData.user?.id;
  if (!userId) return;

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
}

export async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id || null;
}

export function subscribeToNotifications(userId, onInsert) {
  if (!userId) return null;

  return supabase
    .channel(`notifications-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onInsert?.(mapNotification(payload.new))
    )
    .subscribe();
}
