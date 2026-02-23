import { useState, useEffect, useRef } from 'react';
import '../styles/Autocomplete.css';

/**
 * Text-only autocomplete (no logos). Filters options as user types.
 * Used for Degree and Field of study in Education form.
 */
export default function TextAutocomplete({ value, onChange, options, placeholder, name, disabled }) {
    const [query, setQuery] = useState(value || '');
    const [open, setOpen] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const wrapperRef = useRef(null);
    const listRef = useRef(null);
    const justSelectedRef = useRef(false);

    const q = (query || '').trim().toLowerCase();
    const filtered = options.filter((opt) =>
        (opt || '').toLowerCase().includes(q)
    ).slice(0, 12);

    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    useEffect(() => {
        if (justSelectedRef.current) {
            justSelectedRef.current = false;
            return;
        }
        if (query.trim().length >= 1 && filtered.length > 0) setOpen(true);
        else setOpen(false);
    }, [query, filtered.length]);

    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setHighlightIndex(-1);
    }, [query, filtered]);

    const handleSelect = (opt) => {
        justSelectedRef.current = true;
        setQuery(opt);
        setOpen(false);
        onChange?.({ target: { name: name || 'value', value: opt } });
    };

    const handleKeyDown = (e) => {
        if (!open || filtered.length === 0) {
            if (e.key === 'Escape') setOpen(false);
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightIndex((i) => (i < filtered.length - 1 ? i + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightIndex((i) => (i > 0 ? i - 1 : filtered.length - 1));
        } else if (e.key === 'Enter' && highlightIndex >= 0 && filtered[highlightIndex]) {
            e.preventDefault();
            handleSelect(filtered[highlightIndex]);
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    };

    useEffect(() => {
        if (highlightIndex >= 0 && listRef.current) {
            const el = listRef.current.children[highlightIndex];
            el?.scrollIntoView({ block: 'nearest' });
        }
    }, [highlightIndex]);

    return (
        <div ref={wrapperRef} className="autocomplete-wrap">
            <input
                type="text"
                name={name}
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    onChange?.(e);
                }}
                onFocus={() => query.trim().length >= 1 && filtered.length > 0 && setOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="exp-form-input autocomplete-input"
                disabled={disabled}
                autoComplete="off"
            />
            {open && filtered.length > 0 && (
                <ul ref={listRef} className="autocomplete-dropdown autocomplete-dropdown-text">
                    {filtered.map((opt, i) => (
                        <li
                            key={opt}
                            className={`autocomplete-item autocomplete-item-text-only ${i === highlightIndex ? 'autocomplete-item-highlight' : ''}`}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelect(opt);
                            }}
                            onMouseEnter={() => setHighlightIndex(i)}
                        >
                            <span className="autocomplete-item-text">
                                <strong>{opt}</strong>
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
