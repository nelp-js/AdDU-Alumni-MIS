import { useState, useEffect } from 'react';


export function useCountries() {
    const [countries, setCountries] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);

    useEffect(() => {
        fetch('https://restcountries.com/v3.1/all?fields=name,flag,cca2')
            .then((r) => r.json())
            .then((data) => {
                const sorted = data
                    .map((c) => ({
                        value: c.name.common,
                        label: `${c.flag} ${c.name.common}`,
                    }))
                    .sort((a, b) => a.value.localeCompare(b.value));

                // Pin Philippines to the top
                const ph = sorted.find((c) => c.value === 'Philippines');
                const rest = sorted.filter((c) => c.value !== 'Philippines');
                setCountries(ph ? [ph, ...rest] : sorted);
            })
            .catch(() => setError('Failed to load countries.'))
            .finally(() => setLoading(false));
    }, []);

    return { countries, loading, error };
}