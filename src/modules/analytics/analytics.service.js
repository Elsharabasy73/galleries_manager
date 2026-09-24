const { getPrisma } = require("../../config/prisma");

const BOT_UA_PATTERN =
  /bot|crawler|spider|slurp|mediapartners|baidu|yandex|sogou|exabot|facebot|ia_archiver|semrush|ahrefs|mj12bot|dotbot|petalbot|headless|phantom|playwright|selenium/i;

const INTERNAL_PATH_PREFIXES = ["/admin", "/dashboard"];

const GROUP_TRUNC = Object.freeze({
  day: "day",
  week: "week",
  month: "month",
});

const isBot = (userAgent) => BOT_UA_PATTERN.test(userAgent || "");

const isInternalPath = (path) =>
  INTERNAL_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

const normalizePath = (path) => {
  let p = String(path || "/").slice(0, 500);
  if (!p.startsWith("/")) p = `/${p}`;
  return p;
};

// Store one anonymous page view. Returns true when stored, false when skipped.
// Never throws — tracking must never break the site or leak errors.
const trackPageView = async ({ visitorId, sessionId, userId, path, referrer, userAgent }) => {
  const normalizedPath = normalizePath(path);
  if (isBot(userAgent)) return false;
  if (isInternalPath(normalizedPath)) return false;

  const prisma = getPrisma();
  await prisma.pageView.create({
    data: {
      visitorId,
      sessionId,
      userId: userId || null,
      path: normalizedPath,
      referrer: referrer ? String(referrer).slice(0, 1000) : null,
      userAgent: userAgent ? String(userAgent).slice(0, 500) : null,
    },
  });
  return true;
};

const parseRange = (from, to) => {
  const end = to ? new Date(to) : new Date();
  const start = from ? new Date(from) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid from/to date");
  }
  return { start, end };
};

const bucketKey = (date, groupBy) => {
  const d = new Date(date);
  if (groupBy === "month") return d.toISOString().slice(0, 7); // YYYY-MM
  return d.toISOString().slice(0, 10); // YYYY-MM-DD (day + week buckets labeled by day)
};

const fillBuckets = (start, end, groupBy) => {
  const buckets = [];
  const cursor = new Date(start);
  cursor.setUTCHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setUTCHours(0, 0, 0, 0);
  if (groupBy === "week") {
    // Align to Monday (DATE_TRUNC('week') buckets start on Monday).
    const day = (cursor.getUTCDay() + 6) % 7;
    cursor.setUTCDate(cursor.getUTCDate() - day);
  }
  while (cursor <= last) {
    buckets.push(bucketKey(cursor, groupBy));
    if (groupBy === "month") cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    else if (groupBy === "week") cursor.setUTCDate(cursor.getUTCDate() + 7);
    else cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return buckets;
};

// Admin overview of site traffic. Unique visitors = COUNT(DISTINCT visitorId),
// visits = COUNT(DISTINCT sessionId), pageViews = row count.
const getVisitorStats = async ({ from, to, groupBy = "day" } = {}) => {
  const trunc = GROUP_TRUNC[groupBy] || GROUP_TRUNC.day;
  const { start, end } = parseRange(from, to);
  const prisma = getPrisma();

  const [totals, seriesRows, topPages] = await Promise.all([
    prisma.$queryRaw`
      SELECT COUNT(*)::int AS "pageViews",
             COUNT(DISTINCT "visitorId")::int AS "visitors",
             COUNT(DISTINCT "sessionId")::int AS "visits"
      FROM "PageView"
      WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}`,
    prisma.$queryRaw`
      SELECT DATE_TRUNC(${trunc}, "createdAt") AS bucket,
             COUNT(*)::int AS "views",
             COUNT(DISTINCT "visitorId")::int AS "visitors"
      FROM "PageView"
      WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
      GROUP BY bucket
      ORDER BY bucket ASC`,
    prisma.$queryRaw`
      SELECT path,
             COUNT(*)::int AS "views",
             COUNT(DISTINCT "visitorId")::int AS "visitors"
      FROM "PageView"
      WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
      GROUP BY path
      ORDER BY "views" DESC
      LIMIT 5`,
  ]);

  // DATE_TRUNC('week') buckets start on Monday; label every bucket uniformly.
  const byBucket = new Map();
  for (const row of seriesRows) {
    const key = bucketKey(row.bucket, groupBy);
    byBucket.set(key, { views: row.views, visitors: row.visitors });
  }

  const series = fillBuckets(start, end, groupBy).map((date) => ({
    date,
    views: byBucket.get(date)?.views || 0,
    visitors: byBucket.get(date)?.visitors || 0,
  }));

  return {
    range: { from: start.toISOString(), to: end.toISOString(), groupBy: groupBy in GROUP_TRUNC ? groupBy : "day" },
    totals: totals[0] || { pageViews: 0, visitors: 0, visits: 0 },
    series,
    topPages: topPages.map((r) => ({ path: r.path, views: r.views, visitors: r.visitors })),
  };
};

module.exports = {
  trackPageView,
  getVisitorStats,
};
