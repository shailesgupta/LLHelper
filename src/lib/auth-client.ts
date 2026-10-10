"use client";

import { createAuthClient } from "@neondatabase/auth/next";

// Uses the same-origin /api/auth proxy, so session cookies belong to LLHelper.
export const authClient = createAuthClient();
