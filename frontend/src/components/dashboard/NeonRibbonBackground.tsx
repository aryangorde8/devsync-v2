'use client';

import { useEffect, useRef } from 'react';

type RibbonPoint = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  color: string;
};

export function NeonRibbonBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config = {
      speedX: 0.15,
      speedY: 0.15,
      maxLength: 120,
      redStep: 0.02,
      greenStep: 0.015,
      blueStep: 0.025,
      spreadLimit: 20,
    };

    const points: RibbonPoint[] = [];
    const mouse = { x: 0, y: 0 };
    const prevMouse = { x: 0, y: 0 };
    const colorState = { red: 0, green: 255, blue: 255, size: 0 };
    let animationFrame = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const spreadPoint = (point: RibbonPoint) => {
      point.x += point.dx;
      point.y += point.dy;
    };

    const drawLines = () => {
      const total = points.length;
      if (total < 3) return;

      for (let i = total - 1; i > 1; i -= 1) {
        const p0 = points[i];
        const p1 = points[i - 1];
        const p2 = points[i - 2];

        ctx.beginPath();
        ctx.strokeStyle = p0.color;
        ctx.lineWidth = p0.size;
        ctx.globalAlpha = i / total;

        ctx.moveTo((p1.x + p0.x) / 2, (p1.y + p0.y) / 2);
        ctx.quadraticCurveTo(
          p1.x,
          p1.y,
          (p1.x + p2.x) / 2,
          (p1.y + p2.y) / 2
        );

        ctx.stroke();
        spreadPoint(p0);
      }

      if (points[0]) spreadPoint(points[0]);
      if (points[total - 1]) spreadPoint(points[total - 1]);
    };

    const draw = () => {
      let dx = (mouse.x - prevMouse.x) * config.speedX;
      let dy = (mouse.y - prevMouse.y) * config.speedY;

      dx = Math.max(-config.spreadLimit, Math.min(config.spreadLimit, dx));
      dy = Math.max(-config.spreadLimit, Math.min(config.spreadLimit, dy));

      prevMouse.x = mouse.x;
      prevMouse.y = mouse.y;

      colorState.size += 0.125;
      colorState.red += config.redStep;
      colorState.green += config.greenStep;
      colorState.blue += config.blueStep;

      const size = Math.abs(Math.sin(colorState.size) * 10) + 1;
      const r = Math.floor(Math.sin(colorState.red) * 128 + 128);
      const g = Math.floor(Math.sin(colorState.green) * 128 + 128);
      const b = Math.floor(Math.sin(colorState.blue) * 128 + 128);

      points.push({
        x: mouse.x,
        y: mouse.y,
        dx,
        dy,
        size,
        color: `rgb(${r}, ${g}, ${b})`,
      });

      if (points.length > config.maxLength) points.shift();

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalCompositeOperation = 'lighter';
      drawLines();
      drawLines();
      drawLines();

      animationFrame = requestAnimationFrame(draw);
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    };

    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault();
      const touch = event.touches?.[0];
      if (!touch) return;
      mouse.x = touch.clientX;
      mouse.y = touch.clientY;
    };

    resize();
    mouse.x = window.innerWidth / 2;
    mouse.y = window.innerHeight / 2;
    prevMouse.x = window.innerWidth / 2;
    prevMouse.y = window.innerHeight / 2;

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    draw();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <div className="dashboard-hero-bg fixed inset-0 -z-10 pointer-events-none bg-black">
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
    </div>
  );
}