import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, space } from '../../src/theme';
import { AppText, Card, Field, LangSwitch, SpeakBtn, StatusPill, useUi } from '../../src/ui';
import { Image } from 'expo-image';

type BrowserSpeechRecognitionEvent = Event & {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechWindow = Window & {
  SpeechRecognition?: new () => BrowserSpeechRecognition;
  webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
};

export default function Ask() {
  const insets = useSafeAreaInsets();
  const {
    tt,
    palette,
    row,
    isRTL,
    locale,
    messages,
    chatHistory,
    sendUser,
    resetChat,
    openChatConversation,
    removeChatConversation,
    startBookingConversation,
    bookingNavigationPending,
    consumeBookingNavigation,
    appointments,
    documents,
  } = useUi();
  const [text, setText] = useState('');
  const [voice, setVoice] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const scroll = useRef<ScrollView>(null);
  const voiceBaseText = useRef('');
  const recognition = useRef<BrowserSpeechRecognition | null>(null);

  useEffect(() => () => {
    recognition.current?.abort();
  }, []);

  useEffect(() => {
    scroll.current?.scrollToEnd({ animated: false });
  }, [messages]);

  useEffect(() => {
    if (bookingNavigationPending) {
      consumeBookingNavigation();
      router.replace('/(beneficiary)/appointments');
    }
  }, [bookingNavigationPending, consumeBookingNavigation]);

  const submit = async (value?: string) => {
    const v = (value ?? text).trim();
    if (!v || isTyping) return;
    setText('');
    setVoice(false);
    setIsTyping(true);
    try {
      await sendUser(v);
    } finally {
      setIsTyping(false);
    }
  };

  const groupedChats = [...new Map(
    chatHistory.map((message) => [message.conversationId ?? 'legacy', message.conversationId ?? 'legacy'])
  ).keys()].map((conversationId) => {
    const chatMessages = chatHistory.filter((message) =>
      (message.conversationId ?? 'legacy') === conversationId
    );
    const latest = chatMessages[chatMessages.length - 1];
    const firstQuestion = chatMessages.find((message) => message.role === 'user');
    return {
      conversationId,
      title: firstQuestion?.textEn ?? (locale === 'ar' ? 'محادثة جديدة' : 'New conversation'),
      preview: latest?.textEn ?? '',
      date: latest?.createdAt ?? '',
    };
  }).sort((a, b) => b.date.localeCompare(a.date));

  const filteredChats = groupedChats.filter((chat) =>
    `${chat.title} ${chat.preview}`.toLocaleLowerCase().includes(historySearch.trim().toLocaleLowerCase())
  );

  const confirmDeleteChat = (conversationId: string) => {
    Alert.alert(
      locale === 'ar' ? 'حذف المحادثة؟' : 'Delete conversation?',
      locale === 'ar' ? 'سيتم حذف رسائل هذه المحادثة.' : 'Messages in this conversation will be deleted.',
      [
        { text: locale === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: locale === 'ar' ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: () => void removeChatConversation(conversationId).catch(() =>
            Alert.alert(locale === 'ar' ? 'تعذر الحذف' : 'Could not delete', locale === 'ar' ? 'تحقق من الاتصال وحاول مرة أخرى.' : 'Check your connection and try again.')
          ),
        },
      ]
    );
  };

  const handleUploadReport = () => {
    router.push('/(beneficiary)/explain');
  };

  const startVoiceInput = async () => {
    if (recognizing) {
      recognition.current?.stop();
      return;
    }

    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      Alert.alert(
        locale === 'ar' ? 'الإدخال الصوتي غير متاح في التطبيق' : 'Voice input is unavailable in the app',
        locale === 'ar'
          ? 'يمكنك استخدام الإدخال الصوتي عند فتح عون في متصفح يدعم التعرف على الكلام.'
          : 'Voice input is available when you open Awn in a browser that supports speech recognition.'
      );
      return;
    }

    voiceBaseText.current = text.trim() ? `${text.trim()} ` : '';
    try {
      const browserWindow = window as SpeechWindow;
      const SpeechRecognition = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setVoice(false);
        Alert.alert(
          locale === 'ar' ? 'التعرف على الكلام غير متاح' : 'Speech recognition unavailable',
          locale === 'ar'
            ? 'هذا المتصفح لا يدعم التعرف على الكلام. جرّب متصفحًا مدعومًا.'
            : 'This browser does not support speech recognition. Try a supported browser.'
        );
        return;
      }

      const speechRecognition = new SpeechRecognition();
      speechRecognition.lang = locale === 'ar' ? 'ar-SA' : 'en-US';
      speechRecognition.interimResults = true;
      speechRecognition.continuous = false;
      speechRecognition.onstart = () => setRecognizing(true);
      speechRecognition.onend = () => {
        setRecognizing(false);
        setVoice(false);
      };
      speechRecognition.onresult = (event) => {
        const transcript = Array.from({ length: event.results.length }, (_, index) =>
          event.results[index]?.[0]?.transcript ?? ''
        ).join('').trim();
        if (transcript) setText(`${voiceBaseText.current}${transcript}`);
      };
      speechRecognition.onerror = (event) => {
        setRecognizing(false);
        setVoice(false);
        Alert.alert(
          event.error === 'not-allowed'
            ? (locale === 'ar' ? 'إذن الميكروفون مطلوب' : 'Microphone permission needed')
            : (locale === 'ar' ? 'تعذر التعرف على الكلام' : 'Speech recognition failed'),
          event.error === 'not-allowed'
            ? (locale === 'ar' ? 'اسمح للمتصفح باستخدام الميكروفون.' : 'Allow microphone access in your browser.')
            : (locale === 'ar' ? 'حاول مرة أخرى.' : 'Please try again.')
        );
      };

      recognition.current = speechRecognition;
      setVoice(true);
      speechRecognition.start();
    } catch {
      setVoice(false);
      Alert.alert(
        locale === 'ar' ? 'تعذر بدء الإدخال الصوتي' : 'Could not start voice input',
        locale === 'ar' ? 'تحقق من إذن الميكروفون وحاول مرة أخرى.' : 'Check microphone permission and try again.'
      );
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: palette.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: insets.top, paddingHorizontal: space.md, flex: 1 }}>
        <View style={[row, { alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, gap: 12 }]}>

          <View style={{ flex: 1, alignItems: 'center', gap: 4, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <Image source={require('awn/assets/brand/logo.png')} style={{ width: 36, height: 36 }} contentFit="contain" />

            <AppText size={24} weight="700">
              {tt('askMe')}
            </AppText>
          </View>

          <View style={[row, { alignItems: 'center', gap: 8 }]}>
            <Pressable
              onPress={() => setHistoryVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={locale === 'ar' ? 'سجل المحادثات' : 'Chat history'}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="time-outline" size={22} color={palette.tealDark} />
            </Pressable>
            <Pressable
              onPress={resetChat}
              accessibilityRole="button"
              accessibilityLabel={locale === 'ar' ? 'بدء محادثة جديدة' : 'Start a new chat'}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="add-outline" size={24} color={palette.tealDark} />
            </Pressable>
            <LangSwitch />
          </View>
        </View>


        <ScrollView ref={scroll} contentContainerStyle={{ paddingBottom: 16 }} keyboardShouldPersistTaps="handled">

          <View>
          <AppText muted size={14} style={{ marginBottom: 8 }}>
            {tt('principle')}
          </AppText>
        </View>

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
                  {m.role === 'awn' ? (
                    <View style={[row, { marginTop: 8, alignItems: 'center', justifyContent: 'flex-end', gap: 8 }]}>
                      <SpeakBtn text={body} />
                    </View>
                  ) : null}
                  {m.disclaimer ? (
                    <View style={{ marginTop: 8 }}>
                      <StatusPill label={tt('supportingOnly')} tone="info" />
                    </View>
                  ) : null}
                </View>
                {!mine && m.sources?.length ? (
                  <View style={{ maxWidth: '92%', marginTop: 6, gap: 4 }}>
                    {m.sources.map((source) => (
                      <Pressable
                        key={source.url}
                        onPress={() => void Linking.openURL(source.url)}
                        accessibilityRole="link"
                      >
                        <AppText size={13} style={{ color: palette.tealDark, textDecorationLine: 'underline' }}>
                          {source.title}
                        </AppText>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
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
                      onPress={() => void submit(locale === 'ar' ? o.labelAr : o.labelEn)}
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
                        else if (a.kind === 'intent' && a.intent === 'book_appointment') startBookingConversation();
                        else if (a.kind === 'intent' && a.intent === 'general_info') submit(locale === 'ar' ? 'معلومات عامة' : 'General information');
                        else if (a.kind === 'intent' && a.intent === 'confirm_booking') void submit(locale === 'ar' ? 'نعم، تأكيد' : 'Yes, confirm');
                        else if (a.kind === 'confirm_booking') void submit(locale === 'ar' ? 'نعم، تأكيد' : 'Yes, confirm');
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
          <Pressable onPress={() => void startVoiceInput()} accessibilityRole="button" accessibilityLabel={locale === 'ar' ? 'إدخال الرسالة بالصوت' : 'Dictate message'} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: recognizing ? palette.tealDark : palette.mint, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={recognizing ? 'mic' : 'mic-outline'} size={22} color={recognizing ? '#fff' : palette.tealDark} />
          </Pressable>
          <Field value={text} onChange={setText} placeholder={tt('composer')} onSubmit={() => submit()} />
          <Pressable onPress={() => submit()} accessibilityLabel={tt('send')} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: palette.tealDark, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>

      {isTyping ? (
        <View style={{ position: 'absolute', left: space.md, bottom: 86, flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 10, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 }}>
          <ActivityIndicator size="small" color={palette.tealDark} />
          <AppText muted size={14}>{locale === 'ar' ? 'عون يكتب…' : 'Awn is typing…'}</AppText>
        </View>
      ) : null}

      <Modal visible={voice} animationType="slide" transparent onRequestClose={() => recognizing ? recognition.current?.stop() : setVoice(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(10,28,24,0.45)', justifyContent: 'flex-end' }} onPress={() => recognizing ? recognition.current?.stop() : setVoice(false)}>
          <Pressable
            onPress={() => { }}
            style={{ backgroundColor: palette.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36 }}
          >
            <AppText size={22} weight="700" style={{ textAlign: 'center' }}>
              {recognizing
                ? (locale === 'ar' ? 'أتحدث الآن…' : 'Listening…')
                : (locale === 'ar' ? 'تم تحويل الكلام إلى نص' : 'Speech added to your message')}
            </AppText>
            <AppText muted style={{ textAlign: 'center', marginBottom: 16 }}>
              {locale === 'ar'
                ? 'سيظهر النص في مربع الرسالة لتراجعه قبل الإرسال.'
                : 'Your words will appear in the message box for review before sending.'}
            </AppText>
            <View style={{ alignItems: 'center', marginVertical: 12 }}>
              <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: palette.mint, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 78, height: 78, borderRadius: 39, backgroundColor: palette.teal, alignItems: 'center', justifyContent: 'center' }}>
                  {recognizing
                    ? <Ionicons name="mic" size={36} color="#fff" />
                    : <Ionicons name="checkmark" size={36} color="#fff" />}
                </View>
              </View>
            </View>
            <Pressable
              onPress={() => recognizing ? recognition.current?.stop() : setVoice(false)}
              accessibilityRole="button"
              style={{ alignItems: 'center', marginTop: 8, padding: 12 }}
            >
              <AppText weight="700">{recognizing ? tt('stop') : (locale === 'ar' ? 'تم' : 'Done')}</AppText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={historyVisible} animationType="slide" onRequestClose={() => setHistoryVisible(false)}>
        <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top, paddingHorizontal: space.md }}>
          <View style={[row, { alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }]}>
            <AppText size={22} weight="700">{locale === 'ar' ? 'سجل المحادثات' : 'Chat history'}</AppText>
            <Pressable onPress={() => setHistoryVisible(false)} accessibilityRole="button" accessibilityLabel={locale === 'ar' ? 'إغلاق' : 'Close'}>
              <Ionicons name="close-circle-outline" size={28} color={palette.ink} />
            </Pressable>
          </View>
          <View style={{ borderWidth: 1, borderColor: palette.border, borderRadius: 14, backgroundColor: palette.surface, paddingHorizontal: 12, marginBottom: 12 }}>
            <TextInput
              value={historySearch}
              onChangeText={setHistorySearch}
              placeholder={locale === 'ar' ? 'ابحث في المحادثات' : 'Search conversations'}
              placeholderTextColor={palette.inkSoft}
              style={{ color: palette.ink, minHeight: 46, textAlign: isRTL ? 'right' : 'left' }}
              accessibilityLabel={locale === 'ar' ? 'ابحث في المحادثات' : 'Search conversations'}
            />
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
            {filteredChats.length ? filteredChats.map((chat) => (
              <View key={chat.conversationId} style={[row, { alignItems: 'center', gap: 8, marginBottom: 8 }]}>
                <Pressable
                  onPress={() => {
                    openChatConversation(chat.conversationId);
                    setHistoryVisible(false);
                  }}
                  style={{ flex: 1, backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: 16, padding: 14 }}
                >
                  <AppText weight="700" numberOfLines={1}>{chat.title}</AppText>
                  <AppText muted size={13} numberOfLines={1} style={{ marginTop: 4 }}>{chat.preview}</AppText>
                  <AppText muted size={12} style={{ marginTop: 6 }}>{chat.date.slice(0, 16).replace('T', ' ')}</AppText>
                </Pressable>
                <Pressable
                  onPress={() => confirmDeleteChat(chat.conversationId)}
                  accessibilityRole="button"
                  accessibilityLabel={locale === 'ar' ? 'حذف المحادثة' : 'Delete conversation'}
                  style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="trash-outline" size={21} color={palette.danger} />
                </Pressable>
              </View>
            )) : (
              <AppText muted style={{ textAlign: 'center', marginTop: 32 }}>
                {locale === 'ar' ? 'لا توجد محادثات مطابقة.' : 'No matching conversations.'}
              </AppText>
            )}
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
