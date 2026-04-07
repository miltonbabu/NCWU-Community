import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  article?: {
    publishedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
  breadcrumbs?: Array<{
    name: string;
    url: string;
  }>;
}

const defaultSEO = {
  title:
    "NCWU International Student Community - North China University of Water Resources and Electric Power",
  description:
    "Official unofficial community for NCWU international students. Find class schedules, HSK learning resources, campus guides, scholarship info, visa help, and student support for Bangladesh, Morocco, Pakistan, Africa, and all international students at North China University of Water Resources and Electric Power in Zhengzhou, Henan, China.",
  keywords:
    "NCWU, NCWU China, North China University of Water Resources and Electric Power, 华北水利水电大学, Zhengzhou University, Henan NCWU, NCWU student Bangladesh, NCWU Morocco, NCWU Pakistan, NCWU Africa, NCWU scholarship, NCWU tuition fees, NCWU visa, NCWU apply, NCWU international student, NCWU help, NCWU new student, class schedule, HSK Chinese, student guide, university China, study in China, Chinese scholarship",
  canonicalUrl: "https://www.ncwu.site/",
  ogImage: "https://www.ncwu.site/ncwu-logo.png",
};

export function SEO({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage,
  ogType = "website",
  article,
  breadcrumbs,
}: SEOProps) {
  useEffect(() => {
    const seoTitle = title ? `${title} | NCWU Community` : defaultSEO.title;
    const seoDescription = description || defaultSEO.description;
    const seoKeywords = keywords || defaultSEO.keywords;
    const seoCanonical = canonicalUrl || defaultSEO.canonicalUrl;
    const seoImage = ogImage || defaultSEO.ogImage;

    document.title = seoTitle;

    const updateMeta = (name: string, content: string, property = false) => {
      const selector = property
        ? `meta[property="${name}"]`
        : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;

      if (!meta) {
        meta = document.createElement("meta");
        if (property) {
          meta.setAttribute("property", name);
        } else {
          meta.setAttribute("name", name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    updateMeta("title", seoTitle);
    updateMeta("description", seoDescription);
    updateMeta("keywords", seoKeywords);
    updateMeta("og:title", seoTitle, true);
    updateMeta("og:description", seoDescription, true);
    updateMeta("og:url", seoCanonical, true);
    updateMeta("og:image", seoImage, true);
    updateMeta("og:type", ogType, true);
    updateMeta("twitter:title", seoTitle, true);
    updateMeta("twitter:description", seoDescription, true);
    updateMeta("twitter:image", seoImage, true);

    let canonicalLink = document.querySelector(
      'link[rel="canonical"]',
    ) as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", seoCanonical);

    if (article) {
      if (article.publishedTime) {
        updateMeta("article:published_time", article.publishedTime, true);
      }
      if (article.author) {
        updateMeta("article:author", article.author, true);
      }
      if (article.section) {
        updateMeta("article:section", article.section, true);
      }
      if (article.tags) {
        updateMeta("article:tag", article.tags.join(", "), true);
      }
    }

    if (breadcrumbs && breadcrumbs.length > 0) {
      const existingScript = document.querySelector(
        'script[data-seo="breadcrumbs"]',
      );
      if (existingScript) {
        existingScript.remove();
      }

      const breadcrumbScript = document.createElement("script");
      breadcrumbScript.setAttribute("type", "application/ld+json");
      breadcrumbScript.setAttribute("data-seo", "breadcrumbs");
      breadcrumbScript.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      });
      document.head.appendChild(breadcrumbScript);
    }

    return () => {
      const breadcrumbScript = document.querySelector(
        'script[data-seo="breadcrumbs"]',
      );
      if (breadcrumbScript) {
        breadcrumbScript.remove();
      }
    };
  }, [
    title,
    description,
    keywords,
    canonicalUrl,
    ogImage,
    ogType,
    article,
    breadcrumbs,
  ]);

  return null;
}

export const pageSEO = {
  home: {
    title: "NCWU International Student Community",
    description:
      "Official unofficial community for NCWU international students. Class schedules, HSK learning, campus guides, scholarship info, and student support.",
    keywords:
      "NCWU, NCWU China, North China University of Water Resources and Electric Power, international student, Zhengzhou, Henan, China",
    canonicalUrl: "https://www.ncwu.site/",
  },
  cst: {
    title: "Computer Science & Technology - CST Department",
    description:
      "CST Department class schedules, course information, and resources for Computer Science and Technology students at NCWU. 2023 Batch undergraduate program.",
    keywords:
      "NCWU CST, Computer Science NCWU, CST class schedule, NCWU computer science, CST 2023 batch, NCWU technology department",
    canonicalUrl: "https://www.ncwu.site/cst",
  },
  cstSchedule: {
    title: "CST 2023 Batch Class Schedule - 2026 Semester",
    description:
      "Weekly class schedule for Computer Science and Technology 2023 Batch at NCWU. View classes by day, time, room, and instructor.",
    keywords:
      "NCWU CST schedule, CST class timetable, NCWU computer science schedule, 2023 batch schedule, NCWU weekly classes",
    canonicalUrl: "https://www.ncwu.site/cst/schedule/2023",
  },
  economics: {
    title: "Economics Department - Class Schedule & Resources",
    description:
      "Economics Department class schedules, course information, and resources for Economics students at NCWU.",
    keywords:
      "NCWU Economics, Economics class schedule, NCWU economics department, economics NCWU China",
    canonicalUrl: "https://www.ncwu.site/economics",
  },
  economicsSchedule: {
    title: "Economics Class Schedule - 2025 Semester",
    description:
      "Weekly class schedule for Economics students at NCWU. View classes by day, time, room, and instructor.",
    keywords:
      "NCWU Economics schedule, Economics class timetable, NCWU economics weekly classes",
    canonicalUrl: "https://www.ncwu.site/economics/schedule",
  },
  hsk: {
    title: "HSK Chinese Learning - Vocabulary & Practice",
    description:
      "Learn Chinese with HSK vocabulary lists, practice tests, and study materials. HSK 1, HSK 2, HSK 3 vocabulary with pinyin, examples, and audio pronunciation.",
    keywords:
      "HSK Chinese, HSK vocabulary, learn Chinese, HSK 1, HSK 2, HSK 3, Chinese learning, NCWU Chinese, HSK practice, 汉语水平考试",
    canonicalUrl: "https://www.ncwu.site/hsk",
  },
  guides: {
    title: "Student Guides - NCWU Life & Study Tips",
    description:
      "Comprehensive guides for NCWU international students. Campus life, dormitory, food, transportation, banking, and essential tips for living in Zhengzhou, China.",
    keywords:
      "NCWU guide, student life NCWU, NCWU dormitory, NCWU food, Zhengzhou student guide, China student tips",
    canonicalUrl: "https://www.ncwu.site/guides",
  },
  campusMap: {
    title: "NCWU Campus Map - Buildings & Locations",
    description:
      "Interactive campus map of North China University of Water Resources and Electric Power. Find buildings, departments, cafeterias, libraries, and facilities.",
    keywords:
      "NCWU campus map, NCWU buildings, NCWU locations, Zhengzhou university map, NCWU campus guide",
    canonicalUrl: "https://www.ncwu.site/campus-map",
  },
  transportation: {
    title: "Transportation Guide - Getting Around Zhengzhou",
    description:
      "Transportation guide for NCWU students. Bus routes, subway, taxi, bike sharing, and travel tips for Zhengzhou and Henan province.",
    keywords:
      "Zhengzhou transportation, NCWU bus, Zhengzhou metro, China transportation, getting around Zhengzhou",
    canonicalUrl: "https://www.ncwu.site/transportation",
  },
  paymentGuide: {
    title: "Payment Guide - Banking & Money in China",
    description:
      "Complete payment guide for NCWU international students. WeChat Pay, Alipay, bank accounts, tuition fees, and money transfer tips.",
    keywords:
      "China payment, WeChat Pay, Alipay, NCWU tuition, Chinese banking, international student payment",
    canonicalUrl: "https://www.ncwu.site/payment-guide",
  },
  apps: {
    title: "Essential Apps for Students in China",
    description:
      "Must-have apps for international students in China. WeChat, Alipay, Didi, Meituan, translation apps, and useful tools for daily life.",
    keywords:
      "China apps, WeChat, Alipay, Didi, Meituan, Chinese apps, student apps China, essential apps",
    canonicalUrl: "https://www.ncwu.site/apps",
  },
  emergency: {
    title: "Emergency Contacts & Safety Information",
    description:
      "Emergency contacts and safety information for NCWU international students. Police, hospital, embassy contacts, and safety tips.",
    keywords:
      "NCWU emergency, China emergency numbers, Zhengzhou hospital, embassy China, student safety",
    canonicalUrl: "https://www.ncwu.site/emergency",
  },
  events: {
    title: "Events & Activities - NCWU Student Life",
    description:
      "Campus events, activities, and student life at NCWU. Cultural events, sports, clubs, and community activities for international students.",
    keywords:
      "NCWU events, student activities, NCWU clubs, campus life, Zhengzhou events, international student activities",
    canonicalUrl: "https://www.ncwu.site/events",
  },
};
