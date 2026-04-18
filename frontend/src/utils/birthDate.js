/** Earliest realistic birth year for validation */
export const BIRTH_DATE_MIN_YEAR = 1900;

/** Today's date as YYYY-MM-DD in local time (for `max` on `<input type="date">`). */
export function birthDateInputMax() {
    const t = new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, '0');
    const d = String(t.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Accept only empty or strict HTML date values: exactly YYYY-MM-DD,4-digit year,
 * real calendar date, year in [BIRTH_DATE_MIN_YEAR, current year].
 * @param {string} raw
 * @returns {string|null} normalized value, or `null` if invalid (caller should ignore the change)
 */
export function sanitizeIsoBirthDate(raw) {
    const v = (raw ?? '').trim();
    if (!v) return '';

    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;

    const yStr = v.slice(0, 4);
    const y = Number(yStr);
    const m = Number(v.slice(5, 7));
    const day = Number(v.slice(8, 10));

    if (yStr.length !== 4 || Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(day)) return null;

    const maxYear = new Date().getFullYear();
    if (y < BIRTH_DATE_MIN_YEAR || y > maxYear) return null;
    if (m < 1 || m > 12 || day < 1 || day > 31) return null;

    const dt = new Date(y, m - 1, day);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== day) return null;

    return v;
}

/** For API-loaded values: valid ISO date string, or empty if missing/invalid. */
export function normalizeStoredBirthDate(raw) {
    const s = (raw ?? '').trim();
    if (!s) return '';
    const ok = sanitizeIsoBirthDate(s);
    return ok === null ? '' : ok;
}
