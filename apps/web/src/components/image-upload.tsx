"use client";

import { useState, useRef, useEffect, type ChangeEvent } from "react";
import { ApiError, API_URL, getAssetUrl } from "@/lib/api";
const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif"];

type ImageUploadProps = {
  endpoint: string;
  currentImageUrl?: string | null;
  onUploaded: (imageUrl: string) => void;
  onRemoved?: () => void;
};

export function ImageUpload({
  endpoint,
  currentImageUrl,
  onUploaded,
  onRemoved,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Revoke object URL on cleanup or when preview changes
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    // Client-side checks (server validates independently)
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only PNG, JPEG, and GIF images are allowed.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("File too large. Maximum 2MB.");
      return;
    }

    // Revoke previous preview before creating a new one
    if (preview) URL.revokeObjectURL(preview);

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        body: formData,
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new ApiError(res.status, data.error ?? "Upload failed");
      }

      const data = await res.json();
      onUploaded(data.imageUrl);
    } catch (err) {
      setPreview(null);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Upload failed. Please try again.");
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const displayUrl = preview ?? getAssetUrl(currentImageUrl);

  return (
    <div className="space-y-2">
      {displayUrl && (
        <img
          src={displayUrl}
          alt="Upload preview"
          className="h-24 w-24 rounded-full object-cover"
        />
      )}
      <div className="flex items-center gap-2">
        <label className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
          {uploading ? "Uploading..." : "Choose image"}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif"
            onChange={handleChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {currentImageUrl && onRemoved && (
          <button
            onClick={onRemoved}
            type="button"
            className="text-xs text-red-500 hover:underline"
          >
            Remove
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
