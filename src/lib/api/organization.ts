import "server-only";

import type { Prisma } from "@/generated/prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonApiError } from "@/lib/api/response";

type AuthorizationResult =
  | {
      authorized: true;
      userId: string;
      organizationId: string;
    }
  | {
      authorized: false;
      response: Response;
    };

export async function authorizeOrganization(
  requestHeaders: Headers,
): Promise<AuthorizationResult> {
  const sessionData = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!sessionData) {
    return {
      authorized: false,
      response: jsonApiError({
        status: 401,
        code: "UNAUTHENTICATED",
        message: "You must be signed in to access this resource.",
      }),
    };
  }

  const userId = sessionData.user.id;
  const organizationId = sessionData.session.activeOrganizationId;

  if (!organizationId) {
    return {
      authorized: false,
      response: jsonApiError({
        status: 403,
        code: "ORGANIZATION_REQUIRED",
        message: "You must select an organization to continue.",
      }),
    };
  }

  const membership = await prisma.member.findFirst({
    where: {
      userId,
      organizationId,
    },
    select: {
      id: true,
    },
  });

  if (!membership) {
    return {
      authorized: false,
      response: jsonApiError({
        status: 403,
        code: "FORBIDDEN",
        message: "You do not have access to this organization.",
      }),
    };
  }

  return {
    authorized: true,
    userId,
    organizationId,
  };
}

export async function withOrganizationTransaction<T>(
  organizationId: string,
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT set_config(
        'app.current_organization_id',
        ${organizationId},
        true
      )
    `;

    return callback(tx);
  });
}
