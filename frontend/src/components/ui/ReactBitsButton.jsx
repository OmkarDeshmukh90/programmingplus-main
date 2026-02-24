import React from "react";

const variantClasses = {
  primary:
    "bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-slate-950 shadow-[0_8px_28px_rgba(56,189,248,0.45)] hover:shadow-[0_12px_36px_rgba(56,189,248,0.55)]",
  success:
    "bg-gradient-to-r from-emerald-400 via-lime-300 to-emerald-500 text-slate-950 shadow-[0_8px_28px_rgba(52,211,153,0.45)] hover:shadow-[0_12px_36px_rgba(52,211,153,0.55)]",
  neutral:
    "bg-slate-800 text-slate-100 border border-slate-600 hover:bg-slate-700",
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function ReactBitsButton({
  children,
  className = "",
  variant = "primary",
  fullWidth = false,
  loading = false,
  disabled = false,
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-5 py-3 font-semibold transition-all duration-300",
        "before:absolute before:inset-0 before:-z-10 before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100",
        "before:bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.38),transparent_40%)]",
        "active:scale-[0.98] hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
        variantClasses[variant] || variantClasses.primary,
        fullWidth && "w-full",
        isDisabled && "cursor-not-allowed opacity-60 hover:translate-y-0 hover:shadow-none",
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}
