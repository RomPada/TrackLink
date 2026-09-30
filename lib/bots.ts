const BOT_PATTERNS = [
  /facebookexternalhit/i,
  /facebot/i,
  /telegrambot/i,
  /twitterbot/i,
  /linkedinbot/i,
  /slackbot/i,
  /discordbot/i,
  /skypeuripreview/i,
  /whatsapp/i,
  /pinterestbot/i,
  /googlebot/i,
  /bingbot/i,
  /yandexbot/i,
  /duckduckbot/i,
  /applebot/i,
  /embedly/i,
  /quora link preview/i,
  /crawler/i,
  /spider/i,
];

export function isLikelyBot(userAgent: string | null) {
  if (!userAgent) return true;
  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

export function isPrefetch(headers: Headers) {
  const purpose = headers.get("purpose")?.toLowerCase();
  const secPurpose = headers.get("sec-purpose")?.toLowerCase();
  const nextRouterPrefetch = headers.get("next-router-prefetch");

  return (
    purpose === "prefetch" ||
    secPurpose?.includes("prefetch") === true ||
    nextRouterPrefetch === "1"
  );
}
