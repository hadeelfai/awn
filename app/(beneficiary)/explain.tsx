import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { API_URL } from '../../src/config';
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

  /*
   * Sends a PDF or image to the real
   * Awn /reports/analyze endpoint.
   */
  const analyzeReport = async (
    uri: string,
    fileName: string
  ) => {
    try {
      setUploading(true);

      const file = new File(uri);

      const formData =
        new FormData();

      formData.append(
        'report',
        file,
        fileName
      );

      const response =
        await fetch(
          `${API_URL}/reports/analyze`,
          {
            method: 'POST',
            body: formData,
          }
        );

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error("FILE_TOO_LARGE");
        }

        throw new Error(`HTTP_${response.status}`);
      }

      const data =
        await response.json();

      const report =
        data.report ?? data;

      if (!report?.explanation) {
        throw new Error(
          'No explanation returned from backend'
        );
      }

      /*
       * Convert the backend report into
       * the frontend document format so
       * the teammate's existing UI can
       * continue displaying it.
       */
      const newDocument = {
        id:
          report.id ??
          `DOC-${Date.now()}`,

        titleAr:
          'شرح التقرير الطبي',

        titleEn:
          'Medical Report Explanation',

        kind:
          'report' as const,

        originalName:
          report.fileName ??
          fileName,

        findings: [
          {
            nameAr:
              'شرح فهمني',

            nameEn:
              'Fahimni Explanation',

            value: '',
            unit: '',

            simpleAr:
              report.explanation,

            simpleEn:
              report.explanation,
          },
        ],

        createdAt:
          report.createdAt ??
          new Date().toISOString(),
      };

      addDocument(newDocument);

      setUploading(false);

      /*
       * Open the explanation immediately
       * after the analysis is complete.
       */
      router.push({
        pathname:
          '/(beneficiary)/report/[id]',

        params: {
          id: newDocument.id,
          from: 'explain',
        },
      });
    } catch (error) {
      console.log(
        'Report analysis failed:',
        error
      );

      setUploading(false);

      Alert.alert(
        locale === 'ar'
          ? 'تعذر تحليل التقرير'
          : 'Could not analyze report',

        error instanceof Error && error.message === 'FILE_TOO_LARGE'
          ? locale === 'ar'
            ? 'حجم الملف أكبر من الحد المسموح. اختر ملفًا لا يتجاوز 25 ميجابايت.'
            : 'The file is too large. Choose a file no larger than 25 MB.'
          : locale === 'ar'
            ? 'تعذر على عون تحليل الملف حالياً. حاول مرة أخرى.'
            : 'Awn could not analyze the file right now. Please try again.'
      );
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
                'image/*',
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
          file.name
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

              quality: 1,
            }
          );

        if (result.canceled) {
          return;
        }

        const asset =
          result.assets[0];

        const fileName =
          asset.fileName ??
          `medical-image-${Date.now()}.jpg`;

        await analyzeReport(
          asset.uri,
          fileName
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