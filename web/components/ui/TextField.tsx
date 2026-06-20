"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TextFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
};

export function TextField({
  label,
  name,
  type = "text",
  placeholder,
  required = false,
  value,
  onChange,
  error,
  className,
  ...rest
}: TextFieldProps) {
  return (
    <div className={cn("space-y-1.5 w-full", className)}>
      <label className="text-[11px] text-bd-inkSoft tracking-wide block font-bold select-none">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={cn(
          "w-full bg-white rounded-xl border border-bd-border px-3.5 py-3 text-xs outline-none focus:border-bd-teal transition duration-200 text-bd-tealDeep placeholder-neutral-400 shadow-sm",
          error && "border-red-500 focus:border-red-500"
        )}
        {...rest}
      />
      {error && <p className="text-[10px] text-red-500 font-medium">{error}</p>}
    </div>
  );
}
