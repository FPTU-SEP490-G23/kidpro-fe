import React from 'react';
import { Outlet } from 'react-router-dom';

export const TeacherShell: React.FC = () => {
  return (
    <div className="w-full text-slate-800">
      <Outlet />
    </div>
  );
};

export default TeacherShell;
