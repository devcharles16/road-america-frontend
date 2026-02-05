
// src/services/nhtsaService.ts

const BASE_URL = "https://vpic.nhtsa.dot.gov/api/vehicles";

export interface NhtsaMake {
    MakeId: number;
    MakeName: string;
    VehicleTypeId: number;
    VehicleTypeName: string;
}

export interface NhtsaModel {
    Make_ID: number;
    Make_Name: string;
    Model_ID: number;
    Model_Name: string;
}

// In-memory cache to avoid repeated network calls
let cachedMakes: string[] | null = null;
const cachedModels: Record<string, string[]> = {};

/**
 * Fetches and merges makes for 'car', 'truck', and 'mpv'.
 * Returns a sorted, unique list of Make Names.
 */
export async function fetchNhtsaMakes(): Promise<string[]> {
    if (cachedMakes) return cachedMakes;

    try {
        const types = ["car", "truck", "mpv"];
        const promises = types.map((t) =>
            fetch(`${BASE_URL}/GetMakesForVehicleType/${t}?format=json`)
                .then((r) => r.json())
                .then((data) => data.Results as NhtsaMake[])
        );

        const typeResults = await Promise.all(promises);
        const allMakes = typeResults.flat();

        // Extract names, normalize, deduplicate
        const uniqueMakes = new Set<string>();
        allMakes.forEach((m) => {
            if (m.MakeName) {
                uniqueMakes.add(m.MakeName.trim().toUpperCase());
            }
        });

        cachedMakes = Array.from(uniqueMakes).sort();
        return cachedMakes;
    } catch (error) {
        console.error("Failed to fetch NHTSA makes:", error);
        return [];
    }
}

/**
 * Fetches models for a given Year and Make.
 */
export async function fetchNhtsaModels(year: string, make: string): Promise<string[]> {
    if (!year || !make) return [];

    const cacheKey = `${year}-${make}`;
    if (cachedModels[cacheKey]) return cachedModels[cacheKey];

    try {
        // NHTSA endpoint: GetModelsForMakeYear/make/{make}/modelyear/{year}?format=json
        // Make needs to be somewhat clean, but the API is reasonably forgiving or strict. 
        // Usually passing the name works.
        const url = `${BASE_URL}/GetModelsForMakeYear/make/${encodeURIComponent(
            make
        )}/modelyear/${encodeURIComponent(year)}?format=json`;

        const res = await fetch(url);
        const data = await res.json();
        const results = data.Results as NhtsaModel[];

        const uniqueModels = new Set<string>();
        results.forEach((m) => {
            if (m.Model_Name) {
                uniqueModels.add(m.Model_Name.trim().toUpperCase());
            }
        });

        const models = Array.from(uniqueModels).sort();
        cachedModels[cacheKey] = models;
        return models;
    } catch (error) {
        console.error(`Failed to fetch NHTSA models for ${year} ${make}:`, error);
        return [];
    }
}

/**
 * Returns a list of years from 1980 to Next Year.
 */
export function getVehicleYears(): string[] {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const years: string[] = [];
    for (let y = nextYear; y >= 1980; y--) {
        years.push(String(y));
    }
    return years;
}
