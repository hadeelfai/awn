import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { voiceDemos } from '../../src/services/ai';
import { radius, space } from '../../src/theme';
import { AppText, Card, Field, LangSwitch, SpeakBtn, StatusPill, useUi } from '../../src/ui';

export default function Ask() {
  const insets = useSafeAreaInsets();
  const {
    tt,
    palette,
    row,
    isRTL,
    locale,
    messages,
    sendUser,
    sendOption,
    appointments,
    documents,
    addDocument,
  } = useUi();
  const [text, setText] = useState('');
  const [voice, setVoice] = useState(false);
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    scroll.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const submit = (value?: string) => {
    const v = (value ?? text).trim();
    if (!v) return;
    sendUser(v);
    setText('');
    setVoice(false);
  };

  const handleUploadReport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
      });
      if (result.canceled) return;
      
      // Simulate document explanation
      const newDocument = {
        id: `DOC-${Date.now()}`,
        titleAr: 'تقرير طبي محمل',
        titleEn: 'Uploaded medical report',
        kind: 'report' as const,
        originalName: result.assets[0].name,
        findings: [
          {
            nameAr: 'قيمة طبيعية',
            nameEn: 'Normal value',
            value: 'Within range',
            unit: 'N/A',
            simpleAr: 'القيمة ضمن النطاق الطبيعي',
            simpleEn: 'Value is within normal range',
          },
        ],
        createdAt: new Date().toISOString(),
      };
      
      addDocument(newDocument);
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: palette.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: insets.top, paddingHorizontal: space.md, flex: 1 }}>
        <View style={[row, { alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }]}>
          <AppText size={24} weight="700">
            {tt('askMe')}
          </AppText>
          <LangSwitch />
        </View>
        <AppText muted size={14} style={{ marginBottom: 8 }}>
          {tt('principle')}
        </AppText>
        <ScrollView ref={scroll} contentContainerStyle={{ paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
          {messages.map((m) => {
            const mine = m.role === 'user';
            const body = locale === 'ar' ? m.textAr : m.textEn;
            return (
              <View key={m.id} style={{ marginBottom: 12, alignItems: mine ? (isRTL ? 'flex-start' : 'flex-end') : isRTL ? 'flex-end' : 'flex-start' }}>
                <View
                  style={{
                    maxWidth: '92%',
                    backgroundColor: mine ? palette.tealDark : palette.surface,
                    borderRadius: 22,
                    padding: 14,
                    borderWidth: mine ? 0 : 1,
                    borderColor: palette.border,
                  }}
                >
                  <AppText size={16} style={{ color: mine ? '#fff' : palette.ink }}>
                    {body}
                  </AppText>
                  {!mine ? (
                    <View style={[row, { marginTop: 8, justifyContent: 'flex-end' }]}>
                      <SpeakBtn text={body} />
                    </View>
                  ) : null}
                  {m.disclaimer ? (
                    <View style={{ marginTop: 8 }}>
                      <StatusPill label={tt('supportingOnly')} tone="info" />
                    </View>
                  ) : null}
                </View>
                {m.suggestedAppointment && (
                  <Card key={m.suggestedAppointment.id} style={{ marginTop: 8, width: '92%' }} onPress={() => router.push({ pathname: '/(beneficiary)/appointment/[id]', params: { id: m.suggestedAppointment!.id, from: 'ask' } })}>
                    <View style={[row, { justifyContent: 'space-between', alignItems: 'center' }]}>
                      <AppText weight="700">{locale === 'ar' ? m.suggestedAppointment.specialtyAr : m.suggestedAppointment.specialtyEn}</AppText>
                      <StatusPill label={tt('upcoming')} tone="warning" />
                    </View>
                    <AppText muted style={{ marginTop: 4 }}>
                      {m.suggestedAppointment.date} · {m.suggestedAppointment.time}
                    </AppText>
                    <AppText muted>
                      {locale === 'ar' ? m.suggestedAppointment.facilityAr : m.suggestedAppointment.facilityEn}
                    </AppText>
                  </Card>
                )}
                {m.appointmentIds?.map((id) => {
                  const a = appointments.find((x) => x.id === id);
                  if (!a) return null;
                  return (
                    <Card key={id} style={{ marginTop: 8, width: '92%' }} onPress={() => router.push({ pathname: '/(beneficiary)/appointment/[id]', params: { id, from: 'ask' } })}>
                      <AppText weight="700">{locale === 'ar' ? a.specialtyAr : a.specialtyEn}</AppText>
                      <AppText muted>
                        {a.date} · {a.time} · {locale === 'ar' ? a.facilityAr : a.facilityEn}
                      </AppText>
                    </Card>
                  );
                })}
                {m.documentIds?.map((id) => {
                  const doc = documents.find((d) => d.id === id);
                  if (!doc) return null;
                  return (
                    <Card key={id} style={{ marginTop: 8, width: '92%' }} onPress={() => router.push(`/(beneficiary)/report/${id}`)}>
                      <AppText weight="700">{locale === 'ar' ? doc.titleAr : doc.titleEn}</AppText>
                      <AppText muted>
                        {doc.originalName} · {doc.createdAt.slice(0, 10)}
                      </AppText>
                    </Card>
                  );
                })}
                <View style={[row, { flexWrap: 'wrap', gap: 8, marginTop: 8, maxWidth: '92%' }]}>
                  {m.options?.map((o) => (
                    <Pressable
                      key={o.id}
                      onPress={() => sendOption(o)}
                      style={{ backgroundColor: palette.mint, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill }}
                    >
                      <AppText size={14} weight="700">
                        {locale === 'ar' ? o.labelAr : o.labelEn}
                      </AppText>
                    </Pressable>
                  ))}
                  {m.actions?.map((a) => (
                    <Pressable
                      key={a.id}
                      onPress={() => {
                        if (a.kind === 'navigate' && a.href) router.push(a.href as any);
                        else if (a.kind === 'intent' && a.intent === 'book_appointment') submit(locale === 'ar' ? 'أريد حجز موعد' : 'I want to book an appointment');
                        else if (a.kind === 'intent' && a.intent === 'general_info') submit(locale === 'ar' ? 'معلومات عامة' : 'General information');
                        else if (a.kind === 'confirm_booking') submit(locale === 'ar' ? 'نعم، تأكيد' : 'Yes, confirm');
                        else if (a.kind === 'upload_report') handleUploadReport();
                        else if (a.kind === 'show_appointments') router.push('/(beneficiary)/appointments');
                      }}
                      style={{ backgroundColor: palette.tealDark, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill }}
                    >
                      <AppText size={14} weight="700" style={{ color: '#fff' }}>
                        {locale === 'ar' ? a.labelAr : a.labelEn}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
        <View
          style={[
            row,
            {
              backgroundColor: palette.surface,
              borderRadius: 28,
              borderWidth: 1,
              borderColor: palette.border,
              paddingHorizontal: 10,
              paddingVertical: 6,
              marginBottom: 10,
              alignItems: 'center',
              gap: 6,
            },
          ]}
        >
          <Pressable onPress={() => setVoice(true)} accessibilityLabel={tt('voice')} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: palette.mint, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="mic" size={22} color={palette.tealDark} />
          </Pressable>
          <Field value={text} onChange={setText} placeholder={tt('composer')} onSubmit={() => submit()} />
          <Pressable onPress={() => submit()} accessibilityLabel={tt('send')} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: palette.tealDark, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>

      <Modal visible={voice} animationType="slide" transparent onRequestClose={() => setVoice(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(10,28,24,0.45)', justifyContent: 'flex-end' }} onPress={() => setVoice(false)}>
          <Pressable
            onPress={() => {}}
            style={{ backgroundColor: palette.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36 }}
          >
            <AppText size={22} weight="700" style={{ textAlign: 'center' }}>
              {tt('listen')}
            </AppText>
            <AppText muted style={{ textAlign: 'center', marginBottom: 16 }}>
              {tt('listeningHint')}
            </AppText>
            <View style={{ alignItems: 'center', marginVertical: 12 }}>
              <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: palette.mint, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 78, height: 78, borderRadius: 39, backgroundColor: palette.teal, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="mic" size={36} color="#fff" />
                </View>
              </View>
            </View>
            {voiceDemos.map((d) => (
              <Pressable
                key={d.id}
                onPress={() => submit(locale === 'ar' ? d.ar : d.en)}
                style={{ padding: 14, borderRadius: 16, borderWidth: 1, borderColor: palette.border, marginBottom: 8 }}
              >
                <AppText>{locale === 'ar' ? d.ar : d.en}</AppText>
              </Pressable>
            ))}
            <Pressable onPress={() => setVoice(false)} style={{ alignItems: 'center', marginTop: 8 }}>
              <AppText weight="700">{tt('stop')}</AppText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}
