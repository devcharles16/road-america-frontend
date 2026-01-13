import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description?: string;
    canonical?: string;
    keywords?: string[];
    ogImage?: string;
    ogType?: 'website' | 'article';
    tabTitle?: string;
}

const SEO = ({
    title,
    description = "America's most trusted auto transport company. Get a free instant quote for door-to-door car shipping.",
    canonical,
    keywords = [],
    ogImage = '/logo.png', // Default to logo if no specific image is provided
    ogType = 'website',
    tabTitle,
}: SEOProps) => {
    const siteUrl = window.location.origin;
    const fullCanonical = canonical ? (canonical.startsWith('http') ? canonical : `${siteUrl}${canonical}`) : window.location.href;
    const fullOgImage = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{tabTitle || `${title} | RA Auto Transport`}</title>
            <meta name="description" content={description} />
            {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
            <link rel="canonical" href={fullCanonical} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={ogType} />
            <meta property="og:url" content={fullCanonical} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={fullOgImage} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={fullCanonical} />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={fullOgImage} />
        </Helmet>
    );
};

export default SEO;
