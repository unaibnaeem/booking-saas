BEGIN;

CREATE OR REPLACE FUNCTION public.sync_booking_resource_release()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
BEGIN
    UPDATE public.booking_resource AS allocation
    SET
        reserved_starts_at =
            CASE
                WHEN NEW.starts_at IS DISTINCT FROM OLD.starts_at
                THEN NEW.starts_at
                     + (allocation.reserved_starts_at - OLD.starts_at)
                ELSE allocation.reserved_starts_at
            END,

        reserved_ends_at =
            CASE
                WHEN NEW.ends_at IS DISTINCT FROM OLD.ends_at
                THEN NEW.ends_at
                     + (allocation.reserved_ends_at - OLD.ends_at)
                ELSE allocation.reserved_ends_at
            END,

        released_at =
            CASE
                WHEN NEW.status IN (
                    'CANCELLED'::public.booking_status,
                    'COMPLETED'::public.booking_status,
                    'NO_SHOW'::public.booking_status
                )
                THEN COALESCE(
                    allocation.released_at,
                    pg_catalog.statement_timestamp()
                )
                ELSE NULL
            END

    WHERE allocation.organization_id = NEW.organization_id
      AND allocation.booking_id = NEW.id
      AND (
          NEW.starts_at IS DISTINCT FROM OLD.starts_at
          OR NEW.ends_at IS DISTINCT FROM OLD.ends_at
          OR (
              NEW.status IN (
                  'CANCELLED'::public.booking_status,
                  'COMPLETED'::public.booking_status,
                  'NO_SHOW'::public.booking_status
              )
              AND allocation.released_at IS NULL
          )
          OR (
              NEW.status NOT IN (
                  'CANCELLED'::public.booking_status,
                  'COMPLETED'::public.booking_status,
                  'NO_SHOW'::public.booking_status
              )
              AND allocation.released_at IS NOT NULL
          )
      );

    RETURN NEW;
END;
$function$;

ALTER FUNCTION public.sync_booking_resource_release()
OWNER TO bookwise_migrator;

REVOKE ALL PRIVILEGES
ON FUNCTION public.sync_booking_resource_release()
FROM PUBLIC, bookwise_app;

COMMIT;
