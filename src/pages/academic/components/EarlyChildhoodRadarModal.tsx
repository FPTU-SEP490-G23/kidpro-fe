import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  X,
  Award,
  AlertTriangle,
  Heart,
  Brain,
  Activity,
  Smile,
  Palette,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { ClassStudentEvaluationItem } from '../../../types/classroom.types';

interface EarlyChildhoodRadarModalProps {
  student: ClassStudentEvaluationItem | null;
  isOpen: boolean;
  onClose: () => void;
  ageGroupName?: string;
  termLabel?: string;
}

export const EarlyChildhoodRadarModal: React.FC<EarlyChildhoodRadarModalProps> = ({
  student,
  isOpen,
  onClose,
  ageGroupName = 'Khối Mầm (3 - 4 Tuổi)',
  termLabel = 'Học kỳ I',
}) => {
  if (!isOpen || !student) return null;

  const scores = student.scores;

  // Cấu trúc 5 trục theo Thông tư 28/2016/TT-BGDĐT
  const chartData = [
    {
      domain: 'Thể chất',
      studentScore: scores.physicalScore || (scores.physicalStatus === 'PASS' ? 5 : 2),
      benchmark: 4.5,
      status: scores.physicalStatus === 'PASS' ? 'Đạt chuẩn' : 'Cần rèn luyện',
      fullMark: 5,
    },
    {
      domain: 'Nhận thức',
      studentScore: scores.cognitiveScore || (scores.cognitiveStatus === 'PASS' ? 5 : 2),
      benchmark: 4.5,
      status: scores.cognitiveStatus === 'PASS' ? 'Đạt chuẩn' : 'Cần rèn luyện',
      fullMark: 5,
    },
    {
      domain: 'Ngôn ngữ',
      studentScore: scores.languageScore || (scores.languageStatus === 'PASS' ? 5 : 2),
      benchmark: 4.5,
      status: scores.languageStatus === 'PASS' ? 'Đạt chuẩn' : 'Cần rèn luyện',
      fullMark: 5,
    },
    {
      domain: 'Tình cảm & XH',
      studentScore: scores.emotionalScore || (scores.emotionalStatus === 'PASS' ? 5 : 2),
      benchmark: 4.5,
      status: scores.emotionalStatus === 'PASS' ? 'Đạt chuẩn' : 'Cần rèn luyện',
      fullMark: 5,
    },
    {
      domain: 'Thẩm mỹ',
      studentScore: scores.aestheticScore || (scores.aestheticStatus === 'PASS' ? 5 : 2),
      benchmark: 4.5,
      status: scores.aestheticStatus === 'PASS' ? 'Đạt chuẩn' : 'Cần rèn luyện',
      fullMark: 5,
    },
  ];

  // Kiểm tra điều kiện MSG-265: nếu có trên 70% chỉ số "Chưa đạt" / "Cần rèn luyện"
  // (tức >= 4/5 chỉ số, hoặc >= 70% của 5 chỉ số là 3.5 -> 4 chỉ số trở lên)
  const developingCount = [
    scores.physicalStatus,
    scores.cognitiveStatus,
    scores.languageStatus,
    scores.emotionalStatus,
    scores.aestheticStatus,
  ].filter((st) => st === 'DEVELOPING').length;

  const isHighRiskDelayed = developingCount >= 3; // >= 60-70% chỉ số cần rèn luyện
  const isAllPassed = developingCount === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="p-5 bg-gradient-to-r from-[#1E4D40] to-[#275A4E] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold text-lg border border-white/20 overflow-hidden">
              {student.avatarUrl ? (
                <img src={student.avatarUrl} alt={student.studentName} className="w-full h-full object-cover" />
              ) : (
                <span>{student.studentName.charAt(0)}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{student.studentName}</h3>
                <span className="px-2 py-0.5 rounded text-xs bg-white/20 font-medium">
                  {student.studentCode}
                </span>
              </div>
              <p className="text-xs text-white/80 flex items-center gap-3 mt-0.5">
                <span>{ageGroupName}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {termLabel}
                </span>
                {student.dateOfBirth && (
                  <>
                    <span>•</span>
                    <span>Sinh ngày: {student.dateOfBirth}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng biểu đồ"
            className="p-2 hover:bg-white/10 rounded-lg transition text-white/80 hover:text-white cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Cảnh báo MSG-265 nếu trẻ có dấu hiệu chậm phát triển */}
          {isHighRiskDelayed && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-amber-900">
                  Lưu ý Sư phạm & Tư vấn Tâm lý (Thông tư 28/2016/TT-BGDĐT)
                </h4>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  <strong>MSG-265:</strong> Trẻ có dấu hiệu chậm phát triển ở nhiều chỉ số ({developingCount}/5 lĩnh vực cần rèn luyện). Đề xuất trao đổi nhẹ nhàng với phụ huynh và chuyên gia tâm lý để xây dựng kế hoạch can thiệp sớm phù hợp.
                </p>
              </div>
            </div>
          )}

          {isAllPassed && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3 shadow-xs">
              <Award className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-emerald-900 flex items-center gap-1.5">
                  <span>Phát Triển Xuất Sắc & Đồng Đều</span>
                  <Sparkles className="w-4 h-4 text-[#E5A93C]" />
                </h4>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  Trẻ đạt chuẩn toàn diện cả 5 lĩnh vực phát triển theo lứa tuổi. Khả năng tương tác xã hội và tiếp thu nhận thức rất tốt.
                </p>
              </div>
            </div>
          )}

          {/* Radar Chart Recharts Section */}
          <div className="bg-slate-50/70 p-4 sm:p-6 rounded-2xl border border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div>
                <h4 className="text-sm font-bold text-[#1E4D40] flex items-center gap-2">
                  <span>Biểu Đồ Mạng Nhện 5 Trục Phát Triển (Radar Chart)</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Đối sánh thực tế của bé so với mức chuẩn quy định Bộ Giáo dục & Đào tạo
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#275A4E]" />
                  <span className="font-medium text-slate-700">Điểm số của bé</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#E5A93C]" />
                  <span className="font-medium text-slate-700">Chuẩn lứa tuổi (4.5)</span>
                </div>
              </div>
            </div>

            {/* Radar Chart Container */}
            <div className="w-full h-[280px] sm:h-[320px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                  <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" />
                  <PolarAngleAxis
                    dataKey="domain"
                    tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Radar
                    name="Chuẩn Bộ GD&ĐT"
                    dataKey="benchmark"
                    stroke="#E5A93C"
                    fill="#E5A93C"
                    fillOpacity={0.15}
                    strokeDasharray="4 4"
                  />
                  <Radar
                    name="Kết quả của bé"
                    dataKey="studentScore"
                    stroke="#275A4E"
                    fill="#78C2AD"
                    fillOpacity={0.5}
                    strokeWidth={2.5}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200 text-xs space-y-1 z-50">
                            <p className="font-bold text-[#1E4D40] text-sm">{data.domain}</p>
                            <p className="text-slate-600">
                              Điểm đánh giá:{' '}
                              <span className="font-semibold text-[#275A4E]">
                                {data.studentScore} / 5.0
                              </span>{' '}
                              ({data.status})
                            </p>
                            <p className="text-slate-500">
                              Chuẩn lứa tuổi:{' '}
                              <span className="font-semibold text-[#E5A93C]">
                                {data.benchmark} / 5.0
                              </span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Thẻ 5 Lĩnh vực Chi Tiết */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Chi tiết đánh giá từng tiêu chí
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* 1. Thể chất */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    Thể chất
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      scores.physicalStatus === 'PASS'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {scores.physicalStatus === 'PASS' ? 'Đạt' : 'Cần rèn luyện'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Vận động thô, vận động tinh, phối hợp tay - mắt, vệ sinh cá nhân
                </p>
              </div>

              {/* 2. Nhận thức */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Brain className="w-4 h-4 text-blue-600" />
                    Nhận thức
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      scores.cognitiveStatus === 'PASS'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {scores.cognitiveStatus === 'PASS' ? 'Đạt' : 'Cần rèn luyện'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Toán học sơ đẳng, khám phá khoa học, nhận biết môi trường xung quanh
                </p>
              </div>

              {/* 3. Ngôn ngữ */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Smile className="w-4 h-4 text-purple-600" />
                    Ngôn ngữ
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      scores.languageStatus === 'PASS'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {scores.languageStatus === 'PASS' ? 'Đạt' : 'Cần rèn luyện'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Khả năng nghe hiểu, diễn đạt lời nói mạch lạc, tiếp cận văn học
                </p>
              </div>

              {/* 4. Tình cảm & KNXH */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Heart className="w-4 h-4 text-rose-600" />
                    Tình cảm & Xã hội
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      scores.emotionalStatus === 'PASS'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {scores.emotionalStatus === 'PASS' ? 'Đạt' : 'Cần rèn luyện'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Thể hiện cảm xúc, ý thức bản thân, hợp tác và chia sẻ với bạn bè
                </p>
              </div>

              {/* 5. Thẩm mỹ */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Palette className="w-4 h-4 text-amber-600" />
                    Thẩm mỹ
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      scores.aestheticStatus === 'PASS'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {scores.aestheticStatus === 'PASS' ? 'Đạt' : 'Cần rèn luyện'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Cảm thụ âm nhạc, tạo hình vẽ/xé dán, yêu thích vẻ đẹp tự nhiên
                </p>
              </div>
            </div>
          </div>

          {/* Nhận xét định tính của cô giáo */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <h4 className="text-xs font-bold text-slate-700 mb-1">
              Nhận xét định tính sư phạm của giáo viên chủ nhiệm
            </h4>
            <p className="text-xs text-slate-600 italic leading-relaxed">
              "{scores.teacherNotes || 'Bé ngoan, tích cực tham gia các hoạt động trong ngày của lớp.'}"
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500">
            Bản quyền mẫu biểu: Thông tư 28/2016/TT-BGDĐT • Ban hành bởi Bộ Giáo Dục & Đào Tạo
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#275A4E] text-white text-xs sm:text-sm font-semibold hover:bg-[#1E4D40] transition cursor-pointer min-h-[44px]"
          >
            Đóng Biểu Đồ
          </button>
        </div>
      </div>
    </div>
  );
};
