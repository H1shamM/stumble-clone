import { useEffect, useState } from "react";

const OVERLAY_SELECTOR =
  '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]';

/**
 * True whenever any Radix overlay (dialog, dropdown menu, select, etc.) is
 * mounted in the DOM. Used to pause the native WebView overlay on mobile —
 * native views render above all React UI, so an open menu/modal would otherwise
 * be trapped behind the live site. Watches the body for portal mounts.
 */
export function useAnyOverlayOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const check = () => setOpen(!!document.querySelector(OVERLAY_SELECTOR));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return open;
}
