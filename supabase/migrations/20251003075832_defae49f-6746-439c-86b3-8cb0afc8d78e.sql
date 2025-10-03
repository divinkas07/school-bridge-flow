-- Fix the handle_new_user trigger to properly cast role type
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_role text;
  v_email text;
  v_full_name text;
BEGIN
  -- Get values from metadata
  v_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'student');
  v_email := NEW.email;
  v_full_name := COALESCE(NEW.raw_user_meta_data ->> 'full_name', v_email);

  -- Insert into users table with proper role casting
  BEGIN
    IF v_email IS NOT NULL THEN
      INSERT INTO public.users (id, email, role, full_name, password_hash, created_at)
      VALUES (NEW.id, v_email, v_role::app_role, v_full_name, '', COALESCE(NEW.created_at, now()))
      ON CONFLICT (id) DO UPDATE
        SET email = COALESCE(EXCLUDED.email, public.users.email),
            role = COALESCE(EXCLUDED.role, public.users.role),
            full_name = COALESCE(EXCLUDED.full_name, public.users.full_name);
    ELSE
      INSERT INTO public.users (id, role, full_name, password_hash, created_at)
      VALUES (NEW.id, v_role::app_role, v_full_name, '', COALESCE(NEW.created_at, now()))
      ON CONFLICT (id) DO NOTHING;
    END IF;
  EXCEPTION WHEN others THEN
    INSERT INTO public.user_sync_audit (auth_user_id, operation, status, message, payload)
    VALUES (NEW.id, 'insert_users', 'error', SQLERRM, row_to_json(NEW)::jsonb);
    RAISE;
  END;

  -- Insert into user_roles table
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_role::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  EXCEPTION WHEN others THEN
    INSERT INTO public.user_sync_audit (auth_user_id, operation, status, message, payload)
    VALUES (NEW.id, 'insert_user_roles', 'error', SQLERRM, jsonb_build_object('role', v_role));
  END;

  -- Insert into teachers/students table based on role
  BEGIN
    IF v_role = 'teacher' THEN
      INSERT INTO public.teachers (id, full_name, created_at)
      VALUES (NEW.id, v_full_name, now())
      ON CONFLICT (id) DO NOTHING;
    ELSIF v_role = 'student' THEN
      INSERT INTO public.students (id, full_name, created_at)
      VALUES (NEW.id, v_full_name, now())
      ON CONFLICT (id) DO NOTHING;
    END IF;
  EXCEPTION WHEN others THEN
    INSERT INTO public.user_sync_audit (auth_user_id, operation, status, message, payload)
    VALUES (NEW.id, 'insert_role_table', 'error', SQLERRM, jsonb_build_object('role', v_role, 'new', row_to_json(NEW)));
    RAISE;
  END;

  -- Log success
  INSERT INTO public.user_sync_audit (auth_user_id, operation, status, message, payload)
  VALUES (NEW.id, 'sync_complete', 'ok', NULL, jsonb_build_object('role', v_role, 'email', v_email));

  RETURN NEW;
END;
$function$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();