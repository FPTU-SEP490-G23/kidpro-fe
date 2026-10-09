import React from 'react';
import { ClassDailyHeadcountSummary } from '../../../../types/executiveDashboard.types';
import { Utensils, AlertTriangle, Users, ChefHat } from 'lucide-react';

interface KitchenMealBreakdownChartProps {
  classSummaries: ClassDailyHeadcountSummary[];
}

export const KitchenMealBreakdownChart: React.FC<KitchenMealBreakdownChartProps> = ({
  classSummaries,
}) => {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-amber-50 text-[#E5A93C]">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Chi Tiết Suất Ăn Bán Trú & Báo Báo Chuyên Cần Từng Lớp
            </h3>
            <p className="text-xs text-slate-500">
              Đồng bộ dữ liệu điểm danh thực tế với bếp ăn lúc 08:30 AM (Cơm, Cháo dinh dưỡng & Khẩu phần tránh dị ứng)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#275A4E]"></span> Cơm thường
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#E5A93C]"></span> Cháo
          </span>
          <span className="flex items-center gap-1.5 font-bold text-rose-700">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-600"></span> Tránh dị ứng
          </span>
        </div>
      </div>

      {/* Bảng danh sách chi tiết từng lớp */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <th className="py-3 px-4">Lớp Học / Khối Lớp</th>
              <th className="py-3 px-4 text-center">Sĩ Số</th>
              <th className="py-3 px-4 text-center">Có Mặt</th>
              <th className="py-3 px-4 text-center">Vắng Mặt</th>
              <th className="py-3 px-4 text-center">Suất Cơm</th>
              <th className="py-3 px-4 text-center">Suất Cháo</th>
              <th className="py-3 px-4 text-center">Tránh Dị Ứng</th>
              <th className="py-3 px-4">Cảnh Báo Dị Ứng Cụ Thể (Allergy Alert)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {classSummaries.map((cls) => {
              const hasAllergy = cls.allergyDietCount > 0;

              return (
                <tr key={cls.classId} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-800 text-sm block">{cls.className}</span>
                    <span className="text-[11px] text-slate-400">{cls.ageGroup}</span>
                  </td>

                  <td className="py-3 px-4 text-center font-bold text-slate-800">
                    {cls.totalStudents}
                  </td>

                  <td className="py-3 px-4 text-center font-bold text-[#275A4E]">
                    {cls.presentCount}
                  </td>

                  <td className="py-3 px-4 text-center font-semibold text-rose-600">
                    {cls.absentCount}
                  </td>

                  <td className="py-3 px-4 text-center font-medium">
                    {cls.regularRiceCount}
                  </td>

                  <td className="py-3 px-4 text-center font-medium">
                    {cls.porridgeCount}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {hasAllergy ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                        {cls.allergyDietCount} suất
                      </span>
                    ) : (
                      <span className="text-slate-300">0</span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    {cls.allergyStudents && cls.allergyStudents.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {cls.allergyStudents.map((st, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold animate-pulse"
                          >
                            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                            <span>
                              {st.name}: {st.allergyNote}
                            </span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Không có cảnh báo dị ứng</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KitchenMealBreakdownChart;
