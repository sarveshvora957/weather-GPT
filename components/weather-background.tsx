"use client";

import React, { useEffect, useRef } from "react";

export type WeatherConditionType =
  | "clear"
  | "partly_cloudy"
  | "cloudy"
  | "rain"
  | "thunderstorm"
  | "snow"
  | "fog";

interface WeatherBackgroundProps {
  condition?: WeatherConditionType | string;
  isNight?: boolean;
  intensity?: "low" | "medium" | "high";
}

export const WeatherBackground: React.FC<WeatherBackgroundProps> = ({
  condition = "clear",
  isNight = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Normalize condition string to valid category
  const normalizedCondition: WeatherConditionType = React.useMemo(() => {
    const c = condition.toLowerCase();
    if (c.includes("thunder") || c.includes("lightning") || c.includes("storm")) return "thunderstorm";
    if (c.includes("rain") || c.includes("drizzle") || c.includes("shower")) return "rain";
    if (c.includes("snow") || c.includes("blizzard") || c.includes("ice") || c.includes("hail")) return "snow";
    if (c.includes("fog") || c.includes("mist") || c.includes("haze") || c.includes("smoke")) return "fog";
    if (c.includes("partly") || c.includes("few clouds") || c.includes("scattered")) return "partly_cloudy";
    if (c.includes("cloud") || c.includes("overcast")) return "cloudy";
    return "clear";
  }, [condition]);

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

    // Particle pools based on condition
    const particles: any[] = [];
    const splashes: any[] = [];
    const clouds: any[] = [];

    const particleCount =
      normalizedCondition === "rain" || normalizedCondition === "thunderstorm"
        ? 120
        : normalizedCondition === "snow"
        ? 75
        : normalizedCondition === "fog"
        ? 35
        : isNight
        ? 65
        : 25;

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: Math.random() * 24 + 12,
        speedX:
          normalizedCondition === "snow"
            ? (Math.random() - 0.5) * 1.5
            : normalizedCondition === "rain" || normalizedCondition === "thunderstorm"
            ? (Math.random() - 0.5) * 0.8 - 1.5
            : (Math.random() - 0.5) * 0.4,
        speedY:
          normalizedCondition === "rain" || normalizedCondition === "thunderstorm"
            ? Math.random() * 14 + 12
            : normalizedCondition === "snow"
            ? Math.random() * 2.2 + 0.8
            : normalizedCondition === "fog"
            ? Math.random() * 0.3 + 0.1
            : Math.random() * 0.3 + 0.1,
        radius:
          normalizedCondition === "snow"
            ? Math.random() * 2.5 + 1.2
            : normalizedCondition === "fog"
            ? Math.random() * 45 + 25
            : Math.random() * 2 + 0.8,
        opacity: Math.random() * 0.6 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
      });
    }

    // Initialize decorative drifting clouds for cloudy/partly cloudy
    if (normalizedCondition === "partly_cloudy" || normalizedCondition === "cloudy") {
      const cloudCount = normalizedCondition === "cloudy" ? 6 : 3;
      for (let c = 0; c < cloudCount; c++) {
        clouds.push({
          x: Math.random() * width,
          y: Math.random() * (height * 0.45),
          radius: Math.random() * 60 + 50,
          speedX: Math.random() * 0.2 + 0.08,
          opacity: Math.random() * 0.15 + 0.08,
        });
      }
    }

    let lightningFlash = 0;
    let nextLightningTime = Date.now() + Math.random() * 5000 + 3000;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Thunderstorm realistic lightning flash
      if (normalizedCondition === "thunderstorm") {
        if (Date.now() > nextLightningTime) {
          lightningFlash = 1.0;
          nextLightningTime = Date.now() + Math.random() * 8000 + 4000;
        }

        if (lightningFlash > 0.01) {
          ctx.fillStyle = `rgba(215, 235, 255, ${lightningFlash * 0.35})`;
          ctx.fillRect(0, 0, width, height);
          lightningFlash *= 0.88;
        }
      }

      // 2. Cloud Puff Layer
      if (clouds.length > 0) {
        for (const cloud of clouds) {
          ctx.fillStyle = isNight
            ? `rgba(140, 160, 200, ${cloud.opacity * 0.6})`
            : `rgba(255, 255, 255, ${cloud.opacity})`;
          ctx.beginPath();
          ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
          ctx.arc(cloud.x + cloud.radius * 0.6, cloud.y - cloud.radius * 0.2, cloud.radius * 0.8, 0, Math.PI * 2);
          ctx.arc(cloud.x + cloud.radius * 1.2, cloud.y, cloud.radius * 0.9, 0, Math.PI * 2);
          ctx.fill();

          cloud.x += cloud.speedX;
          if (cloud.x - cloud.radius * 2 > width) {
            cloud.x = -cloud.radius * 2;
            cloud.y = Math.random() * (height * 0.45);
          }
        }
      }

      // 3. Rain & Thunderstorm Particles with Bottom Splash Rings
      if (normalizedCondition === "rain" || normalizedCondition === "thunderstorm") {
        ctx.strokeStyle = "rgba(125, 211, 252, 0.45)";
        ctx.lineWidth = 1.3;
        ctx.lineCap = "round";

        for (const p of particles) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.speedX * 2, p.y + p.length);
          ctx.stroke();

          p.y += p.speedY;
          p.x += p.speedX;

          if (p.y > height - 10) {
            // Chance of splash ring
            if (splashes.length < 25 && Math.random() < 0.25) {
              splashes.push({
                x: p.x,
                y: height - Math.random() * 15,
                radius: 1,
                maxRadius: Math.random() * 7 + 3,
                opacity: 0.5,
              });
            }
            p.y = -p.length;
            p.x = Math.random() * width;
          }
        }

        // Render Splash Rings
        for (let s = splashes.length - 1; s >= 0; s--) {
          const sp = splashes[s];
          ctx.strokeStyle = `rgba(186, 230, 253, ${sp.opacity})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.ellipse(sp.x, sp.y, sp.radius * 2, sp.radius * 0.6, 0, 0, Math.PI * 2);
          ctx.stroke();

          sp.radius += 0.4;
          sp.opacity -= 0.035;

          if (sp.opacity <= 0 || sp.radius >= sp.maxRadius) {
            splashes.splice(s, 1);
          }
        }
      } else if (normalizedCondition === "snow") {
        // 4. Snow Particles
        for (const p of particles) {
          ctx.fillStyle = `rgba(240, 248, 255, ${p.opacity})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          p.y += p.speedY;
          p.x += Math.sin(p.y * 0.015) * 0.7 + p.speedX;

          if (p.y > height) {
            p.y = -6;
            p.x = Math.random() * width;
          }
        }
      } else if (normalizedCondition === "fog") {
        // 5. Fog / Mist drifting vapor puffs
        for (const p of particles) {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
          grad.addColorStop(0, `rgba(200, 215, 230, ${p.opacity * 0.15})`);
          grad.addColorStop(1, "rgba(200, 215, 230, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          p.x += p.speedX;
          p.y += Math.sin(p.x * 0.01) * 0.2;

          if (p.x > width + p.radius) p.x = -p.radius;
        }
      } else if (isNight) {
        // 6. Starry Night Sky (Twinkling cosmic stars)
        for (const p of particles) {
          p.opacity += Math.sin(Date.now() * p.twinkleSpeed) * 0.01;
          const clampedOpacity = Math.max(0.15, Math.min(0.9, p.opacity));

          ctx.fillStyle = `rgba(224, 242, 254, ${clampedOpacity})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          p.y -= 0.05;
          if (p.y < 0) {
            p.y = height;
            p.x = Math.random() * width;
          }
        }
      } else {
        // 7. Clear Sunny Day (Warm ambient solar motes)
        for (const p of particles) {
          p.opacity += Math.sin(Date.now() * p.twinkleSpeed) * 0.008;
          const clampedOpacity = Math.max(0.1, Math.min(0.55, p.opacity));

          ctx.fillStyle = `rgba(255, 220, 140, ${clampedOpacity * 0.4})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 1.5, 0, Math.PI * 2);
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
  }, [normalizedCondition, isNight]);

  // Atmospheric background gradients (curated for readability and modern weather-app realism)
  const getGradientClass = () => {
    if (isNight) {
      if (normalizedCondition === "thunderstorm") return "from-[#08091a] via-[#12132e] to-[#04050d]";
      if (normalizedCondition === "rain") return "from-[#060f1e] via-[#0a182f] to-[#030812]";
      if (normalizedCondition === "snow") return "from-[#09152a] via-[#102242] to-[#050b18]";
      return "from-[#070b19] via-[#0d162e] to-[#040814]";
    }

    // Daytime gradients
    switch (normalizedCondition) {
      case "thunderstorm":
        return "from-[#13172b] via-[#1f1e3d] to-[#0a0d17]";
      case "rain":
        return "from-[#1c2c3d] via-[#283d54] to-[#121d28]";
      case "snow":
        return "from-[#203a5c] via-[#2f517d] to-[#172c47]";
      case "fog":
        return "from-[#283542] via-[#37495b] to-[#1c252e]";
      case "cloudy":
        return "from-[#2b3a4a] via-[#3a4e63] to-[#1e2a36]";
      case "partly_cloudy":
        return "from-[#18497d] via-[#2565a8] to-[#123863]";
      case "clear":
      default:
        return "from-[#1a5eb0] via-[#2a77cc] to-[#13498a]";
    }
  };

  return (
    <div
      className={`fixed inset-0 pointer-events-none -z-10 bg-gradient-to-b ${getGradientClass()} transition-colors duration-1000 overflow-hidden`}
    >
      {/* Dynamic ambient sun/moon/storm glow orbs */}
      {!isNight && (normalizedCondition === "clear" || normalizedCondition === "partly_cloudy") && (
        <div className="absolute top-[-8%] right-[12%] w-[45vw] h-[45vw] rounded-full bg-amber-400/15 blur-[120px] pointer-events-none animate-pulse-slow" />
      )}

      {isNight && (
        <div className="absolute top-[5%] right-[15%] w-[35vw] h-[35vw] rounded-full bg-aurora-cyan/10 blur-[130px] pointer-events-none" />
      )}

      {(normalizedCondition === "rain" || normalizedCondition === "thunderstorm") && (
        <div className="absolute bottom-[-10%] left-[10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/10 blur-[140px] pointer-events-none" />
      )}

      <div className="absolute bottom-[-10%] right-[10%] w-[45vw] h-[45vw] rounded-full bg-aurora-purple/10 blur-[150px] pointer-events-none" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-70" />
    </div>
  );
};
