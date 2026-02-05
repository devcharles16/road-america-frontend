import { AlertTriangle, Info, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { bannerService } from "../services/bannerService";
import type { BannerSettings } from "../services/bannerService";

export default function GlobalBanner() {
    const [banner, setBanner] = useState<BannerSettings | null>(null);

    useEffect(() => {
        bannerService.getSettings().then((data) => {
            if (data && data.is_active) {
                setBanner(data);
            }
        });
    }, []);

    if (!banner) return null;

    return (
        <div className={`
            px-4 py-2 text-center text-sm font-medium relative z-50
            ${banner.type === 'error' ? 'bg-red-600 text-white' :
                banner.type === 'info' ? 'bg-blue-600 text-white' :
                    'bg-amber-500 text-black'}
        `}>
            <div className="flex items-center justify-center gap-2">
                {banner.type === 'error' && <XCircle className="h-4 w-4" />}
                {banner.type === 'info' && <Info className="h-4 w-4" />}
                {banner.type === 'warning' && <AlertTriangle className="h-4 w-4" />}

                <span>
                    {banner.message}
                </span>
            </div>
        </div>
    );
}
