import { useState, useEffect, useRef } from 'react';
import { fetchCompanySuggestions, extractDomain, getCompanyLogoUrl, getFaviconUrl } from '../utils/autocomplete';
import '../styles/Autocomplete.css';

export default function CompanyAutocomplete({ value, selectedDomain, selectedLogoUrl, onChange, onSelect, onClear, placeholder, disabled, required }) {
    const [query, setQuery] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSelected, setIsSelected] = useState(false);
    const debounceRef = useRef(null);
    const wrapperRef = useRef(null);

    const domain = selectedDomain && typeof selectedDomain === 'string'
        ? (extractDomain(selectedDomain) || selectedDomain.replace(/^https?:\/\//, '').replace(/^www\./, ''))
        : null;
    const logoUrl = selectedLogoUrl || (domain ? getCompanyLogoUrl(domain) : null);

    useEffect(() => {
        setQuery(value || '');
        setIsSelected(!!(value && domain));
    }, [value, domain]);

    useEffect(() => {
        if (query.length < 2) {
            setSuggestions([]);
            setOpen(false);
            return;
        }
        if (isSelected || (value && selectedDomain)) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            const list = await fetchCompanySuggestions(query);
            setSuggestions(list);
            setOpen(list.length > 0);
            setLoading(false);
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query, value, selectedDomain, isSelected]);

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
        setIsSelected(true);
        const d = item.domain || '';
        onChange?.({ target: { name: 'company_name', value: item.name } });
        onSelect?.({ company_name: item.name, domain: d, logo: item.logo });
    };

    const handleClear = () => {
        setQuery('');
        setIsSelected(false);
        setOpen(false);
        setSuggestions([]);
        onChange?.({ target: { name: 'company_name', value: '' } });
        onClear?.();
    };

    const showSelected = isSelected && value && domain;

    return (
        <div ref={wrapperRef} className="autocomplete-wrap">
            {showSelected ? (
                <>
                    <input type="hidden" name="company_name" value={value || ''} required={required} readOnly aria-hidden="true" />
                    <div
                        className="autocomplete-selected autocomplete-input exp-form-input"
                        onClick={handleClear}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClear(); }}
                    >
                    <span className="autocomplete-selected-logo">
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt=""
                                onError={(e) => {
                                    e.target.src = getFaviconUrl(domain);
                                    e.target.onerror = null;
                                }}
                            />
                        ) : (
                            <span className="autocomplete-selected-initials">
                                {value ? value.slice(0, 2).toUpperCase() : '?'}
                            </span>
                        )}
                    </span>
                    <span className="autocomplete-selected-text">{value}</span>
                </div>
                </>
            ) : (
                <>
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
                </>
            )}
            {open && suggestions.length > 0 && (
                <ul className="autocomplete-dropdown">
                    {suggestions.map((item, i) => (
                        <li
                            key={`${item.domain}-${i}`}
                            className="autocomplete-item"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelect(item);
                            }}
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
