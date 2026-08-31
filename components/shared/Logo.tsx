import React from "react";

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ className = "h-9 w-auto", width, height }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 460 100"
      width={width}
      height={height}
      className={className}
      fill="none"
    >
      <defs>
        <linearGradient id="eg-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
        <linearGradient id="accent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>

      <g transform="translate(15, 12)">
        <rect x="0" y="48" width="14" height="28" rx="4" fill="url(#eg-grad)" opacity="0.35" />
        <rect x="20" y="32" width="14" height="44" rx="4" fill="url(#eg-grad)" opacity="0.65" />
        <rect x="40" y="16" width="14" height="60" rx="4" fill="url(#eg-grad)" />
        <path d="M 0 70 L 48 10 L 62 10 L 62 24 Z" fill="url(#accent-grad)" />
        <circle cx="62" cy="10" r="5" fill="#34D399" />
      </g>

      <text
        x="105"
        y="60"
        fontFamily="'Inter', system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="44"
        fill="#FFFFFF"
        letterSpacing="-1.5"
      >
        EG<tspan fill="url(#eg-grad)">Crece</tspan>
      </text>

      <text
        x="107"
        y="80"
        fontFamily="'Inter', system-ui, -apple-system, sans-serif"
        fontWeight="600"
        fontSize="11"
        fill="#64748B"
        letterSpacing="3.5"
      >
        FINANZAS &amp; INVERSIÓN
      </text>
    </svg>
  );
}

export function AppIcon({ className = "h-9 w-9", width, height }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={width}
      height={height}
      className={className}
      fill="none"
    >
      <defs>
        <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id="icon-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
      </defs>

      <rect width="512" height="512" rx="112" fill="url(#bg-grad)" stroke="#1E293B" strokeWidth="8" />

      <g transform="translate(126, 126)">
        <rect x="20" y="150" width="45" height="110" rx="12" fill="url(#icon-grad)" opacity="0.35" />
        <rect x="85" y="100" width="45" height="160" rx="12" fill="url(#icon-grad)" opacity="0.65" />
        <rect x="150" y="50" width="45" height="210" rx="12" fill="url(#icon-grad)" />
        <path d="M 10 220 L 175 40 L 220 40 L 220 85 Z" fill="#34D399" />
        <circle cx="220" cy="40" r="16" fill="#6EE7B7" />
      </g>
    </svg>
  );
}
