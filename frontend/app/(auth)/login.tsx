import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Dumbbell } from 'lucide-react-native';
import { useAuth } from '@/src/AuthContext';
import { colors, spacing, radius, typography, shadows } from '@/src/theme';
import { formatNetworkError } from '@/src/formatError';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields'); return; }
    setError(''); setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(formatNetworkError(e, 'Invalid email or password. Check your credentials and try again.'));
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {/* Hero */}
          <View style={s.heroSection}>
            <View style={s.logoCircle}>
              <Dumbbell size={32} color={colors.textInverse} strokeWidth={2.5} />
            </View>
            <Text style={s.brandName}>FITIE</Text>
            <Text style={s.brandSub}>Your AI Fitness Companion</Text>
          </View>

          {/* Form Card */}
          <View style={s.formCard}>
            <Text style={s.formTitle}>Welcome Back</Text>
            <Text style={s.formSub}>Sign in to continue your journey</Text>

            {error ? (
              <View style={s.errorBox}>
                <Text testID="login-error" style={s.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={s.inputWrap}>
              <Text style={s.inputLabel}>EMAIL</Text>
              <TextInput
                testID="login-email-input"
                style={s.input}
                placeholder="your@email.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={s.inputWrap}>
              <Text style={s.inputLabel}>PASSWORD</Text>
              <TextInput
                testID="login-password-input"
                style={s.input}
                placeholder="Enter password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity testID="login-submit-button" style={s.primaryBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="colors.textInverse" /> : <Text style={s.primaryBtnText}>Sign In</Text>}
            </TouchableOpacity>
          </View>

          <TouchableOpacity testID="login-to-register" style={s.linkBtn} onPress={() => router.push('/(auth)/register')}>
            <Text style={s.linkText}>Don&apos;t have an account? <Text style={s.linkBold}>Create one</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { flexGrow: 1 },
  heroSection: { alignItems: 'center', paddingTop: 60, paddingBottom: 40, backgroundColor: colors.primary },
  logoCircle: { width: 72, height: 72, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  brandName: { fontSize: 32, fontWeight: '900', color: colors.textInverse, letterSpacing: 4 },
  brandSub: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  formCard: { backgroundColor: colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: spacing.screen + 4, paddingTop: 36, paddingBottom: 20, flex: 1, minHeight: 400 },
  formTitle: { ...typography.h1, color: colors.textMain, marginBottom: 4 },
  formSub: { ...typography.body, color: colors.textSecondary, marginBottom: 28 },
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: radius.sm, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 16 },
  errorText: { fontSize: 13, color: colors.error, fontWeight: '500' },
  inputWrap: { marginBottom: 18 },
  inputLabel: { ...typography.label, color: colors.textMuted, marginBottom: 8 },
  input: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 15, fontSize: 15, color: colors.textMain },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', marginTop: 8, ...shadows.button },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: colors.textInverse },
  linkBtn: { alignItems: 'center', paddingVertical: 24, backgroundColor: colors.background },
  linkText: { fontSize: 14, color: colors.textSecondary },
  linkBold: { color: colors.primary, fontWeight: '700' },
});
