import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Modal, Pressable, TextInput, View } from 'react-native';
import MonthCalendar from '../../../src/components/MonthCalendar';
import { isUpcomingAppointment, isValidAppointmentDate, localDateKey } from '../../../src/services/appointmentTime';
import { AWN_RAG_URL } from '../../../src/config';
import { AppText, Card, PrimaryButton, Screen, SpeakBtn, StatusPill, TopBar, useUi } from '../../../src/ui';
import type { Appointment, AppointmentPreparation } from '../../../src/types';

const MOH_APPOINTMENTS = 'https://www.moh.gov.sa/en/eservices/sehhaty/pages/appointment-booking-on-sehhaty.aspx';
const MOH_PATIENT_SAFETY = 'https://www.moh.gov.sa/awarenessplateform/varioustopics/pages/patient-safety.aspx';
const PREPARATION_CACHE_VERSION = 2;

export default function AppointmentDetail() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { tt, locale, appointments, palette, row, updateAppointment, cancelAppointment, deleteAppointment, saveAppointmentPreparation } = useUi();
  const appointment = appointments.find((a) => a.id === id);
  const [editOpen, setEditOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [draftDate, setDraftDate] = useState(appointment?.date ?? localDateKey());
  const [draftTime, setDraftTime] = useState(appointment?.time ?? '09:00');
  const [prepResult, setPrepResult] = useState<AppointmentPreparation | null>(null);
  const [prepLoading, setPrepLoading] = useState(false);
  const cachedPreparation = appointment?.preparationByLanguage?.[locale];
  const goBack = () => from === 'appointments' ? router.replace('/(beneficiary)/appointments') : router.canGoBack() ? router.back() : router.replace('/(beneficiary)/appointments');

  useEffect(() => {
    if (!appointment || !isUpcomingAppointment(appointment)) return;
    let current = true;
    if (cachedPreparation?.cacheVersion === PREPARATION_CACHE_VERSION) {
      setPrepResult(cachedPreparation);
      setPrepLoading(false);
      return () => { current = false; };
    }
    setPrepResult(null);
    setPrepLoading(true);
    fetch(`${AWN_RAG_URL}/prepare-appointment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symptoms: appointment.symptoms ?? '',
        specialty: locale === 'ar' ? appointment.specialtyAr : appointment.specialtyEn,
        facility: locale === 'ar' ? appointment.facilityAr : appointment.facilityEn,
        appointment_type: locale === 'ar' ? appointment.specialtyAr : appointment.specialtyEn,
        patient_items: appointment.patientPreparationItems ?? [],
        language: locale,
      }),
    }).then((response) => {
      if (!response.ok) throw new Error(`preparation_http_${response.status}`);
      return response.json();
    })
      .then((result) => {
        const preparation = result && Array.isArray(result.instructions)
          ? result as AppointmentPreparation
          : null;
        if (!preparation) throw new Error('invalid_preparation_response');
        if (!current) return;
        const persistedPreparation = { ...preparation, cacheVersion: PREPARATION_CACHE_VERSION };
        setPrepResult(persistedPreparation);
        if (!preparation.fallback || preparation.instructions.length > 0) {
          saveAppointmentPreparation(appointment.id, locale, persistedPreparation);
        }
      })
      .catch((error) => {
        if (!current) return;
        const errorCode = error instanceof Error ? error.message : '';
        const serverStatus = errorCode.match(/^preparation_http_(\d+)$/)?.[1];
        console.warn('Appointment preparation request failed:', errorCode || error);
        setPrepResult({
          instructions: [],
          sources: [{ title: locale === 'ar' ? 'سلامة المرضى — وزارة الصحة' : 'Patient Safety — Ministry of Health', url: MOH_PATIENT_SAFETY }],
          note: serverStatus
            ? (locale === 'ar'
              ? `خادم التحضير ردّ بالخطأ ${serverStatus}. راجع سجل خادم عون ثم أعد فتح الموعد.`
              : `The preparation server returned error ${serverStatus}. Check the Awn server log, then reopen this appointment.`)
            : (locale === 'ar'
              ? 'تعذر الاتصال بخادم التحضير. شغّل خدمة awn-rag وتأكد من اتصال الجهاز والخادم بالشبكة نفسها.'
              : 'Could not connect to the preparation server. Start awn-rag and make sure the device and server are on the same network.'),
          emergency: false,
          fallback: true,
        });
      })
      .finally(() => { if (current) setPrepLoading(false); });
    return () => { current = false; };
  }, [appointment?.id, appointment?.symptoms, appointment?.patientPreparationItems, appointment?.specialtyAr, appointment?.specialtyEn, appointment?.facilityAr, appointment?.facilityEn, cachedPreparation, locale, saveAppointmentPreparation]);

  if (!appointment) return <Screen><TopBar title={tt('appointment')} back right={null} onBack={goBack} /><AppText>{tt('notFound')}</AppText></Screen>;

  const isUpcoming = isUpcomingAppointment(appointment);
  const isCancelled = appointment.status === 'cancelled';
  const patientReportedContext = appointment?.patientPreparationItems ?? [];
  const patientReportedReminder = patientReportedContext.map((item) => locale === 'ar'
    ? `أحضر العنصر الذي ذكرته: «${item}»`
    : `Bring the item you mentioned: “${item}”.`);
  const saveEdit = () => {
    if (!isValidAppointmentDate(draftDate) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(draftTime)) {
      return;
    }
    if (draftDate < localDateKey()) {
      return;
    }
    updateAppointment(appointment.id, { date: draftDate, time: draftTime });
    setEditOpen(false);
  };
  const confirmDelete = async () => {
    setDeletePending(true);
    try {
      await deleteAppointment(appointment.id);
      setDeleteConfirmOpen(false);
      router.replace('/(beneficiary)/appointments');
    } catch {
      Alert.alert(
        locale === 'ar' ? 'تعذر حذف الموعد' : 'Could not delete appointment',
        locale === 'ar' ? 'تحقق من اتصالك وحاول مرة أخرى.' : 'Check your connection and try again.'
      );
    } finally {
      setDeletePending(false);
    }
  };

  return <Screen scroll>
    <TopBar title={tt('appointmentDetails')} back right={null} onBack={goBack} />
    <Card style={{ marginBottom: 16 }}>
      <View style={[row, { justifyContent: 'space-between', alignItems: 'center' }]}>
        <AppText size={22} weight="700" style={{ flex: 1 }}>{locale === 'ar' ? appointment.specialtyAr : appointment.specialtyEn}</AppText>
        <StatusPill label={isCancelled ? (locale === 'ar' ? 'ملغى' : 'Cancelled') : isUpcoming ? tt('upcoming') : (locale === 'ar' ? 'سابق' : 'Past')} tone={isUpcoming ? 'warning' : 'neutral'} />
      </View>
      <AppText muted style={{ marginTop: 8 }}>{locale === 'ar' ? appointment.doctorAr : appointment.doctorEn}</AppText>
    </Card>
    <Card style={{ marginBottom: 16 }}>
      <AppText size={16} weight="700" style={{ marginBottom: 12 }}>{tt('facility')}</AppText>
      <AppText>{locale === 'ar' ? appointment.facilityAr : appointment.facilityEn}</AppText>
      <AppText muted style={{ marginTop: 4 }}>{locale === 'ar' ? appointment.locationAr : appointment.locationEn}</AppText>
    </Card>
    <Card style={{ marginBottom: 16 }}>
      <View style={[row, { gap: 24 }]}>
        <View style={{ flex: 1 }}><AppText muted size={13}>{tt('date')}</AppText><AppText size={18} weight="700">{appointment.date}</AppText></View>
        <View style={{ flex: 1 }}><AppText muted size={13}>{tt('time')}</AppText><AppText size={18} weight="700">{appointment.time}</AppText></View>
      </View>
      {isUpcoming && <View style={[row, { gap: 10, marginTop: 16 }]}>
        <View style={{ flex: 1 }}><PrimaryButton label={locale === 'ar' ? 'تعديل الموعد' : 'Edit appointment'} onPress={() => { setDraftDate(appointment.date); setDraftTime(appointment.time); setEditOpen(true); }} /></View>
        <Pressable onPress={() => setCancelConfirmOpen(true)} accessibilityRole="button" style={{ minWidth: 92, minHeight: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.danger, paddingHorizontal: 12 }}><AppText size={13} weight="700" style={{ color: palette.danger }}>{locale === 'ar' ? 'إلغاء' : 'Cancel'}</AppText></Pressable>
      </View>}
      <Pressable onPress={() => setDeleteConfirmOpen(true)} accessibilityRole="button" style={[row, { alignItems: 'center', gap: 8, marginTop: 14, minHeight: 44 }]}>
        <Ionicons name="trash-outline" size={18} color={palette.danger} />
        <AppText size={13} weight="700" style={{ color: palette.danger }}>{locale === 'ar' ? 'حذف الموعد من التطبيق' : 'Delete appointment from Awn'}</AppText>
      </Pressable>
    </Card>
    {isUpcoming && <Card style={{ marginBottom: 16 }}>
      <View style={[row, { justifyContent: 'space-between', alignItems: 'center' }]}><AppText size={16} weight="700">{tt('preparation')}</AppText><SpeakBtn text={[...patientReportedReminder, ...(prepResult?.instructions ?? []), ...(prepResult?.general_instructions ?? [])].join('. ')} /></View>
      <AppText muted size={12} style={{ marginTop: 8 }}>{locale === 'ar' ? 'تظهر هنا العناصر التي ذكرتَ أنك ستحضرها، والإرشادات التي يدعمها مصدر، أو اقتراحات عامة عند عدم توفر إرشادات مناسبة.' : 'This section shows items you said you will bring, source-backed guidance, or general suggestions when no relevant source is available.'}</AppText>
      {prepLoading && <AppText muted size={13} style={{ marginTop: 10 }}>{locale === 'ar' ? 'جارِ البحث في المصادر الصحية الموثوقة…' : 'Checking trusted health sources…'}</AppText>}
      {prepResult?.emergency && <AppText weight="700" style={{ color: palette.danger, marginTop: 12 }}>{prepResult.note}</AppText>}
      {prepResult?.note && !prepResult.emergency && (prepResult.fallback || prepResult.instructions.length === 0) && <AppText muted size={13} style={{ marginTop: 10 }}>{prepResult.note}</AppText>}
      {prepResult?.general_note && <AppText muted size={12} style={{ marginTop: 8 }}>{prepResult.general_note}</AppText>}
      {patientReportedReminder.map((item, index) => <View key={`context-${index}`} style={[row, { alignItems: 'flex-start', gap: 8, marginTop: 10 }]}><Ionicons name="information-circle" size={18} color={palette.info} style={{ marginTop: 2 }} /><AppText style={{ flex: 1 }}>{item}</AppText></View>)}
      {prepResult?.instructions.map((item, index) => <View key={`specific-${index}`} style={[row, { alignItems: 'flex-start', gap: 8, marginTop: 9 }]}><Ionicons name="information-circle" size={18} color={palette.info} style={{ marginTop: 2 }} /><AppText style={{ flex: 1 }}>{item}</AppText></View>)}
      {prepResult?.general_instructions?.map((item, index) => <View key={`general-${index}`} style={[row, { alignItems: 'flex-start', gap: 8, marginTop: 9 }]}><Ionicons name="information-circle" size={18} color={palette.info} style={{ marginTop: 2 }} /><AppText style={{ flex: 1 }}>{item}</AppText></View>)}
      {prepResult?.sources.map((source) => <Pressable key={source.url} onPress={() => void Linking.openURL(source.url)} style={{ marginTop: 8 }}><AppText size={13} weight="700" style={{ color: palette.tealDark, textDecorationLine: 'underline' }}>{source.title}</AppText></Pressable>)}
    </Card>}

{/**
    <Pressable onPress={() => void Linking.openURL(MOH_APPOINTMENTS)} style={{ marginBottom: 18 }}><AppText size={13} weight="700" style={{ color: palette.tealDark, textDecorationLine: 'underline' }}>{locale === 'ar' ? 'إدارة الموعد لدى وزارة الصحة عبر صحتي' : 'Manage the official hospital appointment in Sehhaty (MOH)'}</AppText></Pressable>
     */}

{/**
    {appointment.notesAr && <Card style={{ marginBottom: 16 }}><AppText size={16} weight="700" style={{ marginBottom: 8 }}>{tt('notes')}</AppText><AppText muted>{locale === 'ar' ? appointment.notesAr : appointment.notesEn}</AppText></Card>}
 */}

    {appointment.hasPrescription && <Card style={{ marginBottom: 16 }}><View style={[row, { alignItems: 'center', gap: 8 }]}><Ionicons name="medical" size={20} color={palette.teal} /><AppText weight="700">{tt('hasPrescription')}</AppText></View><AppText muted style={{ marginTop: 4 }}>{tt('prescriptionNote')}</AppText></Card>}

    <Modal visible={editOpen} animationType="slide" onRequestClose={() => setEditOpen(false)}>
      <Screen scroll>
        <TopBar title={locale === 'ar' ? 'تعديل الموعد' : 'Edit appointment'} back right={null} onBack={() => setEditOpen(false)} />
        <AppText weight="700" style={{ marginBottom: 10 }}>{tt('date')}</AppText>
        <MonthCalendar value={draftDate} onChange={setDraftDate} minDate={localDateKey()} />
        <AppText weight="700" style={{ marginTop: 18, marginBottom: 8 }}>{locale === 'ar' ? 'الوقت (24 ساعة)' : 'Time (24-hour format)'}</AppText>
        <TextInput value={draftTime} onChangeText={setDraftTime} placeholder="09:30" keyboardType="numbers-and-punctuation" accessibilityLabel={locale === 'ar' ? 'وقت الموعد بصيغة 24 ساعة' : 'Appointment time in 24-hour format'} style={{ borderWidth: 1, borderColor: palette.border, borderRadius: 14, backgroundColor: palette.surface, padding: 14, color: palette.ink, textAlign: locale === 'ar' ? 'right' : 'left' }} />
        <AppText muted size={13} style={{ marginVertical: 12 }}>{locale === 'ar' ? 'سيُحدّث هذا تقويم عون. أكّد التغيير مع المنشأة أو عبر صحتي.' : 'This updates your Awn calendar. Confirm the change with the facility or in Sehhaty.'}</AppText>
        <PrimaryButton label={locale === 'ar' ? 'حفظ التغيير' : 'Save change'} onPress={saveEdit} disabled={!isValidAppointmentDate(draftDate) || draftDate < localDateKey() || !/^([01]\d|2[0-3]):[0-5]\d$/.test(draftTime)} />
        {(!isValidAppointmentDate(draftDate) || draftDate < localDateKey() || !/^([01]\d|2[0-3]):[0-5]\d$/.test(draftTime)) && <AppText size={13} style={{ color: palette.danger, marginTop: 8 }}>{locale === 'ar' ? 'أدخل تاريخاً قادماً صالحاً ووقتاً بصيغة 24 ساعة مثل 14:30.' : 'Enter a valid future date and a 24-hour time, such as 14:30.'}</AppText>}
      </Screen>
    </Modal>

    <Modal visible={cancelConfirmOpen} transparent animationType="fade" onRequestClose={() => setCancelConfirmOpen(false)}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0007' }}>
        <Card>
          <AppText size={19} weight="700">{locale === 'ar' ? 'إلغاء الموعد؟' : 'Cancel appointment?'}</AppText>
          <View style={[row, { gap: 10, marginTop: 16 }]}>
            <View style={{ flex: 1 }}><PrimaryButton label={locale === 'ar' ? 'الإبقاء على الموعد' : 'Keep appointment'} onPress={() => setCancelConfirmOpen(false)} /></View>
            <Pressable onPress={() => { cancelAppointment(appointment.id); setCancelConfirmOpen(false); }} style={{ flex: 1, minHeight: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: palette.danger }}><AppText size={13} weight="700" style={{ color: palette.danger }}>{locale === 'ar' ? 'تأكيد الإلغاء' : 'Confirm cancellation'}</AppText></Pressable>
          </View>
        </Card>
      </View>
    </Modal>

    <Modal visible={deleteConfirmOpen} transparent animationType="fade" onRequestClose={() => !deletePending && setDeleteConfirmOpen(false)}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0007' }}>
        <Card>
          <AppText size={19} weight="700">{locale === 'ar' ? 'حذف الموعد من التطبيق؟' : 'Delete appointment from Awn?'}</AppText>
          <AppText muted style={{ marginTop: 8 }}>{locale === 'ar' ? 'سيُحذف الموعد نهائياً من قائمة مواعيدك في عون. هذا لا يلغي الموعد لدى المستشفى؛ استخدم صحتي أو تواصل مع المنشأة لإلغائه رسمياً.' : 'This permanently removes the appointment from your Awn list. It does not cancel the hospital appointment; use Sehhaty or contact the facility to cancel it officially.'}</AppText>
          <View style={[row, { gap: 10, marginTop: 16 }]}>
            <View style={{ flex: 1 }}><PrimaryButton label={locale === 'ar' ? 'الاحتفاظ' : 'Keep'} onPress={() => setDeleteConfirmOpen(false)} disabled={deletePending} /></View>
            <Pressable disabled={deletePending} onPress={() => void confirmDelete()} style={{ flex: 1, minHeight: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: palette.danger, paddingHorizontal: 8, opacity: deletePending ? 0.6 : 1 }}><AppText size={13} weight="700" style={{ color: palette.danger }}>{deletePending ? (locale === 'ar' ? 'جارٍ الحذف…' : 'Deleting…') : (locale === 'ar' ? 'تأكيد الحذف' : 'Delete')}</AppText></Pressable>
          </View>
        </Card>
      </View>
    </Modal>
  </Screen>;
}
