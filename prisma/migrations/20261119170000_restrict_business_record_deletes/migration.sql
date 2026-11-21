BEGIN;

-- BOOKWISE: PROTECT HISTORICAL BUSINESS DATA

REVOKE DELETE ON TABLE
    public.organization_settings,
    public.service,
    public.service_resource_requirement,
    public.bookable_resource,
    public.service_resource,
    public.customer,
    public.booking,
    public.booking_resource
FROM bookwise_app;


-- BOOKWISE: ALLOW AVAILABILITY CLEANUP

GRANT DELETE ON TABLE
    public.availability_rule,
    public.availability_override
TO bookwise_app;

COMMIT;
