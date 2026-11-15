import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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
    <div className="max-w-md mx-auto p-4 space-y-4">
      {/* Header với nút quay lại */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/teacher')}
          className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 active:scale-95 touch-target shadow-sm"
          aria-label="Quay lại"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
        </div>
      </div>

      {/* Nội dung nghiệp vụ */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
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
