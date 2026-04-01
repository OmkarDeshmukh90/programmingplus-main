import React from "react";

const variantClasses = {
  primary:
    "bg-[var(--accent)] text-white shadow-[0_10px_30px_rgba(79,70,229,0.35)] hover:shadow-[0_16px_36px_rgba(79,70,229,0.45)]",
  success:
    "bg-[var(--accent-2)] text-white shadow-[0_10px_30px_rgba(6,182,212,0.35)] hover:shadow-[0_16px_36px_rgba(6,182,212,0.45)]",
  neutral:
    "bg-[#0a0a0a]/70 text-slate-100 border border-[rgba(255,255,255,0.08)] hover:bg-[#111111]",
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
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]",
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
