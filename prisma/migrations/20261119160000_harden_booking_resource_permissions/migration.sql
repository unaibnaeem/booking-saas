BEGIN;

-- BOOKWISE: SECURE BOOKING RELEASE FUNCTION

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
        UPDATE public.booking_resource AS allocation
        SET released_at = COALESCE(
            allocation.released_at,
            pg_catalog.statement_timestamp()
        )
        WHERE allocation.organization_id = NEW.organization_id
          AND allocation.booking_id = NEW.id
          AND allocation.released_at IS NULL;
    ELSE
        UPDATE public.booking_resource AS allocation
        SET released_at = NULL
        WHERE allocation.organization_id = NEW.organization_id
          AND allocation.booking_id = NEW.id
          AND allocation.released_at IS NOT NULL;
    END IF;

    RETURN NEW;
END;
$function$;

ALTER FUNCTION public.sync_booking_resource_release()
OWNER TO bookwise_migrator;

REVOKE ALL PRIVILEGES
ON FUNCTION public.sync_booking_resource_release()
FROM PUBLIC, bookwise_app;


-- BOOKWISE: SECURE INITIAL ALLOCATION RELEASE

CREATE OR REPLACE FUNCTION public.set_booking_resource_initial_release()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, pg_temp
AS $function$
DECLARE
    booking_status_value public.booking_status;
BEGIN
    SELECT b.status
    INTO booking_status_value
    FROM public.booking AS b
    WHERE b.organization_id = NEW.organization_id
      AND b.id = NEW.booking_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cannot allocate resources for a missing booking'
            USING ERRCODE = '23503';
    END IF;

    IF booking_status_value IN (
        'CANCELLED'::public.booking_status,
        'COMPLETED'::public.booking_status,
        'NO_SHOW'::public.booking_status
    ) THEN
        NEW.released_at := pg_catalog.statement_timestamp();
    ELSE
        -- Never allow an application INSERT to mark an active
        -- booking allocation as already released.
        NEW.released_at := NULL;
    END IF;

    RETURN NEW;
END;
$function$;

ALTER FUNCTION public.set_booking_resource_initial_release()
OWNER TO bookwise_migrator;

REVOKE ALL PRIVILEGES
ON FUNCTION public.set_booking_resource_initial_release()
FROM PUBLIC, bookwise_app;


-- BOOKWISE: RESTRICT DIRECT ALLOCATION CHANGES

REVOKE UPDATE, DELETE
ON TABLE public.booking_resource
FROM bookwise_app;

GRANT SELECT, INSERT
ON TABLE public.booking_resource
TO bookwise_app;

COMMIT;
