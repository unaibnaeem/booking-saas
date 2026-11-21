import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";

import { prisma } from "./prisma";

import { env } from "../env";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,

    async sendResetPassword({ user, url }) {
      if (process.env.NODE_ENV !== "development") {
        throw new Error("Password reset email delivery is not configured.");
      }

      console.info("\n========== BOOKWISE PASSWORD RESET ==========");
      console.info("Recipient:", user.email);
      console.info("Reset URL:", url);
      console.info("=============================================\n");
    },
  },

  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      creatorRole: "owner",

      async sendInvitationEmail(data) {
        if (process.env.NODE_ENV !== "development") {
          throw new Error("Invitation email delivery is not configured.");
        }

        const invitationUrl = `${env.BETTER_AUTH_URL}/accept-invitation?invitationId=${encodeURIComponent(data.id)}`;

        console.info("\n========== BOOKWISE INVITATION ==========");
        console.info("Recipient:", data.email);
        console.info("Organization:", data.organization.name);
        console.info("Invitation URL:", invitationUrl);
        console.info("=========================================\n");
      },
    }),
  ],
});
