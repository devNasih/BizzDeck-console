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
  return "Something went wrong";
}
