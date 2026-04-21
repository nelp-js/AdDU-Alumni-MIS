export function getCurrentUrl() {
    if (typeof window === 'undefined') return '';
    return window.location.href;
}

export async function copyTextToClipboard(text) {
    if (!text) return false;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
    }

    if (typeof document === 'undefined') return false;
    const input = document.createElement('textarea');
    input.value = text;
    input.setAttribute('readonly', '');
    input.style.position = 'absolute';
    input.style.left = '-9999px';
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(input);
    return copied;
}

export async function shareContent({ title = '', text = '', url = '' }) {
    const shareUrl = url || getCurrentUrl();
    if (!shareUrl) return { ok: false };

    if (typeof navigator !== 'undefined' && navigator.share) {
        try {
            await navigator.share({ title, text, url: shareUrl });
            return { ok: true, method: 'native' };
        } catch (error) {
            if (error?.name === 'AbortError') return { ok: false, cancelled: true };
        }
    }

    try {
        await copyTextToClipboard(shareUrl);
        return { ok: true, method: 'clipboard' };
    } catch {
        return { ok: false };
    }
}

export function getSocialShareUrl(network, url, text = '') {
    const target = encodeURIComponent(url || getCurrentUrl());
    if (!target) return '';
    const note = encodeURIComponent(text || '');

    if (network === 'facebook') {
        return `https://www.facebook.com/sharer/sharer.php?u=${target}`;
    }
    if (network === 'linkedin') {
        return `https://www.linkedin.com/sharing/share-offsite/?url=${target}`;
    }
    if (network === 'x') {
        return `https://twitter.com/intent/tweet?url=${target}&text=${note}`;
    }
    return '';
}
