"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await reg.update();
      } catch (err) {
        console.warn("Service Worker registration failed", err);
      }
    };

    register();
  }, []);

  return null;
}
