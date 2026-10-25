CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  serial INTEGER NOT NULL,
  phone TEXT,
  facebook_link TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  archived BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  canonical_link TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX leads_user_serial_idx ON public.leads (user_id, serial);
CREATE INDEX leads_user_created_idx ON public.leads (user_id, created_at DESC);
CREATE UNIQUE INDEX leads_user_phone_idx ON public.leads (user_id, phone) WHERE phone IS NOT NULL;
CREATE INDEX leads_user_archived_idx ON public.leads (user_id, archived);
CREATE INDEX leads_deleted_at_idx ON public.leads (deleted_at);
CREATE UNIQUE INDEX leads_canonical_link_global_unique ON public.leads (canonical_link);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own leads"
  ON public.leads FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_lead_serial()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.serial IS NULL OR NEW.serial = 0 THEN
    -- lock per user so two quick inserts never get the same serial
    PERFORM pg_advisory_xact_lock(hashtext(NEW.user_id::text));
    SELECT COALESCE(MAX(serial), 0) + 1 INTO NEW.serial
    FROM public.leads WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER leads_set_serial BEFORE INSERT ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.set_lead_serial();
REVOKE EXECUTE ON FUNCTION public.set_lead_serial() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.canonical_facebook_link(input_link text)
RETURNS text LANGUAGE plpgsql IMMUTABLE STRICT SET search_path = public AS $$
DECLARE
  normalized text;
  profile_id text;
BEGIN
  normalized := lower(btrim(input_link));
  normalized := regexp_replace(normalized, '[[:space:]]+', '', 'g');
  normalized := regexp_replace(normalized, '^https?://', '', 'i');
  normalized := regexp_replace(normalized, '^(www\.|m\.|mbasic\.|web\.|mobile\.)', '', 'i');
  normalized := regexp_replace(normalized, '^fb\.com/', 'facebook.com/', 'i');
  normalized := regexp_replace(normalized, '^facebook\.com/', '', 'i');
  normalized := regexp_replace(normalized, '#.*$', '');
  IF normalized ~ '^profile\.php\?' THEN
    profile_id := substring(normalized FROM '(?:^|[?&])id=([0-9]+)');
    IF profile_id IS NOT NULL THEN RETURN 'profile:' || profile_id; END IF;
  END IF;
  IF normalized ~ '^people/[^/]+/[0-9]+/?(?:[?#].*)?$' THEN
    profile_id := substring(normalized FROM '^people/[^/]+/([0-9]+)');
    IF profile_id IS NOT NULL THEN RETURN 'profile:' || profile_id; END IF;
  END IF;
  normalized := regexp_replace(normalized, '\?.*$', '');
  normalized := regexp_replace(normalized, '/+$', '');
  RETURN normalized;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_lead_canonical_link()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  NEW.facebook_link := btrim(NEW.facebook_link);
  NEW.canonical_link := public.canonical_facebook_link(NEW.facebook_link);
  RETURN NEW;
END;
$$;
CREATE TRIGGER leads_set_canonical_link
BEFORE INSERT OR UPDATE OF facebook_link, canonical_link ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.set_lead_canonical_link();

REVOKE EXECUTE ON FUNCTION public.canonical_facebook_link(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.canonical_facebook_link(text) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.set_lead_canonical_link() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.collected_leads()
RETURNS TABLE (facebook_link text, canonical_link text, created_at timestamptz, mine boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.facebook_link, l.canonical_link, l.created_at, (l.user_id = auth.uid()) AS mine
  FROM public.leads l
  WHERE auth.uid() IS NOT NULL AND l.deleted_at IS NULL
  ORDER BY l.created_at DESC
$$;
REVOKE ALL ON FUNCTION public.collected_leads() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.collected_leads() TO authenticated;

-- Server-side trash cleanup (30 days), called by the app; deletes only the caller's rows
CREATE OR REPLACE FUNCTION public.purge_old_trash()
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  DELETE FROM public.leads
  WHERE user_id = auth.uid() AND deleted_at < now() - interval '30 days';
$$;
REVOKE ALL ON FUNCTION public.purge_old_trash() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purge_old_trash() TO authenticated;