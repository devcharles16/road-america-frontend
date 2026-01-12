// Utility for Google Ads & Analytics tracking events

// Extend the window interface to include gtag
declare global {
    interface Window {
        gtag?: (
            command: string,
            targetId: string,
            config?: Record<string, any>
        ) => void;
    }
}

/**
 * Tracks a Google Ads conversion event.
 * @param conversionLabel The conversion label from Google Ads (e.g., "AW-12345/AbCdEfGhIjKlMnOpQr")
 * @param value Optional value of the conversion
 * @param currency Optional currency code (default USD)
 */
export const trackConversion = (
    conversionLabel: string,
    value?: number,
    currency: string = 'USD'
) => {
    if (typeof window.gtag === 'function') {
        window.gtag('event', 'conversion', {
            send_to: conversionLabel,
            value: value,
            currency: currency,
        });
        console.log(`[Analytics] Tracked conversion: ${conversionLabel}`);
    } else {
        console.warn('[Analytics] gtag not found, skipping conversion tracking');
    }
};

// You can add more tracking helpers here (e.g. for page views if not auto-tracked)
