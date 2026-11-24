import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Bus,
  Camera,
  CheckCircle2,
  Clock,
  GraduationCap,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { attendanceApi } from '../../../api/attendanceApi';
import {
  BusAttendanceAction,
  BusTripState,
  BusTripStop,
  BusTripStudent,
  TeacherBusRoute,
} from '../../../types/bus.types';

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return error instanceof Error ? error.message : 'Không thể thực hiện thao tác. Vui lòng thử lại.';
};

const statusLabel: Record<BusTripStudent['status'], string> = {
  WAITING: 'Chờ điểm danh',
  ONBOARD: 'Đang trên xe',
  DEBOARDED: 'Đã xuống xe',
};

export const BusAttendanceTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedStopId, setSelectedStopId] = useState('');
  const [tripPeriod, setTripPeriod] = useState<'MORNING' | 'AFTERNOON'>('MORNING');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [emptyCabinConfirmed, setEmptyCabinConfirmed] = useState(false);
  const [qrTailScanToken, setQrTailScanToken] = useState('');
  const [safetyNote, setSafetyNote] = useState('');
  const [cabinPhoto, setCabinPhoto] = useState<string | null>(null);

  const routesQuery = useQuery({
    queryKey: ['teacher-bus-routes'],
    queryFn: attendanceApi.getTeacherBusRoutes,
  });
  const routes = routesQuery.data ?? [];

  useEffect(() => {
    if (!selectedRouteId && routes.length > 0) {
      setSelectedRouteId(routes[0].busId);
    } else if (selectedRouteId && !routes.some((route) => route.busId === selectedRouteId)) {
      setSelectedRouteId(routes[0]?.busId ?? '');
    }
  }, [routes, selectedRouteId]);

  const tripQuery = useQuery({
    queryKey: ['teacher-bus-trip', selectedRouteId],
    queryFn: () => attendanceApi.getBusTripStops(selectedRouteId),
    enabled: Boolean(selectedRouteId),
  });
  const trip: BusTripState | undefined = tripQuery.data;
  const stops = trip?.stops ?? [];
  const students = trip?.students ?? [];
  const selectedStop = stops.find((stop) => stop.stopId === selectedStopId);

  useEffect(() => {
    if (stops.length > 0 && !stops.some((stop) => stop.stopId === selectedStopId)) {
      setSelectedStopId(stops[0].stopId);
    }
  }, [stops, selectedStopId]);

  const stopStudents = useMemo(() => {
    if (!selectedStop) return [];
    let list: BusTripStudent[];
    if (tripPeriod === 'MORNING') {
      list = selectedStop.isDestination
        ? students.filter((student) => student.status === 'ONBOARD')
        : students.filter((student) => student.stopId === selectedStop.stopId && student.status !== 'DEBOARDED');
    } else {
      list = selectedStop.isDestination
        ? students.filter((student) => student.status === 'WAITING' || student.status === 'DEBOARDED')
        : students.filter((student) => student.stopId === selectedStop.stopId && student.status === 'ONBOARD');
    }
    const term = search.trim().toLocaleLowerCase('vi');
    if (!term) return list;
    return list.filter((student) =>
      [student.studentName, student.className, student.parentPhone]
        .some((value) => value?.toLocaleLowerCase('vi').includes(term)),
    );
  }, [selectedStop, students, tripPeriod, search]);

  const mutation = useMutation({
    mutationFn: ({ student, action }: { student: BusTripStudent; action: BusAttendanceAction }) =>
      attendanceApi.recordBusCheckin({
        tripId: selectedRouteId,
        studentId: student.studentId,
        stopId: selectedStopId,
        action,
      }),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['teacher-bus-trip', selectedRouteId] });
      setNotice({
        type: 'success',
        text: `Đã ghi nhận ${variables.action === 'BOARDING' ? 'đón' : 'trả'} bé ${variables.student.studentName}.`,
      });
    },
    onError: (error) => setNotice({ type: 'error', text: getErrorMessage(error) }),
  });

  const closureMutation = useMutation({
    mutationFn: () => {
      if (!selectedRouteId || !cabinPhoto || !qrTailScanToken.trim()) {
        throw new Error('Cần ảnh khoang xe và mã QR đuôi xe.');
      }
      return attendanceApi.performBusSafetyClosure(selectedRouteId, {
        photoUrl: cabinPhoto,
        qrTailScanToken: qrTailScanToken.trim(),
        remainingStudentsCount: trip?.remainingCount ?? 0,
        notes: safetyNote.trim() || undefined,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['teacher-bus-trip', selectedRouteId] });
      setNotice({ type: 'success', text: 'Đã chốt an toàn chuyến xe.' });
    },
    onError: (error) => setNotice({ type: 'error', text: getErrorMessage(error) }),
  });

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setNotice({ type: 'error', text: 'Ảnh phải nhỏ hơn 5 MB.' });
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCabinPhoto(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => setNotice({ type: 'error', text: 'Không thể đọc ảnh đã chọn.' });
    reader.readAsDataURL(file);
  };

  const actionForStop = (stop: BusTripStop): BusAttendanceAction => {
    if (tripPeriod === 'MORNING') return stop.isDestination ? 'DEBOARDING' : 'BOARDING';
    return stop.isDestination ? 'BOARDING' : 'DEBOARDING';
  };

  const route: TeacherBusRoute | undefined = routes.find((item) => item.busId === selectedRouteId);
  const unassignedCount = students.filter((student) => !student.stopId).length;
  const tripClosed = Boolean(trip?.isSafetyClosed);

  return (
    <div className="space-y-5">
      {notice && (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-2xl border p-3 text-sm font-semibold ${
            notice.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {notice.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          <span className="flex-1">{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-xs underline">Đóng</button>
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#1E4D40]">
              <Bus className="h-5 w-5" />
              Điểm danh xe buýt theo trạm
            </h2>
            <p className="mt-1 text-xs text-slate-500">Chọn trạm để xem danh sách học sinh đã đăng ký tại điểm đó.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              void routesQuery.refetch();
              if (selectedRouteId) void tripQuery.refetch();
            }}
            disabled={routesQuery.isFetching || tripQuery.isFetching}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${routesQuery.isFetching || tripQuery.isFetching ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-600">
            Tuyến xe phụ trách
            <select
              value={selectedRouteId}
              onChange={(event) => {
                setSelectedRouteId(event.target.value);
                setSelectedStopId('');
              }}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800"
              disabled={routes.length === 0}
            >
              {routes.length === 0 && <option value="">Không có tuyến được phân công</option>}
              {routes.map((item) => (
                <option key={item.busId} value={item.busId}>
                  {item.routeName} — {item.busNumber}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <div className="grid w-full grid-cols-2 rounded-xl bg-slate-100 p-1">
              {(['MORNING', 'AFTERNOON'] as const).map((period) => (
                <button
                  type="button"
                  key={period}
                  onClick={() => setTripPeriod(period)}
                  className={`rounded-lg px-3 py-2 text-xs font-bold ${
                    tripPeriod === period ? 'bg-white text-[#275A4E] shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {period === 'MORNING' ? 'Chuyến sáng · Đón đến trường' : 'Chuyến chiều · Trả về nhà'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {routesQuery.isLoading || tripQuery.isLoading ? (
          <div className="py-12 text-center text-sm text-slate-500">Đang tải tuyến xe và danh sách học sinh...</div>
        ) : routesQuery.isError ? (
          <div className="py-10 text-center text-sm text-rose-700">{getErrorMessage(routesQuery.error)}</div>
        ) : routes.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">Giáo viên chưa được phân công tuyến xe buýt.</div>
        ) : tripQuery.isError ? (
          <div className="py-10 text-center text-sm text-rose-700">{getErrorMessage(tripQuery.error)}</div>
        ) : trip ? (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-[#EBF7F4] p-4 sm:grid-cols-4">
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-500">Tuyến xe</div>
                <div className="mt-1 text-sm font-extrabold text-[#1E4D40]">{route?.busNumber ?? trip.plateNumber}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-500">Tài xế</div>
                <div className="mt-1 text-sm font-bold text-slate-800">{trip.driverName || 'Chưa cập nhật'}</div>
                {trip.driverPhone && <div className="text-xs text-slate-500">{trip.driverPhone}</div>}
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-500">Tổng học sinh</div>
                <div className="mt-1 text-lg font-extrabold text-sky-700">{trip.totalStudents}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-500">Trên xe / Còn lại</div>
                <div className="mt-1 text-lg font-extrabold text-emerald-700">{trip.onboardCount} / {trip.remainingCount}</div>
              </div>
            </div>

            {tripClosed && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                Chuyến xe hôm nay đã được chốt an toàn; không thể ghi nhận thêm lượt lên/xuống.
              </div>
            )}

            <div className="mt-5">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-extrabold text-slate-800">
                <MapPin className="h-4 w-4 text-[#275A4E]" />
                Danh sách trạm đón / trả
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {stops.map((stop) => {
                  const active = selectedStopId === stop.stopId;
                  return (
                    <button
                      type="button"
                      key={stop.stopId}
                      onClick={() => setSelectedStopId(stop.stopId)}
                      aria-pressed={active}
                      className={`rounded-2xl border p-3 text-left transition ${
                        active
                          ? 'border-[#275A4E] bg-[#EBF7F4] ring-1 ring-[#275A4E]'
                          : 'border-slate-200 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          stop.isDestination ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'
                        }`}>
                          {stop.isDestination ? <GraduationCap className="h-5 w-5" /> : <Bus className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-extrabold text-slate-800">
                            Trạm {stop.stopOrder}: {stop.stopName}
                          </div>
                          {stop.stopAddress && <div className="mt-0.5 text-[11px] text-slate-500">{stop.stopAddress}</div>}
                          <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {stop.estimatedTime || stop.scheduledTime || '--:--'}
                            </span>
                            <span className="font-bold text-emerald-700">
                              {stop.isDestination ? 'Trả' : 'Đón'}: {stop.isDestination ? stop.deboardedCount : stop.boardedCount}
                            </span>
                          </div>
                          <div className="mt-1 text-[10px] font-semibold text-slate-400">{stop.studentCount} học sinh đăng ký</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedStop && (
              <div className="mt-5 rounded-2xl border border-slate-200 p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">
                      Học sinh tại {selectedStop.stopName}
                    </h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {tripPeriod === 'MORNING' ? 'Đón đến trường' : 'Trả về nhà'} · {stopStudents.length} học sinh
                    </p>
                  </div>
                  <div className="relative sm:w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Tìm tên, lớp, điện thoại..."
                      className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-[#275A4E]"
                    />
                  </div>
                </div>

                {stopStudents.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">Không có học sinh cần điểm danh ở trạm này.</div>
                ) : (
                  <div className="mt-3 divide-y divide-slate-100">
                    {stopStudents.map((student) => {
                      const action = actionForStop(selectedStop);
                      const isReady = action === 'BOARDING'
                        ? student.status === 'WAITING' || student.status === 'DEBOARDED'
                        : student.status === 'ONBOARD';
                      return (
                        <div key={student.studentId} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 font-extrabold text-[#275A4E]">
                              {student.studentName.slice(0, 1)}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-bold text-slate-800">{student.studentName}</div>
                              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                                <span>{student.className || 'Chưa xếp lớp'}</span>
                                {student.parentPhone && (
                                  <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{student.parentPhone}</span>
                                )}
                                {student.lastTime && <span>{student.lastTime}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-3 sm:justify-end">
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              student.status === 'ONBOARD'
                                ? 'bg-emerald-100 text-emerald-800'
                                : student.status === 'DEBOARDED'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {statusLabel[student.status]}
                            </span>
                            {isReady && (
                              <button
                                type="button"
                                disabled={mutation.isPending || tripClosed}
                                onClick={() => mutation.mutate({ student, action })}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#275A4E] px-3 py-2 text-xs font-bold text-white hover:bg-[#1E4D40] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <UserCheck className="h-4 w-4" />
                                {action === 'BOARDING' ? 'Điểm danh lên xe' : 'Điểm danh xuống xe'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {unassignedCount > 0 && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Có {unassignedCount} đăng ký cũ chưa gắn với trạm cụ thể. Hãy cập nhật lựa chọn trạm trong đăng ký xe buýt để hiện đúng danh sách.
                </span>
              </div>
            )}
          </>
        ) : null}
      </section>

      <section className="space-y-4 rounded-3xl bg-slate-900 p-4 text-white sm:p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-6 w-6 shrink-0 text-amber-400" />
          <div>
            <h3 className="font-extrabold">Chốt an toàn khoang xe</h3>
            <p className="mt-1 text-xs text-slate-300">Chỉ chốt khi không còn học sinh trên xe; hệ thống xác thực mã QR xe và ảnh khoang xe.</p>
          </div>
        </div>

        {trip?.isSafetyClosed ? (
          <div className="rounded-xl bg-emerald-900/60 p-3 text-sm font-bold text-emerald-100">
            Chuyến xe {trip.plateNumber} đã được chốt an toàn hôm nay.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-3">
              <label className="flex items-start gap-2 rounded-xl bg-white/10 p-3 text-xs">
                <input
                  type="checkbox"
                  checked={emptyCabinConfirmed}
                  onChange={(event) => setEmptyCabinConfirmed(event.target.checked)}
                  className="mt-0.5"
                />
                <span>Tôi đã kiểm tra toàn bộ khoang xe và xác nhận không còn học sinh.</span>
              </label>
              <label className="block text-xs font-semibold text-slate-300">
                Mã QR đuôi xe đã quét
                <input
                  value={qrTailScanToken}
                  onChange={(event) => setQrTailScanToken(event.target.value)}
                  placeholder="Nhập nội dung mã QR trên xe"
                  className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-400"
                />
              </label>
              <textarea
                rows={2}
                value={safetyNote}
                onChange={(event) => setSafetyNote(event.target.value)}
                placeholder="Ghi chú chuyến xe (tùy chọn)"
                className="w-full rounded-xl border border-white/20 bg-white/10 p-3 text-xs text-white placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-white/30 p-3 text-xs text-slate-300">
                <Camera className="h-5 w-5 text-emerald-300" />
                <span>{cabinPhoto ? 'Đã chọn ảnh khoang xe' : 'Chọn ảnh khoang xe rỗng (tối đa 5 MB)'}</span>
                <input type="file" accept="image/*" onChange={handlePhotoSelect} className="sr-only" />
              </label>
              {cabinPhoto && <img src={cabinPhoto} alt="Ảnh khoang xe" className="h-28 w-full rounded-xl object-cover" />}
              <button
                type="button"
                disabled={
                  closureMutation.isPending || !selectedRouteId || !emptyCabinConfirmed ||
                  !cabinPhoto || !qrTailScanToken.trim() || (trip?.remainingCount ?? 0) > 0
                }
                onClick={() => closureMutation.mutate()}
                className="w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-extrabold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {closureMutation.isPending ? 'Đang chốt...' : 'Xác nhận chốt an toàn'}
              </button>
              {(trip?.remainingCount ?? 0) > 0 && (
                <p className="text-[11px] text-amber-200">Còn {trip?.remainingCount} học sinh trên xe; chưa thể chốt.</p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default BusAttendanceTab;
