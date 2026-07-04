"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";

/* ================= CONFIG ================= */
const CONFIG = {
  electionDate: "2026-10-27T07:00:00+03:00",
  registryCloseDate: "2026-09-08T23:59:00+03:00", // estimate, ~50 days before election
  registryCloseConfirmed: false,
  govService: "https://www.gov.il/he/service/changing_address",
};

/* ================= I18N ================= */
type LocaleKey = "he" | "ar" | "ru" | "en";

const LOCALES: Record<LocaleKey, { name: string; dir: "rtl" | "ltr"; tag: string }> = {
  he: { name: "עב", dir: "rtl", tag: "he-IL" },
  ar: { name: "ع", dir: "rtl", tag: "ar" },
  ru: { name: "RU", dir: "ltr", tag: "ru-RU" },
  en: { name: "EN", dir: "ltr", tag: "en-GB" },
};

type Copy = {
  barLabel: string;
  est: string;
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
    est: "מועד משוער",
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
    perks: ["תו חניה אזורי", "הנחות בארנונה", "רישום לגנים ובתי ספר", "הטבות מס ביישובים מוטבים", "חופים ובריכות לתושבים", "דואר רשמי שמגיע אליכם"],
    edge: "עוברים ליישוב קטן, לאילת או לכתובת של אדם אחר? נדרשת הגעה ללשכה — הפרטים בעמוד השירות.",
    honesty: "מעדכנים רק לכתובת שבה אתם באמת גרים. רישום פיקטיבי הוא עבירה פלילית.",
    finalTitle: "חמש דקות היום. קלפי ליד הבית באוקטובר.",
    foot: "יוזמה אזרחית עצמאית · לא אתר ממשלתי · האתר לא אוסף שום פרט אישי",
    days: "ימים", hrs: "שע׳", min: "דק׳", sec: "שנ׳",
    illustrationAlt: "מעברים דירה — הקלפי החדשה מחכה בכתובת החדשה",
  },
  ar: {
    barLabel: "سجلّ الناخبين يُغلق بعد",
    est: "موعد تقديري",
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
    perks: ["تصريح مواقف للسكان", "تخفيضات الأرنونا", "تسجيل روضات ومدارس", "امتيازات ضريبية في بلدات مستفيدة", "شواطئ وبرك للسكان", "بريد رسمي يصلكم"],
    edge: "تنتقلون إلى بلدة صغيرة أو إيلات أو عنوان شخص آخر؟ يلزم الحضور إلى المكتب — التفاصيل في صفحة الخدمة.",
    honesty: "حدّثوا فقط إلى عنوان سكنكم الفعلي. التسجيل الوهمي مخالفة جنائية.",
    finalTitle: "خمس دقائق اليوم. صندوق قرب البيت في أكتوبر.",
    foot: "مبادرة مدنية مستقلة · ليس موقعًا حكوميًا · الموقع لا يجمع أي معلومات شخصية",
    days: "أيام", hrs: "س", min: "د", sec: "ث",
    illustrationAlt: "الانتقال إلى منزل جديد — صندوق الاقتراع بانتظاركم في العنوان الجديد",
  },
  ru: {
    barLabel: "Реестр избирателей закроется через",
    est: "предварительная дата",
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
    perks: ["Парковочный талон жителя", "Скидки на арнону", "Запись в сады и школы", "Налоговые льготы в льготных городах", "Пляжи и бассейны для жителей", "Официальная почта доходит до вас"],
    edge: "Переезжаете в маленький посёлок, Эйлат или на адрес другого человека? Нужен визит в лишку — детали на странице сервиса.",
    honesty: "Указывайте только адрес, где реально живёте. Фиктивная регистрация — уголовное преступление.",
    finalTitle: "Пять минут сегодня. Участок у дома в октябре.",
    foot: "Независимая гражданская инициатива · не государственный сайт · никаких личных данных",
    days: "дн", hrs: "ч", min: "мин", sec: "сек",
    illustrationAlt: "Переезд в новый дом — избирательный участок ждёт по новому адресу",
  },
  en: {
    barLabel: "Voter registry closes in",
    est: "estimated date",
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
    perks: ["Resident parking permit", "Arnona discounts", "Daycare & school registration", "Tax credits in eligible towns", "Resident beaches & pools", "Official mail that reaches you"],
    edge: "Moving to a small community, Eilat, or someone else's address? A bureau visit is required — details on the service page.",
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
  const t = T[locale];
  const { dir, tag } = LOCALES[locale];
  const cd = useCountdown(CONFIG.registryCloseDate);
  const closeDate = fmtDate(CONFIG.registryCloseDate, tag);

  return (
    <div dir={dir} lang={locale} className="min-h-screen bg-white text-zinc-900 antialiased flex-1">
      {/* ===== COUNTDOWN BAR ===== */}
      <div className="sticky top-0 z-30 bg-zinc-950 text-white" role="timer" aria-live="off">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" style={{ animation: "pulseDot 1.6s ease-in-out infinite" }} aria-hidden="true" />
            <span className="text-xs sm:text-sm font-semibold text-zinc-300 truncate">
              {t.barLabel}
              {!CONFIG.registryCloseConfirmed && <span className="opacity-50"> · {t.est}</span>}
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 shrink-0" dir="ltr">
            <Unit n={cd.d} l={t.days} />
            <span className="opacity-30">:</span>
            <Unit n={cd.h} l={t.hrs} />
            <span className="opacity-30">:</span>
            <Unit n={cd.m} l={t.min} />
            <span className="opacity-30">:</span>
            <span className="text-red-400"><Unit n={cd.s} l={t.sec} /></span>
          </div>
          <div className="hidden sm:flex gap-1 shrink-0" role="group" aria-label="Language">
            {Object.entries(LOCALES).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setLocale(k as LocaleKey)}
                aria-pressed={locale === k}
                className={`px-2 py-0.5 rounded text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${locale === k ? "bg-white text-zinc-950" : "text-zinc-400 hover:text-white"}`}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* mobile language row */}
      <div className="sm:hidden flex justify-center gap-1 py-2 bg-zinc-50 border-b border-zinc-100" role="group" aria-label="Language">
        {Object.entries(LOCALES).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setLocale(k as LocaleKey)}
            aria-pressed={locale === k}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${locale === k ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"}`}
          >
            {v.name}
          </button>
        ))}
      </div>

      {/* ===== HERO ===== */}
      <main>
        <section className="max-w-3xl mx-auto px-5 pt-16 sm:pt-24 pb-14 text-center flex flex-col items-center gap-6">
          <p className="text-xs sm:text-sm font-bold tracking-widest text-blue-700 uppercase">{t.kicker}</p>
          <h1 className="text-4xl sm:text-6xl font-black leading-[1.05] tracking-tight">
            {t.h1a}
            <br />
            <span className="text-blue-700">{t.h1b}</span>
          </h1>
          <p className="text-lg sm:text-xl text-zinc-600 max-w-xl leading-relaxed">{t.sub}</p>

          <Image
            src="/images/move-to-vote.png"
            alt={t.illustrationAlt}
            width={2172}
            height={724}
            priority
            className="w-full max-w-xl h-auto mt-2"
          />

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
              <span key={i} className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700">
                {p}
              </span>
            ))}
          </div>
          <p className="mt-8 text-sm text-zinc-500 max-w-lg mx-auto">{t.edge}</p>
        </section>

        {/* ===== FINAL CTA ===== */}
        <section className="bg-zinc-950 text-white">
          <div className="max-w-3xl mx-auto px-5 py-16 text-center flex flex-col items-center gap-6">
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">{t.finalTitle}</h2>
            <p className="text-zinc-400 font-medium">
              ⏳ {closeDate}
              {!CONFIG.registryCloseConfirmed && <span className="opacity-60"> · {t.est}</span>}
            </p>
            <a
              href={CONFIG.govService}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-full bg-white text-zinc-950 font-black text-xl px-10 py-5 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
            >
              {t.cta}
              <span aria-hidden="true">{dir === "rtl" ? "←" : "→"}</span>
            </a>
            <p className="text-xs text-zinc-500">{t.ctaSub}</p>
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
    </div>
  );
}
