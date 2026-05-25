import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "secondary",
  size = "md",
  children,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyle = "inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100";

  const variants = {
    primary: "bg-[var(--grn)] text-white hover:bg-[var(--grn-d)] border border-transparent shadow-sm",
    secondary: "bg-white text-[var(--t0)] border border-[var(--bd2)] hover:bg-[var(--bg1)] shadow-xs",
    danger: "bg-[var(--red-bg)] text-[var(--red)] border border-transparent hover:bg-[rgba(163,45,45,0.08)]",
    ghost: "bg-transparent text-[var(--t1)] hover:bg-[var(--bg1)] hover:text-[var(--t0)]"
  };

  const sizes = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3.5 py-1.5 text-xs",
    lg: "px-5 py-2.5 text-sm"
  };

  return (
    <button
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
