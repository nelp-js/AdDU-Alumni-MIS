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
                // Big Banner: 1920px width, Best Quality, Retina Support
                params = 'w_1920,c_limit,q_auto:best,f_auto,dpr_auto'; 
                break;
            
            case 'avatar':
                // Avatar: 500x500 (Sharp even on big screens)
                params = 'w_500,h_500,c_fill,g_face,q_auto:best,f_auto,dpr_auto';
                break;

            case 'card':
            default:
                // Cards: 1200px width (Crisp on tablets/desktop), Best Quality
                params = 'w_1200,c_limit,q_auto:best,f_auto,dpr_auto';
                break;
        }

        return url.replace('/upload/', `/upload/${params}/`);
    }

    // 3. Handle Local Static Files (in public folder)
    if (url.startsWith('/')) {
        return url; 
    }

    // 4. Return original for everything else
    return url;
};