import { useState, useEffect, useRef } from 'react';
import { fetchCompanySuggestions, extractDomain, getCompanyLogoUrl, getFaviconUrl } from '../utils/autocomplete';
import '../styles/Autocomplete.css';

export default function CompanyAutocomplete({ value, onChange, onSelect, placeholder, disabled, required }) {
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
            const list = await fetchCompanySuggestions(query);
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

    const handleSelect = (item) => {
        setQuery(item.name);
        setOpen(false);
        setSuggestions([]);
        const domain = item.domain || '';
        onChange?.({ target: { name: 'company_name', value: item.name } });
        onSelect?.({ company_name: item.name, domain });
    };

    return (
        <div ref={wrapperRef} className="autocomplete-wrap">
            <input
                type="text"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    onChange?.({ target: { name: 'company_name', value: e.target.value } });
                }}
                onFocus={() => query.length >= 2 && suggestions.length > 0 && setOpen(true)}
                placeholder={placeholder || 'e.g. Google'}
                className="exp-form-input autocomplete-input"
                disabled={disabled}
                required={required}
                autoComplete="off"
            />
            {loading && <span className="autocomplete-spinner" />}
            {open && suggestions.length > 0 && (
                <ul className="autocomplete-dropdown">
                    {suggestions.map((item, i) => (
                        <li
                            key={`${item.domain}-${i}`}
                            className="autocomplete-item"
                            onClick={() => handleSelect(item)}
                        >
                            <span className="autocomplete-item-logo">
                                <img
                                    src={getCompanyLogoUrl(item.domain)}
                                    alt=""
                                    onError={(e) => {
                                        e.target.src = getFaviconUrl(item.domain);
                                        e.target.onerror = null;
                                    }}
                                />
                            </span>
                            <span className="autocomplete-item-text">
                                <strong>{item.name}</strong>
                                {item.domain && <span className="autocomplete-item-meta">{item.domain}</span>}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
