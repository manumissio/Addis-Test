"use client";

import { useEffect, useState, useCallback, useRef, type FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { api, ApiError, getAssetUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

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
    return <p className="py-12 text-center text-red-600 font-bold uppercase text-[10px] tracking-widest">{error}</p>;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col bg-card-bg shadow-2xl rounded-sm overflow-hidden border-t-8 border-addis-blue" style={{ height: "calc(100vh - 140px)" }}>
      {/* Cinematic Conversation Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-addis-dark/50 border-b border-gray-100 dark:border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link href="/messages" className="text-gray-400 hover:text-addis-orange transition-colors">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          {participant && (
            <Link href={`/profile/${participant.username}`} className="group flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-200 ring-2 ring-addis-orange/20 transition-all group-hover:ring-addis-orange">
                  <img
                    src={getAssetUrl(participant.profileImageUrl) ?? "/images/default_user.jpg"}
                    alt={participant.username}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-addis-green border-2 border-white dark:border-addis-dark" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-addis-dark dark:text-white uppercase tracking-wider group-hover:text-addis-orange transition-colors">
                  @{participant.username.toUpperCase()}
                </span>
                <span className="text-[9px] font-black text-addis-green uppercase tracking-widest">Online Now</span>
              </div>
            </Link>
          )}
        </div>
        <div className="hidden sm:block">
           <span className="text-[9px] font-black text-gray-300 dark:text-white/10 uppercase tracking-[0.3em]">Private Conversation // {threadId.padStart(4, '0')}</span>
        </div>
      </div>

      {/* High-Fidelity Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-20 grayscale">
             <img src="/images/logo.png" className="h-12 mb-4 brightness-0 dark:invert" alt="" />
             <p className="text-[10px] font-black uppercase tracking-[0.4em]">Start a Conversation</p>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => {
                const isOwn = msg.userId === user?.id;
                const showAvatar = idx === 0 || messages[idx-1].userId !== msg.userId;
                
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex gap-3 max-w-[85%] ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                      {!isOwn && (
                        <div className={`h-8 w-8 rounded-full overflow-hidden shrink-0 mt-auto shadow-sm transition-opacity ${showAvatar ? "opacity-100" : "opacity-0"}`}>
                           <img src={getAssetUrl(msg.profileImageUrl) ?? "/images/default_user.jpg"} className="h-full w-full object-cover" alt="" />
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-1">
                        <div
                          className={`relative px-4 py-3 shadow-lg ${
                            isOwn
                              ? "bg-gradient-to-br from-addis-orange to-addis-yellow text-white rounded-sm rounded-br-none"
                              : "bg-white dark:bg-addis-dark text-gray-800 dark:text-gray-200 dark:text-white rounded-sm rounded-bl-none border border-gray-100 dark:border-white/5"
                          }`}
                        >
                          {isOwn && <div className="absolute inset-0 bg-white/10 mix-blend-overlay" />}
                          <p className="text-[13px] font-bold leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-tighter tabular-nums ${isOwn ? "text-right text-addis-orange/40" : "text-left text-gray-300 dark:text-white/10"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Tactile Input Terminal */}
      <div className="p-6 bg-white dark:bg-addis-dark/30 border-t border-gray-100 dark:border-white/5">
        {sendError && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-3 text-[10px] font-black uppercase text-addis-red tracking-tight">
            Error: {sendError}
          </motion.p>
        )}
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="TYPE YOUR MESSAGE..."
            maxLength={5000}
            className="flex-1 bg-gray-50 dark:bg-addis-dark border-2 border-gray-100 dark:border-white/5 px-4 py-3 text-sm font-bold text-gray-900 dark:text-white dark:text-white placeholder:text-gray-300 focus:border-addis-orange focus:outline-none transition-all rounded-sm"
          />
          <button
            type="submit"
            disabled={sending || !messageText.trim()}
            className="bg-addis-orange px-8 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white hover:bg-addis-yellow transition-all active:scale-95 disabled:opacity-50 shadow-xl rounded-sm"
          >
            {sending ? "SENDING..." : "SEND"}
          </button>
        </form>
      </div>
    </div>
  );
}
