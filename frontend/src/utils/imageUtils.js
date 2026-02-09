import api from '../api';

/**
 * UTILITY: getOptimizedUrl
 * Injects Cloudinary optimization parameters into the URL.
 */
export const getOptimizedUrl = (url, type = 'card') => {
    // 1. Handle missing/invalid URLs
    if (!url || typeof url !== 'string') {
        // Return a specific default based on type, or null
        return null; 
    }

    // 2. Handle Relative Paths (Local Dev or Django Media)
    // If it starts with '/', prepend the backend URL
    if (!url.startsWith('http')) {
        const baseURL = api.defaults.baseURL || '';
        // Remove double slashes if present
        const cleanPath = url.startsWith('/') ? url : `/${url}`;
        return `${baseURL}${cleanPath}`;
    }

    // 3. CLOUDINARY TRANSFORMATION LOGIC
    // Only apply if it's a Cloudinary URL and doesn't already have params
    if (url.includes('res.cloudinary.com') && url.includes('/upload/') && !url.includes('f_auto')) {
        let params = '';

        switch (type) {
            case 'hero':
                // Big banner images (Events/Articles details)
                params = 'w_1200,c_limit,q_auto,f_auto'; 
                break;
            
            case 'avatar':
                // User profile pictures (Header/Dashboard)
                // c_fill + g_face = Smart face cropping!
                params = 'w_200,h_200,c_fill,g_face,q_auto,f_auto';
                break;

            case 'card':
            default:
                // Standard list items (Events/News lists)
                params = 'w_800,c_limit,q_auto,f_auto';
                break;
        }

        return url.replace('/upload/', `/upload/${params}/`);
    }

    return url;
};