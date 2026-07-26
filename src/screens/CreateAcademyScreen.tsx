import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const COLORS = {
  background: '#F4F6FB',
  cardBg: '#FFFFFF',
  inputBg: '#F1F3FA',
  inputErrorBg: '#FDECEC',
  primary: '#4C5FE8',
  primaryDark: '#3A46C4',
  primaryDisabled: '#B7BEF2',
  logoBg: '#EFE9FF',
  logoAccent: '#8B5CF6',
  idBg: '#FEF3E2',
  idAccent: '#F5A524',
  textPrimary: '#1A1D29',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E8F0',
  errorBorder: '#E24C4C',
  errorText: '#D6303F',
  success: '#1FA971',
  successBg: '#E7F8F0',
};

type PrefixStatus = 'idle' | 'checking' | 'available' | 'unavailable';
type EmailStage = 'input' | 'sendingOtp' | 'otpSent' | 'verifying' | 'verified';

interface FormErrors {
  academyName?: string;
  adminName?: string;
  email?: string;
  otp?: string;
  studentIdPrefix?: string;
  teacherIdPrefix?: string;
}

// Minimal navigation shape so this file doesn't need to import your full
// RootStack param list. Swap this for your actual typed navigation prop,
// e.g. NativeStackScreenProps<RootStackParamList, 'CreateAcademy'>.
interface CreateAcademyNavigation {
  navigate: (screen: 'Login') => void;
  reset: (state: { index: number; routes: { name: 'Login' }[] }) => void;
}

interface CreateAcademyScreenProps {
  navigation?: CreateAcademyNavigation;
  onCreateAcademy?: (data: {
    academyName: string;
    adminName: string;
    email: string;
    studentIdPrefix: string;
    teacherIdPrefix: string;
  }) => Promise<boolean> | boolean | void;
  // Replace these with real API calls (RTK Query mutations, etc.)
  sendOtp?: (email: string) => Promise<boolean>;
  verifyOtp?: (email: string, otp: string) => Promise<boolean>;
  checkPrefixAvailability?: (
    prefix: string,
    type: 'student' | 'teacher',
  ) => Promise<boolean>;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PREFIX_REGEX = /^[A-Z]{2}$/;

const CreateAcademyScreen: React.FC<CreateAcademyScreenProps> = ({
  navigation,
  onCreateAcademy,
  sendOtp,
  verifyOtp,
  checkPrefixAvailability,
}) => {
  const [academyName, setAcademyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [studentIdPrefix, setStudentIdPrefix] = useState('');
  const [teacherIdPrefix, setTeacherIdPrefix] = useState('');

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [emailStage, setEmailStage] = useState<EmailStage>('input');
  const [studentPrefixStatus, setStudentPrefixStatus] =
    useState<PrefixStatus>('idle');
  const [teacherPrefixStatus, setTeacherPrefixStatus] =
    useState<PrefixStatus>('idle');

  const setError = (field: keyof FormErrors, message?: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  };

  // ---------- Field-level validation ----------
  const validateAcademyName = (value: string) => {
    if (!value.trim()) {
      setError('academyName', 'Academy name is required');
      return false;
    }
    if (value.trim().length < 3) {
      setError('academyName', 'Academy name must be at least 3 characters');
      return false;
    }
    setError('academyName', undefined);
    return true;
  };

  const validateAdminName = (value: string) => {
    if (!value.trim()) {
      setError('adminName', 'Admin name is required');
      return false;
    }
    if (!/^[a-zA-Z\s.'-]+$/.test(value.trim())) {
      setError('adminName', 'Enter a valid name (letters only)');
      return false;
    }
    setError('adminName', undefined);
    return true;
  };

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      setError('email', 'Email address is required');
      return false;
    }
    if (!EMAIL_REGEX.test(value.trim())) {
      setError('email', 'Enter a valid email address');
      return false;
    }
    setError('email', undefined);
    return true;
  };

  const validateOtp = (value: string) => {
    if (!value.trim()) {
      setError('otp', 'Enter the OTP sent to your email');
      return false;
    }
    if (!/^\d{6}$/.test(value.trim())) {
      setError('otp', 'OTP must be 6 digits');
      return false;
    }
    setError('otp', undefined);
    return true;
  };

  const validatePrefix = (
    value: string,
    field: 'studentIdPrefix' | 'teacherIdPrefix',
  ) => {
    if (!value.trim()) {
      setError(field, 'Prefix is required');
      return false;
    }
    if (!PREFIX_REGEX.test(value.trim())) {
      setError(field, 'Must be exactly 2 letters (A-Z)');
      return false;
    }
    setError(field, undefined);
    return true;
  };

  // ---------- Email verification flow ----------
  const handleSendOtp = async () => {
    if (!validateEmail(email)) return;
    setEmailStage('sendingOtp');
    try {
      const sent = sendOtp
        ? await sendOtp(email)
        : await new Promise<boolean>(res => setTimeout(() => res(true), 800));
      if (sent) {
        setEmailStage('otpSent');
        setError('email', undefined);
      } else {
        setEmailStage('input');
        setError('email', 'Could not send OTP. Try again.');
      }
    } catch {
      setEmailStage('input');
      setError('email', 'Something went wrong sending the OTP');
    }
  };

  const handleVerifyOtp = async () => {
    if (!validateOtp(otp)) return;
    setEmailStage('verifying');
    try {
      const verified = verifyOtp
        ? await verifyOtp(email, otp)
        : await new Promise<boolean>(res =>
            setTimeout(() => res(otp.length === 6), 800),
          );
      if (verified) {
        setEmailStage('verified');
        setError('otp', undefined);
      } else {
        setEmailStage('otpSent');
        setError('otp', 'Incorrect OTP. Please try again.');
      }
    } catch {
      setEmailStage('otpSent');
      setError('otp', 'Something went wrong verifying the OTP');
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailStage !== 'input') {
      setEmailStage('input');
      setOtp('');
    }
    if (errors.email) setError('email', undefined);
  };

  // ---------- Prefix availability flow ----------
  const handleCheckPrefix = async (type: 'student' | 'teacher') => {
    const value = type === 'student' ? studentIdPrefix : teacherIdPrefix;
    const field = type === 'student' ? 'studentIdPrefix' : 'teacherIdPrefix';
    const setStatus =
      type === 'student' ? setStudentPrefixStatus : setTeacherPrefixStatus;

    if (!validatePrefix(value, field)) {
      setStatus('idle');
      return;
    }

    setStatus('checking');
    try {
      const available = checkPrefixAvailability
        ? await checkPrefixAvailability(value, type)
        : await new Promise<boolean>(res =>
            setTimeout(
              () => res(!['JJ', 'AB'].includes(value.toUpperCase())),
              700,
            ),
          );
      setStatus(available ? 'available' : 'unavailable');
      setError(
        field,
        available
          ? undefined
          : 'This prefix is already taken. Try a different one.',
      );
    } catch {
      setStatus('idle');
      setError(field, 'Could not check availability. Try again.');
    }
  };

  const handleStudentPrefixChange = (text: string) => {
    setStudentIdPrefix(text.toUpperCase().slice(0, 2));
    setStudentPrefixStatus('idle');
    if (errors.studentIdPrefix) setError('studentIdPrefix', undefined);
  };

  const handleTeacherPrefixChange = (text: string) => {
    setTeacherIdPrefix(text.toUpperCase().slice(0, 2));
    setTeacherPrefixStatus('idle');
    if (errors.teacherIdPrefix) setError('teacherIdPrefix', undefined);
  };

  // ---------- Submit ----------
  const handleCreateAcademy = async () => {
    const validAcademyName = validateAcademyName(academyName);
    const validAdminName = validateAdminName(adminName);
    const validEmail = validateEmail(email);
    const validStudentPrefix = validatePrefix(
      studentIdPrefix,
      'studentIdPrefix',
    );
    const validTeacherPrefix = validatePrefix(
      teacherIdPrefix,
      'teacherIdPrefix',
    );

    if (emailStage !== 'verified') {
      setError('email', 'Please verify your email before continuing');
      return;
    }
    if (studentPrefixStatus !== 'available') {
      setError(
        'studentIdPrefix',
        'Please check availability before continuing',
      );
      return;
    }
    if (teacherPrefixStatus !== 'available') {
      setError(
        'teacherIdPrefix',
        'Please check availability before continuing',
      );
      return;
    }
    if (
      !validAcademyName ||
      !validAdminName ||
      !validEmail ||
      !validStudentPrefix ||
      !validTeacherPrefix
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      // If onCreateAcademy returns false, treat it as a failed submission
      // (e.g. the backend rejected it) and stay on this screen.
      const result = await onCreateAcademy?.({
        academyName,
        adminName,
        email,
        studentIdPrefix,
        teacherIdPrefix,
      });

      if (result === false) {
        setError('academyName', 'Could not create academy. Please try again.');
        return;
      }

      // Success — send them back to Login so they can sign in to the
      // academy they just created.
      if (navigation?.reset) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      } else {
        navigation?.navigate('Login');
      }
    } catch {
      setError(
        'academyName',
        'Something went wrong creating your academy. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormReady =
    !!academyName.trim() &&
    !!adminName.trim() &&
    emailStage === 'verified' &&
    studentPrefixStatus === 'available' &&
    teacherPrefixStatus === 'available';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Ignite a New{'\n'}Learning Space</Text>
        <Text style={styles.subtitle}>
          Set up your new Abacus Academy environment. This will create a
          dedicated instance for your students and teachers.
        </Text>

        {/* Academy Identity Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Academy Identity</Text>

          <Text style={styles.label}>Academy Name</Text>
          <TextInput
            style={[styles.input, errors.academyName && styles.inputError]}
            placeholder="e.g. Abacus Heights Intematik"
            placeholderTextColor={COLORS.textMuted}
            value={academyName}
            onChangeText={v => {
              setAcademyName(v);
              if (errors.academyName) validateAcademyName(v);
            }}
            onBlur={() => validateAcademyName(academyName)}
          />
          {!!errors.academyName && (
            <Text style={styles.errorText}>{errors.academyName}</Text>
          )}

          <Text style={styles.label}>Admin Name</Text>
          <TextInput
            style={[styles.input, errors.adminName && styles.inputError]}
            placeholder="Full legal name"
            placeholderTextColor={COLORS.textMuted}
            value={adminName}
            onChangeText={v => {
              setAdminName(v);
              if (errors.adminName) validateAdminName(v);
            }}
            onBlur={() => validateAdminName(adminName)}
          />
          {!!errors.adminName && (
            <Text style={styles.errorText}>{errors.adminName}</Text>
          )}

          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inlineRow}>
            <TextInput
              style={[
                styles.input,
                styles.inlineInput,
                errors.email && styles.inputError,
                emailStage === 'verified' && styles.inputVerified,
              ]}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={
                emailStage !== 'sendingOtp' && emailStage !== 'verified'
              }
            />
            {emailStage === 'verified' ? (
              <View style={styles.verifiedBadge}>
                <MaterialIcons
                  name="check-circle"
                  size={18}
                  color={COLORS.success}
                />
                <Text style={styles.verifiedBadgeText}>Verified</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.inlineButton,
                  emailStage === 'sendingOtp' && styles.inlineButtonDisabled,
                ]}
                onPress={handleSendOtp}
                disabled={emailStage === 'sendingOtp'}
                activeOpacity={0.8}
              >
                {emailStage === 'sendingOtp' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.inlineButtonText}>
                    {emailStage === 'otpSent' ? 'Resend' : 'Verify'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
          {!!errors.email && (
            <Text style={styles.errorText}>{errors.email}</Text>
          )}

          {(emailStage === 'otpSent' || emailStage === 'verifying') && (
            <>
              <Text style={styles.label}>Enter OTP</Text>
              <View style={styles.inlineRow}>
                <TextInput
                  style={[
                    styles.input,
                    styles.inlineInput,
                    errors.otp && styles.inputError,
                  ]}
                  placeholder="6-digit code"
                  placeholderTextColor={COLORS.textMuted}
                  value={otp}
                  onChangeText={v => {
                    setOtp(v.replace(/[^0-9]/g, '').slice(0, 6));
                    if (errors.otp) setError('otp', undefined);
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={emailStage !== 'verifying'}
                />
                <TouchableOpacity
                  style={[
                    styles.inlineButton,
                    emailStage === 'verifying' && styles.inlineButtonDisabled,
                  ]}
                  onPress={handleVerifyOtp}
                  disabled={emailStage === 'verifying'}
                  activeOpacity={0.8}
                >
                  {emailStage === 'verifying' ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.inlineButtonText}>Confirm</Text>
                  )}
                </TouchableOpacity>
              </View>
              {!!errors.otp && (
                <Text style={styles.errorText}>{errors.otp}</Text>
              )}
              <Text style={styles.helperTextSmall}>
                We sent a code to {email || 'your email'}
              </Text>
            </>
          )}
        </View>

        {/* Academy Brand Logo Card */}
        {/* <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Academy Brand Logo</Text>
              <Text style={styles.helperText}>
                Upload a high-resolution logo (PNG/SVG) to customize the student
                dashboard.
              </Text>
            </View>
            <TouchableOpacity style={styles.logoUploadBox} activeOpacity={0.7}>
              <MaterialIcons
                name="cloud-upload"
                size={22}
                color={COLORS.logoAccent}
              />
            </TouchableOpacity>
          </View>
        </View> */}

        {/* Identity System Card */}
        <View style={[styles.card, styles.idSystemCard]}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Identity System</Text>
            <View style={styles.idIconBadge}>
              <MaterialIcons name="badge" size={16} color={COLORS.idAccent} />
            </View>
          </View>
          <Text style={styles.helperText}>
            Define how your student and teacher IDs will be generated across the
            platform. This cannot be changed later.
          </Text>

          <Text style={styles.label}>Student ID Prefix</Text>
          <View style={styles.inlineRow}>
            <TextInput
              style={[
                styles.input,
                styles.inlineInput,
                errors.studentIdPrefix && styles.inputError,
              ]}
              placeholder="e.g. JJ"
              placeholderTextColor={COLORS.textMuted}
              value={studentIdPrefix}
              onChangeText={handleStudentPrefixChange}
              autoCapitalize="characters"
              maxLength={2}
            />
            <TouchableOpacity
              style={[
                styles.inlineButton,
                studentPrefixStatus === 'checking' &&
                  styles.inlineButtonDisabled,
              ]}
              onPress={() => handleCheckPrefix('student')}
              disabled={studentPrefixStatus === 'checking'}
              activeOpacity={0.8}
            >
              {studentPrefixStatus === 'checking' ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.inlineButtonText}>Check</Text>
              )}
            </TouchableOpacity>
          </View>
          {!!errors.studentIdPrefix && (
            <Text style={styles.errorText}>{errors.studentIdPrefix}</Text>
          )}
          {studentPrefixStatus === 'available' && (
            <View style={styles.statusRow}>
              <MaterialIcons
                name="check-circle"
                size={14}
                color={COLORS.success}
              />
              <Text style={styles.statusAvailableText}>
                "{studentIdPrefix}" is available
              </Text>
            </View>
          )}
          {studentPrefixStatus === 'unavailable' && (
            <View style={styles.statusRow}>
              <MaterialIcons name="cancel" size={14} color={COLORS.errorText} />
              <Text style={styles.statusUnavailableText}>
                "{studentIdPrefix}" is taken — please choose another
              </Text>
            </View>
          )}

          <Text style={styles.label}>Teacher ID Prefix</Text>
          <View style={styles.inlineRow}>
            <TextInput
              style={[
                styles.input,
                styles.inlineInput,
                errors.teacherIdPrefix && styles.inputError,
              ]}
              placeholder="e.g. JW"
              placeholderTextColor={COLORS.textMuted}
              value={teacherIdPrefix}
              onChangeText={handleTeacherPrefixChange}
              autoCapitalize="characters"
              maxLength={2}
            />
            <TouchableOpacity
              style={[
                styles.inlineButton,
                teacherPrefixStatus === 'checking' &&
                  styles.inlineButtonDisabled,
              ]}
              onPress={() => handleCheckPrefix('teacher')}
              disabled={teacherPrefixStatus === 'checking'}
              activeOpacity={0.8}
            >
              {teacherPrefixStatus === 'checking' ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.inlineButtonText}>Check</Text>
              )}
            </TouchableOpacity>
          </View>
          {!!errors.teacherIdPrefix && (
            <Text style={styles.errorText}>{errors.teacherIdPrefix}</Text>
          )}
          {teacherPrefixStatus === 'available' && (
            <View style={styles.statusRow}>
              <MaterialIcons
                name="check-circle"
                size={14}
                color={COLORS.success}
              />
              <Text style={styles.statusAvailableText}>
                "{teacherIdPrefix}" is available
              </Text>
            </View>
          )}
          {teacherPrefixStatus === 'unavailable' && (
            <View style={styles.statusRow}>
              <MaterialIcons name="cancel" size={14} color={COLORS.errorText} />
              <Text style={styles.statusUnavailableText}>
                "{teacherIdPrefix}" is taken — please choose another
              </Text>
            </View>
          )}

          <View style={styles.previewRow}>
            <View style={styles.previewPill}>
              <Text style={styles.previewLabel}>PREVIEW</Text>
            </View>
            <Text style={styles.previewValue}>
              {studentIdPrefix || 'JJ'}0001{'   '}
              {teacherIdPrefix || 'JW'}0001
            </Text>
          </View>
          <View style={styles.previewCaptionRow}>
            <Text style={styles.previewCaption}>STUDENT ID</Text>
            <Text style={styles.previewCaption}>TEACHER ID</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.createButton,
            (!isFormReady || isSubmitting) && styles.createButtonDisabled,
          ]}
          activeOpacity={0.85}
          onPress={handleCreateAcademy}
          disabled={!isFormReady || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.createButtonText}>Create Academy</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By clicking "Create Academy", you agree to
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  idSystemCard: { backgroundColor: '#FFFBF5' },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginBottom: 12,
  },
  helperTextSmall: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: -6,
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    backgroundColor: COLORS.inputErrorBg,
    borderColor: COLORS.errorBorder,
  },
  inputVerified: { borderColor: COLORS.success },
  errorText: {
    fontSize: 11.5,
    color: COLORS.errorText,
    marginBottom: 10,
    marginTop: 1,
  },
  inlineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  inlineInput: { flex: 1, marginBottom: 0 },
  inlineButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 76,
  },
  inlineButtonDisabled: { backgroundColor: COLORS.primaryDisabled },
  inlineButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    gap: 4,
  },
  verifiedBadgeText: {
    color: COLORS.success,
    fontSize: 12.5,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
    marginTop: -2,
  },
  statusAvailableText: {
    fontSize: 11.5,
    color: COLORS.success,
    fontWeight: '600',
  },
  statusUnavailableText: {
    fontSize: 11.5,
    color: COLORS.errorText,
    fontWeight: '600',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoUploadBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.logoBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  idIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.idBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  previewPill: {
    backgroundColor: COLORS.idBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 10,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.idAccent,
    letterSpacing: 0.5,
  },
  previewValue: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  previewCaptionRow: { flexDirection: 'row', marginTop: 4, paddingLeft: 76 },
  previewCaption: {
    fontSize: 9,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginRight: 40,
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  createButtonDisabled: { backgroundColor: COLORS.primaryDisabled },
  createButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  disclaimer: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 10,
  },
});

export default CreateAcademyScreen;
