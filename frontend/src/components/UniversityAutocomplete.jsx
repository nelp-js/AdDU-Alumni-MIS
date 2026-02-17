import { useState, useEffect, useRef } from 'react';
import { fetchUniversitySuggestions, fetchWikidataEntity, getFaviconUrl } from '../utils/autocomplete';
import '../styles/Autocomplete.css';

export default function UniversityAutocomplete({ value, onChange, onSelect, placeholder, disabled, required }) {
    const [query, setQuery] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef(null);
    const wrapperRef = useRef(null);

    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    useEffect(() => {
        if (query.length < 2) {
            setSuggestions([]);
            setOpen(false);
            return;
        }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            const list = await fetchUniversitySuggestions(query);
            setSuggestions(list);
            setOpen(list.length > 0);
            setLoading(false);
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query]);

    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = async (item) => {
        setQuery(item.label);
        setOpen(false);
        setSuggestions([]);
        onChange?.({ target: { name: 'school_name', value: item.label } });
        let logoUrl = '';
        let website = '';
        const extra = await fetchWikidataEntity(item.id);
        if (extra) {
            logoUrl = extra.logoUrl || '';
            website = extra.website || '';
        }
        onSelect?.({ school_name: item.label, school_logo_url: logoUrl, school_website: website });
    };

    return (
        <div ref={wrapperRef} className="autocomplete-wrap">
            <input
                type="text"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    onChange?.({ target: { name: 'school_name', value: e.target.value } });
                }}
                onFocus={() => query.length >= 2 && suggestions.length > 0 && setOpen(true)}
                placeholder={placeholder || 'e.g. Ateneo de Davao University'}
                className="exp-form-input autocomplete-input"
                disabled={disabled}
                required={required}
                autoComplete="off"
            />
            {loading && <span className="autocomplete-spinner" />}
            {open && suggestions.length > 0 && (
                <ul className="autocomplete-dropdown">
                    {suggestions.map((item) => (
                        <li
                            key={item.id}
                            className="autocomplete-item"
                            onClick={() => handleSelect(item)}
                        >
                            <span className="autocomplete-item-logo autocomplete-item-logo-placeholder">
                                {item.label.slice(0, 2).toUpperCase()}
                            </span>
                            <span className="autocomplete-item-text">
                                <strong>{item.label}</strong>
                                {item.description && (
                                    <span className="autocomplete-item-meta">{item.description}</span>
                                )}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
