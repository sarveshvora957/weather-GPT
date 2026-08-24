"use client";

import React, { useEffect, useRef } from "react";

interface WeatherBackgroundProps {
  condition?: "clear" | "cloudy" | "rain" | "snow" | "thunderstorm" | "fog";
  isNight?: boolean;
  intensity?: "low" | "medium" | "high";
}

export const WeatherBackground: React.FC<WeatherBackgroundProps> = ({
  condition = "clear",
  isNight = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Particles array
    const particles: any[] = [];
    const count = condition === "rain" || condition === "thunderstorm" ? 90 : condition === "snow" ? 60 : isNight ? 50 : 30;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: Math.random() * 20 + 10,
        speedX: condition === "snow" ? (Math.random() - 0.5) * 1.5 : (Math.random() - 0.5) * 0.5,
        speedY: condition === "rain" || condition === "thunderstorm" ? Math.random() * 12 + 10 : condition === "snow" ? Math.random() * 2 + 1 : Math.random() * 0.3 + 0.1,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.6 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
      });
    }

    let lightningFlash = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Thunderstorm random lightning flash
      if (condition === "thunderstorm" && Math.random() < 0.006) {
        lightningFlash = 1.0;
      }

      if (lightningFlash > 0) {
        ctx.fillStyle = `rgba(180, 220, 255, ${lightningFlash * 0.25})`;
        ctx.fillRect(0, 0, width, height);
        lightningFlash *= 0.9;
      }

      // Render condition-specific particles
      if (condition === "rain" || condition === "thunderstorm") {
        ctx.strokeStyle = "rgba(100, 200, 255, 0.4)";
        ctx.lineWidth = 1.2;
        ctx.lineCap = "round";

        for (const p of particles) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.speedX * 2, p.y + p.length);
          ctx.stroke();

          p.y += p.speedY;
          p.x += p.speedX;

          if (p.y > height) {
            p.y = -p.length;
            p.x = Math.random() * width;
          }
        }
      } else if (condition === "snow") {
        for (const p of particles) {
          ctx.fillStyle = `rgba(240, 248, 255, ${p.opacity})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          p.y += p.speedY;
          p.x += Math.sin(p.y * 0.02) * 0.8 + p.speedX;

          if (p.y > height) {
            p.y = -5;
            p.x = Math.random() * width;
          }
        }
      } else if (isNight || condition === "clear") {
        // Starry night sky or gentle sunbeams
        for (const p of particles) {
          p.opacity += Math.sin(Date.now() * p.twinkleSpeed) * 0.01;
          const clampedOpacity = Math.max(0.1, Math.min(0.8, p.opacity));

          ctx.fillStyle = isNight ? `rgba(200, 230, 255, ${clampedOpacity})` : `rgba(255, 210, 100, ${clampedOpacity * 0.35})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          p.y -= p.speedY;
          if (p.y < 0) {
            p.y = height;
            p.x = Math.random() * width;
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [condition, isNight]);

  // Dynamic atmospheric gradient overlays
  const getGradientClass = () => {
    if (condition === "thunderstorm") {
      return "from-[#0a0d1a] via-[#121128] to-[#050814]";
    }
    if (condition === "rain") {
      return "from-[#071329] via-[#0d1e3d] to-[#040915]";
    }
    if (condition === "snow") {
      return "from-[#0b172a] via-[#162744] to-[#091122]";
    }
    if (condition === "fog" || condition === "cloudy") {
      return "from-[#0c1424] via-[#131c30] to-[#070b16]";
    }
    if (isNight) {
      return "from-[#040817] via-[#09112e] to-[#02050f]";
    }
    // Sunny/Clear
    return "from-[#07193b] via-[#0a2757] to-[#040c1e]";
  };

  return (
    <div className={`fixed inset-0 pointer-events-none -z-10 bg-gradient-to-b ${getGradientClass()} transition-colors duration-1000`}>
      {/* Ambient background glow orbs */}
      <div className="absolute top-[-10%] left-[15%] w-[45vw] h-[45vw] rounded-full bg-brand-500/10 blur-[130px]" />
      <div className="absolute bottom-[-10%] right-[10%] w-[50vw] h-[50vw] rounded-full bg-aurora-purple/10 blur-[150px]" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />
    </div>
  );
};
