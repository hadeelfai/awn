import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { AppText, Card, PrimaryButton, Screen, StatusPill, TopBar, useUi } from '../../../src/ui';

export default function RequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tt, locale, requests, approveRequest, modifyRequest, askMoreInfo, palette, isRTL } = useUi();
  const r = requests.find((x) => x.id === id);
  const [question, setQuestion] = useState(r?.extraQuestion || '');
  const [serviceAr, setServiceAr] = useState(r?.approvedServiceAr || 'طب الأسرة');
  const [serviceEn, setServiceEn] = useState(r?.approvedServiceEn || 'Family medicine');
  const [mode, setMode] = useState<'none' | 'modify' | 'info'>('none');

  if (!r) {
    return (
      <Screen>
        <TopBar title={tt('requests')} back />
        <AppText>{tt('noResults')}</AppText>
      </Screen>
    );
  }

  const provided = locale === 'ar' ? r.providedAr : r.providedEn;
  const missing = locale === 'ar' ? r.missingAr : r.missingEn;

  return (
    <Screen scroll>
      <TopBar title={r.id} back />
      <StatusPill label={r.status} tone={r.status === 'approved' || r.status === 'modified' ? 'success' : r.status === 'more_info' ? 'danger' : 'warning'} />
      <AppText muted style={{ marginTop: 8 }}>
        {tt('supportingOnly')}
      </AppText>

      <Card style={{ marginTop: 12 }}>
        <AppText muted>{tt('patient')}</AppText>
        <AppText size={18} weight="700">
          {locale === 'ar' ? r.patientNameAr : r.patientNameEn}
        </AppText>
        <AppText muted>
          {tt('priority')}: {r.priority === 'urgent' ? tt('high') : r.priority === 'soon' ? tt('soon') : tt('routine')}
        </AppText>
      </Card>

      <AppText size={18} weight="700" style={{ marginTop: 16 }}>
        {tt('originalRequest')}
      </AppText>
      <Card style={{ marginTop: 8 }}>
        <AppText>{r.originalText}</AppText>
        {r.extraAnswer ? (
          <AppText style={{ marginTop: 8 }}>
            {tt('yourAnswer')}: {r.extraAnswer}
          </AppText>
        ) : null}
      </Card>

      <AppText size={18} weight="700" style={{ marginTop: 16 }}>
        {tt('aiSummary')}
      </AppText>
      <Card style={{ marginTop: 8 }}>
        <AppText muted>{tt('reason')}</AppText>
        <AppText weight="700">{locale === 'ar' ? r.reasonAr : r.reasonEn}</AppText>
        <AppText muted style={{ marginTop: 10 }}>
          {tt('provided')}
        </AppText>
        {provided.map((p: string) => (
          <AppText key={p}>• {p}</AppText>
        ))}
        <AppText muted style={{ marginTop: 10 }}>
          {tt('missing')}
        </AppText>
        {missing.length === 0 ? <AppText>—</AppText> : missing.map((p: string) => <AppText key={p}>• {p}</AppText>)}
        <AppText muted style={{ marginTop: 10 }}>
          {tt('aiNext')}
        </AppText>
        <AppText>{locale === 'ar' ? r.aiNextStepAr : r.aiNextStepEn}</AppText>
      </Card>

      {mode === 'modify' ? (
        <Card style={{ marginTop: 12 }}>
          <AppText>{tt('modifyService')}</AppText>
          <TextInput value={locale === 'ar' ? serviceAr : serviceEn} onChangeText={(v) => (locale === 'ar' ? setServiceAr(v) : setServiceEn(v))} style={input(palette, isRTL)} />
          <View style={{ marginTop: 10 }}>
            <PrimaryButton
              label={tt('save')}
              onPress={() => {
                modifyRequest(r.id, serviceAr, serviceEn);
                router.back();
              }}
            />
          </View>
        </Card>
      ) : null}

      {mode === 'info' ? (
        <Card style={{ marginTop: 12 }}>
          <AppText>{tt('requestInfo')}</AppText>
          <TextInput value={question} onChangeText={setQuestion} multiline style={[input(palette, isRTL), { minHeight: 90 }]} />
          <View style={{ marginTop: 10 }}>
            <PrimaryButton
              label={tt('sendQuestion')}
              onPress={() => {
                if (question.trim()) askMoreInfo(r.id, question.trim());
                router.back();
              }}
            />
          </View>
        </Card>
      ) : null}

      {r.status === 'approved' || r.status === 'modified' ? (
        <Card style={{ marginTop: 12 }}>
          <AppText weight="700">{tt('approved')}</AppText>
          <AppText>{locale === 'ar' ? r.approvedServiceAr : r.approvedServiceEn}</AppText>
        </Card>
      ) : (
        <View style={{ gap: 10, marginTop: 18 }}>
          <PrimaryButton
            label={tt('approve')}
            icon="checkmark"
            onPress={() => {
              approveRequest(r.id, serviceAr, serviceEn);
              router.back();
            }}
          />
          <PrimaryButton label={tt('modify')} variant="soft" icon="create-outline" onPress={() => setMode('modify')} />
          <PrimaryButton label={tt('requestInfo')} variant="ghost" icon="help-circle-outline" onPress={() => setMode('info')} />
        </View>
      )}
    </Screen>
  );
}

function input(palette: any, isRTL: boolean) {
  return {
    marginTop: 8,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    padding: 12,
    minHeight: 48,
    textAlign: isRTL ? ('right' as const) : ('left' as const),
    color: palette.ink,
  };
}
