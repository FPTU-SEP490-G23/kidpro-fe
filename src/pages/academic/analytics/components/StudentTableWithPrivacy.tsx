import React from 'react';
import { StudentRecord } from '../../../../types/studentAnalytics.types';
import { formatDate, formatGradeLevel } from '../../../../utils/formatters';
import {
  AlertTriangle,
  ShieldCheck,
  User,
  Baby,
  Phone,
  Lock,
} from 'lucide-react';

interface StudentTableWithPrivacyProps {
  students: StudentRecord[];
}

export const StudentTableWithPrivacy: React.FC<StudentTableWithPrivacyProps> = ({ students }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-4">
      {/* Banner ghi chú Nghị định 13 */}
      <div className="p-3.5 mx-4 mt-4 rounded-2xl bg-[#EAF4F1] border border-[#78C2AD]/60 flex items-center justify-between text-xs text-[#1E4D40]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#275A4E] shrink-0" />
          <span>
            Dữ liệu cá nhân trẻ em & phụ huynh được bảo vệ theo <strong>Nghị định 13/2023/NĐ-CP</strong>: Số định danh CCCD và địa chỉ chi tiết được che mờ tự động.
          </span>
        </div>
        <span className="font-bold text-[10px] bg-white px-2 py-0.5 rounded-md border border-[#78C2AD]/40">
          MASKED PRIVACY
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <th className="py-3 px-4">Học Sinh</th>
              <th className="py-3 px-4">Lớp / Độ Tuổi</th>
              <th className="py-3 px-4">Ngày Sinh & Giới Tính</th>
              <th className="py-3 px-4">Cảnh Báo Dị Ứng (Allergy Alerts)</th>
              <th className="py-3 px-4">Người Giám Hộ</th>
              <th className="py-3 px-4">Số CCCD (Che Mờ NĐ 13)</th>
              <th className="py-3 px-4 text-center">Trạng Thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {students.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <Baby className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-medium">Không tìm thấy hồ sơ học sinh nào phù hợp</p>
                </td>
              </tr>
            ) : (
              students.map((student) => {
                const hasAllergy = student.allergyTags.length > 0;

                return (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition">
                    {/* Học sinh */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-emerald-50 border border-[#78C2AD] flex items-center justify-center shrink-0">
                          {student.avatarUrl ? (
                            <img
                              src={student.avatarUrl}
                              alt={student.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 text-[#275A4E]" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 text-sm block">
                            {student.fullName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {student.studentCode}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Lớp */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">{student.className}</span>
                      <span className="text-[11px] text-slate-400">{formatGradeLevel(student.ageGroup)}</span>
                    </td>

                    {/* Ngày sinh */}
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-700 block">
                        {formatDate(student.dateOfBirth)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {student.gender === 'MALE' ? 'Bé trai' : 'Bé gái'}
                      </span>
                    </td>

                    {/* Dị ứng */}
                    <td className="py-3.5 px-4">
                      {hasAllergy ? (
                        <div className="flex flex-wrap gap-1">
                          {student.allergyTags.map((tag, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-300 text-rose-800 text-[11px] font-extrabold animate-pulse"
                            >
                              <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                              <span>{tag}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Bình thường (Không dị ứng)</span>
                      )}
                    </td>

                    {/* Người giám hộ */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">{student.guardianName}</span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {student.guardianPhone}
                      </span>
                    </td>

                    {/* CCCD Che mờ */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded-lg w-fit">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>{student.guardianNationalIdMasked}</span>
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          student.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-[#1E4D40] border border-[#78C2AD]'
                            : student.status === 'TRANSFERRED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : student.status === 'RESERVED'
                            ? 'bg-amber-50 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {student.status === 'ACTIVE'
                          ? 'ĐANG THEO HỌC'
                          : student.status === 'TRANSFERRED'
                          ? 'ĐÃ CHUYỂN LỚP'
                          : student.status === 'RESERVED'
                          ? 'ĐANG BẢO LƯU'
                          : 'TỐT NGHIỆP'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentTableWithPrivacy;
