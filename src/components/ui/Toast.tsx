"use client";

import { useEffect } from "react";
import { CheckIcon } from "./icons";

/** Bottom-centre confirmation toast; auto-dismisses. */
export function Toast({
  message,
  onDone,
}: {
  message: string | null;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 3400);
    return () => clearTimeout(t);
  }, [message, onDone]);

  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 lg:left-[calc(50%+132px)]">
      <div className="flex items-center gap-2.5 rounded-full bg-primary-darker px-5 py-3 text-sm font-semibold text-white shadow-dialog">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success text-white">
          <CheckIcon width={14} height={14} />
        </span>
        {message}
      </div>
    </div>
  );
}
