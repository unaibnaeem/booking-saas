-- CreateTable
CREATE TABLE "idempotency_record" (
    "organization_id" TEXT NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "request_hash" CHAR(64) NOT NULL,
    "response_status" INTEGER,
    "response_body" JSONB,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "idempotency_record_pkey" PRIMARY KEY ("organization_id","key")
);

-- CreateIndex
CREATE INDEX "idempotency_record_expires_at_idx" ON "idempotency_record"("expires_at");

-- AddForeignKey
ALTER TABLE "idempotency_record" ADD CONSTRAINT "idempotency_record_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "auth"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;



-- ============================================
-- BOOKWISE: IDEMPOTENCY RECORD CONSTRAINTS
-- ============================================

ALTER TABLE public.idempotency_record
ADD CONSTRAINT idempotency_record_key_not_empty_chk
CHECK (
    length(btrim("key")) > 0
    AND "key" = btrim("key")
),
ADD CONSTRAINT idempotency_record_request_hash_format_chk
CHECK (
    "request_hash"::text ~ '^[0-9a-f]{64}$'
),
ADD CONSTRAINT idempotency_record_response_status_chk
CHECK (
    "response_status" IS NULL
    OR "response_status" BETWEEN 200 AND 599
),
ADD CONSTRAINT idempotency_record_response_pair_chk
CHECK (
    (
        "response_status" IS NULL
        AND "response_body" IS NULL
    )
    OR
    (
        "response_status" IS NOT NULL
        AND "response_body" IS NOT NULL
        AND jsonb_typeof("response_body") = 'object'
    )
),
ADD CONSTRAINT idempotency_record_expiration_chk
CHECK ("expires_at" > "created_at");


-- ============================================
-- BOOKWISE: IDEMPOTENCY TABLE OWNERSHIP
-- ============================================

ALTER TABLE public.idempotency_record
OWNER TO bookwise_migrator;


-- ============================================
-- BOOKWISE: IDEMPOTENCY ROW-LEVEL SECURITY
-- ============================================

ALTER TABLE public.idempotency_record
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.idempotency_record
FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation
ON public.idempotency_record
TO bookwise_app
USING (
    organization_id =
    current_setting('app.current_organization_id', true)
)
WITH CHECK (
    organization_id =
    current_setting('app.current_organization_id', true)
);

CREATE POLICY migration_role_access
ON public.idempotency_record
TO bookwise_migrator
USING (true)
WITH CHECK (true);


-- BOOKWISE: IDEMPOTENCY APPLICATION PERMISSIONS

REVOKE ALL PRIVILEGES
ON TABLE public.idempotency_record
FROM PUBLIC, bookwise_app;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.idempotency_record
TO bookwise_app;
