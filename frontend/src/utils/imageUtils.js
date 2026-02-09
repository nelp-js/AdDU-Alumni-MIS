import api from '../api'; 

/**
 * UTILITY: getOptimizedUrl
 * Injects Cloudinary optimization parameters into the URL.
 */
export const getOptimizedUrl = (url, type = 'card') => {
    // 1. Handle missing/invalid URLs
    if (!url || typeof url !== 'string') {
        return null; 
    }

    // 2. Handle Cloudinary URLs (Optimize them)
    if (url.includes('res.cloudinary.com') && url.includes('/upload/') && !url.includes('f_auto')) {
        let params = '';

        switch (type) {
            case 'hero':
                params = 'w_1200,c_limit,q_auto,f_auto'; 
                break;
            case 'avatar':
                params = 'w_200,h_200,c_fill,g_face,q_auto,f_auto';
                break;
            case 'card':
            default:
                params = 'w_800,c_limit,q_auto,f_auto';
                break;
        }
        return url.replace('/upload/', `/upload/${params}/`);
    }

    if (url.startsWith('/')) {
        return url; 
    }

    return url;
};