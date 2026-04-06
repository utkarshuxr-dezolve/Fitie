import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Dumbbell } from 'lucide-react-native';
import { useAuth } from '@/src/AuthContext';
import { colors, spacing, radius, typography, shadows } from '@/src/theme';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) { setError('Please fill in all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError(''); setLoading(true);
    try {
      await register(email.trim(), password, name.trim());
      router.replace('/(tabs)');
    } catch (e: any) {
      const d = e?.response?.data?.detail;
      setError(typeof d === 'string' ? d : 'Registration failed. Please check your email and try again.');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.heroSection}>
            <View style={s.logoCircle}>
              <Dumbbell size={32} color={colors.textInverse} strokeWidth={2.5} />
            </View>
            <Text style={s.brandName}>FITIE</Text>
          </View>

          <View style={s.formCard}>
            <Text style={s.formTitle}>Get Started</Text>
            <Text style={s.formSub}>Create your account to begin training</Text>

            {error ? <View style={s.errorBox}><Text testID="register-error" style={s.errorText}>{error}</Text></View> : null}

            <View style={s.inputWrap}>
              <Text style={s.inputLabel}>FULL NAME</Text>
              <TextInput testID="register-name-input" style={s.input} placeholder="John Doe" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
            </View>
            <View style={s.inputWrap}>
              <Text style={s.inputLabel}>EMAIL</Text>
              <TextInput testID="register-email-input" style={s.input} placeholder="your@email.com" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={s.inputWrap}>
              <Text style={s.inputLabel}>PASSWORD</Text>
              <TextInput testID="register-password-input" style={s.input} placeholder="Min 6 characters" placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
            </View>

            <TouchableOpacity testID="register-submit-button" style={s.primaryBtn} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Create Account</Text>}
            </TouchableOpacity>
          </View>

          <TouchableOpacity testID="register-to-login" style={s.linkBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={s.linkText}>Already have an account? <Text style={s.linkBold}>Sign In</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { flexGrow: 1 },
  heroSection: { alignItems: 'center', paddingTop: 48, paddingBottom: 32, backgroundColor: colors.primary },
  logoCircle: { width: 72, height: 72, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  brandName: { fontSize: 32, fontWeight: '900', color: colors.textInverse, letterSpacing: 4 },
  formCard: { backgroundColor: colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: spacing.screen + 4, paddingTop: 32, paddingBottom: 20, flex: 1, minHeight: 460 },
  formTitle: { ...typography.h1, color: colors.textMain, marginBottom: 4 },
  formSub: { ...typography.body, color: colors.textSecondary, marginBottom: 24 },
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: radius.sm, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 16 },
  errorText: { fontSize: 13, color: colors.error, fontWeight: '500' },
  inputWrap: { marginBottom: 16 },
  inputLabel: { ...typography.label, color: colors.textMuted, marginBottom: 8 },
  input: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: colors.textMain },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', marginTop: 8, ...shadows.button },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: colors.textInverse },
  linkBtn: { alignItems: 'center', paddingVertical: 24, backgroundColor: colors.background },
  linkText: { fontSize: 14, color: colors.textSecondary },
  linkBold: { color: colors.primary, fontWeight: '700' },
});
