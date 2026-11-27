BEGIN;

-- BOOKWISE: PROTECT PRISMA MIGRATION HISTORY

DO $$
BEGIN
    IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
        REVOKE ALL PRIVILEGES
        ON TABLE public._prisma_migrations
        FROM bookwise_app;
    END IF;
END
$$;

COMMIT;

-- BEGIN;

-- -- BOOKWISE: PROTECT PRISMA MIGRATION HISTORY

-- REVOKE ALL PRIVILEGES
-- ON TABLE public._prisma_migrations
-- FROM bookwise_app;

-- COMMIT;