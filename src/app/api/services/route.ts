import "server-only";

import {
  authorizeOrganization,
  withOrganizationTransaction,
} from "@/lib/api/organization";
import { jsonApiData, jsonApiError } from "@/lib/api/response";

export const runtime = "nodejs";

// GET /api/services
// LIST ACTIVE ORGANIZATION SERVICES

export async function GET(request: Request): Promise<Response> {
  const authorization = await authorizeOrganization(request.headers);

  if (!authorization.authorized) {
    return authorization.response;
  }

  const { organizationId } = authorization;

  try {
    const services = await withOrganizationTransaction(
      organizationId,
      async (tx) => {
        const records = await tx.service.findMany({
          where: {
            organizationId,
            isActive: true,
          },
          orderBy: [{ name: "asc" }, { id: "asc" }],
          select: {
            id: true,
            name: true,
            durationMinutes: true,
            priceAmount: true,
            currencyCode: true,
          },
        });

        return records.map((service) => ({
          ...service,
          priceAmount: service.priceAmount.toString(),
        }));
      },
    );

    return jsonApiData({ services });
  } catch (error) {
    console.error("Failed to list services:", error);

    return jsonApiError({
      status: 500,
      code: "INTERNAL_ERROR",
      message: "Unable to retrieve services.",
    });
  }
}
