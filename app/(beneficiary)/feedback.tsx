import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { AppText, PrimaryButton, Screen, TopBar, useUi } from '../../src/ui';

const tags = ['chipsEasy', 'chipsClear', 'chipsFast', 'chipsHelpful', 'chipsConfusing'] as const;

export default function Feedback() {
  const { tt, addFeedback, pendingFeedback, palette, isRTL } = useUi();
  const [rating, setRating] = useState(5);
  const [picked, setPicked] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <Screen>
        <TopBar title={tt('feedbackTitle')} back />
        <AppText size={20} weight="700">
          {tt('feedbackThanks')}
        </AppText>
        <View style={{ marginTop: 20 }}>
          <PrimaryButton label={tt('home')} onPress={() => router.replace('/(beneficiary)')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <TopBar title={tt('feedbackTitle')} back />
      <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, marginVertical: 12 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => setRating(n)}
            accessibilityLabel={`${n}`}
            style={{
              flex: 1,
              minHeight: 56,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: rating >= n ? palette.tealDark : palette.mint,
            }}
          >
            <AppText weight="700" style={{ color: rating >= n ? '#fff' : palette.tealDark }}>
              {n}
            </AppText>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 8 }}>
        {tags.map((k) => {
          const on = picked.includes(k);
          return (
            <Pressable
              key={k}
              onPress={() => setPicked((p) => (on ? p.filter((x) => x !== k) : [...p, k]))}
              style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, backgroundColor: on ? palette.tealDark : palette.mint }}
            >
              <AppText size={14} weight="700" style={{ color: on ? '#fff' : palette.tealDark }}>
                {tt(k)}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder={tt('optionalComment')}
        placeholderTextColor={palette.inkSoft}
        multiline
        style={{
          marginTop: 16,
          minHeight: 100,
          borderWidth: 1,
          borderColor: palette.border,
          borderRadius: 18,
          padding: 14,
          textAlign: isRTL ? 'right' : 'left',
          fontSize: 16,
          color: palette.ink,
        }}
      />
      <View style={{ marginTop: 16, gap: 10 }}>
        <PrimaryButton
          label={tt('submit')}
          onPress={() => {
            addFeedback({ rating, tags: picked, comment, journey: pendingFeedback || 'ask' });
            setDone(true);
          }}
        />
        <PrimaryButton label={tt('skip')} variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
