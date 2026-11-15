import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Home } from 'lucide-react';
import { LeaveRequestReviewTab } from '../attendance/tabs/LeaveRequestReviewTab';
import { BusAttendanceTab } from '../attendance/tabs/BusAttendanceTab';
import { ClassroomEquipmentIncidentTab } from '../attendance/tabs/ClassroomEquipmentIncidentTab';
import { MedicationAdministrationTab } from '../health/tabs/MedicationAdministrationTab';
import { MedicalIncidentsTab } from '../health/tabs/MedicalIncidentsTab';
import { ClassHealthMetricsTab } from '../health/tabs/ClassHealthMetricsTab';
import { ClassroomJournalTab } from '../health/tabs/ClassroomJournalTab';
import { WeeklyLessonPlanTab } from '../academic/tabs/WeeklyLessonPlanTab';
import { EarlyChildhoodEvaluationTab } from '../academic/tabs/EarlyChildhoodEvaluationTab';

interface TeacherSubTaskProps {
  type:
    | 'leave'
    | 'medication'
    | 'health-metrics'
    | 'health-incidents'
    | 'bus'
    | 'lesson-plans'
    | 'evaluations'
    | 'equipment'
    | 'journal';
  title: string;
  subtitle?: string;
}

export const TeacherSubTaskWrapperPage: React.FC<TeacherSubTaskProps> = ({
  type,
  title,
  subtitle,
}) => {
  const navigate = useNavigate();

  return (
    <div className="w-full space-y-6">
      {/* Header với nút quay lại và breadcrumb */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/teacher')}
            className="w-11 h-11 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition shadow-xs cursor-pointer shrink-0"
            aria-label="Quay lại Tổng quan Giáo viên"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <span
                onClick={() => navigate('/teacher')}
                className="hover:text-blue-600 cursor-pointer flex items-center gap-1"
              >
                <Home className="w-3.5 h-3.5" /> Giáo viên
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-600 font-semibold">{title}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-0.5">{title}</h1>
            {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
          </div>
        </div>

        <button
          onClick={() => navigate('/teacher')}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
        >
          Về Dashboard Giáo Viên
        </button>
      </div>

      {/* Nội dung nghiệp vụ */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        {type === 'leave' && <LeaveRequestReviewTab />}
        {type === 'medication' && <MedicationAdministrationTab />}
        {type === 'health-metrics' && <ClassHealthMetricsTab />}
        {type === 'health-incidents' && <MedicalIncidentsTab />}
        {type === 'bus' && <BusAttendanceTab />}
        {type === 'lesson-plans' && <WeeklyLessonPlanTab />}
        {type === 'evaluations' && <EarlyChildhoodEvaluationTab />}
        {type === 'equipment' && <ClassroomEquipmentIncidentTab />}
        {type === 'journal' && <ClassroomJournalTab />}
      </div>
    </div>
  );
};

export default TeacherSubTaskWrapperPage;
