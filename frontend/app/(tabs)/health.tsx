import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Upload, FileText, AlertTriangle, CheckCircle, X, ChevronRight, Shield } from 'lucide-react-native';
import { healthAPI } from '@/src/api';
import { colors, spacing, radius, typography } from '@/src/theme';

const reportTypes = [
  { id: 'blood_work', name: 'Blood Work', icon: Heart, description: 'Complete blood count, lipids, glucose' },
  { id: 'general_checkup', name: 'General Checkup', icon: Shield, description: 'BMI, blood pressure, heart rate' },
  { id: 'vitamin_panel', name: 'Vitamin Panel', icon: FileText, description: 'Vitamin D, B12, Iron levels' },
];

export default function HealthScreen() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const { data } = await healthAPI.getReports();
      setReports(data);
    } catch (e) { console.log('Health load error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const uploadReport = async (reportType: string) => {
    setUploading(true);
    try {
      const sampleData: any = {
        blood_work: { hemoglobin: '14.2 g/dL', cholesterol: '185 mg/dL', blood_sugar: '95 mg/dL', vitamin_d: '28 ng/mL' },
        general_checkup: { bmi: '23.5', bp: '120/80', hr: '72 bpm' },
        vitamin_panel: { vitamin_d: '28 ng/mL', b12: '450 pg/mL', iron: '80 mcg/dL' },
      };
      const { data } = await healthAPI.uploadReport({ report_type: reportType, data: sampleData[reportType] || {} });
      setShowUploadModal(false);
      setSelectedReport(data);
      setShowDetailModal(true);
      loadData();
    } catch { Alert.alert('Error', 'Could not analyze report'); }
    finally { setUploading(false); }
  };

  const statusColor = (status: string) => {
    if (status === 'normal') return colors.success;
    if (status === 'low' || status === 'high') return colors.warning;
    return colors.error;
  };

  if (loading) {
    return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.primary} />} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Health</Text>

        {/* Upload CTA */}
        <TouchableOpacity testID="upload-report-btn" style={styles.uploadCard} onPress={() => setShowUploadModal(true)}>
          <View style={styles.uploadIcon}><Upload size={24} color={colors.textInverse} /></View>
          <View style={styles.uploadText}>
            <Text style={styles.uploadTitle}>Analyze Health Report</Text>
            <Text style={styles.uploadSub}>Get AI-powered insights from your medical data</Text>
          </View>
          <ChevronRight size={20} color={colors.textInverse} />
        </TouchableOpacity>

        {/* Reports */}
        <Text style={styles.sectionTitle}>Your Reports</Text>
        {reports.length > 0 ? (
          reports.map((report, i) => (
            <TouchableOpacity key={i} testID={`report-${i}`} style={styles.reportCard} onPress={() => { setSelectedReport(report); setShowDetailModal(true); }}>
              <View style={styles.reportIconWrap}><FileText size={18} color={colors.primary} /></View>
              <View style={styles.reportInfo}>
                <Text style={styles.reportName}>{report.report_type.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</Text>
                <Text style={styles.reportDate}>{new Date(report.created_at).toLocaleDateString()}</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Heart size={32} color={colors.border} />
            <Text style={styles.emptyText}>No health reports yet</Text>
            <Text style={styles.emptySubText}>Upload a report to get personalized insights</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Upload Modal */}
      <Modal visible={showUploadModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Report Type</Text>
              <TouchableOpacity testID="close-upload-modal" onPress={() => setShowUploadModal(false)}><X size={24} color={colors.textMain} /></TouchableOpacity>
            </View>
            {uploading ? (
              <View style={styles.uploadingWrap}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.uploadingText}>Analyzing report...</Text></View>
            ) : (
              reportTypes.map((rt) => {
                const Icon = rt.icon;
                return (
                  <TouchableOpacity key={rt.id} testID={`report-type-${rt.id}`} style={styles.reportTypeCard} onPress={() => uploadReport(rt.id)}>
                    <View style={styles.reportTypeIcon}><Icon size={20} color={colors.primary} /></View>
                    <View style={styles.reportTypeInfo}>
                      <Text style={styles.reportTypeName}>{rt.name}</Text>
                      <Text style={styles.reportTypeDesc}>{rt.description}</Text>
                    </View>
                    <ChevronRight size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide">
        <SafeAreaView style={styles.detailSafe}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>Health Insights</Text>
            <TouchableOpacity testID="close-detail-modal" onPress={() => setShowDetailModal(false)}><X size={24} color={colors.textMain} /></TouchableOpacity>
          </View>
          <ScrollView style={styles.detailScroll} contentContainerStyle={styles.detailScrollContent}>
            {selectedReport?.insights && (
              <>
                <View style={styles.summaryCard}>
                  <CheckCircle size={20} color={colors.success} />
                  <Text style={styles.summaryText}>{selectedReport.insights.summary}</Text>
                </View>

                {selectedReport.insights.key_metrics?.length > 0 && (
                  <>
                    <Text style={styles.detailSection}>Key Metrics</Text>
                    {selectedReport.insights.key_metrics.map((m: any, i: number) => (
                      <View key={i} style={styles.metricCard}>
                        <View style={styles.metricInfo}>
                          <Text style={styles.metricName}>{m.name}</Text>
                          <Text style={styles.metricValue}>{m.value}</Text>
                        </View>
                        <View style={[styles.metricBadge, { backgroundColor: statusColor(m.status) + '20' }]}>
                          <Text style={[styles.metricBadgeText, { color: statusColor(m.status) }]}>{m.status}</Text>
                        </View>
                      </View>
                    ))}
                  </>
                )}

                {selectedReport.insights.risk_indicators?.length > 0 && (
                  <>
                    <Text style={styles.detailSection}>Risk Indicators</Text>
                    {selectedReport.insights.risk_indicators.map((r: any, i: number) => (
                      <View key={i} style={styles.riskCard}>
                        <AlertTriangle size={16} color={colors.warning} />
                        <View style={styles.riskInfo}>
                          <Text style={styles.riskText}>{r.indicator}</Text>
                          <Text style={styles.riskSeverity}>{r.severity}</Text>
                        </View>
                      </View>
                    ))}
                  </>
                )}

                {selectedReport.insights.recommendations?.length > 0 && (
                  <>
                    <Text style={styles.detailSection}>Recommendations</Text>
                    {selectedReport.insights.recommendations.map((rec: string, i: number) => (
                      <View key={i} style={styles.recCard}>
                        <View style={styles.recDot} />
                        <Text style={styles.recText}>{rec}</Text>
                      </View>
                    ))}
                  </>
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.screen },
  pageTitle: { ...typography.h1, color: colors.textMain, marginTop: spacing.md, marginBottom: spacing.lg },
  uploadCard: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.md, flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  uploadIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  uploadText: { flex: 1 },
  uploadTitle: { ...typography.body, fontWeight: '600', color: colors.textInverse },
  uploadSub: { ...typography.bodySm, color: 'rgba(255,255,255,0.7)' },
  sectionTitle: { ...typography.h3, color: colors.textMain, marginBottom: spacing.md },
  reportCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  reportIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  reportInfo: { flex: 1 },
  reportName: { ...typography.body, fontWeight: '600', color: colors.textMain },
  reportDate: { ...typography.bodySm, color: colors.textMuted },
  emptyCard: { alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.sm },
  emptyText: { ...typography.body, fontWeight: '600', color: colors.textMain },
  emptySubText: { ...typography.bodySm, color: colors.textMuted, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.screen },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { ...typography.h3, color: colors.textMain },
  uploadingWrap: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md },
  uploadingText: { ...typography.body, color: colors.textMuted },
  reportTypeCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  reportTypeIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  reportTypeInfo: { flex: 1 },
  reportTypeName: { ...typography.body, fontWeight: '600', color: colors.textMain },
  reportTypeDesc: { ...typography.bodySm, color: colors.textMuted },
  detailSafe: { flex: 1, backgroundColor: colors.background },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.screen, paddingTop: spacing.md, paddingBottom: spacing.md },
  detailTitle: { ...typography.h2, color: colors.textMain },
  detailScroll: { flex: 1 },
  detailScrollContent: { paddingHorizontal: spacing.screen, paddingBottom: spacing.xl },
  summaryCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F0FDF4', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg, gap: 10 },
  summaryText: { ...typography.body, color: colors.textMain, flex: 1 },
  detailSection: { ...typography.h3, color: colors.textMain, marginBottom: spacing.md, marginTop: spacing.md },
  metricCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  metricInfo: {},
  metricName: { ...typography.bodySm, color: colors.textMuted },
  metricValue: { ...typography.body, fontWeight: '700', color: colors.textMain },
  metricBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  metricBadgeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  riskCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFBEB', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, gap: 10 },
  riskInfo: { flex: 1 },
  riskText: { ...typography.body, color: colors.textMain },
  riskSeverity: { ...typography.bodySm, color: colors.warning, textTransform: 'capitalize' },
  recCard: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, gap: 12 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
  recText: { ...typography.body, color: colors.textMain, flex: 1 },
});
