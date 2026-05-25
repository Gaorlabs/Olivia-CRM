import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = "", onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-[var(--bg0)] border border-[var(--bd)] rounded-[var(--rl)] p-4 shadow-[var(--shadow)] transition-all ${
        onClick ? "hover:scale-[1.005] hover:border-[var(--bd2)] cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
};
