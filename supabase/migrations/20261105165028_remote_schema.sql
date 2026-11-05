SET local check_function_bodies = off;

CREATE TABLE "public"."assessment_attempts" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"         uuid                     NOT NULL,
  "assessment_id"   uuid                     NOT NULL,
  "score"           integer,
  "total_questions" integer,
  "correct_answers" integer,
  "status"          text                     DEFAULT 'in_progress'::text,
  "started_at"      timestamp with time zone DEFAULT now(),
  "completed_at"    timestamp with time zone,
  "created_at"      timestamp with time zone DEFAULT now(),
  CONSTRAINT "assessment_attempts_pkey" PRIMARY KEY (id),
  CONSTRAINT "assessment_attempts_status_check" CHECK ((status = ANY (ARRAY['in_progress'::text, 'completed'::text])))
);

ALTER TABLE "public"."assessment_attempts"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."assessment_questions" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "assessment_id"   uuid                     NOT NULL,
  "question_text"   text                     NOT NULL,
  "question_type"   text                     NOT NULL,
  "topic"           text,
  "options"         jsonb                    NOT NULL,
  "correct_answer"  text,
  "correct_answers" text[],
  "explanation"     text,
  "created_at"      timestamp with time zone DEFAULT now(),
  "source_id"       bigint,
  CONSTRAINT "assessment_questions_pkey" PRIMARY KEY (id),
  CONSTRAINT "assessment_questions_question_type_check" CHECK ((question_type = ANY (ARRAY['mcq'::text, 'true_false'::text, 'multi_select'::text])))
);

ALTER TABLE "public"."assessment_questions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."assessment_shares" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "attempt_id"     uuid                     NOT NULL,
  "shared_with_id" uuid                     NOT NULL,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "assessment_shares_attempt_id_shared_with_id_key" UNIQUE (attempt_id, shared_with_id),
  CONSTRAINT "assessment_shares_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."assessment_shares"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."assessments" (
  "id"               uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"          uuid                     NOT NULL,
  "course_id"        uuid,
  "title"            text                     NOT NULL,
  "difficulty_level" integer,
  "source"           text,
  "description"      text,
  "created_at"       timestamp with time zone DEFAULT now(),
  CONSTRAINT "assessments_difficulty_level_check" CHECK (((difficulty_level >= 0) AND (difficulty_level <= 100))),
  CONSTRAINT "assessments_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."assessments"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."assignments" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"         uuid                     NOT NULL,
  "course_id"       uuid,
  "lms_external_id" text,
  "title"           text                     NOT NULL,
  "description"     text,
  "file_url"        text,
  "due_date"        timestamp with time zone,
  "points_possible" numeric,
  "source"          text                     NOT NULL DEFAULT 'lms'::text,
  "is_completed"    boolean                  NOT NULL DEFAULT false,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "assignments_pkey" PRIMARY KEY (id),
  CONSTRAINT "assignments_source_check" CHECK ((source = ANY (ARRAY['lms'::text, 'local'::text]))),
  CONSTRAINT "assignments_user_lms_external_id_key" UNIQUE (user_id, lms_external_id)
);

ALTER TABLE "public"."assignments"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."attempt_answers" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "attempt_id"  uuid                     NOT NULL,
  "question_id" uuid                     NOT NULL,
  "user_answer" jsonb,
  "is_correct"  boolean,
  "created_at"  timestamp with time zone DEFAULT now(),
  CONSTRAINT "attempt_answers_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."attempt_answers"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."chat_conversations" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "chat_conversations_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."chat_conversations"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."chat_messages" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "conversation_id" uuid                     NOT NULL,
  "sender_id"       uuid                     NOT NULL,
  "body"            text                     NOT NULL,
  "attempt_id"      uuid,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "chat_messages_body_check" CHECK (((char_length(TRIM(BOTH FROM body)) >= 1) AND (char_length(TRIM(BOTH FROM body)) <= 4000))),
  CONSTRAINT "chat_messages_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."chat_messages"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."chat_participants" (
  "conversation_id" uuid                     NOT NULL,
  "user_id"         uuid                     NOT NULL,
  "last_read_at"    timestamp with time zone,
  CONSTRAINT "chat_participants_pkey" PRIMARY KEY (conversation_id, user_id)
);

ALTER TABLE "public"."chat_participants"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."courses" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"         uuid,
  "lms_external_id" text,
  "course_code"     text,
  "course_name"     text                     NOT NULL,
  "description"     text,
  "created_at"      timestamp with time zone DEFAULT now(),
  CONSTRAINT "courses_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."courses"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."gpa_progression" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"        uuid                     NOT NULL,
  "semester"       text                     NOT NULL,
  "semester_order" integer                  NOT NULL,
  "gpa"            numeric(3,2),
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "gpa_progression_gpa_check" CHECK (((gpa IS NULL) OR ((gpa >= (0)::numeric) AND (gpa <= (4)::numeric)))),
  CONSTRAINT "gpa_progression_pkey" PRIMARY KEY (id),
  CONSTRAINT "gpa_progression_user_id_semester_key" UNIQUE (user_id, semester)
);

ALTER TABLE "public"."gpa_progression"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."inbox_notifications" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "recipient_id"      uuid                     NOT NULL,
  "actor_id"          uuid,
  "notification_type" text                     NOT NULL,
  "note_id"           uuid,
  "attempt_id"        uuid,
  "title"             text                     NOT NULL,
  "body"              text,
  "read_at"           timestamp with time zone,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "assessment_id"     uuid,
  CONSTRAINT "inbox_notifications_notification_type_check" CHECK ((notification_type = ANY (ARRAY['note_share'::text, 'assessment_share'::text]))),
  CONSTRAINT "inbox_notifications_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."inbox_notifications"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."inbox_notifications"
  REPLICA IDENTITY FULL;

CREATE TABLE "public"."lms_connections" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"        uuid,
  "platform_name"  text                     NOT NULL,
  "last_synced_at" timestamp with time zone,
  "is_active"      boolean                  DEFAULT true,
  "secret_id"      uuid,
  CONSTRAINT "lms_connections_pkey" PRIMARY KEY (id),
  CONSTRAINT "unique_user_platform" UNIQUE (user_id, platform_name)
);

ALTER TABLE "public"."lms_connections"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."material_progress" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"     uuid                     NOT NULL,
  "material_id" uuid                     NOT NULL,
  "viewed"      boolean                  NOT NULL DEFAULT false,
  "viewed_at"   timestamp with time zone,
  "updated_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "material_progress_pkey" PRIMARY KEY (id),
  CONSTRAINT "material_progress_user_id_material_id_key" UNIQUE (user_id, material_id)
);

ALTER TABLE "public"."material_progress"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."materials" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "course_id"       uuid,
  "title"           text                     NOT NULL,
  "content_type"    text,
  "file_url"        text,
  "raw_content"     text,
  "due_date"        timestamp with time zone,
  "created_at"      timestamp with time zone DEFAULT now(),
  "user_id"         uuid,
  "lms_external_id" text,
  "module_name"     text,
  "source"          text                     NOT NULL DEFAULT 'local'::text,
  "updated_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "materials_content_type_check" CHECK ((content_type = ANY (ARRAY['pdf'::text, 'text'::text, 'deadline'::text]))),
  CONSTRAINT "materials_pkey" PRIMARY KEY (id),
  CONSTRAINT "materials_user_lms_external_id_key" UNIQUE (user_id, lms_external_id)
);

ALTER TABLE "public"."materials"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."note_favorites" (
  "user_id"    uuid                     NOT NULL,
  "note_id"    uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "note_favorites_pkey" PRIMARY KEY (user_id, note_id)
);

ALTER TABLE "public"."note_favorites"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."note_shares" (
  "id"               uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "note_id"          uuid,
  "shared_with_id"   uuid,
  "permission_level" text                     NOT NULL,
  "created_at"       timestamp with time zone DEFAULT now(),
  CONSTRAINT "note_shares_permission_level_check" CHECK ((permission_level = ANY (ARRAY['read'::text, 'edit'::text]))),
  CONSTRAINT "note_shares_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."note_shares"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."note_tag_links" (
  "note_id" uuid NOT NULL,
  "tag_id"  uuid NOT NULL,
  CONSTRAINT "note_tag_links_pkey" PRIMARY KEY (note_id, tag_id)
);

ALTER TABLE "public"."note_tag_links"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."note_tags" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    uuid                     NOT NULL,
  "name"       text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "course_id"  uuid,
  CONSTRAINT "note_tags_pkey" PRIMARY KEY (id),
  CONSTRAINT "note_tags_user_id_name_key" UNIQUE (user_id, name)
);

ALTER TABLE "public"."note_tags"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."notes" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "course_id"   uuid,
  "owner_id"    uuid,
  "title"       text                     DEFAULT 'Untitled Note'::text,
  "content"     jsonb,
  "is_archived" boolean                  DEFAULT false,
  "created_at"  timestamp with time zone DEFAULT now(),
  "updated_at"  timestamp with time zone DEFAULT now(),
  CONSTRAINT "notes_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."notes"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."profiles" (
  "id"               uuid                     NOT NULL,
  "full_name"        text                     DEFAULT gen_random_uuid(),
  "role"             text,
  "institution_name" text,
  "avatar_url"       text,
  "created_at"       timestamp with time zone DEFAULT now(),
  "updated_at"       timestamp with time zone DEFAULT now(),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "profiles_role_check" CHECK ((role = ANY (ARRAY['student'::text, 'supervisor'::text, 'admin'::text])))
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."research" (
  "id"               bigint                   GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  "user_id"          uuid                     NOT NULL,
  "link"             text,
  "display_name"     text,
  "referenced_notes" uuid[],
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "research_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."research"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_editable_shared_notes()
  RETURNS SETOF uuid
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  SELECT note_id FROM note_shares WHERE shared_with_id = auth.uid() AND permission_level = 'edit';
$function$;

CREATE OR REPLACE FUNCTION public.get_shared_notes()
  RETURNS SETOF uuid
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  SELECT note_id FROM note_shares WHERE shared_with_id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.get_user_by_email (
  user_email text
)
  RETURNS TABLE (
    id uuid
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
BEGIN
  RETURN QUERY SELECT au.id FROM auth.users au WHERE au.email = user_email LIMIT 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    'student' -- Default role
  );
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.store_lms_token (
  p_platform_name text,
  p_token         text
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'vault'
  AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_old_secret_id uuid;
  v_secret_id uuid;
  v_connection_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to store an LMS token';
  END IF;

  SELECT secret_id
  INTO v_old_secret_id
  FROM public.lms_connections
  WHERE user_id = v_user_id
    AND platform_name = p_platform_name;

  v_secret_id := vault.create_secret(
    p_token,
    'lms-token-' || v_user_id::text || '-' || gen_random_uuid()::text,
    'LMS access token for ' || p_platform_name
  );

  INSERT INTO public.lms_connections (user_id, platform_name, secret_id, is_active)
  VALUES (v_user_id, p_platform_name, v_secret_id, true)
  ON CONFLICT ON CONSTRAINT unique_user_platform
  DO UPDATE SET
    secret_id = EXCLUDED.secret_id,
    is_active = true
  RETURNING id INTO v_connection_id;

  IF v_old_secret_id IS NOT NULL AND v_old_secret_id <> v_secret_id THEN
    DELETE FROM vault.secrets
    WHERE id = v_old_secret_id;
  END IF;

  RETURN v_connection_id;
END;
$function$;

ALTER TABLE "public"."assessment_shares"
  ADD CONSTRAINT "assessment_shares_attempt_id_fkey" FOREIGN KEY (attempt_id) REFERENCES public.assessment_attempts(id) ON DELETE CASCADE;

ALTER TABLE "public"."assessment_attempts"
  ADD CONSTRAINT "assessment_attempts_assessment_id_fkey" FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE;

ALTER TABLE "public"."assessment_questions"
  ADD CONSTRAINT "assessment_questions_assessment_id_fkey" FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE;

ALTER TABLE "public"."attempt_answers"
  ADD CONSTRAINT "attempt_answers_attempt_id_fkey" FOREIGN KEY (attempt_id) REFERENCES public.assessment_attempts(id) ON DELETE CASCADE;

ALTER TABLE "public"."attempt_answers"
  ADD CONSTRAINT "attempt_answers_question_id_fkey" FOREIGN KEY (question_id) REFERENCES public.assessment_questions(id);

ALTER TABLE "public"."chat_messages"
  ADD CONSTRAINT "chat_messages_attempt_id_fkey" FOREIGN KEY (attempt_id) REFERENCES public.assessment_attempts(id) ON DELETE SET NULL;

ALTER TABLE "public"."chat_messages"
  ADD CONSTRAINT "chat_messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;

ALTER TABLE "public"."chat_participants"
  ADD CONSTRAINT "chat_participants_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;

ALTER TABLE "public"."assessments"
  ADD CONSTRAINT "assessments_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."assignments"
  ADD CONSTRAINT "assignments_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE "public"."inbox_notifications"
  ADD CONSTRAINT "inbox_notifications_assessment_id_fkey" FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE;

ALTER TABLE "public"."inbox_notifications"
  ADD CONSTRAINT "inbox_notifications_attempt_id_fkey" FOREIGN KEY (attempt_id) REFERENCES public.assessment_attempts(id) ON DELETE CASCADE;

ALTER TABLE "public"."lms_connections"
  ADD CONSTRAINT "lms_connections_secret_id_fkey" FOREIGN KEY (secret_id) REFERENCES vault.secrets(id);

ALTER TABLE "public"."materials"
  ADD CONSTRAINT "materials_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE "public"."material_progress"
  ADD CONSTRAINT "material_progress_material_id_fkey" FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE CASCADE;

ALTER TABLE "public"."note_tags"
  ADD CONSTRAINT "note_tags_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;

ALTER TABLE "public"."note_tag_links"
  ADD CONSTRAINT "note_tag_links_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES public.note_tags(id) ON DELETE CASCADE;

ALTER TABLE "public"."notes"
  ADD CONSTRAINT "notes_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE "public"."inbox_notifications"
  ADD CONSTRAINT "inbox_notifications_note_id_fkey" FOREIGN KEY (note_id) REFERENCES public.notes(id) ON DELETE CASCADE;

ALTER TABLE "public"."note_favorites"
  ADD CONSTRAINT "note_favorites_note_id_fkey" FOREIGN KEY (note_id) REFERENCES public.notes(id) ON DELETE CASCADE;

ALTER TABLE "public"."note_shares"
  ADD CONSTRAINT "note_shares_note_id_fkey" FOREIGN KEY (note_id) REFERENCES public.notes(id) ON DELETE CASCADE;

ALTER TABLE "public"."note_tag_links"
  ADD CONSTRAINT "note_tag_links_note_id_fkey" FOREIGN KEY (note_id) REFERENCES public.notes(id) ON DELETE CASCADE;

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."assessment_attempts"
  ADD CONSTRAINT "assessment_attempts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."assessment_shares"
  ADD CONSTRAINT "assessment_shares_shared_with_id_fkey" FOREIGN KEY (shared_with_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."assessments"
  ADD CONSTRAINT "assessments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."assignments"
  ADD CONSTRAINT "assignments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."chat_messages"
  ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."chat_participants"
  ADD CONSTRAINT "chat_participants_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."courses"
  ADD CONSTRAINT "courses_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."gpa_progression"
  ADD CONSTRAINT "gpa_progression_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."inbox_notifications"
  ADD CONSTRAINT "inbox_notifications_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."inbox_notifications"
  ADD CONSTRAINT "inbox_notifications_recipient_id_fkey" FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."lms_connections"
  ADD CONSTRAINT "lms_connections_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."material_progress"
  ADD CONSTRAINT "material_progress_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."materials"
  ADD CONSTRAINT "materials_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."note_favorites"
  ADD CONSTRAINT "note_favorites_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."note_shares"
  ADD CONSTRAINT "note_shares_shared_with_id_fkey" FOREIGN KEY (shared_with_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."note_tags"
  ADD CONSTRAINT "note_tags_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."notes"
  ADD CONSTRAINT "notes_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."research"
  ADD CONSTRAINT "research_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id);

CREATE VIEW "public"."decrypted_lms_connections" WITH (security_invoker=on) AS  SELECT connections.id,
    connections.user_id,
    connections.platform_name AS domain,
    connections.is_active,
    decrypted.decrypted_secret AS access_token
   FROM (public.lms_connections connections
     JOIN vault.decrypted_secrets decrypted ON ((decrypted.id = connections.secret_id)))
  WHERE (connections.is_active = true);

CREATE INDEX assessment_shares_shared_with_idx ON public.assessment_shares USING btree (shared_with_id);

CREATE INDEX assignments_user_due_date_idx ON public.assignments USING btree (user_id, due_date);

CREATE INDEX chat_messages_conversation_created_idx ON public.chat_messages USING btree (conversation_id, created_at);

CREATE INDEX chat_messages_sender_id_idx ON public.chat_messages USING btree (sender_id);

CREATE INDEX chat_participants_user_id_idx ON public.chat_participants USING btree (user_id);

CREATE INDEX gpa_progression_user_order_idx ON public.gpa_progression USING btree (user_id, semester_order);

CREATE UNIQUE INDEX inbox_notifications_assessment_unique ON public.inbox_notifications USING btree (recipient_id, assessment_id, notification_type)
  WHERE (assessment_id IS NOT NULL);

CREATE INDEX material_progress_user_idx ON public.material_progress USING btree (user_id, material_id);

CREATE INDEX materials_user_course_idx ON public.materials USING btree (user_id, course_id);

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "Assessment owners and recipients can view shares" ON "public"."assessment_shares"
  FOR SELECT
  TO PUBLIC
  USING (((shared_with_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.assessment_attempts
  WHERE ((assessment_attempts.id = assessment_shares.attempt_id) AND (assessment_attempts.user_id = auth.uid()))))));

CREATE POLICY "Authenticated user read" ON "public"."assessments"
  FOR SELECT
  TO "authenticator"
  USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."assessments"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Users manage their assignments" ON "public"."assignments"
  FOR ALL
  TO PUBLIC
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Chat participants can send messages" ON "public"."chat_messages"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (((sender_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.chat_participants
  WHERE ((chat_participants.conversation_id = chat_messages.conversation_id) AND (chat_participants.user_id = auth.uid()))))));

CREATE POLICY "Chat participants can view messages" ON "public"."chat_messages"
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.chat_participants
  WHERE ((chat_participants.conversation_id = chat_messages.conversation_id) AND (chat_participants.user_id = auth.uid())))));

CREATE POLICY "Chat participants can mark messages read" ON "public"."chat_participants"
  FOR UPDATE
  TO PUBLIC
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Chat participants can view their conversations" ON "public"."chat_participants"
  FOR SELECT
  TO PUBLIC
  USING ((user_id = auth.uid()));

CREATE POLICY "Allow owner user to handle all data" ON "public"."courses"
  FOR ALL
  TO PUBLIC
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Enable insert for authenticated users only" ON "public"."courses"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (true);

CREATE POLICY "Enable users to view their own data only" ON "public"."courses"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users manage their GPA progression" ON "public"."gpa_progression"
  FOR ALL
  TO PUBLIC
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Enable delete for users based on user_id" ON "public"."inbox_notifications"
  FOR DELETE
  TO PUBLIC
  USING ((( SELECT auth.uid() AS uid) = actor_id));

CREATE POLICY "Users mark inbox read" ON "public"."inbox_notifications"
  FOR UPDATE
  TO PUBLIC
  USING ((recipient_id = auth.uid()))
  WITH CHECK ((recipient_id = auth.uid()));

CREATE POLICY "Users read their inbox" ON "public"."inbox_notifications"
  FOR SELECT
  TO PUBLIC
  USING ((recipient_id = auth.uid()));

CREATE POLICY "Users can view their own LMS connections." ON "public"."lms_connections"
  FOR SELECT
  TO "authenticated"
  USING ((auth.uid() = user_id));

CREATE POLICY "Users manage their material progress" ON "public"."material_progress"
  FOR ALL
  TO PUBLIC
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Users manage their materials" ON "public"."materials"
  FOR ALL
  TO PUBLIC
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Users manage their note favorites" ON "public"."note_favorites"
  FOR ALL
  TO PUBLIC
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Note owners can manage shares" ON "public"."note_shares"
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.notes
  WHERE ((notes.id = note_shares.note_id) AND (notes.owner_id = auth.uid())))));

CREATE POLICY "Users can see shares directed at them" ON "public"."note_shares"
  FOR SELECT
  TO PUBLIC
  USING ((shared_with_id = auth.uid()));

CREATE POLICY "Users read their note tag links" ON "public"."note_tag_links"
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.notes n
  WHERE ((n.id = note_tag_links.note_id) AND (n.owner_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.notes n
  WHERE ((n.id = note_tag_links.note_id) AND (n.owner_id = auth.uid())))));

CREATE POLICY "Users manage their note tags" ON "public"."note_tags"
  FOR ALL
  TO PUBLIC
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "notes_delete_policy" ON "public"."notes"
  FOR DELETE
  TO PUBLIC
  USING ((auth.uid() = owner_id));

CREATE POLICY "notes_insert_policy" ON "public"."notes"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = owner_id));

CREATE POLICY "notes_select_policy" ON "public"."notes"
  FOR SELECT
  TO PUBLIC
  USING (((auth.uid() = owner_id) OR (id IN ( SELECT public.get_shared_notes() AS get_shared_notes))));

CREATE POLICY "notes_update_policy" ON "public"."notes"
  FOR UPDATE
  TO PUBLIC
  USING (((auth.uid() = owner_id) OR (id IN ( SELECT public.get_editable_shared_notes() AS get_editable_shared_notes))));

CREATE POLICY "Admin Update Permissions" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.profiles profiles_1
  WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::text)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles profiles_1
  WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::text)))));

CREATE POLICY "Enable read access for all users" ON "public"."profiles"
  FOR SELECT
  TO PUBLIC
  USING (true);

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."chat_messages";

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."inbox_notifications";

GRANT EXECUTE ON FUNCTION "public"."get_editable_shared_notes"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."get_editable_shared_notes"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_editable_shared_notes"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_editable_shared_notes"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."get_shared_notes"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."get_shared_notes"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_shared_notes"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_shared_notes"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."get_user_by_email"(text) TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."get_user_by_email"(text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_user_by_email"(text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_user_by_email"(text) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."store_lms_token"(text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."store_lms_token"(text, text) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."store_lms_token"(text, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."store_lms_token"(text, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."store_lms_token"(text, text) TO "service_role";

REVOKE ALL ON SEQUENCE "public"."research_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."research_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."research_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."research_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."research_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."research_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."research_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."research_id_seq" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."assessment_attempts" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."assessment_attempts" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."assessment_attempts" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."assessment_attempts" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."assessment_questions" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."assessment_questions" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."assessment_questions" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."assessment_questions" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."assessment_shares" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."assessment_shares" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."assessment_shares" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."assessment_shares" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."assessments" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."assessments" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."assessments" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."assessments" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."assignments" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."assignments" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."assignments" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."assignments" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."attempt_answers" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."attempt_answers" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."attempt_answers" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."attempt_answers" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."chat_conversations" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."chat_conversations" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."chat_conversations" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."chat_conversations" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."chat_messages" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."chat_messages" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."chat_messages" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."chat_messages" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."chat_participants" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."chat_participants" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."chat_participants" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."chat_participants" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."courses" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."courses" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."courses" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."courses" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."gpa_progression" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."gpa_progression" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."gpa_progression" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."gpa_progression" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."inbox_notifications" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."inbox_notifications" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."inbox_notifications" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."inbox_notifications" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."lms_connections" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."lms_connections" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."lms_connections" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."lms_connections" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."material_progress" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."material_progress" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."material_progress" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."material_progress" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."materials" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."materials" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."materials" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."materials" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."note_favorites" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."note_favorites" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."note_favorites" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."note_favorites" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."note_shares" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."note_shares" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."note_shares" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."note_shares" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."note_tag_links" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."note_tag_links" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."note_tag_links" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."note_tag_links" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."note_tags" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."note_tags" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."note_tags" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."note_tags" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notes" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."notes" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notes" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notes" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."profiles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."research" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."research" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."research" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."research" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."decrypted_lms_connections" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."decrypted_lms_connections" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."decrypted_lms_connections" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."decrypted_lms_connections" TO "service_role";

