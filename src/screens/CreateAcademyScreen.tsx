import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

const COLORS = {
  bg: '#EDF1FB',
  navy: '#12294A',
  navyDeep: '#0B1E38',
  blue: '#2F6FE0',
  blueLight: '#DDE6FB',
  blueSoft: '#E7EDFC',
  white: '#FFFFFF',
  textMuted: '#7C8AA5',
  border: '#D7E0F5',
  purpleIcon: '#5B6EF5',
  fingerprintBg: '#F3D8C9',
};

const clampPrefix = (value: string, max = 3) =>
  value.toUpperCase().slice(0, max);

export default function CreateAcademyScreen() {
  const [academyName, setAcademyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [studentPrefix, setStudentPrefix] = useState('JJ');
  const [teacherPrefix, setTeacherPrefix] = useState('JW');

  const studentPreview = useMemo(
    () => `${studentPrefix || 'XX'}101`,
    [studentPrefix],
  );
  const teacherPreview = useMemo(
    () => `${teacherPrefix || 'XX'}01`,
    [teacherPrefix],
  );

  const handleCreateAcademy = () => {
    // TODO: hook up to API call
    console.log({
      academyName,
      adminName,
      email,
      studentPrefix,
      teacherPrefix,
    });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Breadcrumb */}
      <View style={styles.breadcrumbRow}>
        <Text style={styles.breadcrumbInactive}>Admin</Text>
        <Text style={styles.breadcrumbSeparator}> › </Text>
        <Text style={styles.breadcrumbActive}>Create Academy</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>
        Ignite a New{'\n'}
        <Text style={styles.titleAccent}>Learning Space</Text>
      </Text>
      <Text style={styles.subtitle}>
        Set up your new Abacus Academy environment. This will create a dedicated
        instance for your students and teachers.
      </Text>

      {/* Academy Identity Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.iconCircleBlue}>
            <Text style={styles.iconGlyph}>🎓</Text>
          </View>
          <Text style={styles.cardTitle}>Academy Identity</Text>
        </View>

        <Text style={styles.inputLabel}>Academy Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Abacus Heights International"
          placeholderTextColor={COLORS.textMuted}
          value={academyName}
          onChangeText={setAcademyName}
        />

        <Text style={styles.inputLabel}>Admin Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Full legal name"
          placeholderTextColor={COLORS.textMuted}
          value={adminName}
          onChangeText={setAdminName}
        />

        <Text style={styles.inputLabel}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="admin@academy.com"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {/* Logo Upload */}
      <TouchableOpacity style={styles.logoCard} activeOpacity={0.7}>
        <View style={styles.logoUploadBox}>
          <Text style={styles.logoUploadIcon}>🖼️</Text>
          <Text style={styles.logoUploadText}>UPLOAD</Text>
        </View>
        <View style={styles.logoTextWrap}>
          <Text style={styles.logoTitle}>Academy Brand Logo</Text>
          <Text style={styles.logoSubtitle}>
            Upload a high-resolution logo (PNG/SVG) to customize the student
            dashboard.
          </Text>
        </View>
      </TouchableOpacity>

      {/* Identity System Card */}
      <View style={styles.identityCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.iconCircleFingerprint}>
            <Text style={styles.iconGlyph}>🔒</Text>
          </View>
          <Text style={styles.cardTitle}>Identity System</Text>
        </View>

        <Text style={styles.identityDescription}>
          Define how your student and teacher IDs will be generated across the
          platform. This cannot be changed later.
        </Text>

        <Text style={styles.inputLabel}>Student ID Prefix</Text>
        <View style={styles.pillInputWrap}>
          <TextInput
            style={styles.pillInput}
            value={studentPrefix}
            onChangeText={v => setStudentPrefix(clampPrefix(v))}
            autoCapitalize="characters"
            maxLength={3}
          />
        </View>
        <Text style={styles.helperText}>
          e.g., JJ becomes JJ100, max 3 chars
        </Text>

        <Text style={[styles.inputLabel, { marginTop: 18 }]}>
          Teacher ID Prefix
        </Text>
        <View style={styles.pillInputWrap}>
          <TextInput
            style={styles.pillInput}
            value={teacherPrefix}
            onChangeText={v => setTeacherPrefix(clampPrefix(v))}
            autoCapitalize="characters"
            maxLength={3}
          />
        </View>
        <Text style={styles.helperText}>e.g., JW becomes JW1, max 3 chars</Text>

        {/* Preview */}
        <View style={styles.previewBox}>
          <Text style={styles.previewLabel}>✨ PREVIEW</Text>
          <View style={styles.previewRow}>
            <View>
              <Text style={styles.previewKey}>STUDENT:</Text>
            </View>
            <Text style={styles.previewValue}>{studentPreview}</Text>
            <View style={{ width: 24 }} />
            <Text style={styles.previewKey}>TEACHER:</Text>
            <Text style={styles.previewValue}>{teacherPreview}</Text>
          </View>
        </View>
      </View>

      {/* Create Button */}
      <TouchableOpacity
        style={styles.createButton}
        activeOpacity={0.85}
        onPress={handleCreateAcademy}
      >
        <Text style={styles.createButtonText}>Create Academy</Text>
        <Text style={styles.createButtonArrow}>›</Text>
      </TouchableOpacity>

      <Text style={styles.termsText}>
        By clicking "Create Academy", you agree to the{' '}
        <Text style={styles.termsLink}>Administrator Terms of Service.</Text>
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  breadcrumbInactive: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  breadcrumbSeparator: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  breadcrumbActive: {
    fontSize: 13,
    color: COLORS.blue,
    fontWeight: '600',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.navy,
    lineHeight: 36,
  },
  titleAccent: {
    color: COLORS.blue,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 12,
    lineHeight: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    marginTop: 24,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  iconCircleBlue: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconCircleFingerprint: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.fingerprintBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconGlyph: {
    fontSize: 18,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.navy,
  },
  inputLabel: {
    fontSize: 13,
    color: COLORS.navy,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.blueSoft,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: COLORS.navy,
    marginBottom: 18,
  },
  logoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.blueLight,
    borderRadius: 24,
    padding: 18,
    marginTop: 20,
    borderWidth: 1.5,
    borderColor: COLORS.blue,
    borderStyle: 'dashed',
  },
  logoUploadBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  logoUploadIcon: {
    fontSize: 20,
  },
  logoUploadText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.blue,
    marginTop: 2,
  },
  logoTextWrap: {
    flex: 1,
  },
  logoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 4,
  },
  logoSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 17,
  },
  identityCard: {
    backgroundColor: COLORS.blueLight,
    borderRadius: 24,
    padding: 20,
    marginTop: 20,
  },
  identityDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 19,
    marginBottom: 20,
  },
  pillInputWrap: {
    backgroundColor: COLORS.white,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  pillInput: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.navy,
  },
  helperText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  previewBox: {
    backgroundColor: '#DCE5FA',
    borderRadius: 18,
    padding: 16,
    marginTop: 20,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.blue,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  previewKey: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginRight: 6,
  },
  previewValue: {
    fontSize: 13,
    color: COLORS.navy,
    fontWeight: '700',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.navyDeep,
    borderRadius: 30,
    paddingVertical: 18,
    marginTop: 28,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  createButtonArrow: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
  },
  termsText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 16,
  },
  termsLink: {
    color: COLORS.blue,
    fontWeight: '600',
  },
});
