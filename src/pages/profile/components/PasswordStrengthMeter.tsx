import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
}

interface Criterion {
  label: string;
  met: boolean;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const criteria: Criterion[] = [
    { label: 'Tối thiểu 8 ký tự', met: password.length >= 8 },
    { label: 'Ít nhất 1 chữ hoa (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'Ít nhất 1 chữ thường (a-z)', met: /[a-z]/.test(password) },
    { label: 'Ít nhất 1 chữ số (0-9)', met: /\d/.test(password) },
    { label: 'Ít nhất 1 ký tự đặc biệt (!@#$%^&*)', met: /[!@#$%^&*]/.test(password) },
  ];

  const metCount = criteria.filter((c) => c.met).length;

  // Đánh giá mức độ
  let strengthLabel = 'Chưa nhập';
  let strengthColor = 'bg-slate-200 text-slate-500';
  let progressWidth = '0%';
  let progressColor = 'bg-slate-300';

  if (password.length > 0) {
    if (metCount <= 2) {
      strengthLabel = 'Yếu';
      strengthColor = 'text-rose-600';
      progressWidth = '25%';
      progressColor = 'bg-rose-500';
    } else if (metCount === 3) {
      strengthLabel = 'Trung bình';
      strengthColor = 'text-amber-600';
      progressWidth = '50%';
      progressColor = 'bg-[#E5A93C]';
    } else if (metCount === 4) {
      strengthLabel = 'Khá';
      strengthColor = 'text-[#78C2AD]';
      progressWidth = '75%';
      progressColor = 'bg-[#78C2AD]';
    } else {
      strengthLabel = 'Rất mạnh (Khuyên dùng)';
      strengthColor = 'text-[#275A4E] font-bold';
      progressWidth = '100%';
      progressColor = 'bg-[#275A4E]';
    }
  }

  return (
    <div className="space-y-3 rounded-2xl bg-slate-50/80 p-4 border border-slate-200/80">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600">Độ mạnh mật khẩu:</span>
        <span className={`font-semibold ${strengthColor}`}>{strengthLabel}</span>
      </div>

      {/* Thanh tiến trình */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full transition-all duration-300 ease-out ${progressColor}`}
          style={{ width: progressWidth }}
        />
      </div>

      {/* Checklist tiêu chí */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {criteria.map((c, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <div
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors ${
                c.met ? 'bg-emerald-100 text-[#275A4E]' : 'bg-slate-200 text-slate-400'
              }`}
            >
              {c.met ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : <X className="h-2.5 w-2.5" />}
            </div>
            <span className={c.met ? 'text-slate-700 font-medium' : 'text-slate-400'}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
