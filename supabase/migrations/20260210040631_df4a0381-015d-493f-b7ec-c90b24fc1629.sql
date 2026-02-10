
-- Fix 1: Recreate client_tracking_view with security_invoker
DROP VIEW IF EXISTS public.client_tracking_view;
CREATE VIEW public.client_tracking_view
WITH (security_invoker = on) AS
SELECT bc.tracking_token,
    bc.bc_id,
    bc.tracking_enabled,
    bc.statut AS bc_statut,
    bc.volume_m3 AS bc_volume,
    bc.date_livraison_souhaitee,
    bc.heure_livraison_souhaitee,
    bc.adresse_livraison,
    bc.client_confirmed_at AS bc_confirmed_at,
    bc.client_confirmed_by_name AS bc_confirmed_by,
    c.nom_client,
    f.designation AS formule_designation,
    z.nom_zone AS zone_nom
FROM bons_commande bc
LEFT JOIN clients c ON bc.client_id = c.client_id
LEFT JOIN formules_theoriques f ON bc.formule_id = f.formule_id
LEFT JOIN zones_livraison z ON bc.zone_livraison_id = z.id
WHERE bc.tracking_enabled = true;

-- Fix 2: Recreate monthly_deposit_summary with security_invoker
DROP VIEW IF EXISTS public.monthly_deposit_summary;
CREATE VIEW public.monthly_deposit_summary
WITH (security_invoker = on) AS
SELECT (date_trunc('month', deposit_date::timestamp with time zone))::date AS month,
    count(*) AS total_deposits,
    sum(amount) AS total_amount,
    count(*) FILTER (WHERE justification_status = 'justified') AS justified_count,
    sum(amount) FILTER (WHERE justification_status = 'justified') AS justified_amount,
    count(*) FILTER (WHERE justification_status = 'unjustified' OR justification_status = 'pending') AS unjustified_count,
    sum(amount) FILTER (WHERE justification_status = 'unjustified' OR justification_status = 'pending') AS unjustified_amount,
    count(*) FILTER (WHERE justification_status = 'flagged') AS flagged_count,
    sum(amount) FILTER (WHERE justification_status = 'flagged') AS flagged_amount,
    round((count(*) FILTER (WHERE justification_status = 'justified')::numeric / NULLIF(count(*), 0)::numeric) * 100, 1) AS justification_rate
FROM cash_deposits
GROUP BY date_trunc('month', deposit_date::timestamp with time zone)
ORDER BY (date_trunc('month', deposit_date::timestamp with time zone))::date DESC;
