"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";

/* ================= CONFIG ================= */
const CONFIG = {
  electionDate: "2026-10-27T07:00:00+03:00",
  registryCloseDate: "2026-09-08T23:59:00+03:00", // estimate, ~50 days before election
  govService: "https://www.gov.il/he/service/changing_address",
  // Central Elections Committee — the per-election polling-station locator
  // (kalpi.bechirot.gov.il) only goes live near election day.
  pollingLocator: "https://www.bechirot.gov.il/",
  siteUrl: "https://move-to-vote.vercel.app/",
};

/* ================= I18N ================= */
type LocaleKey = "he" | "ar" | "ru" | "en";

const LOCALES: Record<LocaleKey, { name: string; dir: "rtl" | "ltr"; tag: string }> = {
  he: { name: "עברית", dir: "rtl", tag: "he-IL" },
  ar: { name: "العربية", dir: "rtl", tag: "ar" },
  ru: { name: "Русский", dir: "ltr", tag: "ru-RU" },
  en: { name: "English", dir: "ltr", tag: "en-GB" },
};

const PERK_ICONS = ["🅿️", "💳", "🏫", "🏖️", "📬"];

const LOCALE_STORAGE_KEY = "locale";

/* ================= DESIGN OPTIONS ================= */
// Temporary A/B/C toggle so the countdown bar (previously black-on-black and
// easy to miss) can be compared against higher-contrast alternatives.
type ThemeKey = "classicBlue" | "signalRed" | "highVisAmber";

// Theme only restyles the countdown bar — the rest of the page (accent
// blue, CTA buttons, final section) stays fixed regardless of the toggle.
type Theme = {
  label: string;
  barBg: string;
  barText: string;
  barSubText: string;
  barDot: string;
};

// The countdown numbers always sit in a white pill (readable against any bar
// color), so themes only need to set the bar background, label color, and
// pulsing dot.
const THEMES: Record<ThemeKey, Theme> = {
  classicBlue: {
    label: "Classic Blue",
    barBg: "bg-zinc-950",
    barText: "text-white",
    barSubText: "text-zinc-300",
    barDot: "bg-red-500",
  },
  signalRed: {
    label: "Signal Red",
    barBg: "bg-red-600",
    barText: "text-white",
    barSubText: "text-red-100",
    barDot: "bg-yellow-300",
  },
  highVisAmber: {
    label: "High-Vis Amber",
    barBg: "bg-amber-200",
    barText: "text-zinc-950",
    barSubText: "text-zinc-900",
    barDot: "bg-red-700",
  },
};

type Copy = {
  barLabel: string;
  kicker: string;
  h1aStatic: string;
  // Rotating tail of the headline question: "עברתם [דירה? / לתל אביב? / …]"
  h1aRotating: string[];
  h1b: string;
  sub: string;
  cta: string;
  ctaSub: string;
  shareCta: string;
  shareText: string;
  copyLink: string;
  copied: string;
  facts: [string, string][];
  perksTitle: string;
  perks: string[];
  faqTitle: string;
  // [question, answer, optional label for the polling-locator link]
  faq: [string, string, string?][];
  honesty: string;
  finalTitle: string;
  foot: string;
  days: string;
  hrs: string;
  min: string;
  sec: string;
  illustrationAlt: string;
};

const T: Record<LocaleKey, Copy> = {
  he: {
    barLabel: "פנקס הבוחרים נסגר בעוד",
    kicker: "בחירות לכנסת · 27.10.2026",
    h1aStatic: "עברתם",
    h1aRotating: ["דירה?", "לתל אביב?", "לבאר שבע?", "לירושלים?"],
    h1b: "הקלפי לא עברה איתכם.",
    sub: "בישראל מצביעים רק לפי הכתובת שבתעודת הזהות. עדכון הכתובת הוא חינם, אונליין, וכחמש דקות — אבל רק עד סגירת הפנקס.",
    cta: "עדכנו כתובת עכשיו",
    ctaSub: "חינם · באתר הממשלתי הרשמי · ~5 דקות",
    shareCta: "עזרו להפיץ את הבשורה",
    shareText: "עברתם דירה? הקלפי לא עברה איתכם. עדכון כתובת לוקח חמש דקות — ובאוקטובר מצביעים ליד הבית:",
    copyLink: "העתקת קישור",
    copied: "הועתק!",
    facts: [
      ["🗳️", "בלי עדכון — תצביעו בעיר הקודמת, או שלא תצביעו בכלל"],
      ["⚖️", "החוק ממילא מחייב עדכון תוך 30 יום ממעבר"],
      ["⏱️", "השינוי נקלט תוך כ־3 ימי עסקים"],
    ],
    perksTitle: "וזה שווה הרבה מעבר לבחירות",
    perks: ["תו חניה אזורי", "הנחות בארנונה", "רישום לגנים ובתי ספר", "חופים ובריכות לתושבים", "דואר רשמי שמגיע אליכם"],
    faqTitle: "שאלות נפוצות",
    faq: [
      ["מי צריך לעדכן כתובת?", "כל מי שעבר דירה — גם בתוך אותה עיר, וגם בשכירות, בדירת שותפים או אצל ההורים. הקלפי נקבעת לפי הכתובת הרשומה בתעודת הזהות, ובעלות על הדירה לא קשורה לעניין."],
      ["מה צריך כדי לעדכן, וכמה זה עולה?", "רק הזדהות ממשלתית באתר gov.il והצהרה על הכתובת החדשה — חינם, אונליין, כחמש דקות. ספח מעודכן יישלח אליכם בדואר, ואין צורך להוציא תעודת זהות חדשה."],
      ["מה קורה אם לא אעדכן לפני סגירת הפנקס?", "תוכלו להצביע רק בקלפי שליד הכתובת הישנה. בישראל אין הצבעה בדואר ואי אפשר להצביע מקלפי אחרת — וכשהדרך רחוקה, רבים פשוט מוותרים."],
      ["מתי בדיוק נסגר פנקס הבוחרים?", "המועד המשוער הוא {DATE} — כחמישים יום לפני הבחירות. את המועד הרשמי תקבע ועדת הבחירות המרכזית, אז עדיף לא לחכות לרגע האחרון."],
      ["עוברים ליישוב קטן, לאילת או לכתובת של אדם אחר?", "במקרים האלה אי אפשר לעדכן אונליין ונדרשת הגעה ללשכת רשות האוכלוסין — כל הפרטים בעמוד השירות הממשלתי."],
      ["אפשר להירשם אצל חבר כדי להצביע בעיר אחרת?", "לא. מעדכנים רק כתובת שבה גרים בפועל — רישום פיקטיבי הוא עבירה פלילית."],
      ["איך אדע איפה הקלפי שלי?", "לקראת הבחירות תישלח אליכם הודעה לבוחר, ואפשר גם לאתר את הקלפי לפי מספר תעודת הזהות באתר ועדת הבחירות המרכזית.", "לאיתור הקלפי שלכם"],
    ],
    honesty: "מעדכנים רק לכתובת שבה אתם באמת גרים. רישום פיקטיבי הוא עבירה פלילית.",
    finalTitle: "חמש דקות היום. קלפי ליד הבית באוקטובר.",
    foot: "יוזמה אזרחית עצמאית · לא אתר ממשלתי · האתר לא אוסף שום פרט אישי",
    days: "ימים", hrs: "שע׳", min: "דק׳", sec: "שנ׳",
    illustrationAlt: "מעברים דירה — הקלפי החדשה מחכה בכתובת החדשה",
  },
  ar: {
    barLabel: "سجلّ الناخبين يُغلق بعد",
    kicker: "انتخابات الكنيست · 27.10.2026",
    h1aStatic: "انتقلتم",
    h1aRotating: ["لبيت جديد؟", "إلى تل أبيب؟", "إلى بئر السبع؟", "إلى القدس؟"],
    h1b: "صندوق الاقتراع لم ينتقل معكم.",
    sub: "في إسرائيل نصوّت فقط حسب العنوان في بطاقة الهوية. تحديث العنوان مجاني، عبر الإنترنت، ونحو خمس دقائق — لكن فقط حتى إغلاق السجلّ.",
    cta: "حدّثوا العنوان الآن",
    ctaSub: "مجانًا · في الموقع الحكومي الرسمي · ~5 دقائق",
    shareCta: "انشروا الخبر",
    shareText: "انتقلتم لبيت جديد؟ صندوق الاقتراع لم ينتقل معكم. تحديث العنوان يستغرق خمس دقائق — وفي أكتوبر تصوّتون قرب البيت:",
    copyLink: "نسخ الرابط",
    copied: "تم النسخ!",
    facts: [
      ["🗳️", "بدون تحديث — تصوّتون في المدينة السابقة، أو لا تصوّتون إطلاقًا"],
      ["⚖️", "القانون يُلزم أصلًا بالتحديث خلال 30 يومًا من الانتقال"],
      ["⏱️", "التغيير يُستوعب خلال نحو 3 أيام عمل"],
    ],
    perksTitle: "وقيمته تتجاوز الانتخابات بكثير",
    perks: ["تصريح مواقف للسكان", "تخفيضات الأرنونا", "تسجيل روضات ومدارس", "شواطئ وبرك للسكان", "بريد رسمي يصلكم"],
    faqTitle: "أسئلة شائعة",
    faq: [
      ["من يحتاج إلى تحديث العنوان؟", "كل من انتقل إلى سكن جديد — حتى داخل المدينة نفسها، وكذلك المستأجرون والساكنون في شقة مشتركة أو عند الأهل. صندوق الاقتراع يُحدَّد حسب العنوان المسجَّل في بطاقة الهوية، ولا علاقة للأمر بملكية الشقة."],
      ["ماذا يلزم للتحديث، وكم يكلّف؟", "فقط تسجيل دخول حكومي في موقع gov.il وتصريح عن العنوان الجديد — مجانًا، عبر الإنترنت، ونحو خمس دقائق. الملحق المحدَّث يصلكم بالبريد، ولا حاجة لإصدار بطاقة هوية جديدة."],
      ["ماذا يحدث إذا لم أحدّث قبل إغلاق السجلّ؟", "ستتمكنون من التصويت فقط في الصندوق قرب العنوان القديم. في إسرائيل لا يوجد تصويت بالبريد ولا يمكن التصويت من صندوق آخر — وحين تكون المسافة بعيدة، كثيرون يتنازلون ببساطة."],
      ["متى يُغلق سجلّ الناخبين بالضبط؟", "الموعد التقديري هو {DATE} — نحو خمسين يومًا قبل الانتخابات. الموعد الرسمي تحدّده لجنة الانتخابات المركزية، لذا يُفضَّل عدم الانتظار حتى اللحظة الأخيرة."],
      ["تنتقلون إلى بلدة صغيرة، إيلات أو عنوان شخص آخر؟", "في هذه الحالات لا يمكن التحديث عبر الإنترنت ويلزم الحضور شخصيًا إلى مكتب سلطة السكان — كل التفاصيل في صفحة الخدمة الحكومية."],
      ["هل يمكن التسجيل عند صديق للتصويت في مدينة أخرى؟", "لا. حدّثوا فقط عنوان سكنكم الفعلي — التسجيل الوهمي مخالفة جنائية."],
      ["كيف أعرف أين صندوق الاقتراع الخاص بي؟", "قبيل الانتخابات تصلكم بطاقة الناخب، ويمكن أيضًا تحديد موقع الصندوق حسب رقم الهوية في موقع لجنة الانتخابات المركزية.", "لتحديد موقع صندوقكم"],
    ],
    honesty: "حدّثوا فقط إلى عنوان سكنكم الفعلي. التسجيل الوهمي مخالفة جنائية.",
    finalTitle: "خمس دقائق اليوم. صندوق قرب البيت في أكتوبر.",
    foot: "مبادرة مدنية مستقلة · ليس موقعًا حكوميًا · الموقع لا يجمع أي معلومات شخصية",
    days: "أيام", hrs: "س", min: "د", sec: "ث",
    illustrationAlt: "الانتقال إلى منزل جديد — صندوق الاقتراع بانتظاركم في العنوان الجديد",
  },
  ru: {
    barLabel: "Реестр избирателей закроется через",
    kicker: "Выборы в Кнессет · 27.10.2026",
    h1aStatic: "Переехали",
    h1aRotating: ["в новую квартиру?", "в Тель-Авив?", "в Беэр-Шеву?", "в Иерусалим?"],
    h1b: "Ваш участок — нет.",
    sub: "В Израиле голосуют только по адресу в теудат-зеут. Обновление — бесплатно, онлайн, около пяти минут. Но только до закрытия реестра.",
    cta: "Обновить адрес сейчас",
    ctaSub: "Бесплатно · на официальном сайте · ~5 минут",
    shareCta: "Расскажите друзьям",
    shareText: "Переехали? Ваш участок — нет. Обновление адреса занимает пять минут — и в октябре вы голосуете рядом с домом:",
    copyLink: "Скопировать ссылку",
    copied: "Скопировано!",
    facts: [
      ["🗳️", "Без обновления — голосовать в старом городе или никак"],
      ["⚖️", "Закон и так требует обновить адрес за 30 дней после переезда"],
      ["⏱️", "Изменение вступает в силу за ~3 рабочих дня"],
    ],
    perksTitle: "И это даёт куда больше, чем выборы",
    perks: ["Парковочный талон жителя", "Скидки на арнону", "Запись в сады и школы", "Пляжи и бассейны для жителей", "Официальная почта доходит до вас"],
    faqTitle: "Частые вопросы",
    faq: [
      ["Кому нужно обновлять адрес?", "Всем, кто переехал — даже в пределах того же города; съёмная квартира, квартира с соседями или жильё у родителей тоже считаются. Участок определяется по адресу, записанному в теудат-зеут, — право собственности значения не имеет."],
      ["Что нужно для обновления и сколько это стоит?", "Только государственная идентификация на gov.il и декларация о новом адресе — бесплатно, онлайн, около пяти минут. Обновлённый вкладыш (сефах) придёт по почте; новый теудат-зеут не нужен."],
      ["Что будет, если не обновить до закрытия реестра?", "Голосовать можно будет только на участке у старого адреса. В Израиле нет голосования по почте и нельзя проголосовать на другом участке — а когда ехать далеко, многие просто не голосуют."],
      ["Когда именно закрывается реестр?", "Предварительная дата — {DATE}, примерно за пятьдесят дней до выборов. Официальную дату установит Центральная избирательная комиссия, так что лучше не откладывать на последний момент."],
      ["Переезжаете в маленький посёлок, Эйлат или на адрес другого человека?", "В этих случаях онлайн-обновление недоступно — нужен личный визит в бюро Управления регистрации населения. Подробности на странице сервиса."],
      ["Можно зарегистрироваться у друга, чтобы голосовать в другом городе?", "Нет. Указывать можно только адрес, где вы реально живёте, — фиктивная регистрация является уголовным преступлением."],
      ["Как узнать, где мой участок?", "Перед выборами вам придёт уведомление избирателя, а найти свой участок по номеру теудат-зеут можно на сайте Центральной избирательной комиссии.", "Найти свой участок"],
    ],
    honesty: "Указывайте только адрес, где реально живёте. Фиктивная регистрация — уголовное преступление.",
    finalTitle: "Пять минут сегодня. Участок у дома в октябре.",
    foot: "Независимая гражданская инициатива · не государственный сайт · никаких личных данных",
    days: "дн", hrs: "ч", min: "мин", sec: "сек",
    illustrationAlt: "Переезд в новый дом — избирательный участок ждёт по новому адресу",
  },
  en: {
    barLabel: "Voter registry closes in",
    kicker: "Knesset elections · 27.10.2026",
    h1aStatic: "You moved",
    h1aRotating: ["apartments.", "to Tel Aviv.", "to Be'er Sheva.", "to Jerusalem."],
    h1b: "Your polling station didn't.",
    sub: "In Israel you vote only where your ID says you live. Updating your address is free, online, and about five minutes — but only until the registry closes.",
    cta: "Update your address now",
    ctaSub: "Free · on the official gov site · ~5 min",
    shareCta: "Spread the word",
    shareText: "You moved — your polling station didn't. Updating your address takes five minutes, and in October you vote near home:",
    copyLink: "Copy link",
    copied: "Copied!",
    facts: [
      ["🗳️", "No update means voting in your old city — or not at all"],
      ["⚖️", "The law already requires updating within 30 days of moving"],
      ["⏱️", "Takes effect within ~3 business days"],
    ],
    perksTitle: "Worth far more than election day",
    perks: ["Resident parking permit", "Arnona discounts", "Daycare & school registration", "Resident beaches & pools", "Official mail that reaches you"],
    faqTitle: "Frequently asked questions",
    faq: [
      ["Who needs to update their address?", "Anyone who's moved — even within the same city, and renters, flatshares, or living at your parents' place all count. Your polling station follows the address registered on your ID; owning the apartment has nothing to do with it."],
      ["What do I need, and what does it cost?", "Just a government login on gov.il and a declaration of your new address — free, online, about five minutes. An updated ID appendix arrives by mail; no new ID card needed."],
      ["What happens if I don't update before the registry closes?", "You'll only be able to vote at the station near your old address. Israel has no mail-in voting and no vote-anywhere option — and when it's a long trip, many people simply skip it."],
      ["When exactly does the registry close?", "The estimated date is {DATE} — about fifty days before the election. The official date is set by the Central Elections Committee, so don't wait until the last minute."],
      ["Moving to a small community, Eilat, or someone else's address?", "These cases can't be done online — they require visiting a Population Authority bureau in person. Full details on the government service page."],
      ["Can I register at a friend's place to vote in another city?", "No. Register only where you actually live — a fictitious address is a criminal offense."],
      ["How will I know where my polling station is?", "A voter notice is sent before the election, and you can also look up your station by ID number on the Central Elections Committee website.", "Find your polling station"],
    ],
    honesty: "Register only where you actually live. A fictitious address is a criminal offense.",
    finalTitle: "Five minutes today. A polling station near home in October.",
    foot: "Independent civic initiative · not a government site · no personal data collected",
    days: "days", hrs: "hrs", min: "min", sec: "sec",
    illustrationAlt: "Moving to a new home — your polling station waits at the new address",
  },
};

/* ================= HOOKS ================= */
// A shared clock store ticking once a second. getSnapshot must return the
// same value until something actually changes, so we can't call Date.now()
// directly inside it (that broke useSyncExternalStore with a render loop) —
// instead we cache the value and only refresh it on each tick.
let clockValue = Date.now();
const clockListeners = new Set<() => void>();
if (typeof window !== "undefined") {
  setInterval(() => {
    clockValue = Date.now();
    clockListeners.forEach((listener) => listener());
  }, 1000);
}

function subscribeToClock(callback: () => void) {
  clockListeners.add(callback);
  return () => clockListeners.delete(callback);
}

function getClockSnapshot() {
  return clockValue;
}

function getServerClockSnapshot() {
  return null;
}

// null on the server (and on the client's first render, before hydration)
// so they match; useSyncExternalStore then switches to the real clock.
function useCountdown(targetIso: string) {
  const now = useSyncExternalStore(subscribeToClock, getClockSnapshot, getServerClockSnapshot);
  if (now === null) return { d: null, h: null, m: null, s: null };
  const diff = Math.max(0, new Date(targetIso).getTime() - now);
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

const fmtDate = (iso: string, tag: string) =>
  new Date(iso).toLocaleDateString(tag, { day: "numeric", month: "long", year: "numeric" });

/* ================= PRESENTATIONAL ================= */
const WORD_ROTATE_MS = 2000;

// Cycles through the headline's rotating words. Remounting the span via the
// key replays the wordSwap entrance animation on every change (globals.css
// disables it under prefers-reduced-motion).
function RotatingWord({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((v) => v + 1), WORD_ROTATE_MS);
    return () => clearInterval(id);
  }, [words]);
  const word = words[index % words.length];
  return (
    <span
      key={word}
      className="inline-block whitespace-nowrap"
      style={{ animation: "wordSwap 0.35s cubic-bezier(0.22, 1, 0.36, 1) both" }}
    >
      {word}
    </span>
  );
}

// Brand icon paths (simple-icons, 24×24 viewBox).
const ICON_PATHS = {
  whatsapp:
    "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z",
  telegram:
    "M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z",
  facebook:
    "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  x: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
} as const;

// Secondary CTA: always-visible share icons (WhatsApp first — it's the main
// channel here), copy-link with inline feedback, and a native share-sheet
// button that appears only on devices supporting the Web Share API.
const subscribeNoop = () => () => {};

function ShareRow({ t, variant = "light" }: { t: Copy; variant?: "light" | "dark" }) {
  const [copied, setCopied] = useState(false);
  // false on the server and first client render, then the real capability.
  const canNativeShare = useSyncExternalStore(
    subscribeNoop,
    () => !!navigator.share,
    () => false
  );

  const url = CONFIG.siteUrl;
  const text = t.shareText;
  const enc = encodeURIComponent;
  const dark = variant === "dark";

  const networks: { name: string; href: string; color: string; path: string }[] = [
    { name: "WhatsApp", href: `https://wa.me/?text=${enc(`${text} ${url}`)}`, color: "#25D366", path: ICON_PATHS.whatsapp },
    { name: "Telegram", href: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`, color: "#26A5E4", path: ICON_PATHS.telegram },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, color: "#1877F2", path: ICON_PATHS.facebook },
    { name: "X", href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`, color: dark ? "#ffffff" : "#0f0f0f", path: ICON_PATHS.x },
  ];

  async function handleCopy() {
    await navigator.clipboard.writeText(`${text} ${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleNativeShare() {
    try {
      await navigator.share({ text, url });
    } catch {
      // user closed the share sheet
    }
  }

  const circle = `flex h-11 w-11 items-center justify-center rounded-full border transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 ${
    dark
      ? "border-white/20 bg-white/10 hover:bg-white/20 focus-visible:ring-blue-400"
      : "border-zinc-200 bg-white shadow-sm hover:shadow-md focus-visible:ring-blue-300"
  }`;
  const strokeIcon = dark ? "text-zinc-300" : "text-zinc-600";

  return (
    <div className="flex flex-col items-center gap-3">
      <span className={`text-sm font-bold ${dark ? "text-zinc-300" : "text-zinc-600"}`}>
        <span aria-hidden="true">📣</span> {t.shareCta}
      </span>
      <div className="flex items-center gap-2.5" dir="ltr">
        {networks.map((n) => (
          <a key={n.name} href={n.href} target="_blank" rel="noopener noreferrer" aria-label={n.name} title={n.name} className={circle}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill={n.color} aria-hidden="true">
              <path d={n.path} />
            </svg>
          </a>
        ))}
        <button onClick={handleCopy} aria-label={copied ? t.copied : t.copyLink} title={copied ? t.copied : t.copyLink} className={circle}>
          {copied ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className={`h-5 w-5 ${strokeIcon}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.71" />
            </svg>
          )}
        </button>
        {canNativeShare && (
          <button onClick={handleNativeShare} aria-label={t.shareCta} title={t.shareCta} className={circle}>
            <svg viewBox="0 0 24 24" className={`h-5 w-5 ${strokeIcon}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="8.59" y1="10.49" x2="15.42" y2="6.51" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function CTA({ big, t, dir }: { big?: boolean; t: Copy; dir: "rtl" | "ltr" }) {
  return (
    <a
      href={CONFIG.govService}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex flex-col items-center gap-1"
    >
      <span
        className={`inline-flex items-center gap-3 rounded-full bg-blue-700 text-white font-black shadow-lg shadow-blue-700/30 transition-all hover:bg-blue-600 hover:shadow-blue-600/40 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${big ? "text-xl sm:text-2xl px-10 py-5" : "text-lg px-8 py-4"}`}
      >
        {t.cta}
        <span aria-hidden="true" className={`transition-transform ${dir === "rtl" ? "group-hover:-translate-x-1" : "group-hover:translate-x-1"}`}>
          {dir === "rtl" ? "←" : "→"}
        </span>
      </span>
      <span className="text-sm font-medium text-zinc-500">{t.ctaSub}</span>
    </a>
  );
}

function Unit({ n, l }: { n: number | null; l: string }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="tabular-nums font-black text-lg sm:text-xl" style={{ fontVariantNumeric: "tabular-nums" }}>
        {n === null ? "--" : String(n).padStart(2, "0")}
      </span>
      <span className="text-[10px] sm:text-xs opacity-60 font-semibold">{l}</span>
    </span>
  );
}

/* ================= APP ================= */
export default function VoteWhereYouLive() {
  const [locale, setLocale] = useState<LocaleKey>("he");
  const [themeKey, setThemeKey] = useState<ThemeKey>("classicBlue");
  const theme = THEMES[themeKey];
  const t = T[locale];
  const { dir, tag } = LOCALES[locale];
  const cd = useCountdown(CONFIG.registryCloseDate);
  const closeDate = fmtDate(CONFIG.registryCloseDate, tag);

  useEffect(() => {
    // A manually picked language (stored on change) always wins. Otherwise,
    // Hebrew is the default for everyone (including English browsers); only
    // Arabic or Russian browsers get switched automatically.
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && stored in LOCALES) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocale(stored as LocaleKey);
      return;
    }
    const browserLang = navigator.language.slice(0, 2).toLowerCase();
    if (browserLang === "ar" || browserLang === "ru") {
      // One-time sync with the browser's language, which isn't known during
      // the server render, so it can only be read after mount.
      setLocale(browserLang);
    }
  }, []);

  function handleLocaleChange(next: LocaleKey) {
    setLocale(next);
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
  }

  return (
    <div dir={dir} lang={locale} className="min-h-screen bg-white text-zinc-900 antialiased flex-1">
      {/* ===== COUNTDOWN BAR ===== */}
      <div className={`sticky top-0 z-30 ${theme.barBg} ${theme.barText}`} role="timer" aria-live="off">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`h-2 w-2 rounded-full shrink-0 ${theme.barDot}`} style={{ animation: "pulseDot 1.6s ease-in-out infinite" }} aria-hidden="true" />
            <span className={`text-xs sm:text-sm font-semibold truncate ${theme.barSubText}`}>{t.barLabel}</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 bg-white text-zinc-900 rounded-lg shadow-sm px-3 py-1.5">
            <Unit n={cd.d} l={t.days} />
            <span className="opacity-30">:</span>
            <Unit n={cd.h} l={t.hrs} />
            <span className="opacity-30">:</span>
            <Unit n={cd.m} l={t.min} />
            <span className="opacity-30">:</span>
            <span className="text-red-600"><Unit n={cd.s} l={t.sec} /></span>
          </div>
          <select
            value={locale}
            onChange={(e) => handleLocaleChange(e.target.value as LocaleKey)}
            aria-label="Language"
            className="bg-white text-zinc-900 rounded-full border border-zinc-200 shadow-sm px-3 py-1.5 text-xs sm:text-sm font-semibold shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            {Object.entries(LOCALES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ===== HERO ===== */}
      <main>
        <section className="max-w-3xl mx-auto px-5 pt-6 sm:pt-8 pb-14 text-center flex flex-col items-center gap-6">
          <p
            className="text-xs sm:text-sm font-bold tracking-widest uppercase text-blue-700 border border-blue-700 rounded px-2.5 py-1"
          >
            {t.kicker}
          </p>

          <Image
            src="/images/move-to-vote.png"
            alt={t.illustrationAlt}
            width={2172}
            height={724}
            priority
            className="w-full max-w-xl h-auto"
          />

          <h1 className="text-4xl sm:text-6xl font-black leading-[1.05] tracking-tight">
            {t.h1aStatic} <RotatingWord words={t.h1aRotating} />
            <br />
            <span className="text-blue-700">{t.h1b}</span>
          </h1>
          <p className="text-lg sm:text-xl text-zinc-600 max-w-xl leading-relaxed">{t.sub}</p>

          <div className="mt-2 mb-4 flex flex-col items-center gap-4">
            <CTA big t={t} dir={dir} />
            <ShareRow t={t} />
          </div>
        </section>

        {/* ===== FACTS ===== */}
        <section className="border-y border-zinc-100 bg-zinc-50">
          <div className="max-w-4xl mx-auto px-5 py-10 grid sm:grid-cols-3 gap-6">
            {t.facts.map(([icon, txt], i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-2xl shrink-0" aria-hidden="true">{icon}</span>
                <p className="text-zinc-700 font-medium leading-snug">{txt}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== PERKS ===== */}
        <section className="max-w-3xl mx-auto px-5 py-14 text-center">
          <h2 className="text-xl sm:text-2xl font-black mb-6">{t.perksTitle}</h2>
          <div className="flex flex-wrap justify-center gap-2.5">
            {t.perks.map((p, i) => (
              <span key={i} className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700">
                <span aria-hidden="true">{PERK_ICONS[i]}</span>
                {p}
              </span>
            ))}
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section className="border-t border-zinc-100 bg-zinc-50">
          <div className="max-w-2xl mx-auto px-5 py-14">
            <h2 className="text-xl sm:text-2xl font-black mb-6 text-center">{t.faqTitle}</h2>
            <div className="flex flex-col gap-3">
              {t.faq.map(([q, a, locatorLabel], i) => (
                <details key={i} className="group rounded-xl border border-zinc-200 bg-white px-5 py-4 open:pb-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-zinc-900 marker:content-none">
                    {q}
                    <span className="shrink-0 transition-transform group-open:rotate-45 text-xl leading-none" aria-hidden="true">+</span>
                  </summary>
                  <p className="mt-3 text-zinc-600 leading-relaxed">{a.replace("{DATE}", closeDate)}</p>
                  {locatorLabel && (
                    <a
                      href={CONFIG.pollingLocator}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:underline"
                    >
                      {locatorLabel}
                      <span aria-hidden="true">{dir === "rtl" ? "←" : "→"}</span>
                    </a>
                  )}
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FINAL CTA ===== */}
        <section className="bg-zinc-950 text-white">
          <div className="max-w-3xl mx-auto px-5 py-16 text-center flex flex-col items-center gap-6">
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">{t.finalTitle}</h2>
            <p className="font-medium text-zinc-400">⏳ {closeDate}</p>
            <CTA big t={t} dir={dir} />
            <ShareRow t={t} variant="dark" />
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="bg-zinc-950 border-t border-zinc-800">
        <div className="max-w-3xl mx-auto px-5 py-6 text-center flex flex-col gap-1.5">
          <p className="text-xs text-zinc-500">{t.foot}</p>
          <p className="text-xs text-zinc-600">⚖️ {t.honesty}</p>
        </div>
      </footer>

      {/* ===== DESIGN TOGGLE (review only) ===== */}
      <div className="fixed bottom-4 end-4 z-40 flex flex-col gap-1.5 rounded-xl bg-white/95 backdrop-blur border border-zinc-200 shadow-xl p-2" dir="ltr">
        <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 px-1">Design</span>
        {Object.entries(THEMES).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setThemeKey(k as ThemeKey)}
            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${themeKey === k ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"}`}
          >
            <span className={`h-3 w-3 rounded-full ${v.barBg} border border-zinc-300`} aria-hidden="true" />
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}
