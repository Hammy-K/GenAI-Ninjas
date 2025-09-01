export type TutorialKeyParts = {
  org: string;
  mainMission: string;
  mission: string;
};

export type TutorialSeenRecord = {
  seenAt: string;
  expiresAt: string;
  videoId: string;
};

const HOURS_VALID = 24;

const buildKey = ({ org, mainMission, mission }: TutorialKeyParts) =>
  `tutorialSeen:${org}:${mainMission}:${mission}`;

export function getTutorialSeen(
  parts: TutorialKeyParts,
): TutorialSeenRecord | null {
  try {
    const raw = localStorage.getItem(buildKey(parts));

    if (!raw) return null;

    const parsed: TutorialSeenRecord = JSON.parse(raw);

    if (!parsed.expiresAt) return null;

    if (new Date(parsed.expiresAt) < new Date()) {
      removeTutorialSeen(parts);

      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function setTutorialSeen(
  parts: TutorialKeyParts,
  videoId: string,
): void {
  try {
    const now = new Date();

    const expires = new Date(now.getTime() + HOURS_VALID * 60 * 60 * 1000);

    const record: TutorialSeenRecord = {
      seenAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      videoId,
    };

    localStorage.setItem(buildKey(parts), JSON.stringify(record));
  } catch {
    // ignore if storage unavailable
  }
}

export function removeTutorialSeen(parts: TutorialKeyParts): void {
  try {
    localStorage.removeItem(buildKey(parts));
  } catch {
    // ignore
  }
}
