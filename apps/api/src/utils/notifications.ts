import type { Database } from "@addis/db";
import { notifications } from "@addis/db";

export type NotificationType = "like" | "comment" | "collab_request" | "message" | "profile_view";

export async function createNotification(
  db: Database,
  params: {
    recipientId: number;
    senderId?: number;
    type: NotificationType;
    message: string;
    link?: string;
  }
) {
  // Don't notify if sender is same as recipient
  if (params.senderId && params.senderId === params.recipientId) return;

  await db.insert(notifications).values({
    recipientId: params.recipientId,
    senderId: params.senderId,
    type: params.type,
    message: params.message,
    link: params.link,
  });
}