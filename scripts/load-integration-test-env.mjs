import "dotenv/config";

const integrationUrl = process.env.INTEGRATION_TEST_DATABASE_URL;

if (!integrationUrl) {
  throw new Error(
    "INTEGRATION_TEST_DATABASE_URL is missing from the environment.",
  );
}

const databaseUrl = new URL(integrationUrl);

const expectedDatabase = "bookwise_integration_test";
const expectedRole = "bookwise_app";

if (
  databaseUrl.protocol !== "postgresql:" ||
  databaseUrl.hostname !== "127.0.0.1" ||
  databaseUrl.port !== "5433" ||
  databaseUrl.pathname !== `/${expectedDatabase}` ||
  decodeURIComponent(databaseUrl.username) !== expectedRole
) {
  throw new Error(
    "Integration tests must connect to bookwise_integration_test on localhost as bookwise_app.",
  );
}

// Override the development DATABASE_URL loaded from .env.
process.env.DATABASE_URL = integrationUrl;
