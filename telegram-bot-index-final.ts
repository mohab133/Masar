import { createClient } from "npm:@supabase/supabase-js@2";
import * as XLSX from "npm:xlsx@0.18.5";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const ADMIN_CHAT_ID = Number(Deno.env.get("TELEGRAM_ADMIN_CHAT_ID"));
const WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SECRET_KEYS_RAW = Deno.env.get("SUPABASE_SECRET_KEYS");

if (!BOT_TOKEN || !ADMIN_CHAT_ID || !WEBHOOK_SECRET || !SUPABASE_URL || !SECRET_KEYS_RAW) {
  throw new Error("Missing required environment variables");
}

const secretKeys = JSON.parse(SECRET_KEYS_RAW);
const supabase = createClient(SUPABASE_URL, secretKeys.default);
const TG = `https://api.telegram.org/bot${BOT_TOKEN}`;
const BUCKET = "course-materials";
const ANNOUNCEMENTS_BUCKET = "announcements";

function newId() {
  return crypto.randomUUID();
}

function nullable(value: unknown) {
  const s = String(value ?? "").trim();
  return !s || s === "-" ? null : s;
}

type State = {
  action?: string;
  step?: string;
  data?: Record<string, unknown>;
};

const menuKeyboard = {
  inline_keyboard: [
    [{ text: "إضافة إعلان", callback_data: "add_announcement" }, { text: "الإعلانات", callback_data: "list_announcements" }],
    [{ text: "إضافة موعد", callback_data: "add_date" }, { text: "المواعيد", callback_data: "list_dates" }],
    [{ text: "إضافة مقرر", callback_data: "add_course" }, { text: "المقررات", callback_data: "list_courses" }],
    [{ text: "إضافة جدول", callback_data: "add_schedule" }, { text: "الجدول", callback_data: "list_schedule" }],
    [{ text: "رفع ملف", callback_data: "upload_file" }, { text: "ملفات المقررات", callback_data: "list_files" }],
    [{ text: "استيراد بيانات دراسية", callback_data: "import_study" }, { text: "أيقونات المواد", callback_data: "course_icons" }],
    [{ text: "الجداول الرسمية", callback_data: "list_official" }, { text: "الآراء", callback_data: "list_feedback" }],
    [{ text: "إدارة وتعديل", callback_data: "manage" }],
  ],
};

const cancelKeyboard = {
  inline_keyboard: [[{ text: "إلغاء", callback_data: "cancel" }]],
};

function esc(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function short(value: unknown, max = 70) {
  const s = String(value ?? "");
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

async function tg(method: string, body?: unknown) {
  const response = await fetch(`${TG}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  const result = await response.json();
  if (!result.ok) {
    throw new Error(`Telegram ${method}: ${JSON.stringify(result)}`);
  }
  return result.result;
}

async function send(chatId: number, text: string, replyMarkup?: unknown) {
  return tg("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

async function answerCallback(id: string) {
  try {
    await tg("answerCallbackQuery", { callback_query_id: id });
  } catch {}
}

async function getState(chatId: number): Promise<State> {
  const { data, error } = await supabase
    .from("telegram_admin_states")
    .select("state")
    .eq("chat_id", chatId)
    .maybeSingle();

  if (error) throw error;
  return (data?.state ?? {}) as State;
}

async function setState(chatId: number, state: State) {
  const { error } = await supabase.from("telegram_admin_states").upsert({
    chat_id: chatId,
    state,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

async function clearState(chatId: number) {
  await supabase.from("telegram_admin_states").delete().eq("chat_id", chatId);
}

async function ask(
  chatId: number,
  action: string,
  step: string,
  data: Record<string, unknown>,
  text: string,
  keyboard: unknown = cancelKeyboard,
) {
  await setState(chatId, { action, step, data });
  return send(chatId, text, keyboard);
}

async function home(chatId: number, text = "لوحة تحكم مسار") {
  await clearState(chatId);
  return send(chatId, text, menuKeyboard);
}

function parseDate(value: string) {
  const s = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;

  const d = new Date(`${s}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;

  const [y, m, day] = s.split("-").map(Number);
  if (
    d.getUTCFullYear() !== y ||
    d.getUTCMonth() + 1 !== m ||
    d.getUTCDate() !== day
  ) {
    return null;
  }

  return s;
}

function daysUntil(date: string) {
  const target = new Date(`${date}T00:00:00`);
  const now = new Date();

  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const b = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();

  return Math.round((b - a) / 86400000);
}

function formatDateAr(date: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

async function courseButtons(prefix: string, options: { includeGeneral?: boolean; includeNone?: boolean } = {}) {
  const { data, error } = await supabase
    .from("courses")
    .select("id,code,name_ar,name_en")
    .order("code");

  if (error) throw error;

  const rows = (data ?? []).map((course: any) => [
    {
      text: `${course.code} • ${course.name_ar || course.name_en}`,
      callback_data: `${prefix}:${course.id}`,
    },
  ]);

  if (options.includeGeneral) rows.push([{ text: "عام", callback_data: `${prefix}:general` }]);
  if (options.includeNone !== false) rows.push([{ text: "بدون مقرر", callback_data: `${prefix}:none` }]);
  rows.push([{ text: "إلغاء", callback_data: "cancel" }]);

  return { inline_keyboard: rows };
}

/* -------------------- Add announcement -------------------- */

async function beginAddAnnouncement(chatId: number) {
  return ask(chatId, "add_announcement", "content", {}, "أرسل محتوى الإعلان:");
}

/* -------------------- Add date -------------------- */

async function beginAddDate(chatId: number) {
  return ask(
    chatId,
    "add_date",
    "type",
    {},
    "اختر نوع الموعد:",
    {
      inline_keyboard: [
        [{ text: "تكليف", callback_data: "date_type:assignment" }, { text: "تسليم", callback_data: "date_type:submission" }],
        [{ text: "كويز", callback_data: "date_type:quiz" }, { text: "مشروع", callback_data: "date_type:project" }],
        [{ text: "لاب", callback_data: "date_type:lab" }, { text: "ميدتيرم", callback_data: "date_type:midterm" }],
        [{ text: "فاينل", callback_data: "date_type:final" }],
        [{ text: "إلغاء", callback_data: "cancel" }],
      ],
    },
  );
}

/* -------------------- Add course -------------------- */

async function beginAddCourse(chatId: number) {
  return ask(chatId, "add_course", "code", {}, "أرسل كود المقرر، مثل PHYS 102:");
}

/* -------------------- Add schedule -------------------- */

async function beginAddSchedule(chatId: number) {
  return ask(chatId, "add_schedule", "course", {}, "أرسل اسم المقرر:");
}

/* -------------------- Upload file -------------------- */

async function beginUploadFile(chatId: number) {
  await setState(chatId, { action: "upload_file", step: "course", data: {} });
  return send(chatId, "اختر المقرر:", await courseButtons("file_course"));
}

/* -------------------- Bulk study import -------------------- */

const IMPORT_DAYS: Record<string, { number: number; ar: string }> = {
  "الأحد": { number: 0, ar: "الأحد" },
  "الاحد": { number: 0, ar: "الأحد" },
  "الاثنين": { number: 1, ar: "الاثنين" },
  "الإثنين": { number: 1, ar: "الاثنين" },
  "الثلاثاء": { number: 2, ar: "الثلاثاء" },
  "الأربعاء": { number: 3, ar: "الأربعاء" },
  "الخميس": { number: 4, ar: "الخميس" },
};

function normalizeHeader(value: unknown) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function cell(row: Record<string, unknown>, ...names: string[]) {
  const entries = Object.entries(row);
  for (const name of names) {
    const wanted = normalizeHeader(name);
    const found = entries.find(([key]) => normalizeHeader(key) === wanted);
    if (found) return String(found[1] ?? "").trim();
  }
  return "";
}

function parseImportWorkbook(bytes: Uint8Array) {
  const workbook = XLSX.read(bytes, { type: "array", cellDates: false });
  const coursesSheet = workbook.Sheets["المقررات"] || workbook.Sheets[workbook.SheetNames[0]];
  const scheduleSheet = workbook.Sheets["الجدول"] || workbook.Sheets[workbook.SheetNames[1] || workbook.SheetNames[0]];
  if (!coursesSheet || !scheduleSheet) throw new Error("ملف Excel يجب أن يحتوي على ورقة المقررات وورقة الجدول.");

  const coursesRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(coursesSheet, { defval: "" });
  const scheduleRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(scheduleSheet, { defval: "" });
  const errors: string[] = [];
  const courses: any[] = [];
  const schedule: any[] = [];
  const courseCodes = new Set<string>();

  coursesRows.forEach((row, index) => {
    const line = index + 2;
    const code = cell(row, "الكود", "code");
    const nameEn = cell(row, "الاسم الإنجليزي", "name_en", "name en");
    const nameAr = cell(row, "الاسم العربي", "name_ar", "name ar");
    const departmentRaw = cell(row, "القسم", "department");
    const instructor = cell(row, "الدكتور", "instructor");
    if (!code && !nameEn && !nameAr) return;
    if (!code) errors.push(`ورقة المقررات، الصف ${line}: كود المادة مفقود.`);
    if (!nameEn) errors.push(`ورقة المقررات، الصف ${line}: الاسم الإنجليزي مفقود.`);
    if (!nameAr) errors.push(`ورقة المقررات، الصف ${line}: الاسم العربي مفقود.`);
    if (courseCodes.has(code)) errors.push(`ورقة المقررات، الصف ${line}: كود المادة مكرر (${code}).`);
    courseCodes.add(code);
    const department = departmentRaw === "حاسبات" || departmentRaw === "قسم حاسبات" || departmentRaw === "computers"
      ? "computers"
      : departmentRaw === "تحكم واتصالات" || departmentRaw === "قسم تحكم واتصالات" || departmentRaw === "control_communications"
        ? "control_communications"
        : "general";
    courses.push({ code, name_en: nameEn, name_ar: nameAr, instructor, department });
  });

  const allowedTypes = new Map([["محاضرة", "lecture"], ["lecture", "lecture"], ["سكشن", "section"], ["section", "section"]]);
  scheduleRows.forEach((row, index) => {
    const line = index + 2;
    const courseCode = cell(row, "كود المقرر", "course_code", "code");
    const course = cell(row, "اسم المادة", "المادة", "course");
    const typeRaw = cell(row, "النوع", "type");
    const dayRaw = cell(row, "اليوم", "day");
    const startTime = cell(row, "من", "وقت البداية", "start_time");
    const endTime = cell(row, "إلى", "وقت النهاية", "end_time");
    const location = cell(row, "المكان", "location");
    const instructor = cell(row, "الدكتور", "instructor");
    const sectionNumber = cell(row, "رقم السكشن", "section_number");
    const lectureNumber = cell(row, "رقم المحاضرة", "lecture_number");
    if (!courseCode && !course && !startTime && !endTime) return;
    if (!courseCode) errors.push(`ورقة الجدول، الصف ${line}: كود المقرر مفقود.`);
    if (!courseCodes.has(courseCode)) errors.push(`ورقة الجدول، الصف ${line}: كود المقرر غير موجود في ورقة المقررات (${courseCode}).`);
    const type = allowedTypes.get(typeRaw);
    if (!type) errors.push(`ورقة الجدول، الصف ${line}: النوع يجب أن يكون محاضرة أو سكشن.`);
    const day = IMPORT_DAYS[dayRaw];
    if (!day) errors.push(`ورقة الجدول، الصف ${line}: اليوم غير صحيح.`);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime)) {
      errors.push(`ورقة الجدول، الصف ${line}: الوقت يجب أن يكون بصيغة HH:MM.`);
    } else if (startTime >= endTime) {
      errors.push(`ورقة الجدول، الصف ${line}: وقت النهاية يجب أن يكون بعد البداية.`);
    }
    if (!location) errors.push(`ورقة الجدول، الصف ${line}: المكان مفقود.`);
    if (type === "section" && sectionNumber && !/^\d+$/.test(sectionNumber)) errors.push(`ورقة الجدول، الصف ${line}: رقم السكشن غير صحيح.`);
    if (lectureNumber && !/^\d+$/.test(lectureNumber)) errors.push(`ورقة الجدول، الصف ${line}: رقم المحاضرة غير صحيح.`);
    schedule.push({
      course_code: courseCode, course, type: type || "lecture",
      section_number: sectionNumber, lecture_number: lectureNumber,
      day_of_week: day?.number ?? -1, day_name_ar: day?.ar || dayRaw,
      start_time: startTime, end_time: endTime, location, instructor,
    });
  });

  return { courses, schedule, errors };
}

async function beginImportStudy(chatId: number) {
  await setState(chatId, { action: "import_study", step: "await_file", data: {} });
  return send(chatId, `أرسل ملف Excel أو CSV الآن.\n\nيفضل استخدام قالب Masar المخصص للاستيراد.`, cancelKeyboard);
}

async function commitImport(chatId: number, payload: { courses: any[]; schedule: any[] }) {
  const { data, error } = await supabase.rpc("import_masar_study_data", {
    p_courses: payload.courses,
    p_schedule: payload.schedule,
  });
  if (error) return send(chatId, `تعذر تنفيذ الاستيراد: ${esc(error.message)}`, menuKeyboard);
  return home(chatId, `تم الاستيراد بنجاح.\nالمواد المضافة: ${data?.inserted_courses ?? 0}\nالمواد المحدثة: ${data?.updated_courses ?? 0}\nالحصص المضافة: ${data?.inserted_schedule ?? 0}`);
}

async function handleStudyImportDocument(chatId: number, document: any) {
  const state = await getState(chatId);
  if (state.action !== "import_study" || state.step !== "await_file") return false;
  if (document.file_size && document.file_size > 20 * 1024 * 1024) {
    await send(chatId, "الحد الأقصى 20 MB لهذا النوع من الرفع عبر Telegram.", menuKeyboard);
    return true;
  }
  try {
    const file = await downloadTelegramFile(document.file_id);
    const parsed = parseImportWorkbook(file.bytes);
    if (parsed.errors.length) {
      const details = parsed.errors.slice(0, 25).map((e) => `• ${esc(e)}`).join("\n");
      await send(chatId, `لم يتم الحفظ لأن الملف يحتوي على أخطاء (${parsed.errors.length}).\n\n${details}${parsed.errors.length > 25 ? "\n..." : ""}`, cancelKeyboard);
      return true;
    }
    await setState(chatId, { action: "import_study_confirm", step: "confirm", data: parsed });
    await send(chatId, `مراجعة الاستيراد\n\nالمواد: ${parsed.courses.length}\nالحصص: ${parsed.schedule.length}\nالمحاضرات: ${parsed.schedule.filter((x) => x.type === "lecture").length}\nالسكاشن: ${parsed.schedule.filter((x) => x.type === "section").length}\n\nهل تريد تنفيذ الاستيراد؟`, { inline_keyboard: [[{ text: "تأكيد الاستيراد", callback_data: "confirm_study_import" }], [{ text: "إلغاء", callback_data: "cancel" }]] });
  } catch (error) {
    await send(chatId, `تعذر قراءة الملف: ${esc(error instanceof Error ? error.message : error)}`, menuKeyboard);
  }
  return true;
}

async function handleAnnouncementDocument(chatId: number, document: any) {
  const state = await getState(chatId);
  if (state.action !== "add_announcement" || state.step !== "await_file") return false;
  if (document.file_size && document.file_size > 20 * 1024 * 1024) {
    await send(chatId, "الحد الأقصى 20 MB لملف الإعلان عبر Telegram.", cancelKeyboard);
    return true;
  }
  try {
    const file = await downloadTelegramFile(document.file_id);
    const originalName = document.file_name || "announcement-file";
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from(ANNOUNCEMENTS_BUCKET).upload(storagePath, file.bytes, {
      contentType: document.mime_type || "application/octet-stream",
      upsert: false,
    });
    if (uploadError) throw uploadError;
    const { data: publicData } = supabase.storage.from(ANNOUNCEMENTS_BUCKET).getPublicUrl(storagePath);
    const data = state.data ?? {};
    const row = {
      id: newId(), title: "تنبيه", content: String(data.content ?? "").trim(),
      date: new Date().toISOString(), time_ago: "الآن", category: "general", category_name_ar: "عام",
      is_important: false, status: "active", course_ref: data.courseRef || null,
      link_url: data.linkUrl || null, attachment_path: storagePath, attachment_name: originalName,
    };
    if (!row.content) throw new Error("محتوى الإعلان لا يمكن أن يكون فارغًا.");
    const { error } = await supabase.from("announcements").insert(row);
    if (error) {
      await supabase.storage.from(ANNOUNCEMENTS_BUCKET).remove([storagePath]);
      throw error;
    }
    await home(chatId, "تمت إضافة الإعلان مع المرفق بنجاح.");
  } catch (error) {
    await send(chatId, `تعذر حفظ مرفق الإعلان: ${esc(error instanceof Error ? error.message : error)}`, menuKeyboard);
  }
  return true;
}

/* -------------------- Course icons -------------------- */

async function beginCourseIcons(chatId: number) {
  await setState(chatId, { action: "course_icon", step: "course", data: {} });
  return send(chatId, "اختر المادة التي تريد تغيير أيقونتها:", await courseButtons("icon_course"));
}

async function handleCourseIconPhoto(chatId: number, photo: any[]) {
  const state = await getState(chatId);
  if (state.action !== "course_icon" || state.step !== "await_image") return false;
  const selected = photo[photo.length - 1];
  try {
    const file = await downloadTelegramFile(selected.file_id);
    const courseId = String(state.data?.courseId || "");
    if (!courseId) throw new Error("لم يتم تحديد المادة.");
    const storagePath = `${courseId}/${crypto.randomUUID()}.jpg`;
    const { error: uploadError } = await supabase.storage.from("course-icons").upload(storagePath, file.bytes, { contentType: "image/jpeg", upsert: false });
    if (uploadError) throw uploadError;
    const { data: publicData } = supabase.storage.from("course-icons").getPublicUrl(storagePath);
    const { error: dbError } = await supabase.from("courses").update({ icon_url: publicData.publicUrl }).eq("id", courseId);
    if (dbError) { await supabase.storage.from("course-icons").remove([storagePath]); throw dbError; }
    return !!(await home(chatId, "تم تحديث أيقونة المادة."));
  } catch (error) {
    await send(chatId, `تعذر حفظ الأيقونة: ${esc(error instanceof Error ? error.message : error)}`, menuKeyboard);
    return true;
  }
}

/* -------------------- Lists -------------------- */

async function listAnnouncements(chatId: number) {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return send(chatId, "تعذر قراءة الإعلانات.", menuKeyboard);
  if (!data?.length) return send(chatId, "لا توجد إعلانات.", menuKeyboard);

  const rows = data.map((item: any) => [
    {
      text: `إعلان • ${short(item.content || "تنبيه", 50)}`,
      callback_data: `manage_ann:${item.id}`,
    },
  ]);

  rows.push([{ text: "رجوع", callback_data: "menu" }]);
  return send(chatId, "الإعلانات:", { inline_keyboard: rows });
}

async function listDates(chatId: number) {
  const { data, error } = await supabase
    .from("dates")
    .select("*")
    .order("event_date", { ascending: true })
    .limit(50);

  if (error) return send(chatId, "تعذر قراءة المواعيد.", menuKeyboard);
  if (!data?.length) return send(chatId, "لا توجد مواعيد.", menuKeyboard);

  const rows = data.map((item: any) => [
    {
      text: `موعد • ${short(item.course, 22)} • ${short(item.event_name, 32)}`,
      callback_data: `manage_date:${item.id}`,
    },
  ]);

  rows.push([{ text: "رجوع", callback_data: "menu" }]);
  return send(chatId, "المواعيد:", { inline_keyboard: rows });
}

async function listCourses(chatId: number) {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("code")
    .limit(50);

  if (error) return send(chatId, "تعذر قراءة المقررات.", menuKeyboard);
  if (!data?.length) return send(chatId, "لا توجد مقررات.", menuKeyboard);

  const rows = data.map((item: any) => [
    {
      text: `${item.code} • ${short(item.name_ar || item.name_en, 40)}`,
      callback_data: `manage_course:${item.id}`,
    },
  ]);

  rows.push([{ text: "رجوع", callback_data: "menu" }]);
  return send(chatId, "المقررات:", { inline_keyboard: rows });
}

async function listSchedule(chatId: number) {
  const { data, error } = await supabase
    .from("schedule")
    .select("*")
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(80);

  if (error) return send(chatId, "تعذر قراءة الجدول.", menuKeyboard);
  if (!data?.length) return send(chatId, "لا توجد حصص.", menuKeyboard);

  const rows = data.map((item: any) => [
    {
      text: `${short(item.course, 22)} • ${item.day_name_ar} • ${item.start_time}`,
      callback_data: `manage_schedule:${item.id}`,
    },
  ]);

  rows.push([{ text: "رجوع", callback_data: "menu" }]);
  return send(chatId, "الجدول:", { inline_keyboard: rows });
}

async function listFiles(chatId: number) {
  const { data, error } = await supabase
    .from("course_files")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(80);

  if (error) return send(chatId, "تعذر قراءة الملفات.", menuKeyboard);
  if (!data?.length) return send(chatId, "لا توجد ملفات.", menuKeyboard);

  const rows = data.map((item: any) => [
    {
      text: `ملف • ${short(item.title, 50)}`,
      callback_data: `manage_file:${item.id}`,
    },
  ]);

  rows.push([{ text: "رجوع", callback_data: "menu" }]);
  return send(chatId, "ملفات المقررات:", { inline_keyboard: rows });
}

async function listOfficial(chatId: number) {
  const { data, error } = await supabase
    .from("official_schedules")
    .select("*")
    .order("approved_date", { ascending: false })
    .limit(30);

  if (error) return send(chatId, "تعذر قراءة الجداول الرسمية.", menuKeyboard);
  if (!data?.length) return send(chatId, "لا توجد جداول رسمية.", menuKeyboard);

  const text = data
    .map(
      (item: any) =>
        `<b>${esc(item.title)}</b>\n` +
        `${esc(item.type_label_ar || item.type || "")}\n` +
        `${esc(item.term || "")} ${esc(item.academic_year || "")}\n` +
        `${esc(item.description || "")}`,
    )
    .join("\n\n");

  return send(chatId, text, {
    inline_keyboard: [[{ text: "رجوع", callback_data: "menu" }]],
  });
}

async function listFeedback(chatId: number) {
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .order("submitted_at", { ascending: false })
    .limit(30);

  if (error) return send(chatId, "تعذر قراءة الآراء.", menuKeyboard);
  if (!data?.length) return send(chatId, "لا توجد آراء حاليًا.", menuKeyboard);

  const text = data
    .map((item: any, index: number) => {
      const fields = Object.entries(item)
        .filter(([key]) => !["id", "submitted_at"].includes(key))
        .map(([key, value]) => `${esc(key)}: ${esc(value)}`)
        .join("\n");

      return `<b>#${index + 1}</b>\n${fields}`;
    })
    .join("\n\n");

  return send(chatId, text, {
    inline_keyboard: [[{ text: "رجوع", callback_data: "menu" }]],
  });
}

/* -------------------- Manage details -------------------- */

async function manageMenu(chatId: number) {
  return send(chatId, "اختر البيانات التي تريد إدارتها:", {
    inline_keyboard: [
      [{ text: "الإعلانات", callback_data: "list_announcements" }, { text: "المواعيد", callback_data: "list_dates" }],
      [{ text: "المقررات", callback_data: "list_courses" }, { text: "الجدول", callback_data: "list_schedule" }],
      [{ text: "الملفات", callback_data: "list_files" }],
      [{ text: "رجوع", callback_data: "menu" }],
    ],
  });
}

async function manageAnnouncement(chatId: number, id: string) {
  const { data } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) return home(chatId, "الإعلان غير موجود.");

  return send(
    chatId,
    `<b>تنبيه</b>\n${esc(data.content)}\n` +
      `${data.course_ref ? `المقرر: ${esc(data.course_ref)}` : "عام"}`,
    {
      inline_keyboard: [
        [{ text: "تعديل", callback_data: `edit_ann:${id}` }, { text: "حذف", callback_data: `del_ann:${id}` }],
        [{ text: "رجوع", callback_data: "list_announcements" }],
      ],
    },
  );
}

async function manageDate(chatId: number, id: string) {
  const { data } = await supabase
    .from("dates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) return home(chatId, "الموعد غير موجود.");

  return send(
    chatId,
    `<b>${esc(data.event_name)}</b>\n` +
      `المقرر: ${esc(data.course || "بدون مقرر")}\n` +
      `التاريخ: ${esc(data.display_date_ar || data.event_date || "غير محدد")}\n` +
      `الوقت: ${esc(data.event_time || "غير محدد")}\n` +
      `المكان: ${esc(data.location || "غير محدد")}`,
    {
      inline_keyboard: [
        [{ text: "تعديل", callback_data: `edit_date:${id}` }, { text: "حذف", callback_data: `del_date:${id}` }],
        [{ text: "رجوع", callback_data: "list_dates" }],
      ],
    },
  );
}

async function manageCourse(chatId: number, id: string) {
  const { data } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) return home(chatId, "المقرر غير موجود.");

  return send(
    chatId,
    `<b>${esc(data.code)}</b>\n` +
      `${esc(data.name_ar || data.name_en)}\n` +
      `الاسم الإنجليزي: ${esc(data.name_en)}\n` +
      `الدكتور: ${esc(data.instructor || "غير محدد")}\n` +
      `عدد الملفات: ${esc(data.files_count ?? 0)}`,
    {
      inline_keyboard: [
        [{ text: "تعديل", callback_data: `edit_course:${id}` }, { text: "حذف", callback_data: `del_course:${id}` }],
        [{ text: "رجوع", callback_data: "list_courses" }],
      ],
    },
  );
}

async function manageSchedule(chatId: number, id: string) {
  const { data } = await supabase
    .from("schedule")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) return home(chatId, "الحصة غير موجودة.");

  return send(
    chatId,
    `<b>${esc(data.course)}</b>\n` +
      `النوع: ${esc(data.type)}\n` +
      `${esc(data.day_name_ar)}\n` +
      `${esc(data.start_time)} - ${esc(data.end_time)}\n` +
      `المكان: ${esc(data.location || "غير محدد")}\n` +
      `الدكتور: ${esc(data.instructor || "غير محدد")}`,
    {
      inline_keyboard: [
        [{ text: "تعديل", callback_data: `edit_schedule:${id}` }, { text: "حذف", callback_data: `del_schedule:${id}` }],
        [{ text: "رجوع", callback_data: "list_schedule" }],
      ],
    },
  );
}

async function manageFile(chatId: number, id: string) {
  const { data } = await supabase
    .from("course_files")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) return home(chatId, "الملف غير موجود.");

  return send(
    chatId,
    `<b>${esc(data.title)}</b>\n` +
      `التصنيف: ${esc(data.category)}\n` +
      `النوع: ${esc(data.file_type)}\n` +
      `الحجم: ${esc(data.file_size || "غير محدد")}`,
    {
      inline_keyboard: [
        [{ text: "حذف", callback_data: `del_file:${id}` }],
        [{ text: "رجوع", callback_data: "list_files" }],
      ],
    },
  );
}

/* -------------------- Delete -------------------- */

async function deleteRow(
  chatId: number,
  table: string,
  id: string,
  label: string,
) {
  const { error } = await supabase.from(table).delete().eq("id", id);

  if (error) {
    return send(chatId, `تعذر حذف ${label}: ${esc(error.message)}`, menuKeyboard);
  }

  return home(chatId, `تم حذف ${label} بنجاح.`);
}

async function deleteCourse(chatId: number, id: string) {
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id,code,name_ar,name_en")
    .eq("id", id)
    .maybeSingle();

  if (courseError || !course) return home(chatId, "المقرر غير موجود.");

  const [{ count: fileCount }, { count: scheduleCount }] = await Promise.all([
    supabase.from("course_files").select("id", { count: "exact", head: true }).eq("course_id", id),
    supabase.from("schedule").select("id", { count: "exact", head: true }).eq("course_code", course.code),
  ]);

  if ((fileCount ?? 0) > 0 || (scheduleCount ?? 0) > 0) {
    return send(
      chatId,
      `لا يمكن حذف المقرر الآن لأن له ${fileCount ?? 0} ملف و${scheduleCount ?? 0} حصة مرتبطة به. احذف البيانات المرتبطة أولًا.`,
      menuKeyboard,
    );
  }

  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) {
    return send(chatId, `تعذر حذف المقرر: ${esc(error.message)}`, menuKeyboard);
  }

  return home(chatId, "تم حذف المقرر بنجاح.");
}

async function deleteFile(chatId: number, id: string) {
  const { data, error } = await supabase
    .from("course_files")
    .select("storage_path,course_id")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return home(chatId, "الملف غير موجود.");

  if (data.storage_path) {
    await supabase.storage.from(BUCKET).remove([data.storage_path]);
  }

  const { error: deleteError } = await supabase
    .from("course_files")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return send(chatId, `تعذر حذف الملف: ${esc(deleteError.message)}`, menuKeyboard);
  }

  if (data.course_id) {
    const { count } = await supabase
      .from("course_files")
      .select("id", { count: "exact", head: true })
      .eq("course_id", data.course_id);

    await supabase
      .from("courses")
      .update({
        files_count: count ?? 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.course_id);
  }

  return home(chatId, "تم حذف الملف.");
}

/* -------------------- Edit -------------------- */

const editFields: Record<string, Array<[string, string]>> = {
  announcement: [
    ["content", "المحتوى"],
  ],
  date: [
    ["course", "المقرر"],
    ["event_name", "اسم الحدث"],
    ["event_date", "التاريخ"],
    ["event_time", "الوقت"],
    ["location", "المكان"],
  ],
  course: [
    ["code", "الكود"],
    ["name_en", "الاسم الإنجليزي"],
    ["name_ar", "الاسم العربي"],
    ["instructor", "الدكتور"],
  ],
  schedule: [
    ["course", "المقرر"],
    ["course_code", "كود المقرر"],
    ["day_name_ar", "اليوم"],
    ["start_time", "وقت البداية"],
    ["end_time", "وقت النهاية"],
    ["location", "المكان"],
    ["instructor", "الدكتور"],
  ],
};

async function beginEdit(chatId: number, kind: string, id: string) {
  const table =
    kind === "announcement"
      ? "announcements"
      : kind === "date"
        ? "dates"
        : kind === "course"
          ? "courses"
          : "schedule";

  const { data } = await supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) return home(chatId, "العنصر غير موجود.");

  await setState(chatId, {
    action: `edit_${kind}`,
    step: "field",
    data: { id, table },
  });

  const rows = editFields[kind].map(([field, label]) => [
    { text: label, callback_data: `editfield:${kind}:${field}` },
  ]);

  rows.push([{ text: "إلغاء", callback_data: "cancel" }]);

  return send(chatId, "اختر الحقل الذي تريد تعديله:", {
    inline_keyboard: rows,
  });
}

async function handleEditText(chatId: number, state: State, value: string) {
  const stateData = state.data ?? {};
  const field = String(stateData.field ?? "");
  const table = String(stateData.table ?? "");
  const id = String(stateData.id ?? "");

  if (!field || !table || !id) return home(chatId, "تعذر إكمال التعديل.");

  const allowedFields: Record<string, string[]> = {
    announcements: ["content"],
    dates: ["course", "event_name", "event_date", "event_time", "location"],
    courses: ["code", "name_en", "name_ar", "instructor"],
    schedule: ["course", "course_code", "day_name_ar", "start_time", "end_time", "location", "instructor"],
  };

  if (!allowedFields[table]?.includes(field)) {
    return home(chatId, "هذا الحقل غير متاح للتعديل.");
  }

  if (!value && !["name_ar", "instructor", "event_time", "location"].includes(field)) {
    return send(chatId, "القيمة لا يمكن أن تكون فارغة.", cancelKeyboard);
  }

  if (table === "dates" && field === "event_date") {
    const date = parseDate(value);
    if (!date) {
      return send(chatId, "التاريخ غير صحيح. استخدم YYYY-MM-DD.", cancelKeyboard);
    }

    const remaining = daysUntil(date);
    const patch = {
      event_date: date,
      display_date_ar: formatDateAr(date),
      days_until: remaining,
      remaining_time_ar: remaining >= 0 ? `متبقي ${remaining} يوم` : "منتهي",
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from(table).update(patch).eq("id", id);
    if (error) return send(chatId, `تعذر التعديل: ${esc(error.message)}`, menuKeyboard);
    return home(chatId, "تم تعديل التاريخ.");
  }

  if (table === "schedule" && ["start_time", "end_time"].includes(field)) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
      return send(chatId, "الوقت غير صحيح. استخدم HH:MM مثل 09:30.", cancelKeyboard);
    }
  }

  if (table === "courses" && field === "code" && !/^[A-Za-z0-9][A-Za-z0-9 ._-]{1,30}$/.test(value)) {
    return send(chatId, "كود المقرر غير صحيح.", cancelKeyboard);
  }

  if (table === "schedule" && field === "course_code" && !/^[A-Za-z0-9][A-Za-z0-9 ._-]{1,30}$/.test(value)) {
    return send(chatId, "كود المقرر غير صحيح.", cancelKeyboard);
  }

  if (table === "schedule" && field === "day_name_ar") {
    const allowedDays = new Set(["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"]);
    if (!allowedDays.has(value)) {
      return send(chatId, "اليوم غير صحيح. استخدم أحد الأيام من الأحد إلى الخميس.", cancelKeyboard);
    }
  }

  const patch: Record<string, unknown> = {
    [field]: value === "-" ? null : value,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from(table).update(patch).eq("id", id);
  if (error) return send(chatId, `تعذر التعديل: ${esc(error.message)}`, menuKeyboard);

  return home(chatId, "تم التعديل بنجاح.");
}

/* -------------------- Telegram file upload -------------------- */

async function downloadTelegramFile(fileId: string) {
  const info = await tg("getFile", { file_id: fileId });

  if (!info.file_path) {
    throw new Error("Telegram did not return file_path");
  }

  const response = await fetch(
    `https://api.telegram.org/file/bot${BOT_TOKEN}/${info.file_path}`,
  );

  if (!response.ok) {
    throw new Error("Failed to download Telegram file");
  }

  return {
    bytes: new Uint8Array(await response.arrayBuffer()),
    path: info.file_path,
  };
}

async function handleDocument(chatId: number, document: any) {
  const state = await getState(chatId);

  if (state.action !== "upload_file" || state.step !== "await_file") {
    return send(
      chatId,
      "ابدأ من زر رفع ملف أولًا، ثم أرسل الملف.",
      menuKeyboard,
    );
  }

  const data = state.data ?? {};

  if (document.file_size && document.file_size > 20 * 1024 * 1024) {
    return send(
      chatId,
      "الحد هنا 20 MB لأن Telegram Bot API getFile لا يتيح تنزيل ملفات أكبر من ذلك.",
      menuKeyboard,
    );
  }

  const file = await downloadTelegramFile(document.file_id);
  const originalName = document.file_name || "file";
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const courseId = data.courseId ? String(data.courseId) : "general";
  const storagePath = `${courseId}/${crypto.randomUUID()}-${safeName}`;

  const contentType = document.mime_type || "application/octet-stream";

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file.bytes, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    return send(
      chatId,
      `تعذر رفع الملف إلى Storage: ${esc(uploadError.message)}`,
      menuKeyboard,
    );
  }

  const extension = safeName.split(".").pop()?.toLowerCase();
  const fileType =
    extension === "pdf"
      ? "pdf"
      : ["ppt", "pptx"].includes(extension || "")
        ? "slides"
        : ["xls", "xlsx", "csv"].includes(extension || "")
          ? "sheet"
          : "doc";

  const sizeBytes = document.file_size || file.bytes.length;
  const sizeMb = (sizeBytes / 1024 / 1024).toFixed(2);

  const row = {
    id: newId(),
    course_id: data.courseId || null,
    title: data.title || originalName,
    category: data.category || "other",
    file_type: fileType,
    file_name: originalName,
    storage_path: storagePath,
    file_size: `${sizeMb} MB`,
    file_size_bytes: sizeBytes,
    published_at: new Date().toISOString(),
  };

  const { error: dbError } = await supabase
    .from("course_files")
    .insert(row);

  if (dbError) {
    await supabase.storage.from(BUCKET).remove([storagePath]);

    return send(
      chatId,
      `تم رفع الملف مؤقتًا لكن تعذر حفظ بياناته: ${esc(dbError.message)}`,
      menuKeyboard,
    );
  }

  if (data.courseId) {
    const { count } = await supabase
      .from("course_files")
      .select("id", { count: "exact", head: true })
      .eq("course_id", data.courseId);

    await supabase
      .from("courses")
      .update({
        files_count: count ?? 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.courseId);
  }

  return home(chatId, "تم رفع الملف وحفظه بنجاح.");
}

/* -------------------- Text state machine -------------------- */

async function handleText(chatId: number, text: string) {
  if (text === "/start" || text === "/help") {
    return home(chatId);
  }

  if (text === "/cancel") {
    return home(chatId, "تم الإلغاء.");
  }

  const state = await getState(chatId);
  const value = text.trim();

  if (!state.action) {
    return home(chatId, "اختر عملية من القائمة.");
  }

  const data = state.data ?? {};

  if (state.action === "add_announcement") {
    if (state.step === "content") {
      await setState(chatId, {
        action: "add_announcement",
        step: "attachment",
        data: { content: value },
      });

      return send(chatId, "هل تريد إرفاق رابط أو ملف بالإعلان؟", {
        inline_keyboard: [
          [{ text: "إضافة رابط", callback_data: "ann_attach:link" }, { text: "رفع ملف", callback_data: "ann_attach:file" }],
          [{ text: "بدون مرفق", callback_data: "ann_attach:none" }],
          [{ text: "إلغاء", callback_data: "cancel" }],
        ],
      });
    }

    if (state.step === "link") {
      try {
        const url = new URL(value);
        if (!/^https?:$/.test(url.protocol)) throw new Error("invalid protocol");
      } catch {
        return send(chatId, "الرابط غير صحيح. أرسل رابطًا يبدأ بـ https:// أو http://", cancelKeyboard);
      }
      await setState(chatId, { action: "add_announcement", step: "course", data: { ...data, linkUrl: value, attachmentMode: "link" } });
      return send(chatId, "اختر المقرر المرتبط بالإعلان:", await courseButtons("ann_course", { includeGeneral: true, includeNone: false }));
    }
  }

  if (state.action === "add_date") {
    if (state.step === "course") {
      return ask(
        chatId,
        "add_date",
        "event_name",
        { ...data, course: value },
        "أرسل اسم المهمة أو الحدث:",
      );
    }

    if (state.step === "event_name") {
      return ask(
        chatId,
        "add_date",
        "date",
        { ...data, eventName: value },
        "أرسل التاريخ بصيغة YYYY-MM-DD:",
      );
    }

    if (state.step === "date") {
      const date = parseDate(value);
      if (!date) {
        return send(
          chatId,
          "التاريخ غير صحيح. استخدم YYYY-MM-DD.",
          cancelKeyboard,
        );
      }

      return ask(
        chatId,
        "add_date",
        "time",
        { ...data, eventDate: date },
        "أرسل الوقت، أو اكتب - إذا لا يوجد وقت:",
      );
    }

    if (state.step === "time") {
      return ask(
        chatId,
        "add_date",
        "location",
        { ...data, eventTime: value === "-" ? null : value },
        "أرسل المكان، أو اكتب - إذا لا يوجد:",
      );
    }

    if (state.step === "location") {
      const location = value === "-" ? null : value;
      const date = String(data.eventDate);
      const remaining = daysUntil(date);

      const row = {
        id: newId(),
        type: data.type,
        type_label_ar: data.typeLabelAr,
        course: data.course,
        event_name: data.eventName,
        event_date: date,
        display_date_ar: formatDateAr(date),
        event_time: data.eventTime,
        remaining_time_ar:
          remaining >= 0 ? `متبقي ${remaining} يوم` : "منتهي",
        days_until: remaining,
        location,
      };

      const { error } = await supabase.from("dates").insert(row);

      if (error) {
        return send(
          chatId,
          `تعذر حفظ الموعد: ${esc(error.message)}`,
          menuKeyboard,
        );
      }

      return home(chatId, "تمت إضافة الموعد بنجاح.");
    }
  }

  if (state.action === "add_course") {
    if (state.step === "code") {
      return ask(
        chatId,
        "add_course",
        "name_en",
        { code: value },
        "أرسل اسم المقرر بالإنجليزية:",
      );
    }

    if (state.step === "name_en") {
      return ask(
        chatId,
        "add_course",
        "name_ar",
        { ...data, nameEn: value },
        "أرسل اسم المقرر بالعربية، أو اكتب -:",
      );
    }

    if (state.step === "name_ar") {
      return ask(
        chatId,
        "add_course",
        "instructor",
        { ...data, nameAr: value === "-" ? null : value },
        "أرسل اسم الدكتور، أو اكتب -:",
      );
    }

    if (state.step === "instructor") {
      const row = {
        id: newId(),
        code: data.code,
        name_en: data.nameEn,
        name_ar: data.nameAr,
        instructor: value === "-" ? "" : value,
        files_count: 0,
      };

      const { error } = await supabase.from("courses").insert(row);

      if (error) {
        return send(
          chatId,
          `تعذر حفظ المقرر: ${esc(error.message)}`,
          menuKeyboard,
        );
      }

      return home(chatId, "تمت إضافة المقرر بنجاح.");
    }
  }

  if (state.action === "add_schedule") {
    if (state.step === "course") {
      return ask(
        chatId,
        "add_schedule",
        "course_code",
        { course: value },
        "أرسل كود المقرر:",
      );
    }

    if (state.step === "course_code") {
      return ask(
        chatId,
        "add_schedule",
        "type",
        { ...data, courseCode: value },
        "اختر النوع:",
        {
          inline_keyboard: [
            [{ text: "محاضرة", callback_data: "schedule_type:lecture" }, { text: "سكشن", callback_data: "schedule_type:section" }],
            [{ text: "إلغاء", callback_data: "cancel" }],
          ],
        },
      );
    }

    if (state.step === "day") {
      const day = Number(value);
      const names: Record<number, string> = {
        0: "الأحد",
        1: "الاثنين",
        2: "الثلاثاء",
        3: "الأربعاء",
        4: "الخميس",
      };
      if (!Number.isInteger(day) || !(day in names)) {
        return send(chatId, "اختر يومًا من الأزرار الموجودة.", cancelKeyboard);
      }

      return ask(
        chatId,
        "add_schedule",
        "start",
        { ...data, dayOfWeek: day, dayNameAr: names[day] },
        "أرسل وقت البداية:",
      );
    }

    if (state.step === "day_name") {
      return ask(
        chatId,
        "add_schedule",
        "start",
        { ...data, dayNameAr: value },
        "أرسل وقت البداية:",
      );
    }

    if (state.step === "start") {
      return ask(
        chatId,
        "add_schedule",
        "end",
        { ...data, startTime: value },
        "أرسل وقت النهاية:",
      );
    }

    if (state.step === "end") {
      return ask(
        chatId,
        "add_schedule",
        "location",
        { ...data, endTime: value },
        "أرسل المكان:",
      );
    }

    if (state.step === "location") {
      return ask(
        chatId,
        "add_schedule",
        "instructor",
        { ...data, location: value },
        "أرسل اسم الدكتور أو اكتب -:",
      );
    }

    if (state.step === "instructor") {
      const row = {
        id: newId(),
        course: data.course,
        course_code: data.courseCode,
        type: data.type,
        day_of_week: data.dayOfWeek,
        day_name_ar: data.dayNameAr,
        start_time: data.startTime,
        end_time: data.endTime,
        location: data.location,
        instructor: value === "-" ? null : value,
      };

      const { error } = await supabase.from("schedule").insert(row);

      if (error) {
        return send(
          chatId,
          `تعذر حفظ الحصة: ${esc(error.message)}`,
          menuKeyboard,
        );
      }

      return home(chatId, "تمت إضافة الحصة بنجاح.");
    }
  }

  if (state.action === "upload_file") {
    if (state.step === "title") {
      await setState(chatId, {
        action: "upload_file",
        step: "category",
        data: { ...data, title: value },
      });

      return send(chatId, "اختر تصنيف الملف:", {
        inline_keyboard: [
          [{ text: "محاضرات", callback_data: "file_cat:lectures" }, { text: "سكاشن", callback_data: "file_cat:sections" }],
          [{ text: "ملخصات", callback_data: "file_cat:summaries" }, { text: "حلول", callback_data: "file_cat:solutions" }],
          [{ text: "امتحانات", callback_data: "file_cat:exams" }, { text: "أخرى", callback_data: "file_cat:other" }],
          [{ text: "إلغاء", callback_data: "cancel" }],
        ],
      });
    }
  }

  if (state.action.startsWith("edit_")) {
    return handleEditText(chatId, state, value);
  }

  return send(chatId, "استخدم الأزرار لإكمال هذه العملية.", cancelKeyboard);
}

/* -------------------- Callback handling -------------------- */

async function handleCallback(chatId: number, callbackId: string, data: string) {
  await answerCallback(callbackId);

  if (data === "cancel") return home(chatId, "تم الإلغاء.");
  if (data === "menu") return home(chatId);

  if (data === "add_announcement") return beginAddAnnouncement(chatId);
  if (data === "add_date") return beginAddDate(chatId);
  if (data === "add_course") return beginAddCourse(chatId);
  if (data === "add_schedule") return beginAddSchedule(chatId);
  if (data === "import_study") return beginImportStudy(chatId);
  if (data === "course_icons") return beginCourseIcons(chatId);
  if (data === "upload_file") return beginUploadFile(chatId);

  if (data === "list_announcements") return listAnnouncements(chatId);
  if (data === "list_dates") return listDates(chatId);
  if (data === "list_courses") return listCourses(chatId);
  if (data === "list_schedule") return listSchedule(chatId);
  if (data === "list_files") return listFiles(chatId);
  if (data === "list_official") return listOfficial(chatId);
  if (data === "list_feedback") return listFeedback(chatId);
  if (data === "manage") return manageMenu(chatId);

  if (data.startsWith("date_type:")) {
    const type = data.slice("date_type:".length);
    const labels: Record<string, string> = {
      assignment: "تكليف",
      submission: "تسليم",
      quiz: "كويز",
      project: "مشروع",
      lab: "لاب",
      midterm: "ميدتيرم",
      final: "فاينل",
    };

    return ask(
      chatId,
      "add_date",
      "course",
      { type, typeLabelAr: labels[type] },
      "أرسل اسم المقرر:",
    );
  }

  if (data === "ann_attach:link" || data === "ann_attach:file" || data === "ann_attach:none") {
    const state = await getState(chatId);
    const stateData = state.data ?? {};
    const mode = data.slice("ann_attach:".length);
    if (mode === "link") {
      return ask(chatId, "add_announcement", "link", { ...stateData, attachmentMode: "link" }, "أرسل رابط الإعلان:");
    }
    await setState(chatId, { action: "add_announcement", step: "course", data: { ...stateData, attachmentMode: mode } });
    return send(chatId, "اختر المقرر المرتبط بالإعلان:", await courseButtons("ann_course", { includeGeneral: true, includeNone: false }));
  }

  if (data === "ann_course:general") {
    const state = await getState(chatId);
    const stateData = state.data ?? {};
    if (stateData.attachmentMode === "file") {
      await setState(chatId, { action: "add_announcement", step: "await_file", data: { ...stateData, courseId: null, courseRef: null } });
      return send(chatId, "أرسل الملف الآن كـ Document داخل Telegram.", cancelKeyboard);
    }
    const row = {
      id: newId(), title: "تنبيه", content: String(stateData.content ?? "").trim(),
      date: new Date().toISOString(), time_ago: "الآن", category: "general", category_name_ar: "عام",
      is_important: false, status: "active", course_ref: null,
      link_url: stateData.linkUrl || null,
    };
    if (!row.content) return home(chatId, "محتوى الإعلان لا يمكن أن يكون فارغًا.");
    const { error } = await supabase.from("announcements").insert(row);
    if (error) return send(chatId, `تعذر حفظ الإعلان: ${esc(error.message)}`, menuKeyboard);
    return home(chatId, "تمت إضافة الإعلان بنجاح.");
  }

  if (data.startsWith("ann_course:")) {
    const state = await getState(chatId);
    const courseId = data.slice("ann_course:".length);
    const stateData = state.data ?? {};

    const { data: course, error } = await supabase
      .from("courses")
      .select("code,name_ar,name_en")
      .eq("id", courseId)
      .maybeSingle();

    if (error || !course) return home(chatId, "المقرر غير موجود.");

    if (stateData.attachmentMode === "file") {
      await setState(chatId, { action: "add_announcement", step: "await_file", data: { ...stateData, courseId, courseRef: course.name_ar || course.name_en || course.code } });
      return send(chatId, "أرسل الملف الآن كـ Document داخل Telegram.", cancelKeyboard);
    }

    const row = {
      id: newId(), title: "تنبيه", content: String(stateData.content ?? "").trim(),
      date: new Date().toISOString(), time_ago: "الآن", category: "general", category_name_ar: "عام",
      is_important: false, status: "active", course_ref: course.name_ar || course.name_en || course.code,
      link_url: stateData.linkUrl || null,
    };
    if (!row.content) return home(chatId, "محتوى الإعلان لا يمكن أن يكون فارغًا.");
    const { error: insertError } = await supabase.from("announcements").insert(row);
    if (insertError) return send(chatId, `تعذر حفظ الإعلان: ${esc(insertError.message)}`, menuKeyboard);
    return home(chatId, "تمت إضافة الإعلان بنجاح.");
  }


  if (data.startsWith("schedule_type:")) {
    const state = await getState(chatId);
    const type = data.slice("schedule_type:".length);

    return ask(
      chatId,
      "add_schedule",
      "day",
      { ...(state.data ?? {}), type },
      "اختر اليوم:",
      {
        inline_keyboard: [
          [{ text: "الأحد", callback_data: "schedule_day:0" }, { text: "الاثنين", callback_data: "schedule_day:1" }],
          [{ text: "الثلاثاء", callback_data: "schedule_day:2" }, { text: "الأربعاء", callback_data: "schedule_day:3" }],
          [{ text: "الخميس", callback_data: "schedule_day:4" }],
          [{ text: "إلغاء", callback_data: "cancel" }],
        ],
      },
    );
  }

  if (data.startsWith("schedule_day:")) {
    const state = await getState(chatId);
    const day = Number(data.slice("schedule_day:".length));
    const names: Record<number, string> = {
      0: "الأحد",
      1: "الاثنين",
      2: "الثلاثاء",
      3: "الأربعاء",
      4: "الخميس",
    };
    if (!(day in names)) return home(chatId, "اليوم غير صحيح.");

    return ask(
      chatId,
      "add_schedule",
      "start",
      { ...(state.data ?? {}), dayOfWeek: day, dayNameAr: names[day] },
      "أرسل وقت البداية:",
    );
  }

  if (data === "confirm_study_import") {
    const state = await getState(chatId);
    if (state.action !== "import_study_confirm" || !state.data) return home(chatId, "انتهت جلسة الاستيراد.");
    return commitImport(chatId, state.data as any);
  }

  if (data.startsWith("icon_course:")) {
    const courseId = data.slice("icon_course:".length);
    await setState(chatId, { action: "course_icon", step: "await_image", data: { courseId } });
    return send(chatId, "أرسل صورة الأيقونة الآن كصورة داخل Telegram.", cancelKeyboard);
  }

  if (data.startsWith("file_course:")) {
    const state = await getState(chatId);
    const courseId = data.slice("file_course:".length);

    await setState(chatId, {
      action: "upload_file",
      step: "title",
      data: {
        ...(state.data ?? {}),
        courseId: courseId === "none" ? null : courseId,
      },
    });

    return send(chatId, "أرسل اسم الملف أو عنوانه:", cancelKeyboard);
  }

  if (data.startsWith("file_cat:")) {
    const state = await getState(chatId);
    const category = data.slice("file_cat:".length);

    await setState(chatId, {
      action: "upload_file",
      step: "await_file",
      data: {
        ...(state.data ?? {}),
        category,
      },
    });

    return send(chatId, "أرسل الملف الآن كـ Document داخل Telegram.", cancelKeyboard);
  }

  if (data.startsWith("editfield:")) {
    const [, kind, field] = data.split(":");
    const state = await getState(chatId);

    if (!state.action?.startsWith("edit_")) {
      return home(chatId, "انتهت جلسة التعديل.");
    }

    await setState(chatId, {
      ...state,
      step: "value",
      data: {
        ...(state.data ?? {}),
        field,
      },
    });

    const labels: Record<string, string> = Object.fromEntries(
      editFields[kind] ?? [],
    );

    return send(
      chatId,
      `أرسل القيمة الجديدة لحقل «${labels[field] || field}».\nاكتب - لمسح القيمة إذا كان الحقل يقبل ذلك.`,
      cancelKeyboard,
    );
  }

  if (data.startsWith("manage_ann:")) {
    return manageAnnouncement(chatId, data.slice("manage_ann:".length));
  }

  if (data.startsWith("manage_date:")) {
    return manageDate(chatId, data.slice("manage_date:".length));
  }

  if (data.startsWith("manage_course:")) {
    return manageCourse(chatId, data.slice("manage_course:".length));
  }

  if (data.startsWith("manage_schedule:")) {
    return manageSchedule(chatId, data.slice("manage_schedule:".length));
  }

  if (data.startsWith("manage_file:")) {
    return manageFile(chatId, data.slice("manage_file:".length));
  }

  if (data.startsWith("del_ann:")) {
    return deleteRow(chatId, "announcements", data.slice("del_ann:".length), "الإعلان");
  }

  if (data.startsWith("del_date:")) {
    return deleteRow(chatId, "dates", data.slice("del_date:".length), "الموعد");
  }

  if (data.startsWith("del_course:")) {
    return deleteCourse(chatId, data.slice("del_course:".length));
  }

  if (data.startsWith("del_schedule:")) {
    return deleteRow(chatId, "schedule", data.slice("del_schedule:".length), "الحصة");
  }

  if (data.startsWith("del_file:")) {
    return deleteFile(chatId, data.slice("del_file:".length));
  }

  if (data.startsWith("edit_ann:")) {
    return beginEdit(chatId, "announcement", data.slice("edit_ann:".length));
  }

  if (data.startsWith("edit_date:")) {
    return beginEdit(chatId, "date", data.slice("edit_date:".length));
  }

  if (data.startsWith("edit_course:")) {
    return beginEdit(chatId, "course", data.slice("edit_course:".length));
  }

  if (data.startsWith("edit_schedule:")) {
    return beginEdit(chatId, "schedule", data.slice("edit_schedule:".length));
  }

  return send(chatId, "أمر غير معروف.", menuKeyboard);
}

/* -------------------- Webhook -------------------- */

async function dispatchUpdate(update: any) {
  const message = update.message;
  const callback = update.callback_query;

  const chatId = message?.chat?.id ?? callback?.message?.chat?.id;

  if (chatId !== ADMIN_CHAT_ID) {
    return;
  }

  if (callback) {
    return handleCallback(chatId, callback.id, callback.data || "");
  }

  if (message?.document) {
    if (await handleStudyImportDocument(chatId, message.document)) return;
    if (await handleAnnouncementDocument(chatId, message.document)) return;
    return handleDocument(chatId, message.document);
  }

  if (message?.photo) {
    if (await handleCourseIconPhoto(chatId, message.photo)) return;
  }

  if (message?.text) {
    return handleText(chatId, message.text);
  }

  return send(chatId, "استخدم أزرار لوحة التحكم.", menuKeyboard);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("OK", { status: 200 });
  }

  const secret = req.headers.get("X-Telegram-Bot-Api-Secret-Token");

  if (secret !== WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const update = await req.json();
    await dispatchUpdate(update);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("telegram-bot error", error);

    // Telegram should receive 200 so it does not retry the same update endlessly.
    return new Response("OK", { status: 200 });
  }
});
