import { run, get, all } from "../config/database.js";
import { v4 as uuidv4 } from "uuid";

const ENGLISH_BAD_WORDS = [
  "fuck",
  "fucking",
  "fuck you",
  "fucked",
  "fucker",
  "motherfucker",
  "shit",
  "shitty",
  "bullshit",
  "horseshit",
  "dipshit",
  "ass",
  "asshole",
  "dumbass",
  "jackass",
  "dumb ass",
  "bitch",
  "bitchy",
  "son of a bitch",
  "bastard",
  "damn",
  "goddamn",
  "dammit",
  "crap",
  "crappy",
  "piss",
  "pissed",
  "piss off",
  "nigger",
  "nigga",
  "n-word",
  "chink",
  "chinky",
  "spic",
  "spick",
  "kike",
  "fag",
  "faggot",
  "faggy",
  "retard",
  "retarded",
  "tard",
  "dyke",
  "tranny",
  "porn",
  "porno",
  "pornography",
  "sex",
  "sexy",
  "sexual",
  "nude",
  "naked",
  "cock",
  "dick",
  "penis",
  "pussy",
  "vagina",
  "cunt",
  "boobs",
  "tits",
  "breasts",
  "masturbate",
  "masturbation",
  "orgasm",
  "cum",
  "cumming",
  "blowjob",
  "handjob",
  "idiot",
  "stupid",
  "moron",
  "imbecile",
  "loser",
  "failure",
  "ugly",
  "disgusting",
  "fat",
  "fatty",
  "fatso",
  "whore",
  "slut",
  "prostitute",
  "wanker",
  "jerk off",
  "drug",
  "drugs",
  "dope",
  "cocaine",
  "coke",
  "crack",
  "heroin",
  "meth",
  "crystal meth",
  "marijuana",
  "weed",
  "pot",
  "cannabis",
  "lsd",
  "acid",
  "ecstasy",
  "mdma",
];

const CHINESE_BAD_WORDS = [
  "操",
  "操你",
  "操你妈",
  "操你大爷",
  "艹",
  "艹你",
  "艹你妈",
  "草",
  "草你",
  "草你妈",
  "他妈的",
  "他妈",
  "TMD",
  "tmd",
  "去你妈的",
  "去死",
  "傻逼",
  "傻B",
  "SB",
  "sb",
  "煞笔",
  "牛逼",
  "牛B",
  "NB",
  "nb",
  "装逼",
  "装B",
  "二逼",
  "二B",
  "鸡巴",
  "JB",
  "jb",
  "阴茎",
  "逼",
  "阴道",
  "屁眼",
  "肛门",
  "王八蛋",
  "王八",
  "混蛋",
  "混账",
  "畜生",
  "畜牲",
  "贱人",
  "贱货",
  "婊子",
  "婊",
  "滚蛋",
  "滚开",
  "滚",
  "废物",
  "垃圾",
  "白痴",
  "弱智",
  "脑残",
  "神经病",
  "疯子",
  "你妈",
  "你奶奶",
  "你大爷",
  "妈的",
  "娘的",
  "干你娘",
  "干你妈",
  "做爱",
  "性交",
  "强奸",
  "强暴",
  "卖淫",
  "嫖娼",
  "毒品",
  "吸毒",
  "大麻",
  "冰毒",
  "海洛因",
  "摇头丸",
];

const OFFENSIVE_SLANG = [
  "kys",
  "kill yourself",
  "gtfo",
  "get the fuck out",
  "stfu",
  "shut the fuck up",
  "wtf",
  "what the fuck",
  "omfg",
  "oh my fucking god",
  "fml",
  "fuck my life",
  "ffs",
  "for fuck sake",
  "lmfao",
  "laughing my fucking ass off",
  "roflmao",
];

const ARABIC_BAD_WORDS = [
  "كس أمك",
  "كس امك",
  "كسومك",
  "يلعن أمك",
  "يلعن امك",
  "يلعن أبوك",
  "يلعن ابوك",
  "كسختك",
  "شرموط",
  "شرموطة",
  "عاهرة",
  "قحبة",
  "قحبه",
  "زبالة",
  "حقير",
  "حيوان",
  "كس",
  "زب",
  "زبر",
  "طيز",
  "خرا",
  "حمار",
  "كلب",
  "خنزير",
  "ابن الشرموطة",
  "ابن شرموطة",
  "ابن القحبة",
  "مخنث",
  "لوطي",
  "نيك",
  "نك",
  "سكس",
  "اغتصاب",
  "يلعن دينك",
  "كس دينك",
];

const MOROCCAN_BAD_WORDS = [
  "زرب",
  "زربي",
  "زبر",
  "زب",
  "طيز",
  "طيزي",
  "طيزك",
  "كحبة",
  "كحاب",
  "شرموط",
  "شرموطة",
  "قحبة",
  "ميريكان",
  "موتك",
  "ختك",
  "اختك",
  "بوك",
  "أبوك",
  "زرب موتك",
  "زرب ختك",
  "حشومة",
  "عيب",
  "نكاح",
  "نيك",
  "نك",
  "مزيان",
  "مليح",
  "سلوقي",
  "بغالي",
  "حرامي",
  "كذاب",
  "خايس",
  "فاشل",
  "عفار",
  "نكح",
  "سيفور",
  "سير تزرب",
  "سير نيك",
  "بزاف عليك",
  "ما كاين والو",
];

const BANGLA_BAD_WORDS = [
  "মাগী",
  "মাগি",
  "খানকী",
  "খানকি",
  "রান্ডী",
  "রান্ডি",
  "রাঁড়ি",
  "পর্ন",
  "পর্নো",
  "চোদন",
  "চুদন",
  "চুদি",
  "চুদ",
  "চুদাচুদি",
  "গুদ",
  "বাড়া",
  "বেড়া",
  "নুনু",
  "পোঁদ",
  "পোদ",
  "পায়খানা",
  "মাগীর পোলা",
  "মাগির পোলা",
  "রান্ডির পোলা",
  "মায়ের",
  "মায়ের চোদা",
  "বোনের",
  "বোনের চোদা",
  "মাগীর বাচ্চা",
  "হারামি",
  "হারামী",
  "হারামজাদা",
  "হারামজাদি",
  "বেইমান",
  "বদমাশ",
  "গুণ্ডা",
  "ছিনতাইকারী",
  "চোর",
  "মিথ্যাবাদী",
  "মিথ্যাবাদি",
  "কুত্তা",
  "কুকুর",
  "শুকর",
  "শূকর",
  "গরু",
  "গাধা",
  "বোকা",
  "মূর্খ",
  "পাগল",
  "নপুংসক",
  "খোজা",
  "সেক্স",
  "ধর্ষণ",
  "ব্লুফিল্ম",
  "নগ্ন",
  "নাস্তিক",
  "কাফের",
  "কাফির",
  "মুনাফিক",
  "শালা",
  "শালি",
  "বেটা",
  "বেটি",
  "ছোকরা",
  "ছোকরি",
];

const BENGLISH_BAD_WORDS = [
  "magi",
  "magir",
  "magi pola",
  "khanki",
  "khankir",
  "khanki pola",
  "randi",
  "randir",
  "randi pola",
  "chudi",
  "choda",
  "chudan",
  "chudacudi",
  "chud",
  "gud",
  "guda",
  "bara",
  "bera",
  "nunu",
  "pod",
  "poda",
  "ponda",
  "paykhana",
  "paikhana",
  "magir pola",
  "magir baccha",
  "randir pola",
  "maer choda",
  "mar choda",
  "boner choda",
  "harami",
  "haramzada",
  "haramjadi",
  "beiman",
  "badmash",
  "gunda",
  "chor",
  "mithyabadi",
  "kutta",
  "kukur",
  "shukor",
  "shukur",
  "goru",
  "gadha",
  "boka",
  "murkho",
  "pagol",
  "nopungshok",
  "khoja",
  "sex",
  "dhorshon",
  "bluefilm",
  "nogno",
  "nastik",
  "kafer",
  "kafir",
  "munafik",
  "shala",
  "shali",
  "beta",
  "beti",
  "chokora",
  "chokori",
  "mg",
  "mgi",
  "rndi",
  "r ndi",
  "chk",
  "ch ki",
  "hrm",
  "hrmi",
  "shl",
  "shla",
];

const ARABISH_BAD_WORDS = [
  "kos omak",
  "kosomak",
  "ks omak",
  "ksomak",
  "kos ommak",
  "kosommak",
  "yalan omak",
  "yilan omak",
  "yalaan omak",
  "yalan abouk",
  "yilan abouk",
  "kos ukhtak",
  "kosukhtak",
  "ks ukhtak",
  "sharmoot",
  "sharmoota",
  "sharmuta",
  "ahra",
  "ahera",
  "kahba",
  "kahaba",
  "qahba",
  "qahaba",
  "zabala",
  "haqeer",
  "haqir",
  "hayawan",
  "kos",
  "koss",
  "ks",
  "zab",
  "zib",
  "zeb",
  "zabr",
  "teez",
  "tiz",
  "tizz",
  "khara",
  "5ara",
  "5ra",
  "hmar",
  "hemar",
  "kalb",
  "kelb",
  "khinzir",
  "khanzeer",
  "ibn sharmoota",
  "ben sharmoota",
  "ibn kahba",
  "ben kahba",
  "mukhanath",
  "lawti",
  "luti",
  "neek",
  "nik",
  "nk",
  "seks",
  "ightisab",
  "yalan deenak",
  "yilan dinak",
  "kos deenak",
  "ks dinak",
  "kso",
  "k o",
  "shm",
  "shmoot",
  "khb",
  "k hba",
];

const MOROCCANLISH_BAD_WORDS = [
  "zerb",
  "zarb",
  "zerbi",
  "zeb",
  "zab",
  "zebr",
  "teez",
  "tiz",
  "teezi",
  "teezak",
  "kahba",
  "ka7ba",
  "kaba",
  "qahba",
  "sharmoot",
  "sharmouta",
  "charmouta",
  "mirikan",
  "merikan",
  "mou tak",
  "moutak",
  "mmtak",
  "khtak",
  "ukhtak",
  "bouk",
  "abouk",
  "zerb moutak",
  "zerb mou tak",
  "zerb khtak",
  "hashoma",
  "hshoma",
  "aib",
  "ayb",
  "nikah",
  "nekah",
  "neek",
  "nik",
  "mzyan",
  "mezian",
  "mlih",
  "mellih",
  "slougi",
  "salougi",
  "bgali",
  "bagali",
  "hram",
  "harami",
  "kadb",
  "kadab",
  "kazzab",
  "khayess",
  "khays",
  "fashel",
  "fachel",
  "afar",
  "afer",
  "nkah",
  "sifour",
  "sifor",
  "sir tzerb",
  "ser tzerb",
  "sir neek",
  "ser nik",
  "bzaf alik",
  "bzzaf alik",
  "ma kayn walo",
  "makayn walo",
  "zrb",
  "z rb",
  "zb",
  "z b",
  "tz",
  "t z",
  "n9",
  "n 9",
  "7rm",
  "7 rm",
];

const SHORTCUT_WORDS = [
  "fuk",
  "fuking",
  "fuked",
  "fuker",
  "shyt",
  "sh!t",
  "sht",
  "b!tch",
  "btch",
  "bich",
  "azz",
  "azzhole",
  "aszhole",
  "n!gga",
  "n!gger",
  "niga",
  "f@g",
  "r3tard",
  "rtard",
  "s3x",
  "sxe",
  "p0rn",
  "prn",
  "f4ck",
  "fck",
  "fvck",
  "sh1t",
  "5h1t",
  "b1tch",
  "b7tch",
  "a55",
  "a5s",
  "p0rn0",
  "k5ba",
  "ka5ba",
  "7mar",
  "8ahba",
  "9ahba",
  "n1k",
  "n!k",
  "cao",
  "caonima",
  "cnm",
  "sha bi",
  "shabi",
  "niu bi",
  "niubi",
  "tm",
  "tmd",
  "jb",
  "mlgb",
  "chd",
  "ch di",
  "wt f",
  "w t f",
  "om f g",
  "f f s",
  "f m l",
  "k y s",
  "g t f o",
  "s t f u",
];

const ALL_BAD_WORDS = [
  ...ENGLISH_BAD_WORDS,
  ...CHINESE_BAD_WORDS,
  ...OFFENSIVE_SLANG,
  ...ARABIC_BAD_WORDS,
  ...MOROCCAN_BAD_WORDS,
  ...BANGLA_BAD_WORDS,
  ...BENGLISH_BAD_WORDS,
  ...ARABISH_BAD_WORDS,
  ...MOROCCANLISH_BAD_WORDS,
  ...SHORTCUT_WORDS,
];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function containsBadWords(content: string): boolean {
  const normalizedContent = normalizeText(content);

  for (const word of ALL_BAD_WORDS) {
    const normalizedWord = word.toLowerCase();
    const patterns = [
      normalizedWord,
      ` ${normalizedWord} `,
      `${normalizedWord} `,
      ` ${normalizedWord}`,
    ];

    for (const pattern of patterns) {
      if (
        normalizedContent.includes(pattern) ||
        normalizedContent === normalizedWord
      ) {
        return true;
      }
    }
  }

  return false;
}

export function detectBadWords(content: string): string[] {
  const normalizedContent = normalizeText(content);
  const detectedWords: string[] = [];

  for (const word of ALL_BAD_WORDS) {
    const normalizedWord = word.toLowerCase();
    const patterns = [
      normalizedWord,
      ` ${normalizedWord} `,
      `${normalizedWord} `,
      ` ${normalizedWord}`,
    ];

    for (const pattern of patterns) {
      if (
        normalizedContent.includes(pattern) ||
        normalizedContent === normalizedWord
      ) {
        if (!detectedWords.includes(word)) {
          detectedWords.push(word);
        }
        break;
      }
    }
  }

  return detectedWords;
}

export interface UserFlag {
  id: string;
  user_id: string;
  flag_type: "auto" | "manual";
  reason: string;
  source: "social_post" | "social_comment" | "discord" | "language_exchange";
  source_id: string | null;
  content_preview: string | null;
  detected_words: string[];
  restriction_type: "temporary" | "permanent";
  restriction_days: number;
  restricted_features: string[];
  restricted_at: string;
  restriction_ends_at: string | null;
  is_active: number;
  created_at: string;
  admin_id: string | null;
}

export interface UserRestriction {
  is_restricted: boolean;
  restriction?: UserFlag;
  restricted_features: string[];
}

export async function checkUserRestriction(
  userId: string,
): Promise<UserRestriction> {
  const activeFlag = await get<any>(
    `SELECT * FROM user_flags
     WHERE user_id = ? AND is_active = 1
     AND (restriction_ends_at IS NULL OR restriction_ends_at > datetime('now'))
     ORDER BY created_at DESC LIMIT 1`,
    [userId],
  );

  if (!activeFlag) {
    return {
      is_restricted: false,
      restricted_features: [],
    };
  }

  return {
    is_restricted: true,
    restriction: {
      ...activeFlag,
      detected_words: JSON.parse(activeFlag.detected_words || "[]"),
      restricted_features: JSON.parse(activeFlag.restricted_features || "[]"),
    },
    restricted_features: JSON.parse(activeFlag.restricted_features || "[]"),
  };
}

export async function isFeatureRestricted(
  userId: string,
  feature: string,
): Promise<boolean> {
  const restriction = await checkUserRestriction(userId);

  if (!restriction.is_restricted) {
    return false;
  }

  return restriction.restricted_features.includes(feature);
}

export function createUserFlag(
  userId: string,
  source: "social_post" | "social_comment" | "discord" | "language_exchange",
  sourceId: string | null,
  content: string,
  detectedWords: string[],
  restrictionDays: number = 3,
): UserFlag {
  const flagId = uuidv4();
  const now = new Date();
  const endsAt = new Date(
    now.getTime() + restrictionDays * 24 * 60 * 60 * 1000,
  );

  const contentPreview = content.substring(0, 200);
  const restrictedFeatures = [source];

  run(
    `INSERT INTO user_flags (
      id, user_id, flag_type, reason, source, source_id, content_preview, detected_words,
      restriction_type, restriction_days, restricted_features, restricted_at, restriction_ends_at, is_active
    ) VALUES (?, ?, 'auto', ?, ?, ?, ?, ?, 'temporary', ?, ?, datetime('now'), ?, 1)`,
    [
      flagId,
      userId,
      `Inappropriate content detected in ${source.replace("_", " ")}`,
      source,
      sourceId,
      contentPreview,
      JSON.stringify(detectedWords),
      restrictionDays,
      JSON.stringify(restrictedFeatures),
      endsAt.toISOString(),
    ],
  );

  logModerationAction(
    userId,
    source,
    sourceId,
    content,
    detectedWords,
    "user_restricted",
  );

  return {
    id: flagId,
    user_id: userId,
    flag_type: "auto",
    reason: `Inappropriate content detected in ${source.replace("_", " ")}`,
    source,
    source_id: sourceId,
    content_preview: contentPreview,
    detected_words: detectedWords,
    restriction_type: "temporary",
    restriction_days: restrictionDays,
    restricted_features: restrictedFeatures,
    restricted_at: now.toISOString(),
    restriction_ends_at: endsAt.toISOString(),
    is_active: 1,
    created_at: now.toISOString(),
    admin_id: null,
  };
}

export function logModerationAction(
  userId: string,
  contentType: string,
  contentId: string | null,
  originalContent: string,
  detectedWords: string[],
  actionTaken: "flagged" | "removed" | "user_restricted",
): void {
  const logId = uuidv4();

  run(
    `INSERT INTO content_moderation_log (
      id, user_id, content_type, content_id, original_content, detected_words, action_taken
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      logId,
      userId,
      contentType,
      contentId || "",
      originalContent.substring(0, 2000),
      JSON.stringify(detectedWords),
      actionTaken,
    ],
  );
}

export function scheduleContentDeletion(
  contentType: "post" | "comment" | "discord_message" | "exchange_message",
  contentId: string,
  delayMinutes: number = 1,
): void {
  setTimeout(
    () => {
      if (contentType === "post") {
        run(`UPDATE posts SET deleted_at = datetime('now') WHERE id = ?`, [
          contentId,
        ]);
      } else if (contentType === "comment") {
        run(`UPDATE comments SET deleted_at = datetime('now') WHERE id = ?`, [
          contentId,
        ]);
      } else if (contentType === "discord_message") {
        run(
          `UPDATE discord_messages SET deleted_at = datetime('now') WHERE id = ?`,
          [contentId],
        );
      } else if (contentType === "exchange_message") {
        run(
          `UPDATE language_exchange_messages SET deleted_at = datetime('now') WHERE id = ?`,
          [contentId],
        );
      }
    },
    delayMinutes * 60 * 1000,
  );
}

export async function extendUserBan(
  flagId: string,
  adminId: string,
  additionalDays: number,
): Promise<void> {
  const flag = await get<{
    id: string;
    user_id: string;
    restriction_ends_at: string | null;
  }>(`SELECT id, user_id, restriction_ends_at FROM user_flags WHERE id = ?`, [
    flagId,
  ]);

  if (!flag) return;

  let newEndsAt: Date;
  const now = new Date();

  if (flag.restriction_ends_at && new Date(flag.restriction_ends_at) > now) {
    newEndsAt = new Date(flag.restriction_ends_at);
    newEndsAt.setDate(newEndsAt.getDate() + additionalDays);
  } else {
    newEndsAt = new Date(now.getTime() + additionalDays * 24 * 60 * 60 * 1000);
  }

  await run(
    `UPDATE user_flags SET restriction_ends_at = ?, restriction_days = restriction_days + ?, admin_id = ? WHERE id = ?`,
    [newEndsAt.toISOString(), additionalDays, adminId, flagId],
  );
}

export function unbanUser(flagId: string, adminId: string): void {
  run(`UPDATE user_flags SET is_active = 0, admin_id = ? WHERE id = ?`, [
    adminId,
    flagId,
  ]);
}

export function deleteFlag(flagId: string): void {
  run(`DELETE FROM user_flags WHERE id = ?`, [flagId]);
}

export async function getAllFlags(
  page: number = 1,
  limit: number = 20,
  status: "active" | "expired" | "all" = "all",
  source?: string,
): Promise<{ flags: any[]; total: number }> {
  const offset = (page - 1) * limit;
  let whereClause = "WHERE 1=1";
  const params: any[] = [];

  if (status === "active") {
    whereClause +=
      " AND uf.is_active = 1 AND (uf.restriction_ends_at IS NULL OR uf.restriction_ends_at > datetime('now'))";
  } else if (status === "expired") {
    whereClause +=
      " AND (uf.is_active = 0 OR (uf.restriction_ends_at IS NOT NULL AND uf.restriction_ends_at <= datetime('now')))";
  }

  if (source) {
    whereClause += " AND uf.source = ?";
    params.push(source);
  }

  const flags = await all<{
    id: string;
    user_id: string;
    flag_type: string;
    reason: string;
    source: string;
    source_id: string | null;
    content_preview: string | null;
    detected_words: string;
    restriction_type: string;
    restriction_days: number;
    restricted_features: string;
    restricted_at: string;
    restriction_ends_at: string | null;
    is_active: number;
    created_at: string;
    admin_id: string | null;
    user_name: string | null;
    user_student_id: string | null;
    user_avatar_url: string | null;
    admin_name: string | null;
    appeal_message: string | null;
    appeal_submitted_at: string | null;
    appeal_status: string;
    appeal_reviewed_at: string | null;
    appeal_reviewed_by: string | null;
  }>(
    `SELECT uf.*, 
       u.full_name as user_name, u.student_id as user_student_id, u.avatar_url as user_avatar_url,
       a.full_name as admin_name
     FROM user_flags uf
     LEFT JOIN users u ON uf.user_id = u.id
     LEFT JOIN users a ON uf.admin_id = a.id
     ${whereClause}
     ORDER BY uf.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  const totalResult = await get<{ count: number }>(
    `SELECT COUNT(*) as count FROM user_flags uf ${whereClause}`,
    params,
  );

  return {
    flags: flags.map((f) => ({
      ...f,
      detected_words: JSON.parse(f.detected_words || "[]"),
      restricted_features: JSON.parse(f.restricted_features || "[]"),
    })),
    total: totalResult?.count || 0,
  };
}

export async function getFlagStats(): Promise<{
  totalFlags: number;
  activeRestrictions: number;
  expiredRestrictions: number;
  bySource: { source: string; count: number }[];
}> {
  const totalFlags = await get<{ count: number }>(
    "SELECT COUNT(*) as count FROM user_flags",
  );

  const activeRestrictions = await get<{ count: number }>(
    `SELECT COUNT(*) as count FROM user_flags
     WHERE is_active = 1 AND (restriction_ends_at IS NULL OR restriction_ends_at > datetime('now'))`,
  );

  const expiredRestrictions = await get<{ count: number }>(
    `SELECT COUNT(*) as count FROM user_flags
     WHERE is_active = 0 OR (restriction_ends_at IS NOT NULL AND restriction_ends_at <= datetime('now'))`,
  );

  const bySource = await all<{ source: string; count: number }>(
    `SELECT source, COUNT(*) as count FROM user_flags GROUP BY source`,
  );

  return {
    totalFlags: totalFlags?.count || 0,
    activeRestrictions: activeRestrictions?.count || 0,
    expiredRestrictions: expiredRestrictions?.count || 0,
    bySource: bySource || [],
  };
}

export { ALL_BAD_WORDS };
