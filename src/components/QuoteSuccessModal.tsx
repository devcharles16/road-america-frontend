import { motion, AnimatePresence } from "framer-motion";
import { type QuoteCreated } from "../services/shipmentsService";

interface QuoteSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    quote: QuoteCreated | null;
}

export default function QuoteSuccessModal({
    isOpen,
    onClose,
    quote,
}: QuoteSuccessModalProps) {
    if (!quote) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#1A1A1A] text-center shadow-2xl"
                    >
                        {/* Header / Icon */}
                        <div className="bg-brand-red/10 py-8">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-red/20 shadow-inner">
                                <svg
                                    className="h-8 w-8 text-brand-red"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                            <h2 className="mt-4 text-2xl font-bold text-white">
                                Quote Request Received!
                            </h2>
                        </div>

                        {/* Body */}
                        <div className="p-8">
                            <p className="text-white/70">
                                Thank you for your interest. We have received your details and will
                                be sending you a competitive price shortly.
                            </p>

                            <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-4">
                                <p className="text-xs uppercase tracking-wider text-white/50">
                                    Reference ID
                                </p>
                                <p className="mt-1 font-mono text-3xl font-bold text-brand-redSoft tracking-wider">
                                    {quote.referenceId}
                                </p>
                            </div>

                            <p className="mt-4 text-xs text-white/40">
                                Please save this Reference ID for future correspondence.
                            </p>

                            <button
                                onClick={onClose}
                                className="mt-8 w-full rounded-xl bg-brand-red py-3 font-semibold text-white shadow-lg transition hover:bg-brand-redSoft active:scale-[0.98]"
                            >
                                Close & Continue
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
