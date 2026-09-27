import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

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
  } = useUi();

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
      </Card>

      {/* REAL FAHIMNI EXPLANATION */}
      {explanation ? (
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

      {/* Medical disclaimer */}
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
    </Screen>
  );
}