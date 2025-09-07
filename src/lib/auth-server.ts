import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { organization, twoFactor, admin, bearer } from "better-auth/plugins";
import { prisma } from "./prisma";

if (!process.env.BETTER_AUTH_SECRET) {
  console.error("BETTER_AUTH_SECRET environment variable is not set!");
  console.error("Please add BETTER_AUTH_SECRET to your .env.local file");
}

export const authServer = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mongodb",
  }),
  emailAndPassword: {
    enabled: true,
  },
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [organization(), twoFactor(), admin(), bearer()],
});
