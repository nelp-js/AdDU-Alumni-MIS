import {
    useState,
    useEffect,
    useRef,
    useCallback,
    useImperativeHandle,
    forwardRef,
} from 'react';
import './BirthDateInput.css';
import { BIRTH_DATE_MIN_YEAR, birthDateInputMax } from '../utils/birthDate';

/** API / parent: YYYY-MM-DD → display mm/dd/yyyy */
function isoToUsDisplay(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
    const [y, m, d] = iso.split('-');
    return `${m}/${d}/${y}`;
}

/** Digits only, max 8 (MMDDYYYY) → mm/dd/yyyy while typing */
function digitsToUsDate(digits) {
    const raw = digits.replace(/\D/g, '').slice(0, 8);
    if (raw.length === 0) return '';
    if (raw.length <= 2) return raw;
    if (raw.length <= 4) return `${raw.slice(0, 2)}/${raw.slice(2)}`;
    return `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4)}`;
}

function parseUsBirthDate(draft, { required }) {
    const s = draft.trim();
    if (!s) {
        if (required) {
            return { ok: false, message: 'Birth date is required.', iso: '' };
        }
        return { ok: true, iso: '' };
    }

    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
        return {
            ok: false,
            message: 'Please enter a complete date as mm/dd/yyyy.',
            iso: '',
        };
    }

    const [mm, dd, yyyy] = s.split('/');
    const month = Number(mm);
    const day = Number(dd);
    const year = Number(yyyy);
    const maxYear = new Date().getFullYear();

    if (year < BIRTH_DATE_MIN_YEAR || year > maxYear) {
        return {
            ok: false,
            message: `Year must be between ${BIRTH_DATE_MIN_YEAR} and ${maxYear}.`,
            iso: '',
        };
    }
    if (month < 1 || month > 12) {
        return { ok: false, message: 'Please enter a valid date in mm/dd/yyyy format.', iso: '' };
    }
    if (day < 1 || day > 31) {
        return { ok: false, message: 'Please enter a valid date in mm/dd/yyyy format.', iso: '' };
    }

    const dt = new Date(year, month - 1, day);
    if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) {
        return { ok: false, message: 'Please enter a valid date in mm/dd/yyyy format.', iso: '' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dt.setHours(0, 0, 0, 0);
    if (dt > today) {
        return { ok: false, message: 'Birth date cannot be in the future.', iso: '' };
    }

    const iso = `${year}-${mm}-${dd}`;
    return { ok: true, iso };
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

const DATE_MIN = `${BIRTH_DATE_MIN_YEAR}-01-01`;

/**
 * Birth date: visible `mm/dd/yyyy` text field + calendar button that opens the native date picker
 * directly (hidden proxy input). Parent value / onChange use ISO YYYY-MM-DD.
 */
const BirthDateInput = forwardRef(function BirthDateInput(
    { value, onChange, required = false, className = '', id, disabled = false },
    ref,
) {
    const errId = id ? `${id}-birth-err` : 'birth-date-err';
    const [draft, setDraft] = useState(() => isoToUsDisplay(value));
    const [error, setError] = useState('');
    const draftRef = useRef(draft);
    draftRef.current = draft;

    const prevExternalRef = useRef(value);
    const nativePickerRef = useRef(null);

    const maxIso = birthDateInputMax();

    useEffect(() => {
        if (value !== prevExternalRef.current) {
            prevExternalRef.current = value;
            setDraft(isoToUsDisplay(value));
            setError('');
        }
    }, [value]);

    /** Keep hidden date input aligned with committed value (for next picker open). */
    useEffect(() => {
        const el = nativePickerRef.current;
        if (!el) return;
        if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            el.value = value;
        } else {
            el.value = '';
        }
    }, [value]);

    const commit = useCallback(() => {
        const result = parseUsBirthDate(draftRef.current, { required });
        if (!result.ok) {
            setError(result.message);
            return { success: false };
        }
        setError('');
        onChange(result.iso);
        if (result.iso) setDraft(isoToUsDisplay(result.iso));
        return { success: true, iso: result.iso };
    }, [required, onChange]);

    useImperativeHandle(ref, () => ({ commit }), [commit]);

    const handleChange = (e) => {
        setError('');
        setDraft(digitsToUsDate(e.target.value));
    };

    /** Opens the browser’s native calendar UI immediately (no intermediate popover). */
    const onNativePickerChange = (e) => {
        const iso = e.target.value;
        if (!iso) return;
        setError('');
        onChange(iso);
        setDraft(isoToUsDisplay(iso));
    };

    const inputClass = ['birth-date-input', className].filter(Boolean).join(' ');

    return (
        <div className="birth-date-input-wrap">
            <div className="birth-date-field-shell">
                <input
                    id={id}
                    type="text"
                    inputMode="numeric"
                    autoComplete="bday"
                    className={inputClass}
                    placeholder="mm/dd/yyyy"
                    value={draft}
                    maxLength={10}
                    disabled={disabled}
                    aria-invalid={!!error}
                    aria-describedby={error ? errId : undefined}
                    aria-required={required}
                    onChange={handleChange}
                    onBlur={commit}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            commit();
                        }
                    }}
                />
                {/* Transparent native date input over the icon: a real user click targets the
                    control (showPicker/click on off-screen inputs is unreliable in Safari/Chromium). */}
                <div className="birth-date-cal-slot">
                    <span className="birth-date-cal-visual" aria-hidden>
                        <CalendarGlyph />
                    </span>
                    <input
                        ref={nativePickerRef}
                        type="date"
                        className="birth-date-native-overlay"
                        min={DATE_MIN}
                        max={maxIso}
                        disabled={disabled}
                        onChange={onNativePickerChange}
                        onFocus={() => setError('')}
                        tabIndex={disabled ? -1 : 0}
                        aria-label="Open calendar to choose birth date"
                    />
                </div>
            </div>

            {error ? (
                <p id={errId} className="birth-date-input-error" role="alert">
                    {error}
                </p>
            ) : null}
        </div>
    );
});

BirthDateInput.displayName = 'BirthDateInput';

export default BirthDateInput;
