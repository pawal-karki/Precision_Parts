import { useEffect, useRef } from "react";

export default function AnimatedGear() {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const chars = "░▒▓█▀▄▌▐│─┤├┴┬╭╮╰╯⚙⛭";
    let time = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const radius = Math.min(rect.width, rect.height) * 0.42;

      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const points = [];

      for (let phi = 0; phi < Math.PI * 2; phi += 0.12) {
        for (let theta = 0; theta < Math.PI; theta += 0.12) {
          const x = Math.sin(theta) * Math.cos(phi + time * 0.4);
          const y = Math.sin(theta) * Math.sin(phi + time * 0.4);
          const z = Math.cos(theta);

          const rotY = time * 0.25;
          const newX = x * Math.cos(rotY) - z * Math.sin(rotY);
          const newZ = x * Math.sin(rotY) + z * Math.cos(rotY);

          const rotX = time * 0.15;
          const newY = y * Math.cos(rotX) - newZ * Math.sin(rotX);
          const finalZ = y * Math.sin(rotX) + newZ * Math.cos(rotX);

          const depth = (finalZ + 1) / 2;
          const charIndex = Math.floor(depth * (chars.length - 1));

          points.push({
            x: centerX + newX * radius,
            y: centerY + newY * radius,
            z: finalZ,
            char: chars[charIndex],
          });
        }
      }

      points.sort((a, b) => a.z - b.z);

      points.forEach((point) => {
        const alpha = 0.12 + (point.z + 1) * 0.35;
        ctx.fillStyle = `rgba(77, 97, 114, ${alpha})`;
        ctx.fillText(point.char, point.x, point.y);
      });

      time += 0.015;
      frameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" style={{ display: "block" }} />;
}
