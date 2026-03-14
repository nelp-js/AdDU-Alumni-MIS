import { useState, useEffect } from 'react';

const BASE = 'https://psgc.cloud/api';

/**
 * Cascading Region → Province → City/Municipality hook
 * using the PSGC Cloud public API.
 *
 * Usage:
 *   const { regions, provinces, cities, loadingRegions, loadingProvinces, loadingCities }
 *     = usePSGC(selectedRegionCode, selectedProvinceCode);
 *
 * Each item in the arrays has: { code, name }
 */
export function usePSGC(regionCode, provinceCode) {
    const [regions, setRegions]                   = useState([]);
    const [provinces, setProvinces]               = useState([]);
    const [cities, setCities]                     = useState([]);
    const [loadingRegions, setLoadingRegions]     = useState(false);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingCities, setLoadingCities]       = useState(false);

    // ── Fetch all regions once on mount ──────────────────────────────────────
    useEffect(() => {
        setLoadingRegions(true);
        fetch(`${BASE}/regions`)
            .then((r) => r.json())
            .then((data) => setRegions(data.map((r) => ({ code: r.code, name: r.name }))))
            .catch(() => setRegions([]))
            .finally(() => setLoadingRegions(false));
    }, []);

    // ── Fetch provinces when region changes ──────────────────────────────────
    useEffect(() => {
        if (!regionCode) { setProvinces([]); setCities([]); return; }
        setLoadingProvinces(true);
        setProvinces([]);
        setCities([]);
        fetch(`${BASE}/regions/${regionCode}/provinces`)
            .then((r) => r.json())
            .then((data) => setProvinces(data.map((p) => ({ code: p.code, name: p.name }))))
            .catch(() => setProvinces([]))
            .finally(() => setLoadingProvinces(false));
    }, [regionCode]);

    // ── Fetch cities/municipalities when province changes ────────────────────
    useEffect(() => {
        if (!provinceCode) { setCities([]); return; }
        setLoadingCities(true);
        setCities([]);
        fetch(`${BASE}/provinces/${provinceCode}/cities-municipalities`)
            .then((r) => r.json())
            .then((data) => setCities(data.map((c) => ({ code: c.code, name: c.name }))))
            .catch(() => setCities([]))
            .finally(() => setLoadingCities(false));
    }, [provinceCode]);

    return { regions, provinces, cities, loadingRegions, loadingProvinces, loadingCities };
}