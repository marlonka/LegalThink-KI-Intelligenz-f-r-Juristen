import React, { useEffect, useRef, useState } from 'react';

interface LoaderProps {
  messages?: string[];
}

const Loader: React.FC<LoaderProps> = ({ messages }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Default generic messages if none provided
  const defaultMessages = [
    "Analysiere Akteninhalt...",
    "Prüfe BGB-Konformität...",
    "Generiere Analysebericht...",
    "Finalisiere Entwurf..."
  ];

  const activeMessages = messages && messages.length > 0 ? messages : defaultMessages;
  
  const [loadingText, setLoadingText] = useState(activeMessages[0]);

  useEffect(() => {
    let index = 0;
    // Immediate set to ensure first render is correct
    setLoadingText(activeMessages[0]);
    
    const interval = setInterval(() => {
      index = (index + 1) % activeMessages.length;
      setLoadingText(activeMessages[index]);
    }, 2500); // 2.5s cycle for readability
    
    return () => clearInterval(interval);
  }, [JSON.stringify(activeMessages)]); // Re-run if messages prop changes

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 300;
      canvas.height = 100;
    };
    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Professional Gradient: Navy to Teal
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#0f172a'); 
      gradient.addColorStop(1, '#0e7490'); 

      ctx.lineWidth = 2; // Thinner line for elegance
      ctx.strokeStyle = gradient;
      
      ctx.beginPath();
      
      const amplitude = 10; // Smaller waves
      const frequency = 0.02;
      const speed = 0.03; // Slower speed
      
      for (let x = 0; x < canvas.width; x++) {
        // Double sine for complexity
        const y = canvas.height / 2 + Math.sin(x * frequency + time) * amplitude + Math.sin(x * 0.05 + time * 0.5) * 5;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      
      ctx.stroke();
      time += speed;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 w-full max-w-md mx-auto">
      <canvas ref={canvasRef} className="w-full h-24 mb-4" />
      <p className="text-sm font-medium text-firm-navy tracking-wide shimmer">
        {loadingText}
      </p>
    </div>
  );
};

export default Loader;