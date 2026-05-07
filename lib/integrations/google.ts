import { google, type calendar_v3 } from "googleapis";
import { prisma } from "@/lib/db";
import { getValidAccessToken } from "@/lib/auth/tokens";
import type { Workspace } from "@/lib/types";

const WINDOW_PAST_DAYS = 1;
const WINDOW_FUTURE_DAYS = 7;

export interface SyncResult {
  upserted: number;
  cancelled: number;
  skipped: number;
}

export async function syncGoogleCalendar(userId: string): Promise<SyncResult> {
  const accessToken = await getValidAccessToken(userId, "google");
  if (!accessToken) throw new Error("No Google access token — re-link account");

  const oauth2 = new google.auth.OAuth2();
  oauth2.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: "v3", auth: oauth2 });

  const now = new Date();
  const timeMin = new Date(now.getTime() - WINDOW_PAST_DAYS * 86_400_000);
  const timeMax = new Date(now.getTime() + WINDOW_FUTURE_DAYS * 86_400_000);

  const events: calendar_v3.Schema$Event[] = [];
  let pageToken: string | undefined;
  do {
    const res = await calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
      pageToken,
    });
    if (res.data.items) events.push(...res.data.items);
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  let upserted = 0;
  let cancelled = 0;
  let skipped = 0;

  for (const event of events) {
    if (!event.id) {
      skipped++;
      continue;
    }

    if (event.status === "cancelled") {
      const deleted = await prisma.meeting.deleteMany({
        where: { userId, externalId: event.id },
      });
      if (deleted.count > 0) cancelled++;
      continue;
    }

    const startAt = parseEventTime(event.start);
    const endAt = parseEventTime(event.end);
    if (!startAt || !endAt) {
      // All-day events (start.date) — skip for now; the dashboard treats
      // meetings as time-bound. Revisit if the user wants to see them.
      skipped++;
      continue;
    }

    const attendees =
      event.attendees
        ?.map((a) => a.email)
        .filter((e): e is string => Boolean(e)) ?? [];

    await prisma.meeting.upsert({
      where: { userId_externalId: { userId, externalId: event.id } },
      create: {
        userId,
        externalId: event.id,
        title: event.summary ?? "(no title)",
        startAt,
        endAt,
        location: event.location ?? null,
        description: event.description ?? null,
        attendees,
        workspace: deriveWorkspace(event),
      },
      update: {
        title: event.summary ?? "(no title)",
        startAt,
        endAt,
        location: event.location ?? null,
        description: event.description ?? null,
        attendees,
      },
    });
    upserted++;
  }

  return { upserted, cancelled, skipped };
}

function parseEventTime(
  t: calendar_v3.Schema$EventDateTime | undefined,
): Date | null {
  if (!t?.dateTime) return null;
  return new Date(t.dateTime);
}

function deriveWorkspace(_event: calendar_v3.Schema$Event): Workspace {
  // Heuristic placeholder — every primary-calendar event lands in
  // "internship" until per-calendar mapping ships. The user can override
  // per-event from the meeting detail page.
  return "internship";
}
