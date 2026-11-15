import React from 'react';
import { TeacherChatTab } from '../attendance/tabs/TeacherChatTab';

export const TeacherChatPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-900">Trao Đổi Với Phụ Huynh</h1>
        <p className="text-xs text-slate-500 font-medium">Nhóm chat chung của lớp & tin nhắn riêng theo từng bé</p>
      </div>

      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
        <TeacherChatTab />
      </div>
    </div>
  );
};
