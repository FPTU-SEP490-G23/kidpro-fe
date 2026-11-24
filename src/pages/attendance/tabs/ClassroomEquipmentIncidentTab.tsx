import React, { useEffect, useState } from 'react';
import { Wrench, Upload, CheckCircle2, AlertTriangle, Clock, Plus, X, RefreshCw } from 'lucide-react';
import { attendanceApi } from '../../../api/attendanceApi';
import {
  equipmentIncidentApi,
  EquipmentIncidentItem,
  ClassEquipmentOption,
  IncidentSeverity,
  INCIDENT_PHOTO_MAX_BYTES,
  INCIDENT_PHOTO_TYPES,
  formatDateTime,
  apiErrorMessage,
} from '../../../api/equipmentIncidentApi';

interface TeacherClass {
  classId: string;
  className: string;
}

/** Chọn "Thiết bị khác" khi thiết bị chưa có trong danh mục tài sản của lớp. */
const OTHER = '__other__';
const MSG_215 = 'Vui lòng nhập mô tả chi tiết sự cố và tải lên ít nhất 01 ảnh chụp hiện trường.';

/** Giáo viên báo hỏng CSVC trên web (RP3 UC-67, BR-051, BR-052). */
export const ClassroomEquipmentIncidentTab: React.FC = () => {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [incidents, setIncidents] = useState<EquipmentIncidentItem[]>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<ClassEquipmentOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [equipmentChoice, setEquipmentChoice] = useState<string>('');
  const [otherName, setOtherName] = useState<string>('');
  const [damagedQuantity, setDamagedQuantity] = useState<number>(1);
  const [description, setDescription] = useState<string>('');
  const [severity, setSeverity] = useState<IncidentSeverity>('NORMAL');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'warning' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Lớp giáo viên phụ trách
  useEffect(() => {
    attendanceApi.getTeacherMyClasses().then((list: any[]) => {
      const mapped = (list || []).map((c) => ({ classId: String(c.classId), className: c.className }));
      setClasses(mapped);
      if (mapped.length > 0) setSelectedClassId(mapped[0].classId);
      else setLoading(false);
    });
  }, []);

  const loadIncidents = async (classId: string) => {
    if (!classId) return;
    setLoading(true);
    try {
      const [list, options] = await Promise.all([
        equipmentIncidentApi.getByClass(classId),
        equipmentIncidentApi.getClassEquipment(classId).catch(() => [] as ClassEquipmentOption[]),
      ]);
      setIncidents(list);
      setEquipmentOptions(options);
    } catch (err: any) {
      setIncidents([]);
      showToast('error', apiErrorMessage(err, 'Không tải được danh sách phiếu báo hỏng.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents(selectedClassId);
  }, [selectedClassId]);

  const selectedOption = equipmentOptions.find((o) => o.equipmentId === equipmentChoice);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // UC-67 E2 (MSG-195): chỉ JPG/PNG, tối đa 10MB
    if (!INCIDENT_PHOTO_TYPES.includes(file.type)) {
      showToast('warning', 'Ảnh hiện trường chỉ nhận định dạng JPG hoặc PNG.');
      return;
    }
    if (file.size > INCIDENT_PHOTO_MAX_BYTES) {
      showToast('warning', 'Ảnh hiện trường quá lớn (tối đa 10MB).');
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const openForm = () => {
    setEquipmentChoice(equipmentOptions.length > 0 ? '' : OTHER);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setEquipmentChoice('');
    setOtherName('');
    setDamagedQuantity(1);
    setDescription('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setSeverity('NORMAL');
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    const isOther = equipmentChoice === OTHER;
    if (!equipmentChoice || (isOther && !otherName.trim())) {
      showToast('warning', 'Vui lòng chọn thiết bị trong danh mục hoặc nhập tên thiết bị.');
      return;
    }
    // UC-67 E1 (MSG-215): bắt buộc mô tả và ảnh hiện trường
    if (!description.trim() || !photoFile) {
      showToast('warning', MSG_215);
      return;
    }
    if (damagedQuantity < 1 || (selectedOption && damagedQuantity > selectedOption.goodQuantity)) {
      showToast('warning', `Số lượng hỏng phải từ 1 đến ${selectedOption ? selectedOption.goodQuantity : 'số thiết bị hiện có'}.`);
      return;
    }

    setSubmitting(true);
    try {
      const photoUrl = await equipmentIncidentApi.uploadPhoto(photoFile);
      const res = await equipmentIncidentApi.report({
        classroomId: selectedClassId,
        equipmentId: isOther ? undefined : equipmentChoice,
        equipmentName: isOther ? otherName.trim() : undefined,
        damagedQuantity,
        description: description.trim(),
        severity,
        photoUrl,
      });
      setShowAddModal(false);
      resetForm();
      showToast('success', res.message || 'Gửi báo cáo sự cố hư hỏng cơ sở vật chất lớp học thành công.');
      await loadIncidents(selectedClassId);
    } catch (err: any) {
      // Giữ nguyên form để giáo viên sửa và gửi lại
      showToast('error', apiErrorMessage(err, 'Không gửi được báo cáo hư hỏng.'));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedClassName = classes.find((c) => c.classId === selectedClassId)?.className;

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans']">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 transition-all animate-in fade-in shadow-sm ${
            toastMessage.type === 'success'
              ? 'bg-[#78C2AD]/15 border border-[#78C2AD] text-[#1E4D40]'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 border border-amber-300 text-amber-900'
              : 'bg-rose-50 border border-rose-300 text-rose-900'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-[#275A4E] shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          )}
          <span className="font-semibold text-sm">{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1E4D40] flex items-center gap-2">
            <Wrench className="w-6 h-6 text-[#275A4E]" />
            <span>Báo Cáo Hư Hỏng Cơ Sở Vật Chất & Thiết Bị Phòng Học</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Chọn thiết bị hỏng trong danh mục tài sản của lớp, chụp ảnh hiện trường và gửi. Phiếu được chuyển ngay tới Giáo vụ và Ban Giám Hiệu.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          {classes.length > 1 && (
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="min-h-[44px] text-xs px-2.5 rounded-xl border border-slate-200 bg-white"
            >
              {classes.map((c) => (
                <option key={c.classId} value={c.classId}>
                  {c.className}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => loadIncidents(selectedClassId)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            title="Tải lại"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={openForm}
            disabled={!selectedClassId}
            className="min-h-[44px] px-4 rounded-2xl bg-[#275A4E] hover:bg-[#1E4D40] text-white font-bold text-xs transition flex items-center gap-2 shadow-md shadow-[#275A4E]/20 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4 text-[#78C2AD]" />
            <span>Báo Hỏng Thiết Bị Mới</span>
          </button>
        </div>
      </div>

      {/* List of Incidents */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center text-sm text-slate-500">Đang tải...</div>
      ) : !selectedClassId ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center text-sm text-slate-500">
          Bạn chưa được phân công lớp nào.
        </div>
      ) : incidents.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center text-sm text-slate-500">
          Lớp {selectedClassName} chưa có phiếu báo hỏng nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {incidents.map((inc) => (
            <div
              key={inc.incidentId}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      inc.severity === 'URGENT' ? 'bg-red-50 text-[#DC2626] border border-red-200' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {inc.severity === 'URGENT' ? 'Khẩn cấp: nguy hiểm cho trẻ' : 'Mức độ: Bình thường'}
                  </span>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      inc.status === 'RESOLVED'
                        ? 'bg-[#78C2AD]/20 text-[#1E4D40]'
                        : inc.status === 'IN_PROGRESS'
                        ? 'bg-[#275A4E]/10 text-[#275A4E]'
                        : 'bg-[#E5A93C]/15 text-[#9E6900]'
                    }`}
                  >
                    {inc.status === 'RESOLVED' ? 'Đã sửa xong' : inc.status === 'IN_PROGRESS' ? 'Đang sửa chữa' : 'Chờ xử lý'}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-800">
                    {inc.equipmentName}
                    {(inc.damagedQuantity ?? 1) > 1 && <span className="text-slate-500"> × {inc.damagedQuantity}</span>}
                  </h3>
                  <div className="text-xs text-[#275A4E] font-semibold mt-0.5">
                    {inc.classroomName}
                    {inc.equipmentCode ? ` · Mã ${inc.equipmentCode}` : ''}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{inc.description}</p>

                {inc.photoUrl && (
                  <div className="w-full h-40 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img src={inc.photoUrl} alt="Hư hỏng" className="w-full h-full object-cover" />
                  </div>
                )}

                {(inc.handledByName || inc.handlerNote) && (
                  <p className="text-xs text-slate-600 bg-slate-50 rounded-xl px-3 py-2">
                    {inc.handledByName || 'Giáo vụ'}: {inc.handlerNote || 'đã tiếp nhận'}
                    {inc.resolvedAt ? ` · xong lúc ${formatDateTime(inc.resolvedAt)}` : ''}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Báo lúc: {formatDateTime(inc.reportedAt)}
                </span>
                <span className="font-semibold text-slate-600">{inc.reportedByName || 'Giáo viên'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Báo hỏng thiết bị mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 bg-[#1E4D40] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[#78C2AD]" />
                <h3 className="font-bold text-base">Gửi Báo Cáo Hư Hỏng Thiết Bị</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Lớp:</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full min-h-[44px] text-xs px-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  {classes.map((c) => (
                    <option key={c.classId} value={c.classId}>
                      {c.className}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Thiết bị hư hỏng (danh mục tài sản của lớp): <span className="text-rose-500">*</span>
                </label>
                <select
                  value={equipmentChoice}
                  onChange={(e) => {
                    setEquipmentChoice(e.target.value);
                    setDamagedQuantity(1);
                  }}
                  className="w-full min-h-[44px] text-xs px-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">-- Chọn thiết bị --</option>
                  {equipmentOptions.map((o) => (
                    <option key={o.equipmentId} value={o.equipmentId} disabled={o.goodQuantity === 0}>
                      {o.name} ({o.equipmentCode}) · còn tốt {o.goodQuantity}
                      {o.damagedQuantity > 0 ? `, đang hỏng ${o.damagedQuantity}` : ''}
                    </option>
                  ))}
                  <option value={OTHER}>Thiết bị khác (chưa có trong danh mục)</option>
                </select>
                {equipmentOptions.length === 0 && (
                  <p className="text-[11px] text-slate-500 mt-1">Phòng học chưa có thiết bị nào trong danh mục, vui lòng nhập tên thiết bị.</p>
                )}
              </div>

              {equipmentChoice === OTHER && (
                <input
                  type="text"
                  placeholder="Ví dụ: Điều hòa Daikin, Quạt trần số 2..."
                  value={otherName}
                  onChange={(e) => setOtherName(e.target.value)}
                  className="w-full min-h-[44px] text-xs px-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#275A4E]"
                />
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Số lượng hỏng:</label>
                  <input
                    type="number"
                    min={1}
                    max={selectedOption?.goodQuantity}
                    value={damagedQuantity}
                    onChange={(e) => setDamagedQuantity(Number(e.target.value))}
                    className="w-full min-h-[44px] text-xs px-3 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mức độ:</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                    className="w-full min-h-[44px] text-xs px-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="NORMAL">Bình thường</option>
                    <option value="URGENT">Khẩn cấp (nguy hiểm cho trẻ)</option>
                  </select>
                </div>
              </div>
              {severity === 'URGENT' && (
                <p className="text-[11px] font-semibold text-[#DC2626]">
                  Sự cố khẩn cấp sẽ được Giáo vụ / BGH tiếp nhận xử lý trong 2 giờ. Vui lòng cách ly trẻ khỏi khu vực nguy hiểm.
                </p>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Mô tả tình trạng hư hỏng chi tiết: <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Mô tả hiện tượng: có tiếng kêu lạ, chập điện, rơi ốc vít, rò rỉ nước..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#275A4E]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ảnh chụp hiện trạng: <span className="text-rose-500">*</span>
                </label>
                <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#275A4E] bg-slate-50 cursor-pointer transition">
                  {photoPreview ? (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden">
                      <img src={photoPreview} alt="Xem trước" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-xs font-bold text-white">
                        Nhấp để chọn ảnh khác
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-1">
                      <Upload className="w-7 h-7 mx-auto text-[#275A4E]" />
                      <div className="text-xs font-bold text-slate-700">Tải ảnh chụp hư hỏng từ máy tính</div>
                      <div className="text-[10px] text-slate-400">Chỉ nhận JPG, PNG (tối đa 10MB)</div>
                    </div>
                  )}
                  <input type="file" accept="image/jpeg,image/png" onChange={handlePhotoSelect} className="hidden" />
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="min-h-[44px] px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[44px] px-5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold transition shadow-md shadow-[#275A4E]/20 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Đang gửi...' : 'Gửi Báo Cáo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomEquipmentIncidentTab;
