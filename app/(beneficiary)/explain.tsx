import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText, Card, Screen, StatusPill, TopBar, useUi } from '../../src/ui';

export default function Explain() {
  const { tt, locale, documents, palette, row, addDocument } = useUi();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    try {
      setUploading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
      });
      
      if (result.canceled) {
        setUploading(false);
        return;
      }

      const file = result.assets[0];
      const isImage = file.mimeType?.startsWith('image/') ?? false;
      
      const mockFindings = generateMockFindings(file.name, isImage);
      
      const newDocument = {
        id: `DOC-${Date.now()}`,
        titleAr: isImage ? 'صورة طبية' : 'تقرير طبي',
        titleEn: isImage ? 'Medical image' : 'Medical report',
        kind: isImage ? ('lab' as const) : ('report' as const),
        originalName: file.name,
        findings: mockFindings,
        createdAt: new Date().toISOString(),
      };
      
      addDocument(newDocument);
      setUploading(false);
      
    } catch (error) {
      console.error('Error uploading document:', error);
      setUploading(false);
    }
  };

  const handleImageUpload = async () => {
    try {
      setUploading(true);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      
      if (result.canceled) {
        setUploading(false);
        return;
      }

      const asset = result.assets[0];
      
      const mockFindings = generateMockFindings(asset.fileName || 'image.jpg', true);
      
      const newDocument = {
        id: `DOC-${Date.now()}`,
        titleAr: 'صورة طبية',
        titleEn: 'Medical image',
        kind: 'lab' as const,
        originalName: asset.fileName || 'image.jpg',
        findings: mockFindings,
        createdAt: new Date().toISOString(),
      };
      
      addDocument(newDocument);
      setUploading(false);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploading(false);
    }
  };

  return (
    <Screen scroll>
      <TopBar title={tt('explainMe')} right={null} />
      
      <View style={[row, { gap: 12, marginBottom: 20 }]}>
        <Pressable
          onPress={handleUpload}
          disabled={uploading}
          style={{
            flex: 1,
            backgroundColor: palette.tealDark,
            borderRadius: 22,
            padding: 16,
            alignItems: 'center',
            opacity: uploading ? 0.6 : 1,
          }}
        >
          <View style={[row, { alignItems: 'center', gap: 8 }]}>
            <Ionicons name="document" size={20} color="#fff" />
            <AppText size={14} weight="700" style={{ color: '#fff' }}>
              {tt('uploadDocument')}
            </AppText>
          </View>
        </Pressable>
        
        <Pressable
          onPress={handleImageUpload}
          disabled={uploading}
          style={{
            flex: 1,
            backgroundColor: palette.mint,
            borderRadius: 22,
            padding: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: palette.tealDark,
            opacity: uploading ? 0.6 : 1,
          }}
        >
          <View style={[row, { alignItems: 'center', gap: 8 }]}>
            <Ionicons name="image" size={20} color={palette.tealDark} />
            <AppText size={14} weight="700" style={{ color: palette.tealDark }}>
              {tt('uploadImage')}
            </AppText>
          </View>
        </Pressable>
      </View>

      <AppText size={18} weight="700" style={{ marginBottom: 12 }}>
        {tt('yourReports')}
      </AppText>
      
      {documents.length === 0 ? (
        <Card>
          <AppText muted>{tt('noReports')}</AppText>
          <AppText muted size={13} style={{ marginTop: 8 }}>
            {tt('uploadFirstReport')}
          </AppText>
        </Card>
      ) : (
        documents.map((doc) => (
          <Card
            key={doc.id}
            style={{ marginBottom: 12 }}
            onPress={() => router.push({ pathname: '/(beneficiary)/report/[id]', params: { id: doc.id, from: 'explain' } })}
          >
            <View style={[row, { justifyContent: 'space-between', alignItems: 'center' }]}>
              <View>
                <AppText size={16} weight="700">
                  {locale === 'ar' ? doc.titleAr : doc.titleEn}
                </AppText>
                <AppText muted size={13}>
                  {doc.originalName} · {doc.createdAt.slice(0, 10)}
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={palette.inkSoft} />
            </View>
            <View style={[row, { marginTop: 8, gap: 8 }]}>
              <StatusPill
                label={doc.kind === 'lab' ? tt('labResult') : doc.kind === 'prescription' ? tt('prescription') : tt('report')}
                tone="info"
              />
              <AppText muted size={13}>
                {doc.findings.length} {tt('findings')}
              </AppText>
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

function generateMockFindings(fileName: string, isImage: boolean) {
  if (isImage) {
    return [
      {
        nameAr: 'صورة طبية',
        nameEn: 'Medical image',
        value: 'Normal',
        unit: 'Visual',
        simpleAr: 'الصورة تظهر نطاقًا طبيعيًا دون abnormalities واضحة. هذا الشرح للتثقيف فقط.',
        simpleEn: 'The image shows a normal range without clear abnormalities. This explanation is for educational purposes only.',
      },
    ];
  }
  
  if (fileName.toLowerCase().includes('blood') || fileName.toLowerCase().includes('hemoglobin')) {
    return [
      {
        nameAr: 'الهيموغلوبين',
        nameEn: 'Hemoglobin',
        value: '13.5',
        unit: 'g/dL',
        simpleAr: 'مستوى الهيموغلوبين ضمن النطاق الطبيعي (12-16 g/dL). يشير إلى مستوى طبيعي للخضاب.',
        simpleEn: 'Hemoglobin level is within normal range (12-16 g/dL). Indicates normal hemoglobin level.',
      },
      {
        nameAr: 'عدد الكريات الحمراء',
        nameEn: 'Red blood cell count',
        value: '4.8',
        unit: 'million/μL',
        simpleAr: 'عدد الكريات الحمراء طبيعي. يوفر مؤشرًا جيدًا على صحة الدم.',
        simpleEn: 'Red blood cell count is normal. Provides a good indicator of blood health.',
      },
    ];
  }
  
  return [
    {
      nameAr: 'قيمة طبيعية',
      nameEn: 'Normal value',
      value: 'Within range',
      unit: 'N/A',
      simpleAr: 'القيمة ضمن النطاق الطبيعي. هذا الشرح للتثقيف ولا يعني تشخيصًا.',
      simpleEn: 'Value is within normal range. This explanation is for educational purposes and not a diagnosis.',
    },
    {
      nameAr: 'تقييم عام',
      nameEn: 'General assessment',
      value: 'Stable',
      unit: 'N/A',
      simpleAr: 'التقييم العام مستقر. يوصى بمراجعة الطبيب للمتابعة الروتينية.',
      simpleEn: 'General assessment is stable. Routine follow-up with physician is recommended.',
    },
  ];
}
