CREATE TABLE public.lead_import_records (
  id uuid PRIMARY KEY,
  source_file text NOT NULL,
  record jsonb NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.lead_import_records TO service_role;
ALTER TABLE public.lead_import_records ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.lead_import_records IS 'Private original lead import archive for ownership-preserving recovery. No browser access.';