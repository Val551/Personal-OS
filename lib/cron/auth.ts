/**
 * Validates the bearer token Vercel Cron sends with scheduled requests.
 * Used by every `app/api/cron/*` route handler. Locally, hit with:
 *   curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/...
 */
export function assertCronCaller(req: Request): Response | null {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return Response.json(
      { error: "CRON_SECRET is not set in env" },
      { status: 500 },
    );
  }
  const got = req.headers.get("authorization");
  if (got !== `Bearer ${expected}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
