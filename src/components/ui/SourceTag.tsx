import React from "react";
import { Facebook, Instagram, Video, MessageSquare } from "lucide-react";

interface SourceTagProps {
  source: "facebook" | "instagram" | "tiktok" | "directo" | string | null;
  className?: string;
}

export const SourceTag: React.FC<SourceTagProps> = ({ source = "directo", className = "" }) => {
  const norm = (source || "directo").toLowerCase();

  const configs: Record<string, { bg: string; text: string; label: string; icon: React.ComponentType<{ size: number }> }> = {
    facebook: {
      bg: "bg-[#E6F1FB]",
      text: "text-[#185FA5]",
      label: "Facebook Ads",
      icon: Facebook
    },
    instagram: {
      bg: "bg-[#FAEEDA]",
      text: "text-[#854F0B]",
      label: "Instagram DM",
      icon: Instagram
    },
    tiktok: {
      bg: "bg-[#EEEDFE]",
      text: "text-[#3C3489]",
      label: "TikTok Video",
      icon: Video
    },
    directo: {
      bg: "bg-[#E1F5EE]",
      text: "text-[#085041]",
      label: "Tráfico Directo",
      icon: MessageSquare
    }
  };

  const conf = configs[norm] || configs.directo;
  const Icon = conf.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[12px] text-[10.5px] font-semibold tracking-wide border border-[rgba(0,0,0,0.03)] ${conf.bg} ${conf.text} ${className}`}
    >
      <Icon size={12} />
      {conf.label}
    </span>
  );
};
