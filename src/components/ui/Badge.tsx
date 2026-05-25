import React from "react";

export type BadgeVariant = 'green' | 'amber' | 'blue' | 'red' | 'purple' | 'gray';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = "gray", children, className = "" }) => {
  const variantStyles: Record<BadgeVariant, string> = {
    green: "bg-[var(--grn-bg)] text-[var(--grn-t)] border border-[rgba(29,158,117,0.2)]",
    amber: "bg-[var(--amb-bg)] text-[var(--amb)] border border-[rgba(133,79,11,0.2)]",
    blue: "bg-[var(--blu-bg)] text-[var(--blu)] border border-[rgba(24,95,165,0.2)]",
    red: "bg-[var(--red-bg)] text-[var(--red)] border border-[rgba(163,45,45,0.2)]",
    purple: "bg-[var(--pur-bg)] text-[var(--pur-t)] border border-[rgba(83,74,183,0.2)]",
    gray: "bg-[var(--bg1)] text-[var(--t1)] border border-[var(--bd)]"
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase shadow-sm transition-all ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
