import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
    type StyleProp,
    type TextStyle,
    type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { I18nKey, t } from './i18n';
import { useApp } from './store';
import { radius, shadow, space } from './theme';

export function useUi() {
  const app = useApp();
  const fs = (n: number) => Math.round(n * app.fontScale);
  const row: ViewStyle = { flexDirection: app.isRTL ? 'row-reverse' : 'row' };
  const align: TextStyle = { textAlign: app.isRTL ? 'right' : 'left', writingDirection: app.isRTL ? 'rtl' : 'ltr' };
  return { ...app, fs, row, align, tt: (k: I18nKey, vars?: Record<string, string>) => t(app.locale, k, vars) };
}

export function AppText({
  children,
  style,
  muted,
  size = 16,
  weight = '500',
  ...rest
}: React.ComponentProps<typeof Text> & { muted?: boolean; size?: number; weight?: TextStyle['fontWeight'] }) {
  const { palette, fs, align, locale } = useUi();
  return (
    <Text
      {...rest}
      style={[
        align,
        {
          color: muted ? palette.inkMuted : palette.ink,
          fontSize: fs(size),
          fontWeight: weight,
          fontFamily: locale === 'ar' ? 'Cairo_600SemiBold' : 'IBMPlexSans_500Medium',
          lineHeight: fs(size) * 1.45,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Screen({
  children,
  scroll,
  padded = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
}) {
  const { palette } = useUi();
  const insets = useSafeAreaInsets();
  const body = (
    <View style={{ paddingHorizontal: padded ? space.lg : 0, paddingBottom: 24, flex: scroll ? undefined : 1 }}>{children}</View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top }}>
      {scroll ? (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 48 }}>
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const { palette } = useUi();
  const inner = (
    <View style={[{ backgroundColor: palette.surface, borderRadius: radius.lg, padding: space.md, borderWidth: 1, borderColor: palette.border }, shadow.card, style]}>
      {children}
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {inner}
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'ghost' | 'danger' | 'soft';
  disabled?: boolean;
}) {
  const { palette, fs, isRTL, row } = useUi();
  const bg =
    variant === 'primary' ? palette.tealDark : variant === 'danger' ? palette.danger : variant === 'soft' ? palette.mint : 'transparent';
  const color = variant === 'ghost' || variant === 'soft' ? palette.tealDark : '#fff';
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        row,
        {
          minHeight: 56,
          borderRadius: radius.pill,
          paddingHorizontal: 7,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: bg,
          borderWidth: variant === 'ghost' ? 1.5 : 0,
          borderColor: palette.tealDark,
          opacity: disabled ? 0.5 : pressed ? 0.86 : 1,
        },
      ]}
    >
      {icon ? <Ionicons name={icon} size={22} color={color} /> : null}
      <Text
        style={{
          color,
          fontSize: fs(14),
          fontWeight: '700',
          fontFamily: 'Cairo_700Bold',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function TopBar({
  title,
  subtitle,
  back,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const { palette, row, tt, unread } = useUi();
  return (
    <View style={[row, { alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, gap: 12 }]}>
      <View style={[row, { alignItems: 'center', gap: 10, flex: 1 }]}>
        {back ? (
          <Pressable
            onPress={onBack ?? (() => router.back())}
            accessibilityLabel={tt('back')}
            hitSlop={12}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.border }}
          >
            <Ionicons name="chevron-back" size={22} color={palette.ink} />
          </Pressable>
        ) : (
          <Image source={require('../assets/brand/logo.png')} style={{ width: 36, height: 36 }} contentFit="contain" />
        )}
        <View style={{ flex: 1 }}>
          <AppText size={22} weight="700">
            {title}
          </AppText>
          {subtitle ? (
            <AppText muted size={14}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </View>
      {right !== undefined ? (
        right
      ) : (
        <Pressable
          onPress={() => router.push('/(beneficiary)/notifications')}
          accessibilityLabel={tt('notifications')}
          style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.border }}
        >
          <Ionicons name="notifications-outline" size={22} color={palette.ink} />
          {unread > 0 ? (
            <View style={{ position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: 5, backgroundColor: palette.danger, borderWidth: 2, borderColor: palette.surface }} />
          ) : null}
        </Pressable>
      )}
    </View>
  );
}

export function LangSwitch() {
  const { locale, setLocale, palette, row } = useUi();
  return (
    <View style={[row, { backgroundColor: palette.mint, borderRadius: radius.pill, padding: 2 }]}>
      {(['ar', 'en'] as const).map((l) => (
        <Pressable
          key={l}
          onPress={() => setLocale(l)}
          accessibilityRole="button"
          accessibilityState={{ selected: locale === l }}
          style={{
            paddingHorizontal: 7,
            paddingVertical: 7,
            borderRadius: radius.pill,
            backgroundColor: locale === l ? palette.tealDark : 'transparent',
            minWidth: 44,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: locale === l ? '#fff' : palette.tealDark, fontWeight: '700' }}>{l === 'ar' ? 'عربي' : 'EN'}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: 'success' | 'warning' | 'info' | 'danger' | 'neutral';
}) {
  const { palette, fs } = useUi();
  const map = {
    success: { bg: palette.successSoft, fg: palette.success, icon: 'checkmark-circle' as const },
    warning: { bg: palette.warningSoft, fg: palette.warning, icon: 'time' as const },
    info: { bg: palette.infoSoft, fg: palette.info, icon: 'information-circle' as const },
    danger: { bg: palette.dangerSoft, fg: palette.danger, icon: 'alert-circle' as const },
    neutral: { bg: palette.mint, fg: palette.tealDark, icon: 'ellipse' as const },
  }[tone];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: map.bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, alignSelf: 'flex-start' }}>
      <Ionicons name={map.icon} size={14} color={map.fg} />
      <Text style={{ color: map.fg, fontWeight: '700', fontSize: fs(13) }}>{label}</Text>
    </View>
  );
}

export function Field({
  value,
  onChange,
  placeholder,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  onSubmit?: () => void;
}) {
  const { palette, fs, isRTL } = useUi();
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={palette.inkSoft}
      onSubmitEditing={onSubmit}
      accessibilityLabel={placeholder}
      style={{
        flex: 1,
        minHeight: 52,
        fontSize: fs(16),
        color: palette.ink,
        textAlign: isRTL ? 'right' : 'left',
        fontFamily: 'Cairo_500Medium',
      }}
    />
  );
}

export function SpeakBtn({ text }: { text: string }) {
  const { speak, tt, palette } = useUi();
  return (
    <Pressable
      onPress={() => speak(text)}
      accessibilityLabel={tt('readAloud')}
      style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.mint }}
    >
      <Ionicons name="volume-high-outline" size={18} color={palette.tealDark} />
    </Pressable>
  );
}

export function HeroBand({ children }: { children: React.ReactNode }) {
  const { palette } = useUi();
  return (
    <LinearGradient colors={[palette.bgMint, palette.bg]} style={{ borderRadius: radius.xl, padding: space.lg, overflow: 'hidden' }}>
      {children}
    </LinearGradient>
  );
}
