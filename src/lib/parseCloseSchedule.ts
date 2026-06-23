const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

// Preset dropdown values mapped to their offset (in ms) from now.
const PRESET_OFFSETS: { [value: string]: number } = {
    '1h': HOUR,
    '6h': 6 * HOUR,
    '1d': DAY,
    '3d': 3 * DAY,
    '1w': WEEK,
};

const UNIT_MS: { [unit: string]: number } = {
    m: MINUTE,
    min: MINUTE,
    h: HOUR,
    hour: HOUR,
    d: DAY,
    day: DAY,
    w: WEEK,
    week: WEEK,
};

// Matches relative durations like "3 hours", "2d", "1 week".
const DURATION_RE = /^(\d+)\s*(m|min|h|hour|d|day|w|week)s?$/i;
// Matches absolute date/times like "2026-06-30" or "2026-06-30 18:00" (optional 'T').
const ABSOLUTE_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/;

/**
 * Turns the modal's duration dropdown + custom free-text into an absolute close
 * time (epoch ms, UTC). Returns `undefined` when no scheduling is requested.
 *
 * Throws a field-error object (consumable by `viewErrorResponse`) when the
 * custom input is required but missing/invalid, or when the resulting time is
 * not in the future.
 */
export function parseCloseSchedule(durationValue?: string, customText?: string): number | undefined {
    if (!durationValue || durationValue === 'off') {
        return undefined;
    }

    if (durationValue !== 'custom') {
        const offset = PRESET_OFFSETS[durationValue];
        if (offset === undefined) {
            return undefined;
        }
        return Date.now() + offset;
    }

    // Custom: parse the free-text field.
    const text = (customText || '').trim();
    if (text === '') {
        throw { closeAt: 'Please enter a duration or date/time (UTC)' };
    }

    const closesAt = parseCustom(text);
    if (closesAt === undefined) {
        throw { closeAt: 'Unrecognized date or duration. Try "3 hours" or "2026-06-30 18:00"' };
    }

    if (closesAt <= Date.now()) {
        throw { closeAt: 'Please pick a time in the future' };
    }

    return closesAt;
}

function parseCustom(text: string): number | undefined {
    const absolute = ABSOLUTE_RE.exec(text);
    if (absolute) {
        const [, year, month, day, hour = '0', minute = '0'] = absolute;
        // Interpret as UTC (server time).
        const ms = Date.UTC(
            parseInt(year, 10),
            parseInt(month, 10) - 1,
            parseInt(day, 10),
            parseInt(hour, 10),
            parseInt(minute, 10),
        );
        return isNaN(ms) ? undefined : ms;
    }

    const duration = DURATION_RE.exec(text);
    if (duration) {
        const [, amount, unit] = duration;
        return Date.now() + parseInt(amount, 10) * UNIT_MS[unit.toLowerCase()];
    }

    return undefined;
}
