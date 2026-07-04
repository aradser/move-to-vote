"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";

/* ================= CONFIG ================= */
const CONFIG = {
  electionDate: "2026-10-27T07:00:00+03:00",
  registryCloseDate: "2026-09-08T23:59:00+03:00", // estimate, ~50 days before election
  govService: "https://www.gov.il/he/service/changing_address",
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
  barAccent: string;
  barDot: string;
};

const THEMES: Record<ThemeKey, Theme> = {
  classicBlue: {
    label: "Classic Blue",
    barBg: "bg-zinc-950",
    barText: "text-white",
    barSubText: "text-zinc-300",
    barAccent: "text-red-400",
    barDot: "bg-red-500",
  },
  signalRed: {
    label: "Signal Red",
    barBg: "bg-red-600",
    barText: "text-white",
    barSubText: "text-red-100",
    barAccent: "text-yellow-200",
    barDot: "bg-yellow-300",
  },
  highVisAmber: {
    label: "High-Vis Amber",
    barBg: "bg-amber-400",
    barText: "text-zinc-950",
    barSubText: "text-zinc-800",
    barAccent: "text-red-700",
    barDot: "bg-red-700",
  },
};

type Copy = {
  barLabel: string;
  kicker: string;
  h1a: string;
  h1b: string;
  sub: string;
  cta: string;
  ctaSub: string;
  facts: [string, string][];
  perksTitle: string;
  perks: string[];
  edge: string;
  faqTitle: string;
  faq: [string, string][];
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
    h1a: "עברתם דירה?",
    h1b: "הקלפי לא עברה איתכם.",
    sub: "בישראל מצביעים רק לפי הכתובת שבתעודת הזהות. עדכון הכתובת הוא חינם, אונליין, וכחמש דקות — אבל רק עד סגירת הפנקס.",
    cta: "עדכנו כתובת עכשיו",
    ctaSub: "חינם · באתר הממשלתי הרשמי · ~5 דקות",
    facts: [
      ["🗳️", "בלי עדכון — תצביעו בעיר הקודמת, או שלא תצביעו בכלל"],
      ["⚖️", "החוק ממילא מחייב עדכון תוך 30 יום ממעבר"],
      ["⏱️", "השינוי נקלט תוך כ־3 ימי עסקים"],
    ],
    perksTitle: "וזה שווה הרבה מעבר לבחירות",
    perks: ["תו חניה אזורי", "הנחות בארנונה", "רישום לגנים ובתי ספר", "חופים ובריכות לתושבים", "דואר רשמי שמגיע אליכם"],
    edge: "עוברים ליישוב קטן, לאילת או לכתובת של אדם אחר? נדרשת הגעה ללשכה — הפרטים בעמוד השירות.",
    faqTitle: "שאלות נפוצות",
    faq: [
      ["מי צריך לעדכן כתובת?", "כל מי שעבר דירה, גם בתוך אותה עיר — הקלפי נקבעת לפי הכתובת הרשומה, לא לפי מקום המגורים בפועל."],
      ["זה באמת חינם?", "כן. העדכון מתבצע באתר gov.il הרשמי ואינו כרוך בתשלום."],
      ["הצבעתי בעבר מהכתובת הישנה, זה משנה משהו?", "לא. בכל מערכת בחירות הקלפי נקבעת לפי הכתובת הרשומה ביום סגירת הפנקס."],
      ["מה קורה אם הפנקס נסגר לפני שהספקתי לעדכן?", "תצביעו בקלפי המשויכת לכתובת הישנה. לכן כדאי לעדכן מוקדם ולא לחכות לרגע האחרון."],
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
    h1a: "انتقلتم لبيت جديد؟",
    h1b: "صندوق الاقتراع لم ينتقل معكم.",
    sub: "في إسرائيل نصوّت فقط حسب العنوان في بطاقة الهوية. تحديث العنوان مجاني، عبر الإنترنت، ونحو خمس دقائق — لكن فقط حتى إغلاق السجلّ.",
    cta: "حدّثوا العنوان الآن",
    ctaSub: "مجانًا · في الموقع الحكومي الرسمي · ~5 دقائق",
    facts: [
      ["🗳️", "بدون تحديث — تصوّتون في المدينة السابقة، أو لا تصوّتون إطلاقًا"],
      ["⚖️", "القانون يُلزم أصلًا بالتحديث خلال 30 يومًا من الانتقال"],
      ["⏱️", "التغيير يُستوعب خلال نحو 3 أيام عمل"],
    ],
    perksTitle: "وقيمته تتجاوز الانتخابات بكثير",
    perks: ["تصريح مواقف للسكان", "تخفيضات الأرنونا", "تسجيل روضات ومدارس", "شواطئ وبرك للسكان", "بريد رسمي يصلكم"],
    edge: "تنتقلون إلى بلدة صغيرة أو إيلات أو عنوان شخص آخر؟ يلزم الحضور إلى المكتب — التفاصيل في صفحة الخدمة.",
    faqTitle: "أسئلة شائعة",
    faq: [
      ["من يحتاج لتحديث العنوان؟", "كل من انتقل، حتى داخل نفس المدينة — يُحدَّد صندوق الاقتراع حسب العنوان المسجَّل، لا حسب مكان السكن الفعلي."],
      ["هل هو مجاني فعلاً؟", "نعم. يتم التحديث عبر موقع gov.il الرسمي ولا يتطلب أي دفع."],
      ["صوّتُ سابقًا من العنوان القديم، هل يغيّر ذلك شيئًا؟", "لا. في كل دورة انتخابية يُحدَّد الصندوق حسب العنوان المسجَّل عند إغلاق السجلّ."],
      ["ماذا يحدث إذا أُغلق السجلّ قبل أن أحدّث بياناتي؟", "ستصوّتون في الصندوق المرتبط بعنوانكم القديم، لذا يُفضَّل التحديث مبكرًا وعدم الانتظار للحظة الأخيرة."],
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
    h1a: "Переехали?",
    h1b: "Ваш участок — нет.",
    sub: "В Израиле голосуют только по адресу в теудат-зеут. Обновление — бесплатно, онлайн, около пяти минут. Но только до закрытия реестра.",
    cta: "Обновить адрес сейчас",
    ctaSub: "Бесплатно · на официальном сайте · ~5 минут",
    facts: [
      ["🗳️", "Без обновления — голосовать в старом городе или никак"],
      ["⚖️", "Закон и так требует обновить адрес за 30 дней после переезда"],
      ["⏱️", "Изменение вступает в силу за ~3 рабочих дня"],
    ],
    perksTitle: "И это даёт куда больше, чем выборы",
    perks: ["Парковочный талон жителя", "Скидки на арнону", "Запись в сады и школы", "Пляжи и бассейны для жителей", "Официальная почта доходит до вас"],
    edge: "Переезжаете в маленький посёлок, Эйлат или на адрес другого человека? Нужен визит в лишку — детали на странице сервиса.",
    faqTitle: "Частые вопросы",
    faq: [
      ["Кому нужно обновлять адрес?", "Всем, кто переехал, даже в пределах того же города — участок определяется по зарегистрированному адресу, а не по фактическому месту жительства."],
      ["Это правда бесплатно?", "Да. Обновление происходит на официальном сайте gov.il и не требует оплаты."],
      ["Я уже голосовал(а) по старому адресу раньше — это на что-то влияет?", "Нет. На каждых выборах участок определяется по адресу, актуальному на момент закрытия реестра."],
      ["Что если реестр закроется раньше, чем я успею обновить адрес?", "Вы будете голосовать на участке по старому адресу — поэтому лучше обновить данные заранее, не откладывая на последний момент."],
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
    h1a: "You moved.",
    h1b: "Your polling station didn't.",
    sub: "In Israel you vote only where your ID says you live. Updating your address is free, online, and about five minutes — but only until the registry closes.",
    cta: "Update your address now",
    ctaSub: "Free · on the official gov site · ~5 min",
    facts: [
      ["🗳️", "No update means voting in your old city — or not at all"],
      ["⚖️", "The law already requires updating within 30 days of moving"],
      ["⏱️", "Takes effect within ~3 business days"],
    ],
    perksTitle: "Worth far more than election day",
    perks: ["Resident parking permit", "Arnona discounts", "Daycare & school registration", "Resident beaches & pools", "Official mail that reaches you"],
    edge: "Moving to a small community, Eilat, or someone else's address? A bureau visit is required — details on the service page.",
    faqTitle: "Frequently asked questions",
    faq: [
      ["Who needs to update their address?", "Anyone who's moved, even within the same city — your polling station is based on your registered address, not where you actually live."],
      ["Is it really free?", "Yes. The update happens through the official gov.il site and costs nothing."],
      ["I voted from my old address before — does that matter?", "No. Every election cycle, your polling station is set by whatever address is on file when the registry closes."],
      ["What happens if the registry closes before I update?", "You'll vote at the station tied to your old address — so it's best to update early rather than wait until the last minute."],
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
    // Hebrew is the default for everyone (including English browsers);
    // only Arabic or Russian browsers get switched automatically.
    const browserLang = navigator.language.slice(0, 2).toLowerCase();
    if (browserLang === "ar" || browserLang === "ru") {
      // One-time sync with the browser's language, which isn't known during
      // the server render, so it can only be read after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocale(browserLang);
    }
  }, []);

  return (
    <div dir={dir} lang={locale} className="min-h-screen bg-white text-zinc-900 antialiased flex-1">
      {/* ===== COUNTDOWN BAR ===== */}
      <div className={`sticky top-0 z-30 ${theme.barBg} ${theme.barText}`} role="timer" aria-live="off">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`h-2 w-2 rounded-full shrink-0 ${theme.barDot}`} style={{ animation: "pulseDot 1.6s ease-in-out infinite" }} aria-hidden="true" />
            <span className={`text-xs sm:text-sm font-semibold truncate ${theme.barSubText}`}>{t.barLabel}</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 shrink-0" dir="ltr">
            <Unit n={cd.d} l={t.days} />
            <span className="opacity-30">:</span>
            <Unit n={cd.h} l={t.hrs} />
            <span className="opacity-30">:</span>
            <Unit n={cd.m} l={t.min} />
            <span className="opacity-30">:</span>
            <span className={theme.barAccent}><Unit n={cd.s} l={t.sec} /></span>
          </div>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as LocaleKey)}
            aria-label="Language"
            className="bg-transparent border border-current/30 rounded px-2 py-1 text-xs sm:text-sm font-semibold shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
          >
            {Object.entries(LOCALES).map(([k, v]) => (
              <option key={k} value={k} className="text-zinc-900">
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
            {t.h1a}
            <br />
            <span className="text-blue-700">{t.h1b}</span>
          </h1>
          <p className="text-lg sm:text-xl text-zinc-600 max-w-xl leading-relaxed">{t.sub}</p>

          <div className="mt-2">
            <CTA big t={t} dir={dir} />
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
          <p className="mt-8 text-sm text-zinc-500 max-w-lg mx-auto">{t.edge}</p>
        </section>

        {/* ===== FAQ ===== */}
        <section className="border-t border-zinc-100 bg-zinc-50">
          <div className="max-w-2xl mx-auto px-5 py-14">
            <h2 className="text-xl sm:text-2xl font-black mb-6 text-center">{t.faqTitle}</h2>
            <div className="flex flex-col gap-3">
              {t.faq.map(([q, a], i) => (
                <details key={i} className="group rounded-xl border border-zinc-200 bg-white px-5 py-4 open:pb-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-zinc-900 marker:content-none">
                    {q}
                    <span className="shrink-0 transition-transform group-open:rotate-45 text-xl leading-none" aria-hidden="true">+</span>
                  </summary>
                  <p className="mt-3 text-zinc-600 leading-relaxed">{a}</p>
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
