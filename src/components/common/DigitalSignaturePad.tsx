import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Check, PenTool } from 'lucide-react';

interface DigitalSignaturePadProps {
  signerTitle: string; // vd: "Bếp trưởng" | "Đại diện Ban Giám Hiệu"
  signerName?: string;
  onSave: (signatureDataUrl: string) => void;
  savedSignature?: string;
  disabled?: boolean;
}

export const DigitalSignaturePad: React.FC<DigitalSignaturePadProps> = ({
  signerTitle,
  signerName = '',
  onSave,
  savedSignature,
  disabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [currentSignature, setCurrentSignature] = useState<string | undefined>(savedSignature);

  useEffect(() => {
    setCurrentSignature(savedSignature);
  }, [savedSignature]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1E4D40'; // Deep Brand Green
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setCurrentSignature(undefined);
  };

  const handleConfirmSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setCurrentSignature(dataUrl);
    onSave(dataUrl);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <PenTool className="h-3.5 w-3.5 text-[#275A4E]" />
          <span>Chữ ký số: {signerTitle}</span>
          {signerName && <span className="font-normal text-slate-500">({signerName})</span>}
        </div>
        {currentSignature && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Check className="h-3 w-3" />
            Đã ký điện tử
          </span>
        )}
      </div>

      {currentSignature ? (
        <div className="relative rounded-lg border border-emerald-200 bg-emerald-50/20 p-2 text-center">
          <img
            src={currentSignature}
            alt={`Chữ ký ${signerTitle}`}
            className="h-20 mx-auto object-contain"
          />
          {!disabled && (
            <button
              type="button"
              onClick={clearCanvas}
              className="mt-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
            >
              Ký lại
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50">
            <canvas
              ref={canvasRef}
              width={400}
              height={100}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-24 touch-none cursor-crosshair"
            />
            {!hasDrawn && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                Vẽ hoặc ký trực tiếp bằng ngón tay / bút cảm ứng tại đây
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={clearCanvas}
              disabled={!hasDrawn || disabled}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Xóa</span>
            </button>
            <button
              type="button"
              onClick={handleConfirmSignature}
              disabled={!hasDrawn || disabled}
              className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold text-white bg-[#275A4E] hover:bg-[#1E4D40] rounded-lg disabled:opacity-40 transition shadow-xs cursor-pointer"
            >
              <Check className="h-3 w-3" />
              <span>Xác nhận chữ ký</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
