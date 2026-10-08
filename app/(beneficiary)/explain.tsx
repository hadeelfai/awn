import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, View } from 'react-native';

import {
  explainReport,
  type ExplainResponse,
} from '../../src/services/reportExplanation';
import {
  AppText,
  Card,
  Screen,
  StatusPill,
  TopBar,
  useUi,
} from '../../src/ui';

export default function Explain() {
  const {
    tt,
    locale,
    documents,
    palette,
    row,
    addDocument,
  } = useUi();

  const [uploading, setUploading] =
    useState(false);
  const [explanation, setExplanation] =
    useState<ExplainResponse | null>(null);
  const [uploadedName, setUploadedName] =
    useState('');

  const analyzeReport = async (
    uri: string,
    fileName: string,
    mimeType?: string,
    byteSize?: number
  ) => {
    try {
      setUploading(true);
      setExplanation(null);
      const result = await explainReport(
        uri,
        fileName,
        mimeType,
        locale,
        byteSize
      );
      setUploadedName(fileName);

      if (!result.readable) {
        setExplanation(result);
        return;
      }

      // Save the document to the user's reports
      {
        const docKind = /lab|test|تحاليل|مختبر/i.test(`${result.document_type} ${fileName}`) ? 'lab' : 'report';
        const reportTitle = fileName.replace(/\.[^.]+$/, '').trim() || result.document_type || (locale === 'ar' ? 'تقرير طبي' : 'Medical report');
        const newDoc = {
          id: `DOC-${Date.now()}`,
          titleAr: reportTitle,
          titleEn: reportTitle,
          kind: docKind as 'lab' | 'prescription' | 'report' | 'instructions',
          originalName: fileName,
          originalUri: uri,
          explanationLanguage: locale,
          findings: result.key_points.map((point, i) => ({
            nameAr: point,
            nameEn: point,
            value: '',
            unit: '',
            simpleAr: point,
            simpleEn: point,
          })),
          createdAt: new Date().toISOString(),
          summary: result.summary,
          keyPoints: result.key_points,
          terms: result.terms,
          questionsForDoctor: result.questions_for_doctor,
          nextSteps: result.next_steps,
          urgent: result.urgent,
          sources: result.sources,
          disclaimer: result.disclaimer,
        };
        addDocument(newDoc);
        router.replace({
          pathname: '/(beneficiary)/report/[id]',
          params: { id: newDoc.id, from: 'explain' },
        });
      }
    } catch (error) {
      Alert.alert(
        locale === 'ar'
          ? 'تعذر شرح المستند'
          : 'Could not explain document',

        error instanceof Error && error.message === 'FILE_TOO_LARGE'
          ? locale === 'ar'
            ? 'الحد الأقصى لحجم الملف 10 ميجابايت.'
            : 'The maximum file size is 10 MB.'
            : error instanceof Error && error.message === 'UNSUPPORTED_FILE'
            ? locale === 'ar'
              ? 'اختر JPG أو PNG أو WEBP أو PDF فقط.'
              : 'Choose a JPG, PNG, WEBP, or PDF file.'
            : locale === 'ar'
              ? 'تعذر على عون معالجة الملف حالياً. تأكد أن خادم awn-rag يعمل ثم حاول بصورة أوضح أو ملف PDF تجريبي.'
              : 'Awn could not process the file. Check that the awn-rag server is running, then try a clearer photo or a sample PDF.'
      );
    } finally {
      setUploading(false);
    }
  };

  /*
   * PDF / document upload
   */
  const handleUpload =
    async () => {
      try {
        const result =
          await DocumentPicker.getDocumentAsync(
            {
              type: [
                'application/pdf',
                'image/jpeg',
                'image/png',
                'image/webp',
              ],

              copyToCacheDirectory:
                true,
            }
          );

        if (result.canceled) {
          return;
        }

        const file =
          result.assets[0];

        await analyzeReport(
          file.uri,
          file.name,
          file.mimeType,
          file.size
        );
      } catch (error) {
        console.log(
          'Document picker failed:',
          error
        );

        setUploading(false);

        Alert.alert(
          locale === 'ar'
            ? 'تعذر فتح الملف'
            : 'Could not open file',

          locale === 'ar'
            ? 'حدث خطأ أثناء اختيار الملف.'
            : 'An error occurred while selecting the file.'
        );
      }
    };

  /*
   * Image gallery upload
   */
  const handleImageUpload =
    async () => {
      try {
        const result =
          await ImagePicker.launchImageLibraryAsync(
            {
              mediaTypes: [
                'images',
              ],

              allowsEditing: false,
              preferredAssetRepresentationMode:
                ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,

              quality: 1,
            }
          );

        if (result.canceled) {
          return;
        }

        const asset =
          result.assets[0];

        const mimeType = asset.mimeType ?? undefined;
        const extension = mimeType === 'image/png'
          ? 'png'
          : mimeType === 'image/webp'
            ? 'webp'
            : 'jpg';
        const originalName = asset.fileName ?? `sample-image-${Date.now()}.${extension}`;
        const fileName = /\.(jpe?g|png|webp)$/i.test(originalName)
          ? originalName
          : `${originalName.replace(/\.[^/.]+$/, '')}.${extension}`;

        await analyzeReport(
          asset.uri,
          fileName,
          mimeType,
          asset.fileSize
        );
      } catch (error) {
        console.log(
          'Image picker failed:',
          error
        );

        setUploading(false);

        Alert.alert(
          locale === 'ar'
            ? 'تعذر فتح الصورة'
            : 'Could not open image',

          locale === 'ar'
            ? 'حدث خطأ أثناء اختيار الصورة.'
            : 'An error occurred while selecting the image.'
        );
      }
    };

  const renderListSection = (
    title: string,
    items: string[]
  ) => items.length > 0 ? (
    <Card style={{ marginBottom: 12 }}>
      <AppText size={16} weight="700" style={{ marginBottom: 8 }}>
        {title}
      </AppText>
      {items.map((item, index) => (
        <View key={`${title}-${index}`} style={[row, { alignItems: 'flex-start', gap: 8, marginTop: 6 }]}>
          <AppText weight="700" style={{ color: palette.tealDark }}>•</AppText>
          <AppText style={{ flex: 1 }}>{item}</AppText>
        </View>
      ))}
    </Card>
  ) : null;

  return (
    <Screen scroll>
      <TopBar
        title={tt('explainMe')}
        right={null}
      />

      {/* Upload buttons */}
      <View
        style={[
          row,
          {
            gap: 12,
            marginBottom: 20,
          },
        ]}
      >
        {/* PDF / document */}
        <Pressable
          onPress={handleUpload}
          disabled={uploading}
          style={{
            flex: 1,
            backgroundColor:
              palette.tealDark,
            borderRadius: 22,
            padding: 16,
            alignItems: 'center',
            opacity:
              uploading
                ? 0.6
                : 1,
          }}
        >
          <View
            style={[
              row,
              {
                alignItems:
                  'center',
                gap: 8,
              },
            ]}
          >
            <Ionicons
              name="document"
              size={20}
              color="#fff"
            />

            <AppText
              size={14}
              weight="700"
              style={{
                color: '#fff',
              }}
            >
              {uploading
                ? locale === 'ar'
                  ? 'جاري التحليل...'
                  : 'Analyzing...'
                : tt(
                    'uploadDocument'
                  )}
            </AppText>
          </View>
        </Pressable>

        {/* Image */}
        <Pressable
          onPress={
            handleImageUpload
          }
          disabled={uploading}
          style={{
            flex: 1,
            backgroundColor:
              palette.mint,
            borderRadius: 22,
            padding: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor:
              palette.tealDark,
            opacity:
              uploading
                ? 0.6
                : 1,
          }}
        >
          <View
            style={[
              row,
              {
                alignItems:
                  'center',
                gap: 8,
              },
            ]}
          >
            <Ionicons
              name="image"
              size={20}
              color={
                palette.tealDark
              }
            />

            <AppText
              size={14}
              weight="700"
              style={{
                color:
                  palette.tealDark,
              }}
            >
              {uploading
                ? locale === 'ar'
                  ? 'جاري التحليل...'
                  : 'Analyzing...'
                : tt(
                    'uploadImage'
                  )}
            </AppText>
          </View>
        </Pressable>
      </View>

      {explanation ? (
        <View style={{ marginBottom: 20 }}>
          <Card style={{ marginBottom: 12 }}>
            <View style={[row, { alignItems: 'center', justifyContent: 'space-between', gap: 12 }]}>
              <View style={{ flex: 1 }}>
                <AppText size={17} weight="700">
                  {locale === 'ar' ? 'نتيجة الشرح' : 'Explanation'}
                </AppText>
                <AppText muted size={13}>{uploadedName}</AppText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={locale === 'ar' ? 'إغلاق النتيجة' : 'Dismiss result'}
                onPress={() => {
                  setExplanation(null);
                  setUploadedName('');
                }}
                hitSlop={10}
              >
                <Ionicons name="close-circle-outline" size={24} color={palette.inkSoft} />
              </Pressable>
            </View>
          </Card>

          {!explanation.readable ? (
            <Card style={{ marginBottom: 12 }}>
              <AppText>{explanation.message}</AppText>
            </Card>
          ) : (
            <>
              {explanation.urgent ? (
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
                <AppText size={16} weight="700" style={{ marginBottom: 8 }}>
                  {locale === 'ar' ? 'الخلاصة' : 'Summary'}
                </AppText>
                <AppText style={{ lineHeight: 25 }}>{explanation.summary}</AppText>
              </Card>

              {renderListSection(
                locale === 'ar' ? 'أهم النقاط' : 'Key points',
                explanation.key_points
              )}

              {explanation.terms.length > 0 ? (
                <Card style={{ marginBottom: 12 }}>
                  <AppText size={16} weight="700" style={{ marginBottom: 8 }}>
                    {locale === 'ar' ? 'مصطلحات ومعانيها' : 'Terms in plain language'}
                  </AppText>
                  {explanation.terms.map((item, index) => (
                    <View
                      key={`${item.term}-${index}`}
                      style={{
                        paddingVertical: 9,
                        borderBottomWidth: index < explanation.terms.length - 1 ? 1 : 0,
                        borderBottomColor: palette.border,
                      }}
                    >
                      <AppText weight="700">{item.term}</AppText>
                      <AppText muted style={{ marginTop: 3 }}>{item.meaning}</AppText>
                    </View>
                  ))}
                </Card>
              ) : null}

              {renderListSection(
                locale === 'ar' ? 'أسئلة يمكنك طرحها على الطبيب' : 'Questions for your doctor',
                explanation.questions_for_doctor
              )}
              {renderListSection(
                locale === 'ar' ? 'خطوات تالية' : 'Next steps',
                explanation.next_steps
              )}

              {explanation.sources.length > 0 ? (
                <Card style={{ marginBottom: 12 }}>
                  <AppText size={16} weight="700" style={{ marginBottom: 8 }}>
                    {locale === 'ar' ? 'مصادر وزارة الصحة' : 'Ministry of Health sources'}
                  </AppText>
                  {explanation.sources.map((source, index) => (
                    <Pressable
                      key={`${source.url}-${index}`}
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
                <AppText muted style={{ marginTop: 8 }}>{explanation.disclaimer}</AppText>
              </Card>
            </>
          )}
        </View>
      ) : null}

      {/* Reports */}
      <AppText
        size={18}
        weight="700"
        style={{
          marginBottom: 12,
        }}
      >
        {tt('yourReports')}
      </AppText>

      {documents.length === 0 ? (
        <Card>
          <AppText muted>
            {tt('noReports')}
          </AppText>

          <AppText
            muted
            size={13}
            style={{
              marginTop: 8,
            }}
          >
            {tt(
              'uploadFirstReport'
            )}
          </AppText>
        </Card>
      ) : (
        documents.map(
          (doc) => (
            <Card
              key={doc.id}
              style={{
                marginBottom: 12,
              }}
              onPress={() =>
                router.push({
                  pathname:
                    '/(beneficiary)/report/[id]',

                  params: {
                    id: doc.id,
                    from: 'explain',
                  },
                })
              }
            >
              <View
                style={[
                  row,
                  {
                    justifyContent:
                      'space-between',

                    alignItems:
                      'center',
                  },
                ]}
              >
                <View
                  style={{
                    flex: 1,
                    paddingRight: 8,
                  }}
                >
                  <AppText
                    size={16}
                    weight="700"
                  >
                    {locale === 'ar'
                      ? doc.titleAr
                      : doc.titleEn}
                  </AppText>

                  <AppText
                    muted
                    size={13}
                  >
                    {
                      doc.originalName
                    }{' '}
                    ·{' '}
                    {doc.createdAt.slice(
                      0,
                      10
                    )}
                  </AppText>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={
                    palette.inkSoft
                  }
                />
              </View>

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
                    doc.kind ===
                    'lab'
                      ? tt(
                          'labResult'
                        )
                      : doc.kind ===
                        'prescription'
                      ? tt(
                          'prescription'
                        )
                      : tt(
                          'report'
                        )
                  }
                  tone="info"
                />

                <AppText
                  muted
                  size={13}
                >
                  {
                    doc.findings
                      .length
                  }{' '}
                  {tt('findings')}
                </AppText>
              </View>
            </Card>
          )
        )
      )}
    </Screen>
  );
}
