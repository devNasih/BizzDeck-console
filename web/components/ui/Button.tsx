"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";

type ButtonProps = {
  variant?: "mint" | "teal" | "outline-light" | "outline";
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
  children: React.ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  "data-testid"?: string;
  disabled?: boolean;
};

export function Button({ variant = "mint", size = "md", href, className, children, type, onClick, disabled, ...rest }: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-full font-bold whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    mint: "btn-mint",
    teal: "btn-teal",
    "outline-light": "btn-outline-light",
    outline: "btn-outline",
  } as const;
  const sizes = { sm: "px-3.5 py-1.5 text-[12px]", md: "px-5 py-3 text-sm", lg: "px-6 py-3.5 text-sm sm:text-base" } as const;
  const cls = cn(base, variants[variant], sizes[size], className);

  // Safely resolve the openAuthModal handler if within AuthProvider
  let openAuthModal: ((mode?: "login" | "register") => void) | undefined;
  try {
    const auth = useAuth();
    openAuthModal = auth.openAuthModal;
  } catch {
    // AuthProvider context not present
  }

  const isLoginLink = href && href.startsWith("/login");

  const handleOnClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    if (isLoginLink && openAuthModal) {
      e.preventDefault();
      const mode = href.includes("mode=register") ? "register" : "login";
      openAuthModal(mode);
    } else {
      onClick?.();
    }
  };

  if (href) {
    return (
      <Link href={href} onClick={handleOnClick} className={cls} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type ?? "button"} onClick={handleOnClick} className={cls} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}
