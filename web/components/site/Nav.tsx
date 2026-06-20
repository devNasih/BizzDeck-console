"use client";

/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

export function Nav() {
  const { user, loading, openAuthModal } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed left-1/2 z-50 w-[min(1180px,calc(100%-16px))] -translate-x-1/2 transition-all ${
        scrolled ? "top-2" : "top-3"
      }`}
    >
      <nav className="bd-glass flex items-center justify-between rounded-full px-3 py-2 sm:px-5">
        <Link href="/" aria-label="BizzDeck home" data-testid="nav-home">
          <img src="/assets/logo final.jpeg" alt="BizzDeck Logo" className="h-8 object-contain rounded-lg" />
        </Link>
        <div className="flex items-center gap-2">
          {!loading && user ? (
            <Link
              href="/dashboard"
              data-testid="nav-dashboard-btn"
              className="btn-mint inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-bold sm:text-[13px]"
            >
              Dashboard <ArrowUpRight size={13} strokeWidth={2.5} aria-hidden />
            </Link>
          ) : (
            <>
              <button
                onClick={() => openAuthModal("login")}
                data-testid="nav-login-btn"
                className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-white/85 hover:text-white sm:text-[13px] transition"
              >
                Login
              </button>
              <button
                onClick={() => openAuthModal("register")}
                data-testid="nav-demo-btn"
                className="btn-mint inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[12px] font-bold sm:text-[13px]"
              >
                Book Demo <ArrowUpRight size={13} strokeWidth={2.5} aria-hidden />
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
