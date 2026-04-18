import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import '../styles/MarriageYearMonthFields.css';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Earliest marriage year (older alumni). */
export const MARRIAGE_YEAR_MIN = 1920;

const FORMAT_ERROR = 'Please enter a valid date in mm/yyyy format.';

/** Strict mm/yyyy: month 01–12, year four digits. */
const MMYYYY_STRICT = /^(0[1-9]|1[0-2])\/(\d{4})$/;

/** `YYYY-MM` → `mm/yyyy` for the input */
function toDisplay(yyyyMm) {
    if (!yyyyMm || !/^\d{4}-\d{2}$/.test(yyyyMm)) return '';
    const [y, m] = yyyyMm.split('-');
    return `${m}/${y}`;
}

/** Raw digits (max 6) → display string with slash after month */
function digitsToDraft(digits) {
    const d = digits.replace(/\D/g, '').slice(0, 6);
    if (d.length === 0) return '';
    if (d.length <= 2) return d;
    return `${d.slice(0, 2)}/${d.slice(2)}`;
}

function tryCommitDraft(draft, maxYear) {
    const s = draft.trim();
    if (!s) return { ok: true, storage: '' };
    const match = s.match(MMYYYY_STRICT);
    if (!match) {
        return { ok: false, error: FORMAT_ERROR };
    }
    const mm = match[1];
    const yyyy = match[2];
    const y = Number(yyyy);
    const m = Number(mm);
    if (m < 1 || m > 12) return { ok: false, error: FORMAT_ERROR };
    if (y < MARRIAGE_YEAR_MIN || y > maxYear) return { ok: false, error: FORMAT_ERROR };
    return { ok: true, storage: `${y}-${mm}` };
}

function CalendarGlyph() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}

/**
 * Month + year only (no day). One `mm/yyyy` field: type directly or open the month grid via the calendar button.
 * Parent `value` / `onChange` use `YYYY-MM`.
 */
export default function MarriageYearMonthFields({
    value,
    onChange,
    required = false,
    inputClassName = '',
    id,
}) {
    const errId = id ? `${id}-error` : 'marriage-date-error';
    const maxYear = new Date().getFullYear();
    const [draft, setDraft] = useState(() => toDisplay(value));
    const [error, setError] = useState('');
    const [open, setOpen] = useState(false);
    const [panelYear, setPanelYear] = useState(maxYear);
    const rootRef = useRef(null);

    const yearOptions = useMemo(() => {
        const out = [];
        for (let y = maxYear; y >= MARRIAGE_YEAR_MIN; y -= 1) out.push(y);
        return out;
    }, [maxYear]);

    useEffect(() => {
        setDraft(toDisplay(value));
    }, [value]);

    useEffect(() => {
        if (value && /^\d{4}-\d{2}$/.test(value)) {
            const y = Number(value.slice(0, 4));
            if (!Number.isNaN(y)) {
                setPanelYear(Math.min(maxYear, Math.max(MARRIAGE_YEAR_MIN, y)));
            }
        }
    }, [value, maxYear]);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
        };
        const onKey = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const syncPanelForOpen = useCallback(() => {
        if (value && /^\d{4}-\d{2}$/.test(value)) {
            setPanelYear(Number(value.slice(0, 4)));
            return;
        }
        const committed = tryCommitDraft(draft, maxYear);
        if (committed.ok && committed.storage) {
            const y = Number(committed.storage.slice(0, 4));
            setPanelYear(y);
            return;
        }
        const partial = draft.replace(/\D/g, '');
        const yy = partial.slice(2, 6);
        if (yy.length === 4) {
            const y = Number(yy);
            if (!Number.isNaN(y)) {
                setPanelYear(Math.min(maxYear, Math.max(MARRIAGE_YEAR_MIN, y)));
            }
        }
    }, [value, draft, maxYear]);

    const togglePopover = () => {
        if (!open) syncPanelForOpen();
        setOpen((o) => !o);
    };

    const commitDraft = () => {
        const result = tryCommitDraft(draft, maxYear);
        if (!result.ok) {
            setError(result.error || FORMAT_ERROR);
            return;
        }
        if (required && !result.storage) {
            setError(FORMAT_ERROR);
            return;
        }
        setError('');
        onChange(result.storage || '');
        if (result.storage) setDraft(toDisplay(result.storage));
    };

    const onInputChange = (e) => {
        setError('');
        setDraft(digitsToDraft(e.target.value));
    };

    const stepYear = (delta) => {
        setPanelYear((y) => Math.min(maxYear, Math.max(MARRIAGE_YEAR_MIN, y + delta)));
    };

    const pickMonth = (index) => {
        const mm = String(index + 1).padStart(2, '0');
        const storage = `${panelYear}-${mm}`;
        onChange(storage);
        setDraft(`${mm}/${panelYear}`);
        setError('');
        setOpen(false);
    };

    const fieldClass = ['month-year-picker-field', inputClassName].filter(Boolean).join(' ');

    return (
        <div className="month-year-picker" ref={rootRef}>
            <div className="month-year-picker-field-shell">
                <input
                    id={id}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    className={fieldClass}
                    placeholder="mm/yyyy"
                    value={draft}
                    maxLength={7}
                    aria-invalid={!!error}
                    aria-describedby={error ? errId : undefined}
                    aria-required={required}
                    aria-label="Marriage month and year"
                    onChange={onInputChange}
                    onBlur={commitDraft}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            commitDraft();
                        }
                    }}
                />
                <button
                    type="button"
                    className="month-year-picker-cal-btn month-year-picker-cal-btn--suffix"
                    onClick={(e) => {
                        e.preventDefault();
                        togglePopover();
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    aria-expanded={open}
                    aria-haspopup="dialog"
                    aria-label="Open calendar to choose month and year"
                >
                    <CalendarGlyph />
                </button>
            </div>

            {error ? (
                <p id={errId} className="month-year-picker-error" role="alert">
                    {error}
                </p>
            ) : null}

            {open && (
                <div className="month-year-picker-popover" role="dialog" aria-label="Choose month and year">
                    <div className="month-year-picker-header">
                        <button
                            type="button"
                            className="month-year-picker-nav"
                            aria-label="Previous year"
                            disabled={panelYear <= MARRIAGE_YEAR_MIN}
                            onClick={() => stepYear(-1)}
                        >
                            «
                        </button>
                        <select
                            className="month-year-picker-year-select"
                            value={panelYear}
                            onChange={(e) => setPanelYear(Number(e.target.value))}
                            aria-label="Jump to year"
                        >
                            {yearOptions.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className="month-year-picker-nav"
                            aria-label="Next year"
                            disabled={panelYear >= maxYear}
                            onClick={() => stepYear(1)}
                        >
                            »
                        </button>
                    </div>
                    <div className="month-year-picker-grid">
                        {MONTH_SHORT.map((abbr, i) => {
                            const mm = String(i + 1).padStart(2, '0');
                            const isSelected = value === `${panelYear}-${mm}`;
                            return (
                                <button
                                    key={abbr}
                                    type="button"
                                    className={`month-year-picker-cell${isSelected ? ' is-selected' : ''}`}
                                    onClick={() => pickMonth(i)}
                                >
                                    {abbr}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
