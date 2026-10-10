ALTER TABLE public.assessment_questions
ADD COLUMN IF NOT EXISTS source_id integer;
