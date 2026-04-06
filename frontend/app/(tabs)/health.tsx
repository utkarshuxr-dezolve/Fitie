import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Upload, FileText, AlertTriangle, CheckCircle, X, ChevronRight, Shield, ArrowLeft } from 'lucide-react-native';
import { healthAPI } from '@/src/api';
import { colors, spacing, radius, typography, shadows } from '@/src/theme';
import { Skeleton, SkeletonCard, SkeletonLine } from '@/src/components/Skeleton';
import { formatNetworkError } from '@/src/formatError';

const reportTypes = [
  { id: 'blood_work', name: 'Blood Work', icon: Heart, desc: 'CBC, lipids, glucose panel' },
  { id: 'general_checkup', name: 'General Checkup', icon: Shield, desc: 'BMI, blood pressure, heart rate' },
  { id: 'vitamin_panel', name: 'Vitamin Panel', icon: FileText, desc: 'Vitamin D, B12, Iron levels' },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  normal: { bg: colors.successBg, text: colors.success },
  low: { bg: colors.warningBg, text: colors.warning },
  high: { bg: colors.warningBg, text: colors.warning },
  critical: { bg: colors.errorBg, text: colors.error },
};

export default function HealthScreen() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);

  const loadData = useCallback(async () => {
    try { const { data } = await healthAPI.getReports(); setReports(data); }
    catch (e: any) { console.log('Health load:', formatNetworkError(e)); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const upload = async (type: string) => {
    setUploading(true);
    const samples: Record<string, Record<string, unknown>> = {
      blood_work: { hemoglobin: '14.2 g/dL', cholesterol: '185 mg/dL', blood_sugar: '95 mg/dL', vitamin_d: '28 ng/mL' },
      general_checkup: { bmi: '23.5', bp: '120/80', hr: '72 bpm' },
      vitamin_panel: { vitamin_d: '28 ng/mL', b12: '450 pg/mL', iron: '80 mcg/dL' },
    };
    try {
      const { data } = await healthAPI.uploadReport({ report_type: type, data: samples[type] || {} });
      setShowUpload(false); setSelected(data); setShowDetail(true); loadData();
    } catch (e: any) { Alert.alert('Upload Error', formatNetworkError(e, 'Could not analyze report')); }
    finally { setUploading(false); }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <Skeleton height={28} width="40%" style={{ marginBottom: spacing.lg }} />
          <SkeletonCard />
          <SkeletonLine lines={3} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.primary} />} showsVerticalScrollIndicator={false}>
        <Text style={s.pageTitle}>Health</Text>

        {/* Upload CTA */}
        <TouchableOpacity testID="upload-report-btn" style={s.uploadCard} onPress={() => setShowUpload(true)} activeOpacity={0.9}>
          <View style={s.uploadIconW}><Upload size={22} color="#fff" strokeWidth={2.5} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.uploadTitle}>Analyze Report</Text>
            <Text style={s.uploadSub}>Get AI-powered health insights</Text>
          </View>
          <View style={s.uploadArrow}><ChevronRight size={16} color={colors.primary} /></View>
        </TouchableOpacity>

        {/* Reports */}
        <Text style={s.sectionTitle}>Your Reports</Text>
        {reports.length > 0 ? reports.map((r, i) => (
          <TouchableOpacity key={i} testID={`report-${i}`} style={s.reportCard} onPress={() => { setSelected(r); setShowDetail(true); }} activeOpacity={0.85}>
            <View style={s.reportIcon}><FileText size={16} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.reportName}>{r.report_type.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</Text>
              <Text style={s.reportDate}>{new Date(r.created_at).toLocaleDateString()}</Text>
            </View>
            <ChevronRight size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )) : (
          <View style={s.emptyCard}>
            <Heart size={36} color={colors.primaryLight} />
            <Text style={s.emptyTitle}>No reports yet</Text>
            <Text style={s.emptySub}>Upload a report for personalized insights</Text>
          </View>
        )}

        <View style={{ height: 12 }} />
      </ScrollView>

      {/* Upload Modal */}
      <Modal visible={showUpload} animationType="slide" transparent>
        <View style={s.modalBg}>
          <View style={s.modalBox}>
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>Report Type</Text>
              <TouchableOpacity testID="close-upload-modal" onPress={() => setShowUpload(false)}><X size={22} color={colors.textMain} /></TouchableOpacity>
            </View>
            {uploading ? <View style={s.loadW}><ActivityIndicator size="large" color={colors.primary} /><Text style={s.loadT}>Analyzing...</Text></View> :
              reportTypes.map(rt => {
                const I = rt.icon;
                return (
                  <TouchableOpacity key={rt.id} testID={`report-type-${rt.id}`} style={s.rtCard} onPress={() => upload(rt.id)} activeOpacity={0.85}>
                    <View style={s.rtIcon}><I size={18} color={colors.primary} /></View>
                    <View style={{ flex: 1 }}><Text style={s.rtName}>{rt.name}</Text><Text style={s.rtDesc}>{rt.desc}</Text></View>
                    <ChevronRight size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                );
              })
            }
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={showDetail} animationType="slide">
        <SafeAreaView style={s.detailSafe}>
          <View style={s.detailHead}>
            <TouchableOpacity testID="close-detail-modal" onPress={() => setShowDetail(false)}><ArrowLeft size={22} color={colors.textMain} /></TouchableOpacity>
            <Text style={s.detailTitle}>Health Insights</Text>
            <View style={{ width: 22 }} />
          </View>
          <ScrollView style={s.detailScroll} contentContainerStyle={s.detailContent}>
            {selected?.insights && (
              <>
                <View style={s.summaryBox}>
                  <CheckCircle size={18} color={colors.success} />
                  <Text style={s.summaryText}>{selected.insights.summary}</Text>
                </View>

                {selected.insights.key_metrics?.length > 0 && (
                  <><Text style={s.detailSection}>Key Metrics</Text>
                  {selected.insights.key_metrics.map((m: any, i: number) => {
                    const cl = statusColors[m.status] || { bg: colors.surfaceBlue, text: colors.textMuted };
                    return (
                    <View key={i} style={s.metricRow}>
                      <View><Text style={s.metricLabel}>{m.name}</Text><Text style={s.metricVal}>{m.value}</Text></View>
                      <View style={[s.statusBadge, { backgroundColor: cl.bg }]}><Text style={[s.statusText, { color: cl.text }]}>{m.status}</Text></View>
                    </View>
                    );
                  })}</>
                )}

                {selected.insights.risk_indicators?.length > 0 && (
                  <><Text style={s.detailSection}>Risk Indicators</Text>
                  {selected.insights.risk_indicators.map((r: any, i: number) => (
                    <View key={i} style={s.riskBox}>
                      <AlertTriangle size={14} color={colors.warning} />
                      <View style={{ flex: 1 }}><Text style={s.riskText}>{r.indicator}</Text><Text style={s.riskSev}>{r.severity}</Text></View>
                    </View>
                  ))}</>
                )}

                {selected.insights.recommendations?.length > 0 && (
                  <><Text style={s.detailSection}>Recommendations</Text>
                  {selected.insights.recommendations.map((rc: string, i: number) => (
                    <View key={i} style={s.recRow}>
                      <View style={s.recDot} />
                      <Text style={s.recText}>{rc}</Text>
                    </View>
                  ))}</>
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function ActivityIndicator({ size, color }: { size: string; color: string }) {
  return <View />;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.screen, paddingBottom: spacing.xxl },
  pageTitle: { ...typography.h1, color: colors.textMain, marginTop: spacing.md, marginBottom: spacing.lg },

  uploadCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.xl, padding: 18, marginBottom: spacing.lg, ...shadows.button },
  uploadIconW: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  uploadTitle: { ...typography.h3, color: '#fff' },
  uploadSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  uploadArrow: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },

  sectionTitle: { ...typography.h3, color: colors.textMain, marginBottom: spacing.md },
  reportCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBlue, borderRadius: radius.lg, padding: 14, marginBottom: 8 },
  reportIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  reportName: { ...typography.bodyMd, fontWeight: '600', color: colors.textMain },
  reportDate: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },

  emptyCard: { alignItems: 'center', backgroundColor: colors.cardBlue, borderRadius: radius.xl, padding: 36, gap: 8 },
  emptyTitle: { ...typography.h2, color: colors.textMain },
  emptySub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.screen + 4 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { ...typography.h3, color: colors.textMain },
  loadW: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadT: { ...typography.body, color: colors.textSecondary },
  rtCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  rtIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rtName: { ...typography.bodyMd, fontWeight: '600', color: colors.textMain },
  rtDesc: { fontSize: 12, color: colors.textSecondary },

  detailSafe: { flex: 1, backgroundColor: colors.background },
  detailHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.screen, paddingTop: spacing.md, paddingBottom: spacing.md },
  detailTitle: { ...typography.h3, color: colors.textMain },
  detailScroll: { flex: 1 },
  detailContent: { paddingHorizontal: spacing.screen, paddingBottom: spacing.xl },
  summaryBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.successBg, borderRadius: radius.lg, padding: 16, marginBottom: spacing.lg },
  summaryText: { ...typography.body, color: colors.textMain, flex: 1, lineHeight: 20 },
  detailSection: { ...typography.h3, color: colors.textMain, marginBottom: spacing.md, marginTop: spacing.md },
  metricRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.cardBlue, borderRadius: radius.lg, padding: 14, marginBottom: 8 },
  metricLabel: { fontSize: 12, color: colors.textSecondary },
  metricVal: { ...typography.h3, color: colors.textMain },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  riskBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.warningBg, borderRadius: radius.lg, padding: 14, marginBottom: 8 },
  riskText: { ...typography.body, color: colors.textMain },
  riskSev: { fontSize: 12, color: colors.warning, textTransform: 'capitalize' },
  recRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
  recText: { ...typography.body, color: colors.textMain, flex: 1, lineHeight: 20 },
});
