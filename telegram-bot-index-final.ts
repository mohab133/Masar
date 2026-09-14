import { createClient } from "npm:@supabase/supabase-js@2";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const ADMIN_CHAT_ID = Number(Deno.env.get("TELEGRAM_ADMIN_CHAT_ID"));
const WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SECRET_KEYS_RAW = Deno.env.get("SUPABASE_SECRET_KEYS");

if (!BOT_TOKEN || !ADMIN_CHAT_ID || !WEBHOOK_SECRET || !SUPABASE_URL || !SECRET_KEYS_RAW) {
  throw new Error("Missing required Telegram bot environment variables");
}

const keys = JSON.parse(SECRET_KEYS_RAW);
const supabase = createClient(SUPABASE_URL, keys.default);
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const ANNOUNCEMENTS_BUCKET = "announcements";
const COURSE_MATERIALS_BUCKET = "course-materials";
const COURSE_ICONS_BUCKET = "course-icons";

type BotState = {
  scene: string;
  step: string;
  data: Record<string, unknown>;
};

const EMPTY_STATE: BotState = { scene: "", step: "", data: {} };

const MAIN_MENU = {
  inline_keyboard: [
    [{ text: "إضافة إعلان", callback_data: "scene:announcement:add" }, { text: "الإعلانات", callback_data: "list:announcements" }],
    [{ text: "إضافة موعد", callback_data: "scene:date:add" }, { text: "المواعيد", callback_data: "list:dates" }],
    [{ text: "إضافة مقرر", callback_data: "scene:course:add" }, { text: "المقررات", callback_data: "list:courses" }],
    [{ text: "إضافة حصة", callback_data: "scene:schedule:add" }, { text: "الجدول", callback_data: "list:schedule" }],
    [{ text: "رفع ملف مقرر", callback_data: "scene:file:add" }, { text: "ملفات المقررات", callback_data: "list:files" }],
    [{ text: "الجداول الرسمية", callback_data: "list:official" }, { text: "الآراء", callback_data: "list:feedback" }],
  ],
};
const CANCEL = { inline_keyboard: [[{ text: "إلغاء", callback_data: "nav:cancel" }]] };
const BACK_CANCEL = { inline_keyboard: [[{ text: "رجوع", callback_data: "nav:back" }, { text: "إلغاء", callback_data: "nav:cancel" }]] };

function esc(value: unknown) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function short(value: unknown, max = 48) {
  const text = String(value ?? "");
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
function id() { return crypto.randomUUID(); }
function valueOf(value: unknown) { const text = String(value ?? "").trim(); return text === "-" || text === "" || text === "عام" ? null : text; }

async function telegram(method: string, body?: unknown) {
  const response = await fetch(`${TELEGRAM_API}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json();
  if (!result.ok) throw new Error(`Telegram ${method}: ${JSON.stringify(result)}`);
  return result.result;
}
async function send(chatId: number, text: string, replyMarkup?: unknown) {
  return telegram("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", ...(replyMarkup ? { reply_markup: replyMarkup } : {}) });
}
async function answerCallback(idValue: string) { try { await telegram("answerCallbackQuery", { callback_query_id: idValue }); } catch {} }

async function getState(chatId: number): Promise<BotState> {
  const { data, error } = await supabase.from("telegram_admin_states").select("state").eq("chat_id", chatId).maybeSingle();
  if (error) throw error;
  return { ...EMPTY_STATE, ...(data?.state ?? {}), data: { ...(data?.state?.data ?? {}) } };
}
async function setState(chatId: number, state: Partial<BotState>) {
  const current = await getState(chatId);
  const next = { ...current, ...state, data: { ...current.data, ...(state.data ?? {}) } };
  const { error } = await supabase.from("telegram_admin_states").upsert({ chat_id: chatId, state: next, updated_at: new Date().toISOString() });
  if (error) throw error;
}
async function clearState(chatId: number) { await supabase.from("telegram_admin_states").delete().eq("chat_id", chatId); }
async function home(chatId: number, text = "لوحة تحكم مسار") { await clearState(chatId); return send(chatId, text, MAIN_MENU); }
async function ask(chatId: number, scene: string, step: string, text: string, data: Record<string, unknown> = {}, keyboard: unknown = BACK_CANCEL) {
  await setState(chatId, { scene, step, data });
  return send(chatId, text, keyboard);
}

async function insert(table: string, row: Record<string, unknown>) {
  const { data, error } = await supabase.from(table).insert(row).select("*").single();
  if (error) throw error;
  return data;
}
async function update(table: string, rowId: string, patch: Record<string, unknown>) {
  const { data, error } = await supabase.from(table).update({ ...patch, updated_at: new Date().toISOString() }).eq("id", rowId).select("*").single();
  if (error) throw error;
  return data;
}
async function remove(table: string, rowId: string) {
  const { error } = await supabase.from(table).delete().eq("id", rowId);
  if (error) throw error;
}

function parseDate(text: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}T12:00:00Z`);
  const [year, month, day] = text.split("-").map(Number);
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day ? text : null;
}
function formatArabicDate(text: string) { return new Intl.DateTimeFormat("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${text}T12:00:00`)); }
function daysUntil(text: string) { const now = new Date(); const target = new Date(`${text}T00:00:00`); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(); const date = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime(); return Math.round((date - today) / 86400000); }
function validTime(text: string) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(text); }

async function courseRows() {
  const { data, error } = await supabase.from("courses").select("id,code,name_ar,name_en").order("code").limit(100);
  if (error) throw error;
  return data ?? [];
}
async function courseKeyboard(prefix: string, includeManual = true) {
  const rows = (await courseRows()).map((course: any) => [{ text: `${course.code} • ${course.name_ar || course.name_en}`, callback_data: `${prefix}:${course.id}` }]);
  if (includeManual) rows.push([{ text: "كتابة اسم المادة يدويًا", callback_data: `${prefix}:manual` }]);
  rows.push([{ text: "عام / بدون مقرر", callback_data: `${prefix}:general` }], [{ text: "إلغاء", callback_data: "nav:cancel" }]);
  return { inline_keyboard: rows };
}

/* -------------------- Announcements -------------------- */
async function startAnnouncement(chatId: number) {
  return ask(chatId, "announcement_add", "content", "أرسل نص الإعلان:", {}, CANCEL);
}
async function announcementScope(chatId: number, data: Record<string, unknown>) {
  return ask(chatId, "announcement_add", "scope", "اختر نطاق الإعلان. يمكنك اختيار مادة من القائمة أو كتابة اسمها بنفسك:", data, {
    inline_keyboard: [
      [{ text: "إعلان عام", callback_data: "annscope:general" }],
      [{ text: "اختيار من المواد", callback_data: "annscope:list" }, { text: "كتابة اسم المادة", callback_data: "annscope:manual" }],
      [{ text: "رجوع", callback_data: "nav:back" }, { text: "إلغاء", callback_data: "nav:cancel" }],
    ],
  });
}
async function announcementAttachment(chatId: number, data: Record<string, unknown>) {
  return ask(chatId, "announcement_add", "attachment", "هل تريد إضافة رابط أو ملف؟", data, {
    inline_keyboard: [
      [{ text: "بدون مرفق", callback_data: "annattach:none" }, { text: "رابط", callback_data: "annattach:link" }],
      [{ text: "ملف Telegram", callback_data: "annattach:file" }],
      [{ text: "رجوع", callback_data: "nav:back" }, { text: "إلغاء", callback_data: "nav:cancel" }],
    ],
  });
}
async function saveAnnouncement(chatId: number, data: Record<string, unknown>) {
  const content = String(data.content ?? "").trim();
  if (!content) return send(chatId, "محتوى الإعلان لا يمكن أن يكون فارغًا.", BACK_CANCEL);
  const row = {
    id: id(), title: "تنبيه", content, date: new Date().toISOString(), time_ago: "الآن",
    category: "general", category_name_ar: "إعلان عام", is_important: false, status: "active",
    course_ref: valueOf(data.courseRef), link_url: valueOf(data.linkUrl), attachment_path: valueOf(data.attachmentPath), attachment_name: valueOf(data.attachmentName),
  };
  try {
    const saved = await insert("announcements", row);
    if (!saved?.id || saved.status !== "active") throw new Error("لم يتم حفظ الإعلان كسجل نشط.");
    return home(chatId, "تمت إضافة الإعلان، وسيظهر في Masar من نفس قاعدة البيانات.");
  } catch (error) { return send(chatId, `تعذر حفظ الإعلان: ${esc(error instanceof Error ? error.message : error)}`, MAIN_MENU); }
}
async function listAnnouncements(chatId: number) {
  const { data, error } = await supabase.from("announcements").select("id,content,status,course_ref,created_at").order("created_at", { ascending: false }).limit(40);
  if (error) return send(chatId, `تعذر قراءة الإعلانات: ${esc(error.message)}`, MAIN_MENU);
  if (!data?.length) return send(chatId, "لا توجد إعلانات.", MAIN_MENU);
  const rows = data.map((item: any) => [{ text: `${item.status === "active" ? "نشط" : "منتهي"} • ${short(item.content)}`, callback_data: `item:announcement:${item.id}` }]);
  rows.push([{ text: "رجوع", callback_data: "nav:home" }]);
  return send(chatId, "الإعلانات من public.announcements:", { inline_keyboard: rows });
}
async function showAnnouncement(chatId: number, rowId: string) {
  const { data, error } = await supabase.from("announcements").select("*").eq("id", rowId).maybeSingle();
  if (error || !data) return home(chatId, "الإعلان غير موجود.");
  return send(chatId, `<b>${esc(data.title)}</b>\n${esc(data.content)}\nالنطاق: ${esc(data.course_ref || "عام")}\nالحالة: ${esc(data.status)}`, { inline_keyboard: [[{ text: "تعديل", callback_data: `edit:announcement:${rowId}` }, { text: "حذف", callback_data: `delete:announcement:${rowId}` }], [{ text: "رجوع", callback_data: "list:announcements" }]] });
}

/* -------------------- Dates -------------------- */
const DATE_TYPES: Record<string, string> = { assignment: "تكليف", submission: "تسليم", quiz: "كويز", project: "مشروع", lab: "لاب", midterm: "ميدتيرم", final: "فاينل" };
async function startDate(chatId: number) { return ask(chatId, "date_add", "type", "اختر نوع الموعد:", {}, { inline_keyboard: Object.entries(DATE_TYPES).map(([key, label]) => [{ text: label, callback_data: `date:type:${key}` }]).concat([[{ text: "إلغاء", callback_data: "nav:cancel" }]]) }); }
async function listDates(chatId: number) { const { data, error } = await supabase.from("dates").select("id,event_name,course,event_date,type_label_ar").order("event_date").limit(50); if (error) return send(chatId, `تعذر قراءة المواعيد: ${esc(error.message)}`, MAIN_MENU); if (!data?.length) return send(chatId, "لا توجد مواعيد.", MAIN_MENU); const rows = data.map((x: any) => [{ text: `${x.event_date} • ${short(x.course)} • ${short(x.event_name, 28)}`, callback_data: `item:date:${x.id}` }]); rows.push([{ text: "رجوع", callback_data: "nav:home" }]); return send(chatId, "المواعيد:", { inline_keyboard: rows }); }
async function showDate(chatId: number, rowId: string) { const { data } = await supabase.from("dates").select("*").eq("id", rowId).maybeSingle(); if (!data) return home(chatId, "الموعد غير موجود."); return send(chatId, `<b>${esc(data.event_name)}</b>\n${esc(data.course)}\n${esc(data.display_date_ar)}\n${esc(data.event_time || "بدون وقت")}\n${esc(data.location || "بدون مكان")}`, { inline_keyboard: [[{ text: "تعديل", callback_data: `edit:date:${rowId}` }, { text: "حذف", callback_data: `delete:date:${rowId}` }], [{ text: "رجوع", callback_data: "list:dates" }]] }); }

/* -------------------- Courses and schedule -------------------- */
async function startCourse(chatId: number) { return ask(chatId, "course_add", "code", "أرسل كود المقرر:", {}, CANCEL); }
async function listCourses(chatId: number) { const { data, error } = await supabase.from("courses").select("id,code,name_en,name_ar,instructor,files_count").order("code").limit(80); if (error) return send(chatId, `تعذر قراءة المقررات: ${esc(error.message)}`, MAIN_MENU); if (!data?.length) return send(chatId, "لا توجد مقررات.", MAIN_MENU); const rows = data.map((x: any) => [{ text: `${x.code} • ${short(x.name_ar || x.name_en, 34)}`, callback_data: `item:course:${x.id}` }]); rows.push([{ text: "رجوع", callback_data: "nav:home" }]); return send(chatId, "المقررات:", { inline_keyboard: rows }); }
async function showCourse(chatId: number, rowId: string) { const { data } = await supabase.from("courses").select("*").eq("id", rowId).maybeSingle(); if (!data) return home(chatId, "المقرر غير موجود."); return send(chatId, `<b>${esc(data.code)}</b>\n${esc(data.name_ar || data.name_en)}\nالدكتور: ${esc(data.instructor)}\nالملفات: ${esc(data.files_count)}`, { inline_keyboard: [[{ text: "تعديل", callback_data: `edit:course:${rowId}` }, { text: "حذف", callback_data: `delete:course:${rowId}` }], [{ text: "رجوع", callback_data: "list:courses" }]] }); }
async function startSchedule(chatId: number) { return ask(chatId, "schedule_add", "course", "أرسل اسم المقرر كما سيظهر في الجدول:", {}, CANCEL); }
async function listSchedule(chatId: number) { const { data, error } = await supabase.from("schedule").select("id,course,course_code,type,day_name_ar,start_time,end_time").order("day_of_week").order("start_time").limit(100); if (error) return send(chatId, `تعذر قراءة الجدول: ${esc(error.message)}`, MAIN_MENU); if (!data?.length) return send(chatId, "لا توجد حصص.", MAIN_MENU); const rows = data.map((x: any) => [{ text: `${short(x.course, 22)} • ${x.day_name_ar} • ${x.start_time}`, callback_data: `item:schedule:${x.id}` }]); rows.push([{ text: "رجوع", callback_data: "nav:home" }]); return send(chatId, "الجدول:", { inline_keyboard: rows }); }
async function showSchedule(chatId: number, rowId: string) { const { data } = await supabase.from("schedule").select("*").eq("id", rowId).maybeSingle(); if (!data) return home(chatId, "الحصة غير موجودة."); return send(chatId, `<b>${esc(data.course)}</b>\n${esc(data.type)}\n${esc(data.day_name_ar)} ${esc(data.start_time)} - ${esc(data.end_time)}\n${esc(data.location)}`, { inline_keyboard: [[{ text: "تعديل", callback_data: `edit:schedule:${rowId}` }, { text: "حذف", callback_data: `delete:schedule:${rowId}` }], [{ text: "رجوع", callback_data: "list:schedule" }]] }); }

/* -------------------- Files, official schedules, feedback -------------------- */
async function startFile(chatId: number) { return ask(chatId, "file_add", "course", "اختر المقرر المرتبط بالملف:", {}, await courseKeyboard("filecourse")); }
async function listFiles(chatId: number) { const { data, error } = await supabase.from("course_files").select("id,title,category,file_type,course_id,published_at").order("published_at", { ascending: false }).limit(100); if (error) return send(chatId, `تعذر قراءة الملفات: ${esc(error.message)}`, MAIN_MENU); if (!data?.length) return send(chatId, "لا توجد ملفات.", MAIN_MENU); const rows = data.map((x: any) => [{ text: `ملف • ${short(x.title, 42)}`, callback_data: `item:file:${x.id}` }]); rows.push([{ text: "رجوع", callback_data: "nav:home" }]); return send(chatId, "ملفات المقررات:", { inline_keyboard: rows }); }
async function showFile(chatId: number, rowId: string) { const { data } = await supabase.from("course_files").select("*").eq("id", rowId).maybeSingle(); if (!data) return home(chatId, "الملف غير موجود."); return send(chatId, `<b>${esc(data.title)}</b>\nالتصنيف: ${esc(data.category)}\nالنوع: ${esc(data.file_type)}\nالحجم: ${esc(data.file_size)}`, { inline_keyboard: [[{ text: "حذف", callback_data: `delete:file:${rowId}` }], [{ text: "رجوع", callback_data: "list:files" }]] }); }
async function listOfficial(chatId: number) { const { data, error } = await supabase.from("official_schedules").select("id,title,type,type_label_ar,term,academic_year,approved_date,description").order("approved_date", { ascending: false }).limit(50); if (error) return send(chatId, `تعذر القراءة: ${esc(error.message)}`, MAIN_MENU); if (!data?.length) return send(chatId, "لا توجد جداول رسمية.", MAIN_MENU); return send(chatId, data.map((x: any) => `<b>${esc(x.title)}</b>\n${esc(x.type_label_ar || x.type)}\n${esc(x.term)} ${esc(x.academic_year)}\n${esc(x.description)}`).join("\n\n"), { inline_keyboard: [[{ text: "رجوع", callback_data: "nav:home" }]] }); }
async function listFeedback(chatId: number) { const { data, error } = await supabase.from("feedback").select("id,type,course_or_section,details,submitted_at").order("submitted_at", { ascending: false }).limit(50); if (error) return send(chatId, `تعذر القراءة: ${esc(error.message)}`, MAIN_MENU); if (!data?.length) return send(chatId, "لا توجد آراء.", MAIN_MENU); return send(chatId, data.map((x: any) => `<b>${esc(x.type)}</b>\n${esc(x.course_or_section || "")}\n${esc(x.details)}`).join("\n\n"), { inline_keyboard: [[{ text: "رجوع", callback_data: "nav:home" }]] }); }

async function downloadFile(fileId: string) { const info = await telegram("getFile", { file_id: fileId }); if (!info.file_path) throw new Error("لم يتم العثور على مسار الملف."); const response = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${info.file_path}`); if (!response.ok) throw new Error("تعذر تنزيل ملف Telegram."); return { bytes: new Uint8Array(await response.arrayBuffer()), path: info.file_path }; }
async function saveCourseFile(chatId: number, document: any, state: BotState) {
  const file = await downloadFile(document.file_id); const originalName = String(document.file_name || "file"); const safe = originalName.replace(/[^a-zA-Z0-9._-]/g, "_"); const courseId = valueOf(state.data.courseId); const path = `${courseId || "general"}/${id()}-${safe}`;
  const { error: uploadError } = await supabase.storage.from(COURSE_MATERIALS_BUCKET).upload(path, file.bytes, { contentType: document.mime_type || "application/octet-stream", upsert: false });
  if (uploadError) throw uploadError;
  const ext = safe.split(".").pop()?.toLowerCase(); const fileType = ext === "pdf" ? "pdf" : ["ppt", "pptx"].includes(ext || "") ? "slides" : ["xls", "xlsx", "csv"].includes(ext || "") ? "sheet" : "doc";
  try { await insert("course_files", { id: id(), course_id: courseId, title: state.data.title || originalName, category: state.data.category || "other", file_type: fileType, file_name: originalName, storage_path: path, file_size: `${((document.file_size || file.bytes.length) / 1024 / 1024).toFixed(2)} MB`, file_size_bytes: document.file_size || file.bytes.length, published_at: new Date().toISOString() }); }
  catch (error) { await supabase.storage.from(COURSE_MATERIALS_BUCKET).remove([path]); throw error; }
  if (courseId) { const { count } = await supabase.from("course_files").select("id", { count: "exact", head: true }).eq("course_id", courseId); await supabase.from("courses").update({ files_count: count ?? 0, updated_at: new Date().toISOString() }).eq("id", courseId); }
  return home(chatId, "تم رفع الملف وحفظه في Masar.");
}

/* -------------------- Edit/delete -------------------- */
const EDIT_FIELDS: Record<string, Array<[string, string]>> = {
  announcement: [["content", "المحتوى"], ["course_ref", "نطاق الإعلان"], ["status", "الحالة"]],
  date: [["event_name", "اسم الحدث"], ["event_date", "التاريخ"], ["event_time", "الوقت"], ["location", "المكان"]],
  course: [["code", "الكود"], ["name_en", "الاسم الإنجليزي"], ["name_ar", "الاسم العربي"], ["instructor", "الدكتور"], ["department", "القسم"]],
  schedule: [["course", "المقرر"], ["course_code", "كود المقرر"], ["day_name_ar", "اليوم"], ["start_time", "وقت البداية"], ["end_time", "وقت النهاية"], ["location", "المكان"], ["instructor", "الدكتور"], ["notes", "ملاحظات"]],
};
const TABLE_FOR_KIND: Record<string, string> = { announcement: "announcements", date: "dates", course: "courses", schedule: "schedule" };
async function beginEdit(chatId: number, kind: string, rowId: string) { const fields = EDIT_FIELDS[kind]; if (!fields) return home(chatId, "نوع التعديل غير مدعوم."); await setState(chatId, { scene: `edit_${kind}`, step: "field", data: { rowId } }); return send(chatId, "اختر الحقل الذي تريد تعديله:", { inline_keyboard: fields.map(([field, label]) => [{ text: label, callback_data: `editfield:${kind}:${field}` }]).concat([[{ text: "إلغاء", callback_data: "nav:cancel" }]]) }); }
async function deleteItem(chatId: number, kind: string, rowId: string) { const table = TABLE_FOR_KIND[kind] || (kind === "file" ? "course_files" : ""); if (!table) return home(chatId, "العنصر غير مدعوم."); try { if (kind === "course") { const { data: course } = await supabase.from("courses").select("code").eq("id", rowId).maybeSingle(); const [{ count: files }, { count: schedule }] = await Promise.all([supabase.from("course_files").select("id", { count: "exact", head: true }).eq("course_id", rowId), supabase.from("schedule").select("id", { count: "exact", head: true }).eq("course_code", course?.code ?? "")]); if ((files ?? 0) > 0 || (schedule ?? 0) > 0) return send(chatId, "لا يمكن حذف المقرر قبل حذف البيانات المرتبطة به.", MAIN_MENU); } if (kind === "file") { const { data } = await supabase.from("course_files").select("storage_path,course_id").eq("id", rowId).maybeSingle(); if (data?.storage_path) await supabase.storage.from(COURSE_MATERIALS_BUCKET).remove([data.storage_path]); await remove(table, rowId); if (data?.course_id) { const { count } = await supabase.from("course_files").select("id", { count: "exact", head: true }).eq("course_id", data.course_id); await supabase.from("courses").update({ files_count: count ?? 0, updated_at: new Date().toISOString() }).eq("id", data.course_id); } } else await remove(table, rowId); return home(chatId, "تم الحذف بنجاح."); } catch (error) { return send(chatId, `تعذر الحذف: ${esc(error instanceof Error ? error.message : error)}`, MAIN_MENU); } }

async function handleText(chatId: number, text: string) {
  const state = await getState(chatId); const value = text.trim();
  if (value === "/start" || value === "/help") return home(chatId);
  if (value === "/cancel") return home(chatId, "تم الإلغاء.");
  if (!state.scene) return home(chatId, "استخدم لوحة التحكم.");
  const data = state.data;

  if (state.scene === "announcement_add") {
    if (state.step === "content") return announcementScope(chatId, { content: value });
    if (state.step === "manual_course") return announcementAttachment(chatId, { ...data, courseRef: valueOf(value) });
    if (state.step === "link") { try { const url = new URL(value); if (!/^https?:$/.test(url.protocol)) throw new Error(); } catch { return send(chatId, "الرابط غير صحيح. أرسله بصيغة http:// أو https://.", BACK_CANCEL); } return announcementScope(chatId, { ...data, linkUrl: value }); }
  }
  if (state.scene === "course_add") {
    if (state.step === "code") return ask(chatId, state.scene, "name_en", "أرسل الاسم الإنجليزي:", { code: value });
    if (state.step === "name_en") return ask(chatId, state.scene, "name_ar", "أرسل الاسم العربي أو -:", { ...data, name_en: value });
    if (state.step === "name_ar") return ask(chatId, state.scene, "instructor", "أرسل اسم الدكتور أو -:", { ...data, name_ar: valueOf(value) });
    if (state.step === "instructor") return ask(chatId, state.scene, "department", "أرسل القسم (general أو computers أو control_communications) أو -:", { ...data, instructor: valueOf(value) });
    if (state.step === "department") { const department = valueOf(value); if (department && !["general", "computers", "control_communications"].includes(department)) return send(chatId, "القسم غير موجود في Masar.", BACK_CANCEL); try { await insert("courses", { id: id(), code: data.code, name_en: data.name_en, name_ar: data.name_ar, instructor: data.instructor || "", files_count: 0, department }); return home(chatId, "تمت إضافة المقرر."); } catch (error) { return send(chatId, `تعذر حفظ المقرر: ${esc(error instanceof Error ? error.message : error)}`, MAIN_MENU); } }
  }
  if (state.scene === "date_add") {
    if (state.step === "course") return ask(chatId, state.scene, "event_name", "أرسل اسم الحدث:", { ...data, course: value });
    if (state.step === "event_name") return ask(chatId, state.scene, "event_date", "أرسل التاريخ بصيغة YYYY-MM-DD:", { ...data, event_name: value });
    if (state.step === "event_date") { const date = parseDate(value); if (!date) return send(chatId, "التاريخ غير صحيح.", BACK_CANCEL); return ask(chatId, state.scene, "event_time", "أرسل الوقت أو -:", { ...data, event_date: date }); }
    if (state.step === "event_time") return ask(chatId, state.scene, "location", "أرسل المكان أو -:", { ...data, event_time: valueOf(value) });
    if (state.step === "location") { const remaining = daysUntil(String(data.event_date)); try { await insert("dates", { id: id(), type: data.type, type_label_ar: data.typeLabelAr, course: data.course, event_name: data.event_name, event_date: data.event_date, display_date_ar: formatArabicDate(String(data.event_date)), event_time: data.event_time, remaining_time_ar: remaining >= 0 ? `متبقي ${remaining} يوم` : "منتهي", days_until: remaining, location: valueOf(value) }); return home(chatId, "تمت إضافة الموعد."); } catch (error) { return send(chatId, `تعذر حفظ الموعد: ${esc(error instanceof Error ? error.message : error)}`, MAIN_MENU); } }
  }
  if (state.scene === "schedule_add") {
    if (state.step === "course") return ask(chatId, state.scene, "course_code", "أرسل كود المقرر أو -:", { ...data, course: value });
    if (state.step === "course_code") return ask(chatId, state.scene, "type", "اكتب lecture أو section:", { ...data, course_code: valueOf(value) });
    if (state.step === "type") { if (!["lecture", "section"].includes(value)) return send(chatId, "النوع يجب أن يكون lecture أو section.", BACK_CANCEL); return ask(chatId, state.scene, "day", "اكتب رقم اليوم: الأحد 0، الاثنين 1، الثلاثاء 2، الأربعاء 3، الخميس 4:", { ...data, type: value }); }
    if (state.step === "day") { const day = Number(value); if (!Number.isInteger(day) || day < 0 || day > 4) return send(chatId, "رقم اليوم غير صحيح.", BACK_CANCEL); const names = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"]; return ask(chatId, state.scene, "start", "أرسل وقت البداية HH:MM:", { ...data, day_of_week: day, day_name_ar: names[day] }); }
    if (state.step === "start") { if (!validTime(value)) return send(chatId, "الوقت غير صحيح.", BACK_CANCEL); return ask(chatId, state.scene, "end", "أرسل وقت النهاية HH:MM:", { ...data, start_time: value }); }
    if (state.step === "end") { if (!validTime(value)) return send(chatId, "الوقت غير صحيح.", BACK_CANCEL); return ask(chatId, state.scene, "location", "أرسل المكان:", { ...data, end_time: value }); }
    if (state.step === "location") return ask(chatId, state.scene, "instructor", "أرسل اسم الدكتور أو -:", { ...data, location: value, instructor: null });
    if (state.step === "instructor") { try { await insert("schedule", { id: id(), course: data.course, course_code: data.course_code, type: data.type, day_of_week: data.day_of_week, day_name_ar: data.day_name_ar, start_time: data.start_time, end_time: data.end_time, location: data.location, instructor: valueOf(value), notes: null }); return home(chatId, "تمت إضافة الحصة."); } catch (error) { return send(chatId, `تعذر حفظ الحصة: ${esc(error instanceof Error ? error.message : error)}`, MAIN_MENU); } }
  }
  if (state.scene.startsWith("edit_")) return handleEditText(chatId, state, value);
  return send(chatId, "استخدم الأزرار لإكمال العملية.", BACK_CANCEL);
}

async function handleEditText(chatId: number, state: BotState, value: string) {
  const kind = state.scene.slice(5); const field = String(state.data.field ?? ""); const rowId = String(state.data.rowId ?? ""); const table = TABLE_FOR_KIND[kind];
  if (!table || !EDIT_FIELDS[kind]?.some(([name]) => name === field)) return home(chatId, "حقل التعديل غير مدعوم.");
  if (kind === "announcement" && field === "status" && !["active", "expired"].includes(value)) return send(chatId, "الحالة يجب أن تكون active أو expired.", BACK_CANCEL);
  if (kind === "date" && field === "event_date") { const date = parseDate(value); if (!date) return send(chatId, "التاريخ غير صحيح.", BACK_CANCEL); const remaining = daysUntil(date); try { await update(table, rowId, { event_date: date, display_date_ar: formatArabicDate(date), days_until: remaining, remaining_time_ar: remaining >= 0 ? `متبقي ${remaining} يوم` : "منتهي" }); return home(chatId, "تم تعديل الموعد."); } catch (error) { return send(chatId, `تعذر التعديل: ${esc(error instanceof Error ? error.message : error)}`, MAIN_MENU); } }
  if (kind === "schedule" && ["start_time", "end_time"].includes(field) && !validTime(value)) return send(chatId, "الوقت غير صحيح.", BACK_CANCEL);
  try { await update(table, rowId, { [field]: valueOf(value) }); return home(chatId, "تم التعديل بنجاح."); } catch (error) { return send(chatId, `تعذر التعديل: ${esc(error instanceof Error ? error.message : error)}`, MAIN_MENU); }
}

async function handleDocument(chatId: number, document: any) { const state = await getState(chatId); if (state.scene === "announcement_add" && state.step === "file") { const file = await downloadFile(document.file_id); const name = String(document.file_name || "announcement-file").replace(/[^a-zA-Z0-9._-]/g, "_"); const path = `${id()}-${name}`; const { error } = await supabase.storage.from(ANNOUNCEMENTS_BUCKET).upload(path, file.bytes, { contentType: document.mime_type || "application/octet-stream", upsert: false }); if (error) return send(chatId, `تعذر رفع المرفق: ${esc(error.message)}`, MAIN_MENU); return saveAnnouncement(chatId, { ...state.data, attachmentPath: path, attachmentName: document.file_name || name }); }
  if (state.scene === "file_add" && state.step === "file") { try { return saveCourseFile(chatId, document, state); } catch (error) { return send(chatId, `تعذر حفظ الملف: ${esc(error instanceof Error ? error.message : error)}`, MAIN_MENU); } }
  return send(chatId, "ابدأ عملية رفع الملف من لوحة التحكم أولًا.", MAIN_MENU); }

async function callback(chatId: number, callbackId: string, data: string) {
  await answerCallback(callbackId);
  if (data === "nav:cancel") return home(chatId, "تم الإلغاء.");
  if (data === "nav:home") return home(chatId);
  if (data === "nav:back") { const state = await getState(chatId); if (state.scene === "announcement_add") return state.step === "attachment" ? announcementScope(chatId, state.data) : state.step === "scope" ? ask(chatId, state.scene, "content", "أرسل نص الإعلان:", state.data, CANCEL) : home(chatId); if (state.scene === "edit_announcement" || state.scene.startsWith("edit_")) return home(chatId); return home(chatId); }
  if (data === "scene:announcement:add") return startAnnouncement(chatId);
  if (data === "scene:date:add") return startDate(chatId);
  if (data === "scene:course:add") return startCourse(chatId);
  if (data === "scene:schedule:add") return startSchedule(chatId);
  if (data === "scene:file:add") return startFile(chatId);
  if (data === "list:announcements") return listAnnouncements(chatId);
  if (data === "list:dates") return listDates(chatId);
  if (data === "list:courses") return listCourses(chatId);
  if (data === "list:schedule") return listSchedule(chatId);
  if (data === "list:files") return listFiles(chatId);
  if (data === "list:official") return listOfficial(chatId);
  if (data === "list:feedback") return listFeedback(chatId);
  if (data.startsWith("item:announcement:")) return showAnnouncement(chatId, data.slice("item:announcement:".length));
  if (data.startsWith("item:date:")) return showDate(chatId, data.slice("item:date:".length));
  if (data.startsWith("item:course:")) return showCourse(chatId, data.slice("item:course:".length));
  if (data.startsWith("item:schedule:")) return showSchedule(chatId, data.slice("item:schedule:".length));
  if (data.startsWith("item:file:")) return showFile(chatId, data.slice("item:file:".length));
  if (data.startsWith("delete:")) { const [, kind, rowId] = data.split(":"); return deleteItem(chatId, kind, rowId); }
  if (data.startsWith("edit:")) { const [, kind, rowId] = data.split(":"); return beginEdit(chatId, kind, rowId); }
  if (data.startsWith("editfield:")) { const [, kind, field] = data.split(":"); const state = await getState(chatId); return setState(chatId, { scene: `edit_${kind}`, step: "value", data: { ...state.data, field } }).then(() => send(chatId, `أرسل قيمة «${esc(field)}»:`, BACK_CANCEL)); }
  if (data.startsWith("date:type:")) { const type = data.slice(10); return ask(chatId, "date_add", "course", "أرسل اسم المقرر:", { type, typeLabelAr: DATE_TYPES[type] }); }
  if (data.startsWith("annscope:")) { const mode = data.slice(9); const state = await getState(chatId); if (mode === "general") return announcementAttachment(chatId, { ...state.data, courseRef: null }); if (mode === "manual") return ask(chatId, "announcement_add", "manual_course", "اكتب اسم المادة كما تريد ظهوره، أو اكتب عام:", state.data); return send(chatId, "اختر مادة من البيانات الحالية:", await courseKeyboard("anncourse", false)); }
  if (data.startsWith("anncourse:")) { const state = await getState(chatId); const selected = data.slice(10); if (selected === "general") return announcementAttachment(chatId, { ...state.data, courseRef: null }); const { data: course } = await supabase.from("courses").select("code,name_ar,name_en").eq("id", selected).maybeSingle(); if (!course) return home(chatId, "المادة غير موجودة."); return announcementAttachment(chatId, { ...state.data, courseRef: course.name_ar || course.name_en || course.code }); }
  if (data.startsWith("annattach:")) { const mode = data.slice(10); const state = await getState(chatId); if (mode === "none") return saveAnnouncement(chatId, state.data); if (mode === "link") return ask(chatId, "announcement_add", "link", "أرسل رابط الإعلان:", state.data, BACK_CANCEL); return ask(chatId, "announcement_add", "file", "أرسل ملف الإعلان الآن كـ Document:", state.data, BACK_CANCEL); }
  if (data.startsWith("filecourse:")) { const selected = data.slice(11); const state = await getState(chatId); if (selected === "general") return ask(chatId, "file_add", "title", "أرسل عنوان الملف:", { ...state.data, courseId: null }); return ask(chatId, "file_add", "title", "أرسل عنوان الملف:", { ...state.data, courseId: selected }); }
  if (data.startsWith("filecat:")) { const state = await getState(chatId); return ask(chatId, "file_add", "file", "أرسل الملف الآن:", { ...state.data, category: data.slice(8) }); }
  return send(chatId, "أمر غير معروف.", MAIN_MENU);
}

async function dispatch(update: any) {
  const message = update.message; const query = update.callback_query; const chatId = message?.chat?.id ?? query?.message?.chat?.id;
  if (chatId !== ADMIN_CHAT_ID) return;
  if (query) return callback(chatId, query.id, query.data || "");
  if (message?.document) return handleDocument(chatId, message.document);
  if (message?.text) {
    const state = await getState(chatId);
    if (state.scene === "file_add" && state.step === "title") return ask(chatId, "file_add", "category", "اختر تصنيف الملف:", { ...state.data, title: message.text.trim() }, { inline_keyboard: [[{ text: "محاضرات", callback_data: "filecat:lectures" }, { text: "سكاشن", callback_data: "filecat:sections" }], [{ text: "ملخصات", callback_data: "filecat:summaries" }, { text: "حلول", callback_data: "filecat:solutions" }], [{ text: "امتحانات", callback_data: "filecat:exams" }, { text: "أخرى", callback_data: "filecat:other" }], [{ text: "إلغاء", callback_data: "nav:cancel" }]] });
    return handleText(chatId, message.text);
  }
  return send(chatId, "استخدم لوحة التحكم.", MAIN_MENU);
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("OK", { status: 200 });
  if (request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== WEBHOOK_SECRET) return new Response("Unauthorized", { status: 401 });
  try { await dispatch(await request.json()); } catch (error) { console.error("telegram-bot error", error); }
  return new Response("OK", { status: 200 });
});

void COURSE_ICONS_BUCKET;
void COURSE_MATERIALS_BUCKET;
void ANNOUNCEMENTS_BUCKET;
void EMPTY_STATE;
void valueOf;
void short;
void esc;
