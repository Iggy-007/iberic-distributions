import { randomBytes } from "crypto";

export function generateOrderNumber(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `ORD-${y}${m}${d}-${rand}`;
}

export function generateCancellationNumber(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `CAN-${y}${m}${d}-${rand}`;
}

export function generateTrackingToken(): string {
  return randomBytes(24).toString("hex");
}

export function getAppBaseUrl(): string {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export function getTrackingUrl(token: string): string {
  return `${getAppBaseUrl()}/tracking/${token}`;
}
