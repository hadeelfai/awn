import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useState } from 'react';
import { Alert, Linking, Platform, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { WebView } from 'react-native-webview';
import { translateExplanation } from '../../../src/services/reportExplanation';

import {
  AppText,
  Card,
  Screen,
  SpeakBtn,
  StatusPill,
  TopBar,
  useUi,
} from '../../../src/ui';

export default function ReportDetail() {
  const { id, from } =
    useLocalSearchParams<{
      id: string;
      from?: string;
    }>();

  const {
    tt,
    locale,
    documents,
    palette,
    row,
    updateDocument,
    removeDocument,
  } = useUi();
  const [translating, setTranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const document =
    documents.find(
      (d) => d.id === id
    );

  const handleBack = () => {
    if (from === 'explain') {
      router.replace(
        '/(beneficiary)/explain'
      );
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(
      '/(beneficiary)/explain'
    );
  };

  if (!document) {
    return (
      <Screen>
        <TopBar
          title={tt('report')}
          back
          right={null}
          onBack={handleBack}
        />

        <AppText>
          {tt('notFound')}
        </AppText>
      </Screen>
    );
  }

  /*
   * Reports analyzed by the real
   * Fahimni backend are stored as
   * one special finding.
   */
  const fahimniFinding =
    document.findings.find(
      (finding) =>
        finding.nameAr ===
          'شرح فهمني' ||
        finding.nameEn ===
          'Fahimni Explanation'
    );

  const explanation =
    fahimniFinding
      ? locale === 'ar'
        ? fahimniFinding.simpleAr
        : fahimniFinding.simpleEn
      : null;

  // Check if this is a new Awn explanation with full details
  const hasAwnExplanation = !!document.summary;
  const translation = document.translations?.[locale];
  const activeTranslation = locale !== document.explanationLanguage ? translation : undefined;
  const summary = activeTranslation?.summary ?? document.summary;
  const keyPoints = activeTranslation?.keyPoints ?? document.keyPoints;
  const terms = activeTranslation?.terms ?? document.terms;
  const questionsForDoctor = activeTranslation?.questionsForDoctor ?? document.questionsForDoctor;
  const nextSteps = activeTranslation?.nextSteps ?? document.nextSteps;
  const disclaimer = activeTranslation?.disclaimer ?? document.disclaimer;

  const handleTranslate = async () => {
    if (!document.summary || translating) return;
    setTranslating(true);
    try {
      const translated = await translateExplanation({
        summary: document.summary,
        key_points: document.keyPoints ?? [],
        terms: document.terms ?? [],
        questions_for_doctor: document.questionsForDoctor ?? [],
        next_steps: document.nextSteps ?? [],
        disclaimer: document.disclaimer ?? '',
      }, locale);
      updateDocument({
        ...document,
        translations: {
          ...document.translations,
          [locale]: {
            summary: translated.summary,
            keyPoints: translated.key_points,
            terms: translated.terms,
            questionsForDoctor: translated.questions_for_doctor,
            nextSteps: translated.next_steps,
            disclaimer: translated.disclaimer,
          },
        },
      });
    } catch {
      Alert.alert(
        locale === 'ar' ? 'تعذرت الترجمة' : 'Translation failed',
        locale === 'ar' ? 'تعذر ترجمة تفاصيل التقرير. حاول مرة أخرى.' : 'Could not translate the report details. Please try again.'
      );
    } finally {
      setTranslating(false);
    }
  };

  const handleDelete = () => Alert.alert(
    locale === 'ar' ? 'حذف التقرير؟' : 'Delete report?',
    locale === 'ar' ? 'سيتم حذف التقرير من قائمة تقاريرك.' : 'This report will be removed from your reports.',
    [
      { text: locale === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
      { text: locale === 'ar' ? 'حذف' : 'Delete', style: 'destructive', onPress: () => {
        removeDocument(document.id);
        router.replace('/(beneficiary)/explain');
      } },
    ]
  );

  return (
    <Screen scroll>
      <TopBar
        title={tt('reportDetails')}
        back
        right={null}
        onBack={handleBack}
      />

      {/* Report header */}
      <Card
        style={{
          marginBottom: 16,
        }}
      >
        <View
          style={[
            row,
            {
              justifyContent:
                'space-between',
              alignItems: 'center',
              gap: 12,
            },
          ]}
        >
          <AppText
            size={20}
            weight="700"
            style={{
              flex: 1,
            }}
          >
            {locale === 'ar'
              ? document.titleAr
              : document.titleEn}
          </AppText>

          <SpeakBtn
            text={
              explanation ??
              (locale === 'ar'
                ? document.titleAr
                : document.titleEn)
            }
          />
        </View>

        <AppText
          muted
          style={{
            marginTop: 8,
          }}
        >
          {document.originalName}
          {' · '}
          {document.createdAt.slice(
            0,
            10
          )}
        </AppText>

        <View
          style={[
            row,
            {
              marginTop: 8,
              gap: 8,
            },
          ]}
        >
          <StatusPill
            label={
              document.kind === 'lab'
                ? tt('labResult')
                : document.kind ===
                    'prescription'
                ? tt('prescription')
                : tt('report')
            }
            tone="info"
          />
        </View>

        <View style={[row, { marginTop: 14, gap: 10 }]}>
          {document.originalUri ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowOriginal((visible) => !visible)}
              style={[row, { alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: palette.mint }]}
            >
              <Ionicons name="document-outline" size={18} color={palette.tealDark} />
              <AppText size={13} weight="700" style={{ color: palette.tealDark }}>{showOriginal ? (locale === 'ar' ? 'إخفاء التقرير' : 'Hide report') : (locale === 'ar' ? 'عرض التقرير' : 'View report')}</AppText>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={handleDelete}
            style={[row, { alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: palette.dangerSoft }]}
          >
            <Ionicons name="trash-outline" size={18} color={palette.danger} />
            <AppText size={13} weight="700" style={{ color: palette.danger }}>{locale === 'ar' ? 'حذف' : 'Delete'}</AppText>
          </Pressable>
        </View>
      </Card>

      {showOriginal && document.originalUri ? (
        <Card style={{ padding: 8, marginBottom: 16 }}>
          {document.originalName.toLowerCase().match(/\.(jpe?g|png|webp)$/) ? (
            <Image
              source={{ uri: document.originalUri }}
              contentFit="contain"
              accessibilityLabel={locale === 'ar' ? 'صورة التقرير الأصلي' : 'Original report image'}
              style={{ width: '100%', height: 560, backgroundColor: palette.bg, borderRadius: 10 }}
            />
          ) : Platform.OS === 'web' ? (
            React.createElement('iframe', {
              src: document.originalUri,
              title: document.originalName,
              style: { width: '100%', height: '70vh', border: 0, backgroundColor: '#fff' },
            })
          ) : (
            <WebView
              source={{ uri: document.originalUri }}
              originWhitelist={['*']}
              allowFileAccess
              style={{ height: 640, backgroundColor: palette.bg, borderRadius: 10 }}
            />
          )}
        </Card>
      ) : null}

      {hasAwnExplanation && document.explanationLanguage && locale !== document.explanationLanguage && !translation ? (
        <Pressable
          accessibilityRole="button"
          disabled={translating}
          onPress={() => void handleTranslate()}
          style={[row, { alignItems: 'center', justifyContent: 'center', gap: 8, padding: 13, borderRadius: 12, backgroundColor: palette.tealDark, marginBottom: 12, opacity: translating ? 0.65 : 1 }]}
        >
          <Ionicons name="language" size={19} color="#fff" />
          <AppText weight="700" style={{ color: '#fff' }}>
            {translating
              ? (locale === 'ar' ? 'جاري الترجمة...' : 'Translating...')
              : (locale === 'ar' ? 'ترجمة تفاصيل التقرير إلى العربية' : 'Translate report details to English')}
          </AppText>
        </Pressable>
      ) : null}

      {/* AWN EXPLANATION */}
      {hasAwnExplanation ? (
        <>
          {document.urgent ? (
            <View
              accessibilityRole="alert"
              style={{
                backgroundColor: palette.dangerSoft,
                borderColor: palette.danger,
                borderWidth: 1,
                borderRadius: 12,
                padding: 14,
                marginBottom: 12,
              }}
            >
              <View style={[row, { alignItems: 'center', gap: 8 }]}>
                <Ionicons name="alert-circle" size={22} color={palette.danger} />
                <AppText weight="700" style={{ color: palette.danger, flex: 1 }}>
                  {locale === 'ar'
                    ? 'تنبيه مهم: تواصل مع طبيبك قريباً. للطوارئ اتصل بـ 997.'
                    : 'Important: contact your doctor soon. For emergencies, call 997.'}
                </AppText>
              </View>
            </View>
          ) : null}

          <Card style={{ marginBottom: 12 }}>
            <View style={[row, { justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }]}>
              <AppText size={16} weight="700">
                {locale === 'ar' ? 'الخلاصة' : 'Summary'}
              </AppText>
              <SpeakBtn text={summary || ''} />
            </View>
            <AppText style={{ lineHeight: 25 }}>{summary}</AppText>
          </Card>

          {keyPoints && keyPoints.length > 0 ? (
            <Card style={{ marginBottom: 12 }}>
              <View style={[row, { justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }]}>
                <AppText size={16} weight="700">
                  {locale === 'ar' ? 'أهم النقاط' : 'Key points'}
                </AppText>
                <SpeakBtn text={keyPoints.join('. ')} />
              </View>
              {keyPoints.map((item, index) => (
                <View key={`kp-${index}`} style={[row, { alignItems: 'flex-start', gap: 8, marginTop: 6 }]}>
                  <AppText weight="700" style={{ color: palette.tealDark }}>•</AppText>
                  <AppText style={{ flex: 1 }}>{item}</AppText>
                </View>
              ))}
            </Card>
          ) : null}

          {terms && terms.length > 0 ? (
            <Card style={{ marginBottom: 12 }}>
              <View style={[row, { justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }]}>
                <AppText size={16} weight="700">
                  {locale === 'ar' ? 'مصطلحات ومعانيها' : 'Terms in plain language'}
                </AppText>
                <SpeakBtn text={terms.map(t => `${t.term}: ${t.meaning}`).join('. ')} />
              </View>
              {terms.map((item, index) => (
                <View
                  key={`term-${index}`}
                  style={{
                    paddingVertical: 9,
                    borderBottomWidth: index < terms.length - 1 ? 1 : 0,
                    borderBottomColor: palette.border,
                  }}
                >
                  <AppText weight="700">{item.term}</AppText>
                  <AppText muted style={{ marginTop: 3 }}>{item.meaning}</AppText>
                </View>
              ))}
            </Card>
          ) : null}

          {questionsForDoctor && questionsForDoctor.length > 0 ? (
            <Card style={{ marginBottom: 12 }}>
              <View style={[row, { justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }]}>
                <AppText size={16} weight="700">
                  {locale === 'ar' ? 'أسئلة يمكنك طرحها على الطبيب' : 'Questions for your doctor'}
                </AppText>
                <SpeakBtn text={questionsForDoctor.join('. ')} />
              </View>
              {questionsForDoctor.map((item, index) => (
                <View key={`q-${index}`} style={[row, { alignItems: 'flex-start', gap: 8, marginTop: 6 }]}>
                  <AppText weight="700" style={{ color: palette.tealDark }}>•</AppText>
                  <AppText style={{ flex: 1 }}>{item}</AppText>
                </View>
              ))}
            </Card>
          ) : null}

          {nextSteps && nextSteps.length > 0 ? (
            <Card style={{ marginBottom: 12 }}>
              <View style={[row, { justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }]}>
                <AppText size={16} weight="700">
                  {locale === 'ar' ? 'خطوات تالية' : 'Next steps'}
                </AppText>
                <SpeakBtn text={nextSteps.join('. ')} />
              </View>
              {nextSteps.map((item, index) => (
                <View key={`ns-${index}`} style={[row, { alignItems: 'flex-start', gap: 8, marginTop: 6 }]}>
                  <AppText weight="700" style={{ color: palette.tealDark }}>•</AppText>
                  <AppText style={{ flex: 1 }}>{item}</AppText>
                </View>
              ))}
            </Card>
          ) : null}

          {document.sources && document.sources.length > 0 ? (
            <Card style={{ marginBottom: 12 }}>
              <AppText size={16} weight="700" style={{ marginBottom: 8 }}>
                {locale === 'ar' ? 'مصادر وزارة الصحة' : 'Ministry of Health sources'}
              </AppText>
              {document.sources.map((source, index) => (
                <Pressable
                  key={`src-${index}`}
                  accessibilityRole="link"
                  onPress={() => {
                    void Linking.openURL(source.url).catch(() => undefined);
                  }}
                  style={[row, { alignItems: 'center', gap: 8, paddingVertical: 7 }]}
                >
                  <Ionicons name="open-outline" size={17} color={palette.tealDark} />
                  <AppText style={{ color: palette.tealDark, flex: 1 }}>
                    {source.title || source.url}
                  </AppText>
                </Pressable>
              ))}
            </Card>
          ) : null}

          <Card>
            <View style={[row, { alignItems: 'center', gap: 8 }]}>
              <Ionicons name="information-circle" size={20} color={palette.info} />
              <AppText weight="700" style={{ color: palette.info }}>
                {locale === 'ar' ? 'تنويه طبي' : 'Medical disclaimer'}
              </AppText>
            </View>
            <AppText muted style={{ marginTop: 8 }}>{disclaimer}</AppText>
          </Card>
        </>
      ) : explanation ? (
        <Card
          style={{
            marginBottom: 16,
          }}
        >
          <View
            style={[
              row,
              {
                justifyContent:
                  'space-between',
                alignItems:
                  'flex-start',
                gap: 12,
                marginBottom: 12,
              },
            ]}
          >
            <View
              style={{
                flex: 1,
              }}
            >
              <AppText
                size={18}
                weight="700"
              >
                {locale === 'ar'
                  ? 'شرح فهمني'
                  : 'Fahimni Explanation'}
              </AppText>

              <AppText
                muted
                size={13}
                style={{
                  marginTop: 4,
                }}
              >
                {locale === 'ar'
                  ? 'شرح مبسط لمساعدتك على فهم التقرير'
                  : 'A simplified explanation to help you understand your report'}
              </AppText>
            </View>

            <SpeakBtn
              text={explanation}
            />
          </View>

          <View
            style={{
              borderTopWidth: 1,
              borderTopColor:
                palette.border,
              paddingTop: 16,
            }}
          >
            <AppText
              style={{
                lineHeight: 27,
              }}
            >
              {explanation}
            </AppText>
          </View>
        </Card>
      ) : (
        /*
         * Keep teammate's original
         * findings UI for demo/local
         * reports.
         */
        <Card
          style={{
            marginBottom: 16,
          }}
        >
          <AppText
            size={16}
            weight="700"
            style={{
              marginBottom: 12,
            }}
          >
            {tt(
              'simpleExplanation'
            )}
          </AppText>

          <AppText
            muted
            style={{
              marginBottom: 16,
            }}
          >
            {tt('disclaimer')}
          </AppText>

          {document.findings.map(
            (finding, index) => (
              <View
                key={index}
                style={{
                  marginBottom: 16,
                  paddingBottom: 16,
                  borderBottomWidth:
                    index <
                    document.findings
                      .length -
                      1
                      ? 1
                      : 0,
                  borderBottomColor:
                    palette.border,
                }}
              >
                <View
                  style={[
                    row,
                    {
                      justifyContent:
                        'space-between',
                      alignItems:
                        'flex-start',
                      gap: 12,
                    },
                  ]}
                >
                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <AppText
                      size={16}
                      weight="700"
                    >
                      {locale === 'ar'
                        ? finding.nameAr
                        : finding.nameEn}
                    </AppText>

                    {(finding.value ||
                      finding.unit) && (
                      <AppText
                        size={20}
                        weight="700"
                        style={{
                          color:
                            palette.tealDark,
                          marginTop: 4,
                        }}
                      >
                        {finding.value}
                        {finding.unit
                          ? ` ${finding.unit}`
                          : ''}
                      </AppText>
                    )}
                  </View>

                  <SpeakBtn
                    text={
                      locale === 'ar'
                        ? finding.simpleAr
                        : finding.simpleEn
                    }
                  />
                </View>

                <AppText
                  style={{
                    marginTop: 8,
                    lineHeight: 22,
                  }}
                >
                  {locale === 'ar'
                    ? finding.simpleAr
                    : finding.simpleEn}
                </AppText>
              </View>
            )
          )}
        </Card>
      )}

      {/* Medical disclaimer - only show for non-Awn explanations */}
      {!hasAwnExplanation && (
        <Card>
          <View
            style={[
              row,
              {
                alignItems: 'center',
                gap: 8,
              },
            ]}
          >
            <Ionicons
              name="information-circle"
              size={20}
              color={palette.info}
            />

            <AppText
              weight="700"
              style={{
                color: palette.info,
              }}
            >
              {tt(
                'medicalDisclaimer'
              )}
            </AppText>
          </View>

          <AppText
            muted
            style={{
              marginTop: 8,
            }}
          >
            {tt('noDiagnose')}
          </AppText>
        </Card>
      )}
    </Screen>
  );
}
