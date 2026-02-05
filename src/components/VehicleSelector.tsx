
// src/components/VehicleSelector.tsx
import { useState, useEffect, useRef } from "react";
import { fetchNhtsaMakes, fetchNhtsaModels, getVehicleYears } from "../services/nhtsaService";
import { ChevronDown, Loader2 } from "lucide-react";

interface VehicleSelectorProps {
    year: string;
    make: string;
    model: string;
    onChange: (field: "vehicleYear" | "vehicleMake" | "vehicleModel", value: string) => void;
    onBlur?: (field: "vehicleYear" | "vehicleMake" | "vehicleModel") => void; // Optional, to match existing flow
    className?: string;
}

export default function VehicleSelector({ year, make, model, onChange, className }: VehicleSelectorProps) {
    const [years, setYears] = useState<string[]>([]);
    const [makes, setMakes] = useState<string[]>([]);
    const [models, setModels] = useState<string[]>([]);

    const [loadingMakes, setLoadingMakes] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);

    // Suggestions state
    const [makeSuggestions, setMakeSuggestions] = useState<string[]>([]);
    const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);

    const [showMakeDropdown, setShowMakeDropdown] = useState(false);
    const [showModelDropdown, setShowModelDropdown] = useState(false);

    const makeRef = useRef<HTMLDivElement>(null);
    const modelRef = useRef<HTMLDivElement>(null);

    // 1. Init Years and Makes on mount
    useEffect(() => {
        setYears(getVehicleYears());

        setLoadingMakes(true);
        fetchNhtsaMakes().then((data) => {
            setMakes(data);
            setLoadingMakes(false);
        });
    }, []);

    // 2. Fetch Models when Year or Make changes
    useEffect(() => {
        if (year && make) {
            // Only fetch if make is a "known" make, or just try fetching regardless?
            // Let's try fetching if we have both values.
            setLoadingModels(true);
            fetchNhtsaModels(year, make).then((data) => {
                setModels(data);
                setLoadingModels(false);
            });
        } else {
            setModels([]);
        }
    }, [year, make]);

    // Click outside to close dropdowns
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (makeRef.current && !makeRef.current.contains(event.target as Node)) {
                setShowMakeDropdown(false);
            }
            if (modelRef.current && !modelRef.current.contains(event.target as Node)) {
                setShowModelDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // -- Handlers --

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange("vehicleYear", e.target.value);
        // When year changes, clear model as it might be invalid
        if (model) onChange("vehicleModel", "");
    };

    const handleMakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange("vehicleMake", val);

        // Filter suggestions
        if (val.trim() === "") {
            setMakeSuggestions([]);
            setShowMakeDropdown(false);
        } else {
            const lowerVal = val.toLowerCase();
            const filtered = makes.filter((m) => m.toLowerCase().includes(lowerVal));
            setMakeSuggestions(filtered.slice(0, 50)); // Limit to 50
            setShowMakeDropdown(true);
        }

        // Clear model when make changes
        if (model) onChange("vehicleModel", "");
    };

    const handleSelectMake = (val: string) => {
        onChange("vehicleMake", val);
        setShowMakeDropdown(false);
        if (model) onChange("vehicleModel", "");
    };

    const handleModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange("vehicleModel", val);

        if (val.trim() === "") {
            setModelSuggestions([]);
            setShowModelDropdown(false);
        } else {
            const lowerVal = val.toLowerCase();
            const filtered = models.filter((m) => m.toLowerCase().includes(lowerVal));
            setModelSuggestions(filtered.slice(0, 50));
            setShowModelDropdown(true);
        }
    };

    const handleSelectModel = (val: string) => {
        onChange("vehicleModel", val);
        setShowModelDropdown(false);
    };

    return (
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 ${className}`}>
            {/* YEAR */}
            <div className="relative">
                <select
                    value={year}
                    onChange={handleYearChange}
                    className="w-full h-10 appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 text-sm focus:bg-white focus:border-brand-red focus:ring-4 focus:ring-brand-red/10 outline-none transition-all font-medium text-gray-700"
                >
                    <option value="">Year</option>
                    {years.map((y) => (
                        <option key={y} value={y}>
                            {y}
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronDown className="w-3 h-3" />
                </div>
            </div>

            {/* MAKE */}
            <div className="relative" ref={makeRef}>
                <input
                    type="text"
                    value={make}
                    onChange={handleMakeChange}
                    onFocus={() => {
                        if (make) {
                            const lowerVal = make.toLowerCase();
                            setMakeSuggestions(makes.filter(m => m.toLowerCase().includes(lowerVal)).slice(0, 50));
                            setShowMakeDropdown(true);
                        }
                    }}
                    placeholder={loadingMakes ? "Loading..." : "Make"}
                    className="w-full h-10 bg-gray-50 border border-gray-200 rounded-lg px-3 text-sm focus:bg-white focus:border-brand-red focus:ring-4 focus:ring-brand-red/10 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                    autoComplete="off"
                />
                {loadingMakes && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                    </div>
                )}

                {/* Make Dropdown */}
                {showMakeDropdown && makeSuggestions.length > 0 && (
                    <ul className="absolute z-50 left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                        {makeSuggestions.map((m) => (
                            <li
                                key={m}
                                onClick={() => handleSelectMake(m)}
                                className="px-4 py-2 text-sm text-gray-700 hover:bg-brand-red/5 hover:text-brand-red cursor-pointer"
                            >
                                {m}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* MODEL */}
            <div className="relative" ref={modelRef}>
                <input
                    type="text"
                    value={model}
                    onChange={handleModelChange}
                    onFocus={() => {
                        if (model) {
                            const lowerVal = model.toLowerCase();
                            setModelSuggestions(models.filter(m => m.toLowerCase().includes(lowerVal)).slice(0, 50));
                            setShowModelDropdown(true);
                        } else if (models.length > 0) {
                            setModelSuggestions(models.slice(0, 50));
                            setShowModelDropdown(true);
                        }
                    }}
                    disabled={!year || !make} // Disable if no year/make
                    placeholder={loadingModels ? "Loading..." : "Model"}
                    className={`w-full h-10 border border-gray-200 rounded-lg px-3 text-sm outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400
            ${!year || !make ? "bg-gray-100 cursor-not-allowed opacity-70" : "bg-gray-50 focus:bg-white focus:border-brand-red focus:ring-4 focus:ring-brand-red/10"}
          `}
                    autoComplete="off"
                />
                {loadingModels && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                    </div>
                )}

                {/* Model Dropdown */}
                {showModelDropdown && modelSuggestions.length > 0 && (
                    <ul className="absolute z-50 left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                        {modelSuggestions.map((m) => (
                            <li
                                key={m}
                                onClick={() => handleSelectModel(m)}
                                className="px-4 py-2 text-sm text-gray-700 hover:bg-brand-red/5 hover:text-brand-red cursor-pointer"
                            >
                                {m}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
