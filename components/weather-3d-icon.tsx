import React from "react";

interface Weather3DIconProps {
  condition?: string;
  isNight?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export const Weather3DIcon: React.FC<Weather3DIconProps> = ({
  condition = "clear",
  isNight = false,
  className = "",
  size = "md",
}) => {
  const cond = condition.toLowerCase();

  const sizePixels = {
    sm: 36,
    md: 64,
    lg: 110,
    xl: 140,
  }[size];

  // Unique ID prefix to avoid SVG gradient collisions
  const uid = React.useId().replace(/:/g, "");

  // Determine which 3D icon variant to render
  const isThunder = cond.includes("thunder") || cond.includes("storm") || cond.includes("lightning");
  const isSnow = cond.includes("snow") || cond.includes("flurry") || cond.includes("ice");
  const isRain = cond.includes("rain") || cond.includes("drizzle") || cond.includes("shower");
  const isCloudy = cond.includes("cloud") || cond.includes("overcast") || cond.includes("fog") || cond.includes("mist");
  const isClear = !isRain && !isThunder && !isSnow && (cond.includes("clear") || cond.includes("sun"));

  // 1. THUNDERSTORM: Dark puffy cloud with vivid 3D lightning bolt
  if (isThunder) {
    return (
      <svg
        width={sizePixels}
        height={sizePixels}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`animate-float drop-shadow-xl ${className}`}
      >
        <defs>
          <linearGradient id={`cld-t-${uid}`} x1="20" y1="20" x2="90" y2="85" gradientUnits="userSpaceOnUse">
            <stop stopColor="#94a3b8" />
            <stop offset="0.5" stopColor="#475569" />
            <stop offset="1" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id={`cld-hl-${uid}`} x1="45" y1="25" x2="70" y2="55" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`bolt-${uid}`} x1="48" y1="52" x2="68" y2="105" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fef08a" />
            <stop offset="0.4" stopColor="#facc15" />
            <stop offset="1" stopColor="#ea580c" />
          </linearGradient>
          <filter id={`glow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Cloud Shadow */}
        <ellipse cx="60" cy="85" rx="38" ry="12" fill="rgba(10, 20, 40, 0.45)" filter="blur(6px)" />

        {/* 3D Dark Cloud */}
        <path
          d="M32 74 C22 74 15 66 15 56 C15 47 22 40 31 39 C34 26 46 16 60 16 C76 16 88 28 89 42 C97 43 104 50 104 59 C104 68 96 74 86 74 Z"
          fill={`url(#cld-t-${uid})`}
        />
        <path
          d="M32 70 C24 70 19 64 19 56 C19 49 24 43 32 42 C35 30 46 20 59 20 C73 20 84 30 86 44 C93 45 99 51 99 58 C99 65 93 70 85 70 Z"
          fill={`url(#cld-hl-${uid})`}
        />

        {/* Glowing 3D Lightning Bolt */}
        <path
          d="M62 48 L46 72 H58 L52 100 L76 68 H62 L70 48 Z"
          fill={`url(#bolt-${uid})`}
          filter={`url(#glow-${uid})`}
        />
      </svg>
    );
  }

  // 2. NIGHT TIME CLOUDY: Crescent Moon + Puffy Cloud + Mist Swirl
  if (isNight && isCloudy) {
    return (
      <svg
        width={sizePixels}
        height={sizePixels}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`animate-float drop-shadow-xl ${className}`}
      >
        <defs>
          <linearGradient id={`moon-${uid}`} x1="68" y1="18" x2="98" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fef08a" />
            <stop offset="0.6" stopColor="#e2e8f0" />
            <stop offset="1" stopColor="#94a3b8" />
          </linearGradient>
          <linearGradient id={`cld-n-${uid}`} x1="30" y1="35" x2="85" y2="85" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f8fafc" />
            <stop offset="0.55" stopColor="#e2e8f0" />
            <stop offset="1" stopColor="#94a3b8" />
          </linearGradient>
        </defs>

        {/* 3D Glowing Crescent Moon */}
        <path
          d="M84 20 C73 20 64 29 64 41 C64 53 74 62 86 62 C89 62 93 61 96 59 C93 63 87 66 81 66 C68 66 58 55 58 42 C58 31 66 22 77 20 C79 20 82 20 84 20 Z"
          fill={`url(#moon-${uid})`}
          filter="drop-shadow(0 0 8px rgba(254, 240, 138, 0.5))"
        />

        {/* Ambient Cloud Shadow */}
        <ellipse cx="58" cy="85" rx="36" ry="10" fill="rgba(8, 20, 42, 0.4)" filter="blur(6px)" />

        {/* 3D Puffy Cloud */}
        <path
          d="M32 75 C22 75 15 67 15 57 C15 48 22 41 31 40 C34 27 46 17 60 17 C76 17 88 29 89 43 C97 44 104 51 104 60 C104 69 96 75 86 75 Z"
          fill={`url(#cld-n-${uid})`}
        />

        {/* Soft Wind / Mist stream */}
        <path
          d="M26 84 C38 84 48 88 62 88 C76 88 88 84 94 84"
          stroke="rgba(255, 255, 255, 0.35)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M36 93 C46 93 54 96 68 96 C80 96 86 93 90 93"
          stroke="rgba(255, 255, 255, 0.25)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // 3. RAIN / LIGHT RAIN (The signature 3D icon from the reference screenshot!)
  // Glossy sun behind puffy white cloud with bright cyan raindrops
  if (isRain || (!isClear && !isNight)) {
    return (
      <svg
        width={sizePixels}
        height={sizePixels}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`animate-float drop-shadow-2xl ${className}`}
      >
        <defs>
          {/* 3D Golden Sun Sphere Gradient */}
          <radialGradient id={`sun-sphere-${uid}`} cx="38" cy="34" r="28" fx="32" fy="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fffbeb" />
            <stop offset="0.25" stopColor="#fde047" />
            <stop offset="0.65" stopColor="#f59e0b" />
            <stop offset="1" stopColor="#d97706" />
          </radialGradient>
          {/* Radiant Sun Rays */}
          <linearGradient id={`sun-ray-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#fbbf24" stopOpacity="0.8" />
            <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
          {/* Puffy 3D Cloud Gradient */}
          <linearGradient id={`cld-base-${uid}`} x1="30" y1="26" x2="85" y2="80" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" />
            <stop offset="0.45" stopColor="#f1f5f9" />
            <stop offset="0.8" stopColor="#cbd5e1" />
            <stop offset="1" stopColor="#94a3b8" />
          </linearGradient>
          {/* Cloud Top Specular Reflection */}
          <linearGradient id={`cld-spec-${uid}`} x1="45" y1="20" x2="68" y2="45" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.1" />
          </linearGradient>
          {/* Vibrant Raindrop Pill Gradient */}
          <linearGradient id={`drop-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#67e8f9" />
            <stop offset="0.5" stopColor="#38bdf8" />
            <stop offset="1" stopColor="#2563eb" />
          </linearGradient>
        </defs>

        {/* Ambient Ground Shadow */}
        <ellipse cx="62" cy="85" rx="38" ry="10" fill="rgba(8, 22, 48, 0.4)" filter="blur(6px)" />

        {/* 3D Sun Rays */}
        <circle cx="44" cy="38" r="28" fill="rgba(251, 191, 36, 0.18)" filter="blur(5px)" />
        <g stroke="#f59e0b" strokeWidth="3" strokeLinecap="round">
          <line x1="44" y1="6" x2="44" y2="12" />
          <line x1="22" y1="16" x2="26" y2="20" />
          <line x1="12" y1="38" x2="18" y2="38" />
          <line x1="66" y1="16" x2="62" y2="20" />
        </g>

        {/* 3D Golden Sun Sphere */}
        <circle cx="44" cy="38" r="20" fill={`url(#sun-sphere-${uid})`} />

        {/* 3D Puffy Cloud Body */}
        <path
          d="M34 76 C23 76 16 68 16 58 C16 49 23 42 32 41 C35 28 48 18 63 18 C79 18 92 30 93 45 C101 46 108 53 108 62 C108 71 100 76 90 76 Z"
          fill={`url(#cld-base-${uid})`}
        />
        {/* Specular Highlight */}
        <path
          d="M34 72 C25 72 20 66 20 58 C20 51 25 45 33 44 C36 32 48 22 62 22 C76 22 88 32 90 46 C97 47 103 53 103 60 C103 67 97 72 89 72 Z"
          fill={`url(#cld-spec-${uid})`}
        />

        {/* 3D Falling Raindrop Pills (Matching exact layout from user image) */}
        <rect x="36" y="82" width="4.5" height="15" rx="2.25" fill={`url(#drop-${uid})`} />
        <rect x="49" y="86" width="4.5" height="16" rx="2.25" fill={`url(#drop-${uid})`} />
        <rect x="62" y="82" width="4.5" height="15" rx="2.25" fill={`url(#drop-${uid})`} />
        <rect x="75" y="85" width="4.5" height="16" rx="2.25" fill={`url(#drop-${uid})`} />
      </svg>
    );
  }

  // 4. PURE SUNNY / CLEAR DAY: Radiant 3D Sun Sphere
  if (isClear && !isNight) {
    return (
      <svg
        width={sizePixels}
        height={sizePixels}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`animate-float drop-shadow-2xl ${className}`}
      >
        <defs>
          <radialGradient id={`pure-sun-${uid}`} cx="52" cy="48" r="36" fx="46" fy="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fffbeb" />
            <stop offset="0.2" stopColor="#fef08a" />
            <stop offset="0.55" stopColor="#f59e0b" />
            <stop offset="0.9" stopColor="#ea580c" />
            <stop offset="1" stopColor="#c2410c" />
          </radialGradient>
        </defs>

        {/* Ambient Glow */}
        <circle cx="60" cy="60" r="44" fill="rgba(245, 158, 11, 0.25)" filter="blur(8px)" />

        {/* 3D Sun Sphere */}
        <circle cx="60" cy="60" r="34" fill={`url(#pure-sun-${uid})`} />

        {/* Ray Flares */}
        <g stroke="#f59e0b" strokeWidth="4" strokeLinecap="round">
          <line x1="60" y1="12" x2="60" y2="20" />
          <line x1="60" y1="100" x2="60" y2="108" />
          <line x1="12" y1="60" x2="20" y2="60" />
          <line x1="100" y1="60" x2="108" y2="60" />
          <line x1="26" y1="26" x2="32" y2="32" />
          <line x1="88" y1="88" x2="94" y2="94" />
          <line x1="26" y1="94" x2="32" y2="88" />
          <line x1="88" y1="32" x2="94" y2="26" />
        </g>
      </svg>
    );
  }

  // 5. NIGHT CLEAR SKY: 3D Golden Moon
  return (
    <svg
      width={sizePixels}
      height={sizePixels}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`animate-float drop-shadow-xl ${className}`}
    >
      <defs>
        <linearGradient id={`night-moon-${uid}`} x1="45" y1="25" x2="85" y2="85" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fef08a" />
          <stop offset="0.5" stopColor="#fde047" />
          <stop offset="1" stopColor="#eab308" />
        </linearGradient>
      </defs>

      <circle cx="60" cy="60" r="32" fill="rgba(254, 240, 138, 0.2)" filter="blur(8px)" />
      <path
        d="M78 30 C64 30 52 42 52 58 C52 74 65 86 80 86 C84 86 89 85 93 82 C88 88 80 92 72 92 C54 92 40 78 40 60 C40 44 51 32 66 30 C70 30 74 30 78 30 Z"
        fill={`url(#night-moon-${uid})`}
      />
      {/* Tiny twinkle stars */}
      <circle cx="34" cy="38" r="2" fill="#ffffff" opacity="0.8" />
      <circle cx="86" cy="24" r="1.5" fill="#ffffff" opacity="0.6" />
      <circle cx="92" cy="68" r="2" fill="#ffffff" opacity="0.7" />
    </svg>
  );
};
