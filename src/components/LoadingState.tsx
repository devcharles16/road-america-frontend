import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type LoadingProps = {
  message?: string;
  delayedMessage?: string;
  /** Milliseconds to wait before showing delayed message (default 3000) */
  delay?: number;
  className?: string;
};

export default function LoadingState({
  message = "Loading...",
  delayedMessage = "Connecting to server... this might take up to a minute if the server is waking up (Render Free Tier).",
  delay = 3000,
  className = "",
}: LoadingProps) {
  const [showDelayed, setShowDelayed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDelayed(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-white/60 ${className}`}
    >
      <Loader2 className="mb-3 h-8 w-8 animate-spin text-brand-redSoft" />
      <p className="max-w-md text-center text-sm">
        {showDelayed ? delayedMessage : message}
      </p>
    </div>
  );
}
