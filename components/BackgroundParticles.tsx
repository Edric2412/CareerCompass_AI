import React, { useEffect, useRef } from 'react';

interface Props {
  isDarkMode: boolean;
}

export const BackgroundParticles: React.FC<Props> = ({ isDarkMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationFrameId: number;
    let time = 0;

    const config = {
      particleSize: 1.0, 
      baseRadius: 120,   // Size of the central "void"
      ringSpacing: 16,   
      lobes: 8,          
      waveAmplitude: 12, 
      rotationSpeed: 0.0002, // Ultra slow rotation
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    class Particle {
      angle: number;
      baseRadius: number;
      radius: number;
      x: number;
      y: number;
      color: string;
      speedOffset: number;
      ringIndex: number;

      constructor(ringIndex: number, angleIndex: number, totalInRing: number) {
        this.ringIndex = ringIndex;
        this.angle = (angleIndex / totalInRing) * Math.PI * 2;
        this.baseRadius = config.baseRadius + (ringIndex * config.ringSpacing);
        this.speedOffset = (ringIndex % 2 === 0 ? 1 : -1) * 0.0001; // Slower shear

        const darkColors = [
            'rgba(34, 211, 238, 0.8)',  // Cyan-400
            'rgba(45, 212, 191, 0.8)',  // Teal-400
            'rgba(6, 182, 212, 0.6)',   // Cyan-500
        ];
        
        const lightColors = [
            'rgba(99, 102, 241, 0.6)',  // Indigo-500
            'rgba(100, 116, 139, 0.6)', // Slate-500
            'rgba(148, 163, 184, 0.7)', // Slate-400
        ];

        const colors = isDarkMode ? darkColors : lightColors;
        this.color = colors[ringIndex % colors.length];
        
        this.radius = this.baseRadius;
        this.x = 0;
        this.y = 0;
      }

      update(t: number, centerX: number, centerY: number) {
        this.angle += config.rotationSpeed + this.speedOffset;
        
        // Gentle breathing
        const breathing = Math.sin(t * 0.2) * 8;
        // Gentle ripples
        const distortion = Math.sin(this.angle * config.lobes + t - (this.ringIndex * 0.1)) * config.waveAmplitude;

        this.radius = this.baseRadius + breathing + distortion;
        this.x = centerX + Math.cos(this.angle) * this.radius;
        this.y = centerY + Math.sin(this.angle) * this.radius;
      }

      draw(centerX: number, centerY: number, maxRadius: number) {
        if (!ctx) return;

        const dx = this.x - centerX;
        const dy = this.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const distNormalized = dist / maxRadius;
        
        let alpha = 1;

        // 1. Center Void Fade:
        if (dist < config.baseRadius) {
            alpha = 0;
        } else if (dist < config.baseRadius + 80) {
            alpha = (dist - config.baseRadius) / 80;
        }

        // 2. Edge/Vignette Fade:
        if (distNormalized > 0.35) {
            const fadeStart = 0.35;
            const fadeEnd = 0.75;
            const fadeProgress = (distNormalized - fadeStart) / (fadeEnd - fadeStart);
            const edgeAlpha = 1 - fadeProgress;
            alpha *= Math.max(0, edgeAlpha);
        }

        if (alpha <= 0.01) return;

        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, config.particleSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
        ctx.globalAlpha = 1.0;
      }
    }

    const initParticles = () => {
      particles = [];
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.sqrt(centerX ** 2 + centerY ** 2);
      
      const numberOfRings = Math.floor((maxRadius - config.baseRadius) / config.ringSpacing) + 2;

      for (let r = 0; r < numberOfRings; r++) {
        const radius = config.baseRadius + (r * config.ringSpacing);
        const circumference = 2 * Math.PI * radius;
        const particlesInRing = Math.floor(circumference / 20);

        for (let a = 0; a < particlesInRing; a++) {
          particles.push(new Particle(r, a, particlesInRing));
        }
      }
    };

    const animate = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.sqrt(centerX ** 2 + centerY ** 2);

      ctx.fillStyle = isDarkMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      time += 0.002;

      particles.forEach(p => {
        p.update(time, centerX, centerY);
        p.draw(centerX, centerY, maxRadius);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDarkMode]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000"
      // Decreased opacity for dark mode (0.35) while keeping light mode subtle (0.4)
      style={{ opacity: isDarkMode ? 0.35 : 0.4 }} 
    />
  );
};