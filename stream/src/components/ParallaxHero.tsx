import React, { useState, useRef, type MouseEvent } from 'react';
import './ParallaxHero.css';

interface ParallaxHeroProps {
  title: React.ReactNode;
  subtitle: string;
  onCtaClick?: () => void;
  ctaText?: string;
  backgroundImage?: string;
}

export default function ParallaxHero({ 
  title, 
  subtitle, 
  onCtaClick, 
  ctaText = "Get Started",
  backgroundImage = "https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/images/collection.png"
}: ParallaxHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    // Calculate mouse position relative to the center of the container (-1 to 1)
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    // Max rotation in degrees
    const maxRotation = 20;
    
    setRotation({
      x: -y * maxRotation, // Mouse up (negative Y) tilts up (positive rotateX)
      y: x * maxRotation   // Mouse right (positive X) tilts right (positive rotateY)
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 }); // Reset to center
  };

  // Determine transition styles: snappy when moving, smooth easing when leaving
  const transformStyle = {
    transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
    transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)'
  };

  return (
    <div 
      className="parallax-hero-container"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="parallax-hero-scene" style={transformStyle}>
        
        {/* LAYER 1: Background Image (pushed back) */}
        <div 
          className="parallax-layer-bg" 
          style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url(${backgroundImage})` }}
        />

        {/* LAYER 2: Floating UI Cards (mid-ground) */}
        <div className="parallax-layer-cards">
          <div className="glass-card card-left">
            <div className="glass-skeleton sk-title" />
            <div className="glass-skeleton sk-line" />
            <div className="glass-skeleton sk-line short" />
          </div>
          <div className="glass-card card-right">
             <div className="glass-avatar" />
             <div className="glass-skeleton sk-line" />
          </div>
        </div>

        {/* LAYER 3: Foreground Text & CTA (popping out) */}
        <div className="parallax-layer-foreground">
          <h1 className="ph-title">{title}</h1>
          <p className="ph-subtitle">{subtitle}</p>
          {onCtaClick && (
            <button className="ph-btn" onClick={onCtaClick}>
              {ctaText}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
