import { Resend } from "resend";

export const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

export const RESEND_FROM_EMAIL = "hello@axorks.com";
export const SENDER_NAME_EMAIL = "Axorks OS <hello@axorks.com>";
export const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || "admin@axorks.com";

// Use a fallback dummy key during build time to prevent Resend constructor throwing on empty env
export const resend = new Resend(RESEND_API_KEY || "re_placeholder_key_for_build");
