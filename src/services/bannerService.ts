import { supabase } from "../lib/supabaseClient";

export type BannerSettings = {
    id: number;
    message: string;
    is_active: boolean;
    type: "warning" | "info" | "error";
};

export const bannerService = {
    async getSettings(): Promise<BannerSettings | null> {
        const { data, error } = await supabase
            .from("banners")
            .select("*")
            .single();

        if (error) {
            console.error("Error fetching banner settings:", error);
            return null;
        }
        return data;
    },

    async updateSettings(settings: Partial<BannerSettings>) {
        // We assume there's always one row, let's say ID 1.
        // Upsert acts as "create if not exists, update otherwise"
        const { data, error } = await supabase
            .from("banners")
            .upsert({ id: 1, ...settings })
            .select()
            .single();

        if (error) {
            throw error;
        }
        return data;
    },
};
