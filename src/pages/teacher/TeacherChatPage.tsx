import React from 'react';
import { TeacherChatTab } from '../attendance/tabs/TeacherChatTab';
import { MessageSquare, Users } from 'lucide-react';

export const TeacherChatPage: React.FC = () => {
  return (
    <div className="w-full space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-3 py-0.5 rounded-full">
              Sổ Liên Lạc & Nhóm Lớp
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {new Date().toLocaleDateString('vi-VN')}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1">
            Trao Đổi Thông Tin Với Phụ Huynh
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Kênh liên lạc trực tiếp giữa cô giáo chủ nhiệm và phụ huynh học sinh
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <TeacherChatTab />
      </div>
    </div>
  );
};

export default TeacherChatPage;
