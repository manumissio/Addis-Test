import sanitizeHtml from "sanitize-html";

/**
 * Sanitization profiles for different content types
 * Prevents XSS attacks by stripping dangerous HTML/scripts
 */

// Plain text only - strips all HTML
export function sanitizePlainText(text: string): string {
  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}

// Rich text - allows safe formatting tags
export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "strong", "em", "u", "h1", "h2", "h3", "h4", "h5", "h6",
      "blockquote", "ul", "ol", "li", "a", "code", "pre"
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    // Automatically add rel="noopener noreferrer" to links
    transformTags: {
      a: (tagName, attribs) => {
        return {
          tagName,
          attribs: {
            ...attribs,
            rel: "noopener noreferrer nofollow",
            target: attribs.target || "_blank",
          },
        };
      },
    },
  }).trim();
}

// Strict - for critical fields like usernames
export function sanitizeStrict(text: string): string {
  // Remove all HTML and trim whitespace
  const cleaned = sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();

  // Additional validation for usernames/critical fields
  // Only allow alphanumeric, underscore, hyphen
  return cleaned.replace(/[^\w\s-]/g, "");
}

/**
 * Sanitize an object's string fields based on a schema
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  schema: {
    [K in keyof T]?: "plain" | "rich" | "strict";
  }
): T {
  const sanitized = { ...obj };

  for (const [key, mode] of Object.entries(schema)) {
    const value = sanitized[key as keyof T];
    if (typeof value === "string") {
      switch (mode) {
        case "plain":
          sanitized[key as keyof T] = sanitizePlainText(value) as T[keyof T];
          break;
        case "rich":
          sanitized[key as keyof T] = sanitizeRichText(value) as T[keyof T];
          break;
        case "strict":
          sanitized[key as keyof T] = sanitizeStrict(value) as T[keyof T];
          break;
      }
    }
  }

  return sanitized;
}
