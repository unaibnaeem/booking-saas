BEGIN;

-- BOOKWISE: SYNCHRONIZE RESERVATIONS ON RESCHEDULE

CREATE OR REPLACE FUNCTION public.sync_booking_resource_release()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
BEGIN
    IF NEW.status IN (
        'CANCELLED'::public.booking_status,
        'COMPLETED'::public.booking_status,
        'NO_SHOW'::public.booking_status
    ) THEN
        -- Terminal bookings release their active allocations.
        UPDATE public.booking_resource AS allocation
        SET released_at = COALESCE(
            allocation.released_at,
            pg_catalog.statement_timestamp()
        )
        WHERE allocation.organization_id = NEW.organization_id
          AND allocation.booking_id = NEW.id
          AND allocation.released_at IS NULL;
    ELSE
        -- Preserve the existing buffer offsets when a booking moves.
        -- Update the reservation and reactivate released allocations.
        UPDATE public.booking_resource AS allocation
        SET reserved_starts_at =
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
            released_at = NULL
        WHERE allocation.organization_id = NEW.organization_id
          AND allocation.booking_id = NEW.id
          AND (
              allocation.released_at IS NOT NULL
              OR NEW.starts_at IS DISTINCT FROM OLD.starts_at
              OR NEW.ends_at IS DISTINCT FROM OLD.ends_at
          );
    END IF;

    RETURN NEW;
END;
$function$;

ALTER FUNCTION public.sync_booking_resource_release()
OWNER TO bookwise_migrator;

REVOKE ALL PRIVILEGES
ON FUNCTION public.sync_booking_resource_release()
FROM PUBLIC, bookwise_app;


-- React to booking status and time changes.
DROP TRIGGER booking_sync_resource_release
ON public.booking;

CREATE TRIGGER booking_sync_resource_release
AFTER UPDATE OF status, starts_at, ends_at
ON public.booking
FOR EACH ROW
WHEN (
    OLD.status IS DISTINCT FROM NEW.status
    OR OLD.starts_at IS DISTINCT FROM NEW.starts_at
    OR OLD.ends_at IS DISTINCT FROM NEW.ends_at
)
EXECUTE FUNCTION public.sync_booking_resource_release();

COMMIT;
