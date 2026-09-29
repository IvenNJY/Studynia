import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/server"; // Your cookie-handling helper
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // 1. Identify the user using the COOKIE-based client
    const supabaseServer = await createServerClient();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      console.error("Auth Error:", authError);
      return NextResponse.json({ error: "Auth session missing" }, { status: 401 });
    }

    // 2. Initialize the ADMIN client to access the Vault
    // (Ensure these ENV vars are definitely loaded now!)
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 3. Fetch from the secure View using the User ID we just verified
    const { data: connection, error: connError } = await supabaseAdmin
      .from("decrypted_lms_connections")
      .select("domain, access_token")
      .eq("user_id", user.id)
      .single();

    if (connError || !connection) {
      return NextResponse.json({ error: "LMS connection not found" }, { status: 404 });
    }

    // 3a. Load existing courses so Canvas can be checked for additions and updates.
    const { data: existingCourses, error: coursesError } = await supabaseAdmin
      .from("courses")
      .select("id, lms_external_id, course_name, course_code, description, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (coursesError) {
      return NextResponse.json({ error: "Failed to load existing courses" }, { status: 500 });
    }

    // 4. Call Canvas API
    const baseUrl = connection.domain.replace(/\/$/, "");
    const canvasResponse = await fetch(`${baseUrl}/api/v1/courses?enrollment_state=active,inactive&per_page=100&include[]=term`, {
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
        Accept: "application/json",
      },
    });

    const canvasBody = await canvasResponse.text();

    if (!canvasResponse.ok) {
      return NextResponse.json(
        {
          error: "Canvas API rejected the token",
          status: canvasResponse.status,
          details: canvasBody.slice(0, 300),
        },
        { status: canvasResponse.status }
      );
    }

    if (!canvasResponse.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json(
        {
          error: "Canvas API returned a non-JSON response",
          status: canvasResponse.status,
          details: canvasBody.slice(0, 300),
        },
        { status: 502 }
      );
    }

    let data: unknown;

    try {
      data = JSON.parse(canvasBody);
    } catch (parseError: unknown) {
      const message = parseError instanceof Error ? parseError.message : "Invalid JSON";

      return NextResponse.json(
        {
          error: "Canvas API returned invalid JSON",
          status: canvasResponse.status,
          details: message,
        },
        { status: 502 }
      );
    }

    // Map Canvas data to your local DB schema
    const mappedCourses = (Array.isArray(data) ? data : [])
      .filter((course: Record<string, unknown>) => Boolean(course.id))
      .map((course: Record<string, unknown>) => {
        const term = course.term as { name?: unknown } | undefined;

        return {
          user_id: user.id,
          lms_external_id: String(course.id),
          course_name: typeof course.name === "string" ? course.name : typeof course.original_name === "string" ? course.original_name : "Unnamed Course",
          course_code: typeof course.course_code === "string" ? course.course_code : "",
          // Using description to store the actual term name exactly as expected by the UI
          description: typeof term?.name === "string" ? term.name : "Unknown Term",
        };
      });

    // Reconcile Canvas courses without relying on a database conflict constraint.
    const existingCourseByExternalId = new Map(
      (existingCourses ?? [])
        .filter((course) => course.lms_external_id)
        .map((course) => [course.lms_external_id, course])
    );

    const coursesToInsert = mappedCourses.filter(
      (course) => !existingCourseByExternalId.has(course.lms_external_id)
    );
    const coursesToUpdate = mappedCourses.filter((course) =>
      existingCourseByExternalId.has(course.lms_external_id)
    );

    const syncResults = await Promise.all([
      coursesToInsert.length > 0
        ? supabaseAdmin.from("courses").insert(coursesToInsert)
        : Promise.resolve({ error: null }),
      ...coursesToUpdate.map((course) => {
        const existingCourse = existingCourseByExternalId.get(course.lms_external_id);

        return supabaseAdmin
          .from("courses")
          .update({
            course_name: course.course_name,
            course_code: course.course_code,
            description: course.description,
          })
          .eq("id", existingCourse!.id)
          .eq("user_id", user.id);
      }),
    ]);

    const syncError = syncResults.find((result) => result.error)?.error;
    if (syncError) {
      console.error("Course sync error:", syncError);
      return NextResponse.json({ error: "Failed to sync courses" }, { status: 500 });
    }

    // Return the complete persisted list, including existing courses when there are no additions.
    const { data: syncedCourses, error: syncedCoursesError } = await supabaseAdmin
      .from("courses")
      .select("id, course_name, course_code, description, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (syncedCoursesError) {
      return NextResponse.json({ error: "Failed to load synced courses" }, { status: 500 });
    }

    return NextResponse.json(syncedCourses ?? []);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("SYNC ROUTE CRASH:", err);
    return NextResponse.json({ error: "Internal Server Error", details: message }, { status: 500 });
  }
}