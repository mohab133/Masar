import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function mapSchedule(row: any) {
  return {
    id: row.id,
    course: row.course,
    courseCode: row.course_code,
    type: row.type,
    sectionNumber: row.section_number ?? null,
    lectureNumber: row.lecture_number ?? null,
    dayOfWeek: row.day_of_week,
    dayNameAr: row.day_name_ar,
    startTime: row.start_time,
    endTime: row.end_time,
    location: row.location,
    instructor: row.instructor,
    notes: row.notes ?? null,
  };
}

function mapCourseFile(row: any) {
  const fileType = ["pdf", "slides", "sheet", "doc"].includes(row.file_type)
    ? row.file_type
    : "pdf";

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    type: fileType,
    size: row.file_size,
    date: row.published_at ?? row.created_at ?? "",
    totalPages: row.total_pages ?? undefined,
    url: row.storage_path
      ? supabase.storage.from("course-materials").getPublicUrl(row.storage_path).data.publicUrl
      : null,
  };
}

function mapCourse(row: any, filesByCourse: Map<string, any[]>) {
  const files = filesByCourse.get(row.id) ?? [];
  return {
    id: row.id,
    code: row.code,
    nameEn: row.name_en,
    nameAr: row.name_ar,
    instructor: row.instructor,
    filesCount: files.length || row.files_count || 0,
    files,
    department: row.department ?? null,
    iconUrl: row.icon_url ?? null,
  };
}

function mapOfficialSchedule(row: any) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    typeLabelAr: row.type_label_ar,
    term: row.term,
    academicYear: row.academic_year,
    approvedDate: row.approved_date,
    description: row.description,
    fileSize: row.file_size,
    downloadFileName: row.download_file_name,
    fileUrl: row.storage_path
      ? supabase.storage.from("official-schedules").getPublicUrl(row.storage_path).data.publicUrl
      : null,
  };
}

async function getBootstrap() {
  const [announcements, dates, schedule, courses, files, official, appAssets] = await Promise.all([
    supabase.from("announcements").select("*").eq("status", "active").order("created_at", { ascending: false }),
    supabase.from("dates").select("*").order("event_date", { ascending: true }),
    supabase.from("schedule").select("id,course,course_code,type,section_number,lecture_number,day_of_week,day_name_ar,start_time,end_time,location,instructor,notes").order("day_of_week", { ascending: true }).order("start_time", { ascending: true }),
    supabase.from("courses").select("id,code,name_en,name_ar,instructor,files_count,department,icon_url").order("code", { ascending: true }),
    supabase.from("course_files").select("id,course_id,title,category,file_type,file_name,storage_path,file_size,file_size_bytes,total_pages,published_at,created_at").order("published_at", { ascending: false }),
    supabase.from("official_schedules").select("*").order("approved_date", { ascending: false }),
    supabase.from("app_assets").select("*"),
  ]);

  for (const result of [announcements, dates, schedule, courses, files, official, appAssets]) {
    if (result.error) throw result.error;
  }

  const filesByCourse = new Map<string, any[]>();
  for (const row of files.data ?? []) {
    const list = filesByCourse.get(row.course_id) ?? [];
    list.push(mapCourseFile(row));
    filesByCourse.set(row.course_id, list);
  }

  return {
    announcements: (announcements.data ?? []).map((row: any) => ({
      ...row,
      timeAgo: row.time_ago,
      categoryNameAr: row.category_name_ar,
      isImportant: row.is_important,
      courseRef: row.course_ref,
      linkUrl: row.link_url ?? null,
      attachmentUrl: row.attachment_path
        ? supabase.storage.from("announcements").getPublicUrl(row.attachment_path).data.publicUrl
        : null,
      attachmentName: row.attachment_name ?? null,
    })),
    dates: (dates.data ?? []).map((row: any) => ({
      id: row.id,
      type: row.type,
      typeLabelAr: row.type_label_ar,
      course: row.course,
      eventName: row.event_name,
      date: row.event_date,
      displayDateAr: row.display_date_ar,
      time: row.event_time ?? undefined,
      remainingTimeAr: row.remaining_time_ar,
      daysUntil: row.days_until,
      location: row.location ?? undefined,
    })),
    schedule: (schedule.data ?? []).map(mapSchedule),
    courses: (courses.data ?? []).map((row: any) => mapCourse(row, filesByCourse)),
    officialSchedules: (official.data ?? []).map(mapOfficialSchedule),
    appAssets: (appAssets.data ?? []).map((row: any) => ({
      id: row.id,
      assetKey: row.asset_key,
      title: row.title,
      fileName: row.file_name,
      fileType: row.file_type,
      fileUrl: row.storage_path
        ? supabase.storage.from(row.storage_bucket).getPublicUrl(row.storage_path).data.publicUrl
        : null,
    })),
  };
}

async function hashToken(token: string) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

let cachedAccessToken: string | null = null;
let cachedAccessTokenExpiresAt = 0;

function b64url(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function b64urlText(v: string) { return b64url(new TextEncoder().encode(v)); }
function pemDer(pem: string) {
  const clean = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function getFcmAccessToken(sa: any) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && cachedAccessTokenExpiresAt > now + 60) return cachedAccessToken;
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${b64urlText(JSON.stringify(header))}.${b64urlText(JSON.stringify(payload))}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemDer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned)));
  const assertion = `${unsigned}.${b64url(sig)}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }).toString(),
  });
  const body = await response.json();
  if (!response.ok || !body.access_token) {
    throw new Error(`FCM OAuth token error: ${body.error_description ?? body.error ?? "unknown error"}`);
  }
  cachedAccessToken = body.access_token;
  cachedAccessTokenExpiresAt = now + Number(body.expires_in ?? 3600);
  return cachedAccessToken;
}

async function sendPush(title: string, body: string, data: Record<string, string> = {}) {
  const raw = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");
  if (!raw) return { sent: 0, failed: 0, skipped: true, reason: "FCM_SERVICE_ACCOUNT_JSON is not configured" };
  let sa: any;
  try { sa = JSON.parse(raw); } catch { return { sent: 0, failed: 0, skipped: true, reason: "FCM_SERVICE_ACCOUNT_JSON is invalid JSON" }; }
  if (!sa.client_email || !sa.private_key || !sa.project_id) {
    return { sent: 0, failed: 0, skipped: true, reason: "FCM service account is missing required fields" };
  }

  const accessToken = await getFcmAccessToken(sa);
  const { data: tokens, error } = await supabase.from("device_tokens").select("token_hash,fcm_token").eq("active", true);
  if (error) throw new Error(`device_tokens query failed: ${error.message}`);

  let sent = 0;
  let failed = 0;
  for (const row of tokens ?? []) {
    if (!row.fcm_token) continue;
    const response = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message: { token: row.fcm_token, notification: { title, body }, data } }),
    });
    const text = await response.text();
    if (response.ok) { sent++; continue; }
    failed++;
    try {
      const details = JSON.stringify(JSON.parse(text));
      if (details.includes("UNREGISTERED") || details.includes("registration-token-not-registered")) {
        await supabase.from("device_tokens").update({ active: false, updated_at: new Date().toISOString() }).eq("token_hash", row.token_hash);
      }
    } catch { /* ignore malformed FCM errors */ }
    console.error("FCM send failed", response.status, text);
  }
  return { sent, failed, skipped: false };
}

function isAuthorized(req: Request) {
  const provided = req.headers.get("apikey") ?? "";
  const keysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (keysRaw) {
    try {
      const keys = JSON.parse(keysRaw);
      if (Object.values(keys).some((value: any) => typeof value === "string" && value === provided)) return true;
    } catch { /* fallback below */ }
  }
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  return Boolean(legacy && provided === legacy);
}
function normalizePath(pathname: string) {
  const marker = "/masar-api";
  const index = pathname.indexOf(marker);
  return index >= 0 ? pathname.slice(index + marker.length) || "/" : pathname;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = new URL(req.url);
  const path = normalizePath(url.pathname);

  try {
    if (req.method === "GET" && path === "/api/health") return json({ ok: true, service: "masar-api" });
    if (req.method === "GET" && path === "/api/bootstrap") return json(await getBootstrap());

    if (req.method === "POST" && path === "/api/feedback") {
      const payload = await req.json();
      const details = typeof payload.details === "string" ? payload.details.trim() : "";
      if (!details) return json({ error: "details is required" }, 400);
      if (details.length > 300) return json({ error: "details is too long" }, 400);

      const { data, error } = await supabase.from("feedback").insert({
        id: crypto.randomUUID(),
        type: "note",
        course_or_section: typeof payload.courseOrSection === "string" ? payload.courseOrSection : null,
        details,
      }).select().single();
      if (error) return json({ error: error.message }, 400);
      return json(data, 201);
    }

    if (req.method === "POST" && path === "/api/devices/register") {
      const payload = await req.json();
      if (!payload.token) return json({ error: "token is required" }, 400);
      const token = String(payload.token).trim();
      if (!token) return json({ error: "token is required" }, 400);
      const tokenHash = await hashToken(token);
      const { error } = await supabase.from("device_tokens").upsert({
        token_hash: tokenHash,
        fcm_token: token,
        platform: payload.platform ?? "android",
        active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "token_hash" });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (req.method === "POST" && path === "/api/devices/unregister") {
      const payload = await req.json();
      const token = String(payload.token ?? "").trim();
      if (!token) return json({ error: "token is required" }, 400);
      const tokenHash = await hashToken(token);
      const { error } = await supabase.from("device_tokens").delete().eq("token_hash", tokenHash);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (req.method === "POST" && (path === "/api/notifications/broadcast" || path === "/")) {
      if (!isAuthorized(req)) return json({ error: "Unauthorized" }, 401);
      const payload = await req.json();
      const title = String(payload.title ?? "مسار");
      const body = String(payload.body ?? "");
      const data = payload.data && typeof payload.data === "object" ? payload.data : {};
      return json(await sendPush(title, body, data));
    }

    return json({ error: "Not found" }, 404);
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
