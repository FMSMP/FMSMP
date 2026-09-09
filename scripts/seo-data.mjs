// ساخت داده‌های ساختاریافته (JSON-LD) از روی محتوای واقعی سایت.
// این باعث می‌شود گوگل سوالات پرتکرار و قیمت رنک‌ها را مستقیم در نتایج نشان دهد.

import { SITE, FAQ, RANKS, SHARDS } from "../src/data/site.js";

const URL = SITE.url;

/** تبدیل اعداد فارسی به لاتین (برای فیلد price که باید عدد باشد) */
const toLatin = (s) => String(s).replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));

export function buildJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${URL}#website`,
        url: URL,
        name: SITE.name,
        alternateName: "سرور ماینکرفت FMSMP",
        description:
          "سرور ماینکرفت فارسی FMSMP با محوریت صنعت Slimefun، اقتصاد پویا و چت صوتی زنده.",
        inLanguage: "fa-IR",
        publisher: { "@id": `${URL}#org` },
      },
      {
        "@type": "Organization",
        "@id": `${URL}#org`,
        name: SITE.name,
        url: URL,
        email: SITE.ownerContact,
        logo: { "@type": "ImageObject", url: `${URL}icon.png`, width: 512, height: 512 },
        sameAs: [SITE.discord, "https://github.com/FMSMP/FMSMP"],
      },
      {
        "@type": "VideoGameServer",
        "@id": `${URL}#server`,
        name: SITE.name,
        url: URL,
        description:
          "سرور ماینکرفت فارسی ترکیبی از Slimefun و DonutSMP با چت صوتی زنده و اقتصاد پویا.",
        serverStatus: "https://schema.org/Online",
        playMode: "MultiPlayer",
        gamePlatform: `Minecraft ${SITE.edition} ${SITE.version}`,
        inLanguage: "fa-IR",
        image: `${URL}og.jpg`,
      },
      // سوالات پرتکرار — گوگل این‌ها را زیر لینک سایت نشان می‌دهد
      {
        "@type": "FAQPage",
        "@id": `${URL}#faq`,
        mainEntity: FAQ.map(([q, a]) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
      // راهنمای اتصال به سرور
      {
        "@type": "HowTo",
        "@id": `${URL}#howto`,
        name: `چگونه به سرور ماینکرفت ${SITE.name} وصل شویم؟`,
        description: `راهنمای اتصال به سرور ماینکرفت فارسی ${SITE.name} با آی‌پی ${SITE.ip}`,
        inLanguage: "fa-IR",
        step: [
          {
            "@type": "HowToStep",
            name: "ماینکرفت را باز کنید",
            text: `نسخه ${SITE.edition} ${SITE.version} را اجرا کنید.`,
          },
          {
            "@type": "HowToStep",
            name: "سرور را اضافه کنید",
            text: `در بخش Multiplayer روی Add Server بزنید و آی‌پی ${SITE.ip} را وارد کنید.`,
          },
          {
            "@type": "HowToStep",
            name: "Voice Mod را نصب کنید",
            text: "مود Simple Voice Chat را نصب کنید تا چت صوتی فعال شود.",
          },
          {
            "@type": "HowToStep",
            name: "وارد سرور شوید",
            text: "به دیسکورد بپیوندید و بازی را شروع کنید.",
          },
        ],
      },
      // رنک‌ها و بسته‌های شارد به‌عنوان محصول
      ...RANKS.map((r) => ({
        "@type": "Product",
        name: `رنک ${r.name} — ${SITE.name}`,
        description: r.features.join("، "),
        category: "Minecraft Server Rank",
        offers: {
          "@type": "Offer",
          price: toLatin(r.price),
          priceCurrency: "IRR",
          availability: "https://schema.org/InStock",
          url: SITE.discord,
        },
      })),
      ...SHARDS.map((s) => ({
        "@type": "Product",
        name: `${s.amount} شارد — ${SITE.name}`,
        description: `بسته ${s.amount} شارد برای سرور ماینکرفت ${SITE.name}`,
        category: "Minecraft Server Currency",
        offers: {
          "@type": "Offer",
          price: toLatin(s.price),
          priceCurrency: "IRR",
          availability: "https://schema.org/InStock",
          url: SITE.discord,
        },
      })),
    ],
  };
}
