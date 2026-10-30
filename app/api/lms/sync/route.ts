import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/server"; // Your cookie-handling helper
import { normalizeLmsToken } from "@/lib/lms-token";
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
    const accessToken = normalizeLmsToken(connection.access_token);
    if (!accessToken) {
      return NextResponse.json({ error: "LMS access token is empty or invalid" }, { status: 502 });
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
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    const canvasBody = await canvasResponse.text();

    if (!canvasResponse.ok) {
      if (canvasResponse.status === 401 || canvasResponse.status === 403) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }

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

    const { data: persistedCourses, error: persistedCoursesError } = await supabaseAdmin
      .from("courses")
      .select("id, lms_external_id")
      .eq("user_id", user.id)

    if (persistedCoursesError) {
      return NextResponse.json({ error: "Failed to load courses for assignment sync" }, { status: 500 })
    }

    const assignmentResults = await Promise.all(
      (persistedCourses ?? [])
        .filter((course) => course.lms_external_id)
        .map(async (course) => {
          const assignmentsResponse = await fetch(
            `${baseUrl}/api/v1/courses/${course.lms_external_id}/assignments?per_page=100`,
            { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } }
          )
          if (!assignmentsResponse.ok) return []

          const rawAssignments = await assignmentsResponse.json() as Array<Record<string, unknown>>
          return (Array.isArray(rawAssignments) ? rawAssignments : [])
            .filter((assignment) => assignment.id)
            .map((assignment) => ({
              user_id: user.id,
              course_id: course.id,
              lms_external_id: String(assignment.id),
              title: typeof assignment.name === "string" ? assignment.name : "Untitled assignment",
              description: typeof assignment.description === "string" ? assignment.description : null,
              file_url: typeof assignment.html_url === "string" ? assignment.html_url : null,
              due_date: typeof assignment.due_at === "string" ? assignment.due_at : null,
              points_possible: typeof assignment.points_possible === "number" ? assignment.points_possible : null,
              source: "lms",
              updated_at: new Date().toISOString(),
            }))
        })
    )

    const assignments = Array.from(
      new Map(
        assignmentResults
          .flat()
          .map((assignment) => [`${assignment.user_id}:${assignment.lms_external_id}`, assignment])
      ).values()
    )
    if (assignments.length > 0) {
      const { error: assignmentError } = await supabaseAdmin
        .from("assignments")
        .upsert(assignments, { onConflict: "user_id,lms_external_id" })
      if (assignmentError) {
        console.error("Assignment sync error:", {
          code: assignmentError.code,
          message: assignmentError.message,
          details: assignmentError.details,
          hint: assignmentError.hint,
        })
        return NextResponse.json(
          {
            error: "Courses synced, but assignments could not be saved",
            details: assignmentError.message,
            code: assignmentError.code,
          },
          { status: 500 }
        )
      }
    }

    await supabaseAdmin
      .from("lms_connections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("is_active", true)

    // Return the complete persisted list, including existing courses when there are no additions.
    const { data: syncedCourses, error: syncedCoursesError } = await supabaseAdmin
      .from("courses")
      .select("id, lms_external_id, course_name, course_code, description, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (syncedCoursesError) {
      return NextResponse.json({ error: "Failed to load synced courses" }, { status: 500 });
    }

    const { data: syncedAssignments } = await supabaseAdmin
      .from("assignments")
      .select("id, course_id, title, file_url, due_date, points_possible, is_completed, source")
      .eq("user_id", user.id)
      .order("due_date", { ascending: true, nullsFirst: false })

    return NextResponse.json({ courses: syncedCourses ?? [], assignments: syncedAssignments ?? [] });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("SYNC ROUTE CRASH:", err);
    return NextResponse.json({ error: "Internal Server Error", details: message }, { status: 500 });
  }
}
