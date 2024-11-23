import React, { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { socket } from '../socket';

interface DrawingCanvasProps {
  lobbyId: string;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ lobbyId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = useRef(false);
  const { userColor } = useStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 3;
    ctxRef.current = ctx;

    const handleResize = () => {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      ctx.putImageData(imageData, 0, 0);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 3;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    socket.on('draw', (data: { x: number; y: number; color: string }) => {
      if (!ctxRef.current) return;
      ctxRef.current.strokeStyle = data.color;
      ctxRef.current.lineTo(data.x, data.y);
      ctxRef.current.stroke();
    });

    socket.on('start_path', (data: { x: number; y: number; color: string }) => {
      if (!ctxRef.current) return;
      ctxRef.current.beginPath();
      ctxRef.current.strokeStyle = data.color;
      ctxRef.current.moveTo(data.x, data.y);
    });

    return () => {
      socket.off('draw');
      socket.off('start_path');
    };
  }, []);

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) 
      ? e.touches[0].clientX - rect.left
      : e.clientX - rect.left;
    const y = ('touches' in e)
      ? e.touches[0].clientY - rect.top
      : e.clientY - rect.top;

    return { x: x * (canvas.width / rect.width), y: y * (canvas.height / rect.height) };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e);
    if (!point) return;

    isDrawingRef.current = true;
    socket.emit('start_drawing', { ...point, color: userColor, lobbyId });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;

    const point = getCanvasPoint(e);
    if (!point) return;

    socket.emit('draw', { ...point, color: userColor, lobbyId });
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
      className="w-full h-[400px] bg-black/20 rounded-lg border border-white/10 touch-none"
    />
  );
};

export default DrawingCanvas;