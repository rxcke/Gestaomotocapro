ALTER TABLE public.maintenance_records
  ADD CONSTRAINT maintenance_records_km_nonnegative CHECK (km IS NULL OR km >= 0) NOT VALID,
  ADD CONSTRAINT maintenance_records_next_km_nonnegative CHECK (next_km IS NULL OR next_km >= 0) NOT VALID,
  ADD CONSTRAINT maintenance_records_description_length CHECK (description IS NULL OR length(description) <= 500) NOT VALID,
  ADD CONSTRAINT maintenance_records_workshop_length CHECK (workshop IS NULL OR length(workshop) <= 150) NOT VALID;