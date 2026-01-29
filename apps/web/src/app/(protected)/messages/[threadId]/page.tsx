"use client";

import { useEffect, useState, useCallback, useRef, type FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Message = {
  id: number;
  content: string;
  createdAt: string;
  username: string;
  userId: number;
  profileImageUrl: string | null;
};

type Participant = {
  userId: number;
  username: string;
  profileImageUrl: string | null;
};

export default function ConversationPage() {
  const params = useParams();
  const threadId = params.threadId as string;
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Send form
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    try {
      const data = await api<{ messages: Message[]; participant: Participant | null }>(
        `/api/messages/threads/${threadId}?limit=50&offset=0`
      );
      // API returns newest first; reverse for chronological display
      setMessages(data.messages.reverse());
      setParticipant(data.participant);
    } catch {
      setError("Failed to load conversation");
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed || !participant) return;

    setSendError("");
    setSending(true);
    try {
      await api(`/api/messages/send/${participant.userId}`, {
        method: "POST",
        body: { content: trimmed },
      });
      setMessageText("");
      // Reload to get the new message with server timestamp
      const data = await api<{ messages: Message[]; participant: Participant | null }>(
        `/api/messages/threads/${threadId}?limit=50&offset=0`
      );
      setMessages(data.messages.reverse());
    } catch (err) {
      setSendError(err instanceof ApiError ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-addis-orange border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return <p className="py-12 text-center text-red-600">{error}</p>;
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col" style={{ height: "calc(100vh - 140px)" }}>
      {/* Conversation header */}
      <div className="flex items-center gap-3 border-b pb-3">
        <Link href="/messages" className="text-gray-400 hover:text-gray-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        {participant && (
          <Link href={`/profile/${participant.username}`} className="flex items-center gap-2">
            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-200">
              {participant.profileImageUrl ? (
                <img
                  src={`${API_URL}${participant.profileImageUrl}`}
                  alt={participant.username}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-400">
                  {participant.username[0].toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-gray-900 hover:text-addis-orange">
              {participant.username}
            </span>
          </Link>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-gray-400">
            No messages yet. Start the conversation!
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.userId === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                      isOwn
                        ? "bg-addis-orange text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <p
                      className={`mt-1 text-[10px] ${
                        isOwn ? "text-white/70" : "text-gray-400"
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Send form */}
      <form onSubmit={handleSend} className="border-t pt-3">
        {sendError && (
          <p className="mb-2 text-xs text-red-600">{sendError}</p>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            maxLength={5000}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
          />
          <button
            type="submit"
            disabled={sending || !messageText.trim()}
            className="rounded-md bg-addis-orange px-4 py-2 text-sm text-white hover:bg-addis-orange/90 disabled:opacity-50"
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
