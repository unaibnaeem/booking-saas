import "dotenv/config";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// DATABASE SAFETY CHECKS

const seedTarget = process.argv[2];

if (seedTarget !== "test" && seedTarget !== "development") {
  throw new Error("Specify a seed target: 'test' or 'development'.");
}

const expectedDatabase =
  seedTarget === "test" ? "bookwise_migration_test" : "bookwise";

const connectionString =
  seedTarget === "test"
    ? process.env.SEED_DATABASE_URL
    : process.env.MIGRATION_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    seedTarget === "test"
      ? "SEED_DATABASE_URL is required."
      : "MIGRATION_DATABASE_URL is required.",
  );
}

const databaseUrl = new URL(connectionString);

if (
  databaseUrl.protocol !== "postgresql:" ||
  databaseUrl.hostname !== "127.0.0.1" ||
  databaseUrl.port !== "5433" ||
  databaseUrl.pathname !== `/${expectedDatabase}` ||
  decodeURIComponent(databaseUrl.username) !== "bookwise_migrator"
) {
  throw new Error(
    `Unsafe seed database. Expected bookwise_migrator@127.0.0.1:5433/${expectedDatabase}.`,
  );
}

const defaultPassword = process.env.SEED_DEFAULT_PASSWORD ?? "";

if (defaultPassword.length < 12 || defaultPassword.length > 128) {
  throw new Error(
    "SEED_DEFAULT_PASSWORD must contain between 12 and 128 characters.",
  );
}

const authSecret = process.env.BETTER_AUTH_SECRET;
const authBaseUrl = process.env.BETTER_AUTH_URL;

if (!authSecret || !authBaseUrl) {
  throw new Error("BETTER_AUTH_SECRET and BETTER_AUTH_URL are required.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const seedAuth = betterAuth({
  secret: authSecret,
  baseURL: authBaseUrl,

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    autoSignIn: false,
  },
});

// DEMO DATA

const demoOrganizations = [
  {
    id: "seed-harbor-dental",
    name: "Harbor Dental Studio",
    slug: "harbor-dental-studio",

    owner: {
      name: "Ayesha Khan",
      email: "owner@harbor-dental.test",
    },

    contactPhone: "+923001234567",

    services: [
      {
        name: "Dental Consultation",
        slug: "dental-consultation",
        description: "A general dental consultation and examination.",
        durationMinutes: 30,
        priceAmount: "2500.00",
        resourceName: "Dr. Ayesha Khan",
        resourceDescription: "General and preventive dentistry.",
      },
      {
        name: "Dental Cleaning",
        slug: "dental-cleaning",
        description: "Professional dental cleaning and polishing.",
        durationMinutes: 45,
        priceAmount: "5500.00",
        resourceName: "Dr. Hamza Ali",
        resourceDescription: "Dental cleaning and preventive care.",
      },
    ],

    customers: [
      {
        name: "Amna Siddiqui",
        email: "amna.siddiqui@customers.harbor-dental.test",
        phone: "+923001112233",
      },
      {
        name: "Bilal Ahmed",
        email: "bilal.ahmed@customers.harbor-dental.test",
        phone: "+923002223344",
      },
    ],
  },

  {
    id: "seed-northstar-wellness",
    name: "Northstar Wellness Center",
    slug: "northstar-wellness-center",

    owner: {
      name: "Sara Malik",
      email: "owner@northstar-wellness.test",
    },

    contactPhone: "+923003334455",

    services: [
      {
        name: "Massage Therapy",
        slug: "massage-therapy",
        description: "A full-body therapeutic massage session.",
        durationMinutes: 60,
        priceAmount: "7500.00",
        resourceName: "Sara Malik",
        resourceDescription: "Licensed massage therapist.",
      },
      {
        name: "Physiotherapy Session",
        slug: "physiotherapy-session",
        description: "An individual physiotherapy assessment and session.",
        durationMinutes: 45,
        priceAmount: "6000.00",
        resourceName: "Omar Farooq",
        resourceDescription: "Physiotherapy and rehabilitation.",
      },
    ],

    customers: [
      {
        name: "Hira Shah",
        email: "hira.shah@customers.northstar-wellness.test",
        phone: "+923004445566",
      },
      {
        name: "Usman Tariq",
        email: "usman.tariq@customers.northstar-wellness.test",
        phone: "+923005556677",
      },
    ],
  },
] as const;

// OWNER ACCOUNTS

async function ensureOwner(owner: {
  name: string;
  email: string;
}): Promise<string> {
  let user = await prisma.user.findUnique({
    where: {
      email: owner.email,
    },
  });

  if (!user) {
    await seedAuth.api.signUpEmail({
      body: {
        name: owner.name,
        email: owner.email,
        password: defaultPassword,
      },
    });

    user = await prisma.user.findUnique({
      where: {
        email: owner.email,
      },
    });

    console.log(`Created owner account: ${owner.email}`);
  } else {
    console.log(`Owner account already exists: ${owner.email}`);
  }

  if (!user) {
    throw new Error(`Unable to create owner account: ${owner.email}`);
  }

  const credentialAccount = await prisma.account.findFirst({
    where: {
      userId: user.id,
      providerId: "credential",
    },
  });

  if (!credentialAccount) {
    throw new Error(
      `Owner ${owner.email} exists but has no credential account. Resolve this before continuing.`,
    );
  }

  return user.id;
}

// ORGANIZATION MEMBERSHIP

async function ensureMembership(
  organizationId: string,
  userId: string,
): Promise<void> {
  const existing = await prisma.member.findFirst({
    where: {
      organizationId,
      userId,
    },
  });

  if (existing) {
    if (existing.role !== "owner") {
      throw new Error(
        `Unexpected membership role for seeded owner: ${existing.role}`,
      );
    }

    return;
  }

  await prisma.member.create({
    data: {
      id: `seed-member-${organizationId}`,
      organizationId,
      userId,
      role: "owner",
      createdAt: new Date(),
    },
  });
}

// BUSINESS DATA

async function seedOrganization(
  demo: (typeof demoOrganizations)[number],
): Promise<void> {
  console.log(`\nSeeding organization: ${demo.name}`);

  const ownerId = await ensureOwner(demo.owner);

  const organization = await prisma.organization.upsert({
    where: {
      id: demo.id,
    },

    update: {
      name: demo.name,
      slug: demo.slug,
    },

    create: {
      id: demo.id,
      name: demo.name,
      slug: demo.slug,
      createdAt: new Date(),
    },
  });

  await ensureMembership(organization.id, ownerId);

  // Organization settings
  await prisma.organizationSettings.upsert({
    where: {
      organizationId: organization.id,
    },

    update: {
      timeZone: "Asia/Karachi",
      currencyCode: "PKR",
      contactEmail: demo.owner.email,
      contactPhone: demo.contactPhone,
    },

    create: {
      organizationId: organization.id,
      timeZone: "Asia/Karachi",
      currencyCode: "PKR",
      contactEmail: demo.owner.email,
      contactPhone: demo.contactPhone,
    },
  });

  // Services, resources, requirements and assignments
  for (const serviceData of demo.services) {
    const service = await prisma.service.upsert({
      where: {
        organizationId_slug: {
          organizationId: organization.id,
          slug: serviceData.slug,
        },
      },

      update: {
        name: serviceData.name,
        description: serviceData.description,
        durationMinutes: serviceData.durationMinutes,
        priceAmount: serviceData.priceAmount,
        currencyCode: "PKR",
        isActive: true,
      },

      create: {
        organizationId: organization.id,
        name: serviceData.name,
        slug: serviceData.slug,
        description: serviceData.description,
        durationMinutes: serviceData.durationMinutes,
        priceAmount: serviceData.priceAmount,
        currencyCode: "PKR",
      },
    });

    const resource = await prisma.bookableResource.upsert({
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name: serviceData.resourceName,
        },
      },

      update: {
        description: serviceData.resourceDescription,
        isActive: true,
      },

      create: {
        organizationId: organization.id,
        name: serviceData.resourceName,
        type: "STAFF",
        description: serviceData.resourceDescription,
      },
    });

    let requirement = await prisma.serviceResourceRequirement.findFirst({
      where: {
        organizationId: organization.id,
        serviceId: service.id,
        name: "Assigned staff member",
      },
    });

    if (!requirement) {
      requirement = await prisma.serviceResourceRequirement.create({
        data: {
          organizationId: organization.id,
          serviceId: service.id,
          name: "Assigned staff member",
          resourceType: "STAFF",
          quantity: 1,
          isActive: true,
        },
      });
    }

    const existingAssignment = await prisma.serviceResource.findFirst({
      where: {
        organizationId: organization.id,
        serviceId: service.id,
        requirementId: requirement.id,
        resourceId: resource.id,
      },
    });

    if (!existingAssignment) {
      await prisma.serviceResource.create({
        data: {
          organizationId: organization.id,
          serviceId: service.id,
          requirementId: requirement.id,
          resourceId: resource.id,
          resourceType: "STAFF",
          isActive: true,
        },
      });
    }

    // Monday to Friday, 9:00 AM to 5:00 PM.
    for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
      const existingRule = await prisma.availabilityRule.findFirst({
        where: {
          organizationId: organization.id,
          resourceId: resource.id,
          dayOfWeek,
          startMinute: 540,
          endMinute: 1020,
        },
      });

      if (!existingRule) {
        await prisma.availabilityRule.create({
          data: {
            organizationId: organization.id,
            resourceId: resource.id,
            dayOfWeek,
            startMinute: 540,
            endMinute: 1020,
          },
        });
      }
    }
  }

  // Customers
  for (const customerData of demo.customers) {
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        organizationId: organization.id,
        email: customerData.email,
      },
    });

    if (!existingCustomer) {
      await prisma.customer.create({
        data: {
          organizationId: organization.id,
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
        },
      });
    }
  }

  console.log(`Finished organization: ${demo.name}`);
}

// MAIN

async function main(): Promise<void> {
  console.log("Bookwise database seeding started.");
  console.log(`Seed mode: ${seedTarget}`);
  console.log(`Target database: ${expectedDatabase}`);

  for (const demo of demoOrganizations) {
    await seedOrganization(demo);
  }

  console.log("\nBookwise seeding completed successfully.");
}

main()
  .catch((error: unknown) => {
    console.error("\nBookwise seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
