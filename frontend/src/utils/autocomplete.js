/**
 * Autocomplete utilities - no API keys required.
 * Companies: Clearbit (free, no key)
 * Universities: Wikidata (free, no key)
 */

const CLEARBIT_SUGGEST = 'https://autocomplete.clearbit.com/v1/companies/suggest';
const WIKIDATA_SEARCH = 'https://www.wikidata.org/w/api.php';
const WIKIDATA_ENTITY = 'https://www.wikidata.org/w/api.php';

/** Extract domain from URL or return as-is if already a domain */
export function extractDomain(url) {
    if (!url || !url.trim()) return '';
    let s = url.trim().toLowerCase();
    s = s.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    return s || '';
}

/** Logo URL for a domain - try Clearbit first, fallback to Google favicon */
export function getCompanyLogoUrl(domain) {
    if (!domain) return null;
    const d = extractDomain(domain);
    if (!d) return null;
    return `https://logo.clearbit.com/${d}`;
}

/** Favicon URL - always works as fallback */
export function getFaviconUrl(domain) {
    if (!domain) return null;
    const d = extractDomain(domain);
    if (!d) return null;
    return `https://www.google.com/s2/favicons?domain=${d}&sz=128`;
}

/** Fetch company suggestions from Clearbit (no API key) */
export async function fetchCompanySuggestions(query) {
    if (!query || query.trim().length < 2) return [];
    try {
        const res = await fetch(
            `${CLEARBIT_SUGGEST}?query=${encodeURIComponent(query.trim())}`,
            { signal: AbortSignal.timeout(5000) }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

/** Guess domain from school name for logo lookup (e.g. typed manually or before Wikidata fetch) */
export function guessDomainFromSchoolName(name) {
    if (!name || !name.trim()) return null;
    const n = name.trim().toLowerCase();
    const known = [
        ['ateneo de davao', 'addu.edu.ph'],
        ['ateneo de manila', 'ateneo.edu'],
        ['boston university', 'bu.edu'],
        ['harvard', 'harvard.edu'],
        ['mit', 'mit.edu'],
        ['stanford', 'stanford.edu'],
        ['yale', 'yale.edu'],
        ['princeton', 'princeton.edu'],
        ['columbia', 'columbia.edu'],
        ['ucla', 'ucla.edu'],
        ['berkeley', 'berkeley.edu'],
        ['oxford', 'ox.ac.uk'],
        ['cambridge', 'cam.ac.uk'],
    ];
    for (const [key, domain] of known) {
        if (n.includes(key)) return domain;
    }
    const clean = n.replace(/[^a-z0-9]/g, '');
    return clean ? `${clean}.edu` : null;
}

/** Logo URL for a school - Clearbit or favicon from guessed/known domain */
export function getSchoolLogoUrl(domainOrName) {
    if (!domainOrName) return null;
    const d = extractDomain(domainOrName) || guessDomainFromSchoolName(domainOrName);
    if (!d) return null;
    return `https://logo.clearbit.com/${d}`;
}

/** Fetch university suggestions from Wikidata (no API key) */
export async function fetchUniversitySuggestions(query) {
    if (!query || query.trim().length < 2) return [];
    try {
        const res = await fetch(
            `${WIKIDATA_SEARCH}?` + new URLSearchParams({
                action: 'wbsearchentities',
                search: query.trim(),
                language: 'en',
                limit: '8',
                format: 'json',
                origin: '*',
            }),
            { signal: AbortSignal.timeout(5000) }
        );
        if (!res.ok) return [];
        const data = await res.json();
        const items = data?.search || [];
        return items.map((item) => ({
            id: item.id,
            label: item.label,
            description: item.description?.value || '',
        }));
    } catch {
        return [];
    }
}

/** Fetch Wikidata entity to get logo (P154) and website (P856) */
export async function fetchWikidataEntity(wikidataId) {
    if (!wikidataId) return null;
    try {
        const res = await fetch(
            `${WIKIDATA_ENTITY}?` + new URLSearchParams({
                action: 'wbgetentities',
                ids: wikidataId,
                props: 'claims',
                format: 'json',
                origin: '*',
            }),
            { signal: AbortSignal.timeout(5000) }
        );
        if (!res.ok) return null;
        const data = await res.json();
        const entity = data?.entities?.[wikidataId];
        if (!entity?.claims) return null;

        let logoUrl = '';
        let website = '';

        // P154 = logo image (Commons filename)
        const p154 = entity.claims.P154?.[0]?.mainsnak?.datavalue?.value;
        if (p154) {
            logoUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(p154)}`;
        }

        // P856 = official website
        const p856 = entity.claims.P856?.[0]?.mainsnak?.datavalue?.value;
        if (p856) {
            website = p856;
        }

        return { logoUrl, website };
    } catch {
        return null;
    }
}
