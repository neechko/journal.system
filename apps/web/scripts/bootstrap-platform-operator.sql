\prompt 'Authenticated user ID: ' operator_user_id
\prompt 'DBA identity or change reference: ' bootstrap_actor
\prompt 'Approval reference: ' approval_reference

BEGIN;

LOCK TABLE public.platform_operator IN EXCLUSIVE MODE;

DO $bootstrap$
BEGIN
  IF EXISTS (SELECT 1 FROM public.platform_operator) THEN
    RAISE EXCEPTION 'Initial platform operator already exists; use the approved role-change process.';
  END IF;
END
$bootstrap$;

INSERT INTO public.platform_operator (user_id)
VALUES (NULLIF(:'operator_user_id', ''));

INSERT INTO public.audit_event (
  actor_user_id,
  actor_label,
  action,
  entity_type,
  entity_id,
  reason
)
VALUES (
  NULL,
  NULLIF(:'bootstrap_actor', ''),
  'platform_operator.bootstrapped',
  'platform_operator',
  :'operator_user_id',
  'Initial operator bootstrap; approval reference: ' || NULLIF(:'approval_reference', '')
);

COMMIT;
