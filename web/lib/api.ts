"use client";

import axios from "axios";

// In dev/prod the rewrite in next.config.js proxies /api/* to FastAPI.
// Browser-side calls go through Next first; cookies (httpOnly) are forwarded by the rewrite.
export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export function formatApiError(detail: unknown): string {
  if (!detail) return "Something went wrong";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e) => (e && typeof (e as { msg?: string }).msg === "string" ? (e as { msg: string }).msg : JSON.stringify(e)))
      .join(" ");
  }
  const obj = detail as { msg?: string };
  if (obj && typeof obj.msg === "string") return obj.msg;
  const namedObj = detail as { message?: string; error?: unknown; detail?: unknown };
  if (namedObj && typeof namedObj.message === "string") {
    return formatApiError(namedObj.message);
  }
  if (namedObj?.error) return formatApiError(namedObj.error);
  if (namedObj?.detail) return formatApiError(namedObj.detail);
  return "Something went wrong";
}

function parseBackendMessage(message: string): string {
  try {
    const parsed = JSON.parse(message);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          const path = Array.isArray(item?.path) ? item.path.join(".") : "";
          const msg = typeof item?.message === "string" ? item.message : "";
          return [path, msg].filter(Boolean).join(": ");
        })
        .filter(Boolean)
        .join(" ");
    }
  } catch {
    // Not a JSON encoded validation message.
  }
  return message;
}

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === "object") {
      const body = data as { detail?: unknown; error?: unknown; message?: string };
      if (body.detail) return formatApiError(body.detail);
      if (body.error) {
        if (typeof body.error === "object" && body.error !== null && "message" in body.error) {
          return parseBackendMessage(String((body.error as { message?: unknown }).message || fallback));
        }
        return formatApiError(body.error);
      }
      if (body.message) return formatApiError(body.message);
    }
    if (typeof data === "string" && data.trim()) return data;
    return fallback;
  }

  if (error instanceof Error) {
    return error.message && !error.message.startsWith("Request failed with status code")
      ? error.message
      : fallback;
  }

  return fallback;
}

export function logApiIssue(level: "warn" | "error", label: string, error: unknown, fallback = "Something went wrong") {
  const message = getApiErrorMessage(error, fallback);
  console[level](`${label}: ${message}`);
}
