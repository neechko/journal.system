import "server-only";

import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { Profile } from "@auth/core/types";
import NextAuth from "next-auth";
import type { OIDCConfig } from "next-auth/providers";
import { z } from "zod";
import { getDatabase } from "@/server/db/client";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/server/db/schema";

const issuerSchema = z.string().url().refine((value) => {
  const url = new URL(value);
  return (
    !url.username &&
    !url.password &&
    !url.search &&
    !url.hash &&
    (url.protocol === "https:" ||
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
  );
});

const authUrlSchema = z.string().url().refine((value) => {
  const url = new URL(value);
  return (
    !url.username &&
    !url.password &&
    !url.search &&
    !url.hash &&
    (url.protocol === "https:" ||
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
  );
});

const oidcSettingsSchema = z.object({
  issuer: issuerSchema,
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
});

const oidcEnvironmentWasPartiallySet = [
  process.env.AUTH_OIDC_ISSUER,
  process.env.AUTH_OIDC_CLIENT_ID,
  process.env.AUTH_OIDC_CLIENT_SECRET,
].some(Boolean);

function createOidcProvider(): OIDCConfig<Profile> | undefined {
  if (!oidcEnvironmentWasPartiallySet) {
    return undefined;
  }

  const settings = oidcSettingsSchema.safeParse({
    issuer: process.env.AUTH_OIDC_ISSUER,
    clientId: process.env.AUTH_OIDC_CLIENT_ID,
    clientSecret: process.env.AUTH_OIDC_CLIENT_SECRET,
  });

  if (!settings.success) {
    throw new Error(
      "OIDC configuration is incomplete or invalid; configure issuer, client ID, and client secret.",
    );
  }
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters.");
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required when OIDC authentication is enabled.");
  }
  if (process.env.AUTH_URL) {
    if (!authUrlSchema.safeParse(process.env.AUTH_URL).success) {
      throw new Error(
        "AUTH_URL must be HTTPS, except for localhost development.",
      );
    }
  } else if (process.env.AUTH_TRUST_HOST !== "true") {
    throw new Error(
      "Set AUTH_URL, or set AUTH_TRUST_HOST=true only behind a trusted proxy.",
    );
  }

  return {
    id: "oidc",
    name: "Institutional identity provider",
    type: "oidc",
    issuer: settings.data.issuer,
    clientId: settings.data.clientId,
    clientSecret: settings.data.clientSecret,
    authorization: {
      params: {
        scope: "openid profile email",
      },
    },
  };
}

const oidcProvider = createOidcProvider();

export const isOidcConfigured = oidcProvider !== undefined;

const adapter = oidcProvider
  ? DrizzleAdapter(getDatabase(), {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    })
  : undefined;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  providers: oidcProvider ? [oidcProvider] : [],
  secret: process.env.AUTH_SECRET,
  session: { strategy: oidcProvider ? "database" : "jwt" },
  callbacks: {
    session({ session, user, token }) {
      if (session.user) {
        const userId = user?.id ?? token.sub;
        if (!userId) {
          throw new Error("Authenticated session is missing its user identifier.");
        }
        session.user.id = userId;
      }
      return session;
    },
  },
});
