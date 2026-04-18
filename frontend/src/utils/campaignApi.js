/** Normalize GET /api/campaigns/ — plain array (legacy) or paginated `{ results }`. */
export function normalizeCampaignListResponse(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
}
