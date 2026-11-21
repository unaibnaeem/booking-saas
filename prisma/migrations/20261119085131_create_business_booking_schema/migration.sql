-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateEnum
CREATE TYPE "resource_type" AS ENUM ('STAFF', 'ROOM', 'EQUIPMENT');

-- CreateEnum
CREATE TYPE "booking_status" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "organization_settings" (
    "organization_id" TEXT NOT NULL,
    "time_zone" VARCHAR(64) NOT NULL DEFAULT 'UTC',
    "currency_code" CHAR(3) NOT NULL,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "website_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "organization_settings_pkey" PRIMARY KEY ("organization_id")
);

-- CreateTable
CREATE TABLE "service" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "description" TEXT,
    "duration_minutes" INTEGER NOT NULL,
    "buffer_before_minutes" INTEGER NOT NULL DEFAULT 0,
    "buffer_after_minutes" INTEGER NOT NULL DEFAULT 0,
    "price_amount" DECIMAL(12,2) NOT NULL,
    "currency_code" CHAR(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_resource_requirement" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "resource_type" "resource_type" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "service_resource_requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookable_resource" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "type" "resource_type" NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "bookable_resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_resource" (
    "organization_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "requirement_id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "resource_type" "resource_type" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_resource_pkey" PRIMARY KEY ("organization_id","service_id","requirement_id","resource_id")
);

-- CreateTable
CREATE TABLE "availability_rule" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_minute" INTEGER NOT NULL,
    "end_minute" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "availability_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_override" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "is_available" BOOLEAN NOT NULL,
    "reason" VARCHAR(250),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "availability_override_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" CITEXT,
    "phone" VARCHAR(30),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "status" "booking_status" NOT NULL DEFAULT 'PENDING',
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "service_name" VARCHAR(120) NOT NULL,
    "service_duration_minutes" INTEGER NOT NULL,
    "price_amount" DECIMAL(12,2) NOT NULL,
    "currency_code" CHAR(3) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_resource" (
    "organization_id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "requirement_id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "resource_type" "resource_type" NOT NULL,
    "reserved_starts_at" TIMESTAMPTZ(6) NOT NULL,
    "reserved_ends_at" TIMESTAMPTZ(6) NOT NULL,
    "released_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_resource_pkey" PRIMARY KEY ("organization_id","booking_id","resource_id")
);

-- CreateIndex
CREATE INDEX "service_organization_active_idx" ON "service"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "service_organization_name_idx" ON "service"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "service_organization_id_id_unique" ON "service"("organization_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "service_organization_slug_unique" ON "service"("organization_id", "slug");

-- CreateIndex
CREATE INDEX "service_resource_requirement_service_active_idx" ON "service_resource_requirement"("organization_id", "service_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "service_resource_requirement_identity_unique" ON "service_resource_requirement"("organization_id", "service_id", "id", "resource_type");

-- CreateIndex
CREATE INDEX "bookable_resource_organization_type_active_idx" ON "bookable_resource"("organization_id", "type", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "bookable_resource_organization_id_id_unique" ON "bookable_resource"("organization_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "bookable_resource_organization_name_unique" ON "bookable_resource"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "bookable_resource_organization_id_id_type_unique" ON "bookable_resource"("organization_id", "id", "type");

-- CreateIndex
CREATE INDEX "service_resource_organization_resource_idx" ON "service_resource"("organization_id", "resource_id");

-- CreateIndex
CREATE INDEX "service_resource_requirement_idx" ON "service_resource"("organization_id", "service_id", "requirement_id");

-- CreateIndex
CREATE INDEX "availability_rule_resource_weekday_idx" ON "availability_rule"("organization_id", "resource_id", "day_of_week");

-- CreateIndex
CREATE INDEX "availability_override_resource_interval_idx" ON "availability_override"("organization_id", "resource_id", "starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "customer_organization_name_idx" ON "customer"("organization_id", "name");

-- CreateIndex
CREATE INDEX "customer_organization_phone_idx" ON "customer"("organization_id", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "customer_organization_id_id_unique" ON "customer"("organization_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_organization_email_unique" ON "customer"("organization_id", "email");

-- CreateIndex
CREATE INDEX "booking_organization_start_idx" ON "booking"("organization_id", "starts_at");

-- CreateIndex
CREATE INDEX "booking_customer_start_idx" ON "booking"("organization_id", "customer_id", "starts_at");

-- CreateIndex
CREATE INDEX "booking_status_start_idx" ON "booking"("organization_id", "status", "starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "booking_organization_id_id_unique" ON "booking"("organization_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "booking_organization_id_service_unique" ON "booking"("organization_id", "id", "service_id");

-- CreateIndex
CREATE INDEX "booking_resource_resource_start_idx" ON "booking_resource"("organization_id", "resource_id", "reserved_starts_at");

-- CreateIndex
CREATE INDEX "booking_resource_booking_idx" ON "booking_resource"("organization_id", "booking_id");

-- AddForeignKey
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "auth"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service" ADD CONSTRAINT "service_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_resource_requirement" ADD CONSTRAINT "service_resource_requirement_organization_id_service_id_fkey" FOREIGN KEY ("organization_id", "service_id") REFERENCES "service"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookable_resource" ADD CONSTRAINT "bookable_resource_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_resource" ADD CONSTRAINT "service_resource_organization_id_service_id_requirement_id_fkey" FOREIGN KEY ("organization_id", "service_id", "requirement_id", "resource_type") REFERENCES "service_resource_requirement"("organization_id", "service_id", "id", "resource_type") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_resource" ADD CONSTRAINT "service_resource_organization_id_resource_id_resource_type_fkey" FOREIGN KEY ("organization_id", "resource_id", "resource_type") REFERENCES "bookable_resource"("organization_id", "id", "type") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_rule" ADD CONSTRAINT "availability_rule_organization_id_resource_id_fkey" FOREIGN KEY ("organization_id", "resource_id") REFERENCES "bookable_resource"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_override" ADD CONSTRAINT "availability_override_organization_id_resource_id_fkey" FOREIGN KEY ("organization_id", "resource_id") REFERENCES "bookable_resource"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_organization_id_customer_id_fkey" FOREIGN KEY ("organization_id", "customer_id") REFERENCES "customer"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_organization_id_service_id_fkey" FOREIGN KEY ("organization_id", "service_id") REFERENCES "service"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_resource" ADD CONSTRAINT "booking_resource_organization_id_booking_id_service_id_fkey" FOREIGN KEY ("organization_id", "booking_id", "service_id") REFERENCES "booking"("organization_id", "id", "service_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_resource" ADD CONSTRAINT "booking_resource_organization_id_resource_id_resource_type_fkey" FOREIGN KEY ("organization_id", "resource_id", "resource_type") REFERENCES "bookable_resource"("organization_id", "id", "type") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_resource" ADD CONSTRAINT "booking_resource_organization_id_service_id_requirement_id_fkey" FOREIGN KEY ("organization_id", "service_id", "requirement_id", "resource_id") REFERENCES "service_resource"("organization_id", "service_id", "requirement_id", "resource_id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- BOOKWISE: DATABASE CHECK CONSTRAINTS

-- Organization settings
ALTER TABLE "organization_settings"
ADD CONSTRAINT "organization_settings_currency_code_chk"
CHECK (btrim("currency_code") ~ '^[A-Z]{3}$');


-- Services
ALTER TABLE "service"
ADD CONSTRAINT "service_name_not_empty_chk"
CHECK (length(btrim("name")) > 0),
ADD CONSTRAINT "service_slug_not_empty_chk"
CHECK (length(btrim("slug")) > 0),
ADD CONSTRAINT "service_duration_positive_chk"
CHECK ("duration_minutes" > 0),
ADD CONSTRAINT "service_buffer_before_nonnegative_chk"
CHECK ("buffer_before_minutes" >= 0),
ADD CONSTRAINT "service_buffer_after_nonnegative_chk"
CHECK ("buffer_after_minutes" >= 0),
ADD CONSTRAINT "service_price_nonnegative_chk"
CHECK ("price_amount" >= 0),
ADD CONSTRAINT "service_currency_code_chk"
CHECK (btrim("currency_code") ~ '^[A-Z]{3}$');


-- Service resource requirements
ALTER TABLE "service_resource_requirement"
ADD CONSTRAINT "service_resource_requirement_name_not_empty_chk"
CHECK (length(btrim("name")) > 0),
ADD CONSTRAINT "service_resource_requirement_quantity_positive_chk"
CHECK ("quantity" > 0);


-- Bookable resources
ALTER TABLE "bookable_resource"
ADD CONSTRAINT "bookable_resource_name_not_empty_chk"
CHECK (length(btrim("name")) > 0);


-- Availability rules
ALTER TABLE "availability_rule"
ADD CONSTRAINT "availability_rule_valid_interval_chk"
CHECK (
    "day_of_week" BETWEEN 1 AND 7
    AND "start_minute" >= 0
    AND "start_minute" < 1440
    AND "end_minute" > 0
    AND "end_minute" <= 1440
    AND "start_minute" < "end_minute"
);


-- Availability overrides
ALTER TABLE "availability_override"
ADD CONSTRAINT "availability_override_valid_interval_chk"
CHECK ("starts_at" < "ends_at");


-- Customers
ALTER TABLE "customer"
ADD CONSTRAINT "customer_name_not_empty_chk"
CHECK (length(btrim("name")) > 0),
ADD CONSTRAINT "customer_email_valid_length_chk"
CHECK (
    "email" IS NULL
    OR (
        length("email"::text) BETWEEN 3 AND 320
        AND btrim("email"::text) = "email"::text
    )
);


-- Bookings
ALTER TABLE "booking"
ADD CONSTRAINT "booking_valid_interval_chk"
CHECK ("starts_at" < "ends_at"),
ADD CONSTRAINT "booking_service_duration_positive_chk"
CHECK ("service_duration_minutes" > 0),
ADD CONSTRAINT "booking_price_nonnegative_chk"
CHECK ("price_amount" >= 0),
ADD CONSTRAINT "booking_service_name_not_empty_chk"
CHECK (length(btrim("service_name")) > 0),
ADD CONSTRAINT "booking_currency_code_chk"
CHECK (btrim("currency_code") ~ '^[A-Z]{3}$');


-- Booking resource allocations
ALTER TABLE "booking_resource"
ADD CONSTRAINT "booking_resource_valid_interval_chk"
CHECK ("reserved_starts_at" < "reserved_ends_at");


-- BOOKWISE: WEEKLY AVAILABILITY OVERLAP

ALTER TABLE "availability_rule"
ADD CONSTRAINT "availability_rule_no_overlap_excl"
EXCLUDE USING gist (
    "organization_id" WITH =,
    "resource_id" WITH =,
    "day_of_week" WITH =,
    (int4range("start_minute", "end_minute", '[)')) WITH &&
);


-- BOOKWISE: RESOURCE RESERVATION OVERLAP

ALTER TABLE "booking_resource"
ADD CONSTRAINT "booking_resource_no_overlap_excl"
EXCLUDE USING gist (
    "organization_id" WITH =,
    "resource_id" WITH =,
    (tstzrange("reserved_starts_at", "reserved_ends_at", '[)')) WITH &&
)
WHERE ("released_at" IS NULL);


-- BOOKWISE: BOOKING RESOURCE RELEASE

-- Release or reactivate allocations when booking status changes.
CREATE OR REPLACE FUNCTION public.sync_booking_resource_release()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status IN (
        'CANCELLED'::public.booking_status,
        'COMPLETED'::public.booking_status,
        'NO_SHOW'::public.booking_status
    ) THEN
        UPDATE public.booking_resource
        SET released_at = COALESCE(released_at, statement_timestamp())
        WHERE organization_id = NEW.organization_id
          AND booking_id = NEW.id
          AND released_at IS NULL;
    ELSE
        -- Reactivating a booking attempts to reserve its resources again.
        -- The exclusion constraint rejects reactivation if a resource
        -- has since been allocated to another overlapping booking.
        UPDATE public.booking_resource
        SET released_at = NULL
        WHERE organization_id = NEW.organization_id
          AND booking_id = NEW.id
          AND released_at IS NOT NULL;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER booking_sync_resource_release
AFTER UPDATE OF status ON public.booking
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.sync_booking_resource_release();


-- Ensure allocations created for an already-terminal booking
-- are recorded as released immediately.
CREATE OR REPLACE FUNCTION public.set_booking_resource_initial_release()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    current_booking_status public.booking_status;
BEGIN
    SELECT status
    INTO current_booking_status
    FROM public.booking
    WHERE organization_id = NEW.organization_id
      AND id = NEW.booking_id;

    IF current_booking_status IN (
        'CANCELLED'::public.booking_status,
        'COMPLETED'::public.booking_status,
        'NO_SHOW'::public.booking_status
    ) THEN
        NEW.released_at := COALESCE(
            NEW.released_at,
            statement_timestamp()
        );
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER booking_resource_set_initial_release
BEFORE INSERT ON public.booking_resource
FOR EACH ROW
EXECUTE FUNCTION public.set_booking_resource_initial_release();


-- BOOKWISE: TENANT ROW-LEVEL SECURITY

DO $$
DECLARE
    table_name TEXT;
    tenant_tables TEXT[] := ARRAY[
        'organization_settings',
        'service',
        'service_resource_requirement',
        'bookable_resource',
        'service_resource',
        'availability_rule',
        'availability_override',
        'customer',
        'booking',
        'booking_resource'
    ];
BEGIN
    FOREACH table_name IN ARRAY tenant_tables
    LOOP
        -- Enable RLS and enforce it even for the table owner.
        EXECUTE format(
            'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',
            table_name
        );

        EXECUTE format(
            'ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',
            table_name
        );

        -- Application access is restricted to the current tenant.
        EXECUTE format(
            'CREATE POLICY tenant_isolation ON public.%I
             TO bookwise_app
             USING (
                 organization_id =
                 current_setting(''app.current_organization_id'', true)
             )
             WITH CHECK (
                 organization_id =
                 current_setting(''app.current_organization_id'', true)
             )',
            table_name
        );

        -- The dedicated migration role retains administrative access.
        EXECUTE format(
            'CREATE POLICY migration_role_access ON public.%I
             TO bookwise_migrator
             USING (true)
             WITH CHECK (true)',
            table_name
        );
    END LOOP;
END
$$;


-- BOOKWISE: APPLICATION PERMISSIONS

-- Schema access
GRANT USAGE ON SCHEMA auth, public TO bookwise_app;

-- Better Auth tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
    auth."user",
    auth."session",
    auth."account",
    auth."verification",
    auth."organization",
    auth."member",
    auth."invitation"
TO bookwise_app;

-- Bookwise business tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
    public.organization_settings,
    public.service,
    public.service_resource_requirement,
    public.bookable_resource,
    public.service_resource,
    public.availability_rule,
    public.availability_override,
    public.customer,
    public.booking,
    public.booking_resource
TO bookwise_app;

-- Sequence access
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA auth TO bookwise_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bookwise_app;

-- Custom PostgreSQL types
GRANT USAGE ON TYPE
    public.citext,
    public.resource_type,
    public.booking_status
TO bookwise_app;

-- Future public tables must receive explicit grants in their migrations.
ALTER DEFAULT PRIVILEGES FOR ROLE bookwise_migrator IN SCHEMA public
REVOKE ALL ON TABLES FROM bookwise_app;

ALTER DEFAULT PRIVILEGES FOR ROLE bookwise_migrator IN SCHEMA public
REVOKE ALL ON SEQUENCES FROM bookwise_app;
