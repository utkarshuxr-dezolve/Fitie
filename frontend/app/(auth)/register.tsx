import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/AuthContext';
import { colors, spacing, radius, typography } from '@/src/theme';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(email.trim(), password, name.trim());
      router.replace('/(tabs)');
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>F</Text>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your fitness journey with Fitie</Text>
          </View>

          <View style={styles.form}>
            {error ? <Text testID="register-error" style={styles.errorText}>{error}</Text> : null}
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <TextInput
                testID="register-name-input"
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL</Text>
              <TextInput
                testID="register-email-input"
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <TextInput
                testID="register-password-input"
                style={styles.input}
                placeholder="Min 6 characters"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity testID="register-submit-button" style={styles.button} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.buttonText}>Create Account</Text>}
            </TouchableOpacity>

            <TouchableOpacity testID="register-to-login" style={styles.linkButton} onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Sign In</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.screen },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logoContainer: { width: 72, height: 72, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  logoText: { ...typography.h1, color: colors.textInverse },
  title: { ...typography.h1, color: colors.textMain, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  form: { gap: spacing.md },
  inputGroup: { gap: spacing.xs },
  inputLabel: { ...typography.label, color: colors.textMuted },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 14, fontSize: 16, color: colors.textMain },
  button: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  buttonText: { ...typography.body, fontWeight: '600', color: colors.textInverse },
  linkButton: { alignItems: 'center', paddingVertical: spacing.md },
  linkText: { ...typography.bodySm, color: colors.textMuted },
  linkBold: { color: colors.primary, fontWeight: '600' },
  errorText: { ...typography.bodySm, color: colors.error, textAlign: 'center', backgroundColor: '#FEF2F2', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.sm, overflow: 'hidden' },
});
