import { useState, useEffect, useRef } from 'react';
import {
    fetchUniversitySuggestions,
    fetchWikidataEntity,
    extractDomain,
    getSchoolLogoUrl,
    getFaviconUrl,
    guessDomainFromSchoolName,
} from '../utils/autocomplete';
import '../styles/Autocomplete.css';

export default function UniversityAutocomplete({
    value,
    selectedLogoUrl,
    selectedWebsite,
    onChange,
    onSelect,
    onClear,
    placeholder,
    disabled,
    required,
}) {
    const [query, setQuery] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSelected, setIsSelected] = useState(false);
    const debounceRef = useRef(null);
    const wrapperRef = useRef(null);

    const domain = selectedWebsite ? extractDomain(selectedWebsite) : null;
    const logoUrl = selectedLogoUrl || (domain ? getSchoolLogoUrl(domain) : null) || (value ? getSchoolLogoUrl(value) : null);

    useEffect(() => {
        setQuery(value || '');
        if (value && (selectedLogoUrl || selectedWebsite)) setIsSelected(true);
    }, [value, selectedLogoUrl, selectedWebsite]);

    useEffect(() => {
        if (query.length < 2) {
            setSuggestions([]);
            setOpen(false);
            return;
        }
        if (isSelected) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            const list = await fetchUniversitySuggestions(query);
            setSuggestions(list);
            setOpen(list.length > 0);
            setLoading(false);
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query, isSelected]);

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
        setIsSelected(true);
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

    const handleClear = () => {
        setQuery('');
        setIsSelected(false);
        setOpen(false);
        setSuggestions([]);
        onChange?.({ target: { name: 'school_name', value: '' } });
        onClear?.();
    };

    const showSelected = isSelected && value;

    return (
        <div ref={wrapperRef} className="autocomplete-wrap">
            {showSelected ? (
                <>
                    <input type="hidden" name="school_name" value={value || ''} required={required} readOnly aria-hidden="true" />
                    <div
                        className="autocomplete-selected autocomplete-input exp-form-input"
                        onClick={handleClear}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClear(); }}
                    >
                        <span className="autocomplete-selected-logo">
                            {logoUrl ? (
                                <>
                                    <img
                                        src={logoUrl}
                                        alt=""
                                        onError={(e) => {
                                            const img = e.currentTarget;
                                            const d = domain || guessDomainFromSchoolName(value);
                                            if (d && !img.dataset.triedFavicon) {
                                                img.dataset.triedFavicon = '1';
                                                img.src = getFaviconUrl(d);
                                            } else {
                                                img.style.display = 'none';
                                                if (img.nextSibling) img.nextSibling.style.display = 'flex';
                                            }
                                        }}
                                    />
                                    <span className="autocomplete-selected-initials" style={{ display: 'none' }}>
                                        {value ? value.slice(0, 2).toUpperCase() : '?'}
                                    </span>
                                </>
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
                </>
            )}
            {open && suggestions.length > 0 && (
                <ul className="autocomplete-dropdown">
                    {suggestions.map((item) => {
                        const itemDomain = guessDomainFromSchoolName(item.label);
                        const itemLogo = itemDomain ? getSchoolLogoUrl(itemDomain) : null;
                        const initials = item.label.slice(0, 2).toUpperCase();
                        return (
                            <li
                                key={item.id}
                                className="autocomplete-item"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSelect(item);
                                }}
                            >
                                <span className="autocomplete-item-logo">
                                    {itemLogo ? (
                                        <img
                                            src={itemLogo}
                                            alt=""
                                            onError={(e) => {
                                                e.target.src = itemDomain ? getFaviconUrl(itemDomain) : '';
                                                e.target.onerror = null;
                                            }}
                                        />
                                    ) : (
                                        <span className="autocomplete-item-logo-placeholder">{initials}</span>
                                    )}
                                </span>
                                <span className="autocomplete-item-text">
                                    <strong>{item.label}</strong>
                                    {item.description && (
                                        <span className="autocomplete-item-meta">{item.description}</span>
                                    )}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
