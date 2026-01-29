"use client";

import { useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";

type TopicManagerProps = {
  topics: string[];
  addEndpoint: string;
  deleteEndpoint: (topicName: string) => string;
  onUpdate: () => void;
  editable?: boolean;
  bodyKey?: string;
  placeholder?: string;
  emptyMessage?: string;
  tagClassName?: string;
};

export function TopicManager({
  topics,
  addEndpoint,
  deleteEndpoint,
  onUpdate,
  editable = false,
  bodyKey = "topicName",
  placeholder = "Add topic",
  emptyMessage = "No topics yet",
  tagClassName = "bg-gray-100 text-gray-700",
}: TopicManagerProps) {
  const [newTopic, setNewTopic] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const trimmed = newTopic.trim();
    if (!trimmed) return;
    if (trimmed.length > 255) {
      setError("Topic name too long");
      return;
    }

    setError("");
    setAdding(true);
    try {
      await api(addEndpoint, {
        method: "POST",
        body: { [bodyKey]: trimmed },
      });
      setNewTopic("");
      onUpdate();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add topic");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(topicName: string) {
    setError("");
    try {
      await api(deleteEndpoint(topicName), { method: "DELETE" });
      onUpdate();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to remove topic");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {topics.length === 0 && (
          <p className="text-xs text-gray-400">{emptyMessage}</p>
        )}
        {topics.map((topic) => (
          <span
            key={topic}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${tagClassName}`}
          >
            {topic}
            {editable && (
              <button
                onClick={() => handleRemove(topic)}
                className="ml-1 text-gray-400 hover:text-red-500"
                aria-label={`Remove ${topic}`}
              >
                &times;
              </button>
            )}
          </span>
        ))}
      </div>
      {editable && (
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder={placeholder}
            maxLength={255}
            className="w-40 rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-addis-orange focus:outline-none focus:ring-1 focus:ring-addis-orange"
          />
          <button
            type="submit"
            disabled={adding || !newTopic.trim()}
            className="rounded-md bg-addis-orange px-3 py-1 text-xs text-white hover:bg-addis-orange/90 disabled:opacity-50"
          >
            Add
          </button>
        </form>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
