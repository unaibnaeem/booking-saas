import "server-only";

import {
  authorizeOrganization,
  withOrganizationTransaction,
} from "@/lib/api/organization";
import { jsonApiData, jsonApiError } from "@/lib/api/response";

export const runtime = "nodejs";

// GET /api/customers
// LIST ACTIVE ORGANIZATION CUSTOMERS

export async function GET(request: Request): Promise<Response> {
  const authorization = await authorizeOrganization(request.headers);

  if (!authorization.authorized) {
    return authorization.response;
  }

  const { organizationId } = authorization;

  try {
    const customers = await withOrganizationTransaction(
      organizationId,
      async (tx) => {
        return tx.customer.findMany({
          where: {
            organizationId,
            isActive: true,
          },
          orderBy: [{ name: "asc" }, { id: "asc" }],
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        });
      },
    );

    return jsonApiData({ customers });
  } catch (error) {
    console.error("Failed to list customers:", error);

    return jsonApiError({
      status: 500,
      code: "INTERNAL_ERROR",
      message: "Unable to retrieve customers.",
    });
  }
}
