import { useEffect, useState } from "react";
import { bannerService } from "../services/bannerService";
import type { BannerSettings } from "../services/bannerService";
import { AlertTriangle, CheckCircle, Save } from "lucide-react";

export default function AdminBannerPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<BannerSettings>({
        id: 1,
        message: "",
        is_active: false,
        type: "warning",
    });
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            setLoading(true);
            const data = await bannerService.getSettings();
            if (data) {
                setSettings(data);
            } else {
                // If no data, we stick to defaults, effectively requesting to create one on first save
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setSuccessMessage("");
        try {
            await bannerService.updateSettings({
                message: settings.message,
                is_active: settings.is_active,
                type: settings.type,
            });
            setSuccessMessage("Banner settings updated successfully.");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            console.error("Failed to save settings", err);
            alert("Failed to save settings. Check console.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">Global Banner Management</h1>
                <p className="text-white/60">
                    Configure the alert banner shown at the top of the website.
                </p>
            </div>

            {loading ? (
                <div className="text-white">Loading configuration...</div>
            ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <form onSubmit={handleSave} className="space-y-6">
                        {/* Toggle Visibility */}
                        <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                            <div>
                                <h3 className="text-lg font-medium text-white">Banner Visibility</h3>
                                <p className="text-sm text-white/50">
                                    Toggle to show or hide the banner on the public site.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settings.is_active}
                                    onChange={(e) =>
                                        setSettings({ ...settings, is_active: e.target.checked })
                                    }
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-redSoft"></div>
                            </label>
                        </div>

                        {/* Message Input */}
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">
                                Banner Message
                            </label>
                            <textarea
                                required
                                rows={3}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-redSoft/50"
                                placeholder="e.g., Winter Storm Alert: Expect delays..."
                                value={settings.message}
                                onChange={(e) =>
                                    setSettings({ ...settings, message: e.target.value })
                                }
                            />
                            <p className="mt-2 text-xs text-white/40">
                                This text will be displayed prominently. Keep it short and clear.
                            </p>
                        </div>

                        {/* Type Selection */}
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">
                                Alert Type
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {["warning", "info", "error"].map((type) => (
                                    <div
                                        key={type}
                                        onClick={() =>
                                            setSettings({ ...settings, type: type as any })
                                        }
                                        className={`cursor-pointer border rounded-xl p-3 flex items-center gap-2 transition ${settings.type === type
                                            ? "bg-white/10 border-brand-redSoft text-white"
                                            : "bg-black/20 border-white/5 text-white/60 hover:bg-white/5"
                                            }`}
                                    >
                                        <div
                                            className={`w-3 h-3 rounded-full ${type === "warning"
                                                ? "bg-amber-500"
                                                : type === "error"
                                                    ? "bg-red-500"
                                                    : "bg-blue-500"
                                                }`}
                                        />
                                        <span className="capitalize">{type}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Preview Section */}
                        <div className="mt-8 pt-8 border-t border-white/10">
                            <h3 className="text-sm font-medium text-white/60 mb-4">Live Preview</h3>
                            <div className="bg-white/5 p-4 rounded-xl border border-dashed border-white/10 flex justify-center">
                                {/* Simulate the banner look */}
                                <div
                                    className={`px-4 py-2 text-center text-sm font-medium rounded relative z-0 w-full max-w-2xl ${settings.type === 'error' ? 'bg-red-600 text-white' :
                                        settings.type === 'info' ? 'bg-blue-600 text-white' :
                                            'bg-amber-500 text-black'
                                        } ${!settings.is_active ? 'opacity-50 grayscale' : ''}`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span>{settings.message || "Your message here..."}</span>
                                    </div>
                                </div>
                            </div>
                            {!settings.is_active && (
                                <p className="text-center text-xs text-white/40 mt-2">
                                    (Banner is currently hidden)
                                </p>
                            )}
                        </div>

                        <div className="pt-4 flex items-center justify-end gap-4">
                            {successMessage && (
                                <div className="flex items-center gap-2 text-green-400 text-sm animate-fade-in">
                                    <CheckCircle className="w-4 h-4" />
                                    {successMessage}
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 bg-brand-redSoft hover:bg-brand-red px-6 py-2.5 rounded-xl font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? "Saving..." : "Save Configuration"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
