import { AlertTriangle } from "lucide-react";

export default function GlobalBanner() {
    return (
        <div className="bg-amber-500 text-black px-4 py-2 text-center text-sm font-medium relative z-50">
            <div className="flex items-center justify-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>
                    <strong>Winter Storm Alert:</strong> Expect transport delays in affected regions due to severe weather conditions.
                </span>
            </div>
        </div>
    );
}
