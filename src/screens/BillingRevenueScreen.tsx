import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useDispatch } from 'react-redux';
import RazorpayCheckout from 'react-native-razorpay';

import { setModal } from '../store/slices';
import {
  OrderResponse,
  useCreateOrderMutation,
  useAddPaymentStatusMutation,
  useGetOrgDetailQuery,
  useBillingListQuery,
} from '../store/api';
import { AdminHeader, LoadingOverlay } from '../component';
import { convertDateFormat } from '../util';

export default function BillingRevenueScreen() {
  const [createOrder, { isLoading: createOrderLoading }] =
    useCreateOrderMutation();
  const [addPaymentStatus] = useAddPaymentStatusMutation();
  const { data: { orgDetail } = {}, isLoading } = useGetOrgDetailQuery(null);
  const { data: { payments = [] } = {}, isLoading: paymentListLoading } =
    useBillingListQuery(null);

  const dispatch = useDispatch();

  const paymentInitiate = async (options: any) => {
    try {
      const data = await RazorpayCheckout.open(options);
      await addPaymentStatus(data);
      dispatch(
        setModal({
          state: 'success',
          visible: true,
          title: 'Payment Successful',
          description: 'Your payment has been completed successfully.',
        }),
      );
    } catch (error) {
      console.error('error', error);
      dispatch(
        setModal({
          state: 'failure',
          visible: true,
          title: 'Network Error',
          description:
            'Please try again later. If your account has been debited, the amount will be refunded.',
        }),
      );
    }
  };

  const paymentClick = async () => {
    try {
      const orderDetail: OrderResponse = await createOrder(null).unwrap();

      const options = {
        description: 'Credits towards consultation',
        image: 'https://i.imgur.com/3g7nmJC.jpg',
        currency: orderDetail.currency,
        key: orderDetail.keyId,
        amount: orderDetail.amount,
        name: 'Acme Corp',
        order_id: orderDetail.id,
        prefill: {
          email: 'sreeananthakannan@email.com',
          name: 'Sree Kannan',
        },
        theme: { color: '#53a20e' },
      };
      paymentInitiate(options);
    } catch (error) {
      console.error('error', error);
      dispatch(
        setModal({
          state: 'failure',
          visible: true,
          title: 'Network Error',
          description: 'Something went wrong, Please try again later...',
        }),
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AdminHeader header="Payments & Invoices" />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        {/* <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>ADMIN DASHBOARD</Text>
        <Text style={styles.heroTitle}>Payments & Invoices</Text>
        <Text style={styles.heroSubtitle}>
          Manage your academy's financial ecosystem with precision and tactile
          ease.
        </Text>
      </View> */}

        {/* Total due card */}
        <View style={styles.card}>
          <Text style={styles.label}>TOTAL AMOUNT DUE</Text>
          <Text style={styles.amountDue} numberOfLines={1} adjustsFontSizeToFit>
            ₹ {orgDetail?.amount}
          </Text>

          <View style={styles.dueBadge}>
            <Text style={styles.dueBadgeText}>
              📅 Due by {convertDateFormat(orgDetail?.dueDate)}
            </Text>
          </View>

          <TouchableOpacity
            onPress={paymentClick}
            style={
              orgDetail?.paymentEnable
                ? styles.payButton
                : styles.payButtonDisable
            }
            disabled={!orgDetail?.paymentEnable}
            activeOpacity={0.85}
          >
            <Text style={styles.payButtonText}>Pay Now</Text>
            <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>BILL GENERATED ON</Text>
            <Text style={styles.metaValue}>
              {convertDateFormat(orgDetail?.billGeneratedDate)}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>BILLING CYCLE</Text>
            <Text style={styles.metaValue}>
              {convertDateFormat(orgDetail?.billCycle?.from)} {` `}- {` `}
              {convertDateFormat(orgDetail?.billCycle?.to)}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Bill generated process</Text>
            <Text style={styles.metaLabel}>
              On {convertDateFormat(orgDetail?.billGeneratedDate)}, however many
              students there were on that date that's the count we use for the
              calculation.
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Contact</Text>
            <Text style={styles.metaLabel}>{orgDetail?.appEmailId}</Text>
          </View>
        </View>

        {/* Stat cards */}
        <View style={styles.statCard}>
          <View>
            <Text style={styles.statLabel}>TOTAL STUDENTS</Text>
            <Text style={styles.statValue}>
              {orgDetail?.totalStudentOnBillDate}
            </Text>
          </View>
          <View style={styles.statIconCircleBlue}>
            <MaterialIcons name="people" size={22} color="#1E3A8A" />
          </View>
        </View>

        <View style={styles.statCard}>
          <View>
            <Text style={styles.statLabel}>PRICE PER STUDENT</Text>
            <Text style={styles.statValueBrown}>
              ₹{orgDetail?.pricePerStudent}
            </Text>
          </View>
          <View style={styles.statIconCircleOrange}>
            <MaterialIcons name="savings" size={22} color="#B45309" />
          </View>
        </View>

        {/* Auto-pay banner */}
        {/* <View style={styles.autoPayCard}>
        <View style={styles.autoPayIcon}>
          <MaterialIcons name="check-circle" size={18} color="#2563EB" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.autoPayTitle}>Auto-pay Enabled</Text>
          <Text style={styles.autoPaySubtitle}>
            Next automatic deduction will occur on Oct 25 via Visa ending in
            4421.
          </Text>
        </View>
      </View> */}

        {/* Billing history */}
        {/* <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Billing History</Text>
        <TouchableOpacity style={styles.downloadAll} activeOpacity={0.7}>
          <Text style={styles.downloadAllText}>Download All</Text>
          <MaterialIcons name="file-download" size={16} color="#2563EB" />
        </TouchableOpacity>
      </View> */}

        <View style={styles.tableCard}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderText, { flex: 1.3 }]}>STATUS</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>
              BILLING DATE
            </Text>
            <Text
              style={[
                styles.tableHeaderText,
                { flex: 0.9, textAlign: 'right' },
              ]}
            >
              AMOUNT
            </Text>
          </View>

          {payments.map((row, index) => (
            <View
              key={row.orderId}
              style={[
                styles.tableRow,
                index === payments.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View
                style={{
                  flex: 1.3,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View style={styles.fileIcon}>
                  <MaterialIcons name="description" size={16} color="#2563EB" />
                </View>
                <Text style={styles.invoiceId}>{row.status}</Text>
              </View>
              <Text style={[styles.billingDate, { flex: 1 }]}>
                {convertDateFormat(row.createdAt)}
              </Text>
              <Text
                style={[styles.amountPaid, { flex: 0.9, textAlign: 'right' }]}
              >
                ₹{row.amount}
              </Text>
            </View>
          ))}
        </View>

        <LoadingOverlay
          visible={isLoading || paymentListLoading || createOrderLoading}
        />

        {/* <TouchableOpacity style={styles.viewMoreButton} activeOpacity={0.7}>
        <Text style={styles.viewMoreText}>View More History</Text>
        <MaterialIcons name="keyboard-arrow-down" size={18} color="#111827" />
      </TouchableOpacity> */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  content: {
    paddingHorizontal: 16,
    // paddingTop: 16,
    paddingBottom: 32,
  },

  heroCard: {
    backgroundColor: '#DCE7FB',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#3B5C9A',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 34,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#4B5A78',
    lineHeight: 20,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    paddingBottom: 6,
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  amountDue: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  dueBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FDECEC',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
  },
  dueBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C0392B',
  },
  payButton: {
    flexDirection: 'row',
    backgroundColor: '#0F2E5A',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  payButtonDisable: {
    flexDirection: 'row',
    backgroundColor: '#D1D5DB',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF1F5',
    marginBottom: 16,
  },
  metaRow: {
    marginBottom: 14,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },

  statCard: {
    backgroundColor: '#EEF3FB',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#6B7A99',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  statValueBrown: {
    fontSize: 26,
    fontWeight: '800',
    color: '#7C4A1E',
  },
  statIconCircleBlue: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconCircleOrange: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FCEBD5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  autoPayCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
    padding: 16,
    marginBottom: 24,
  },
  autoPayIcon: {
    marginTop: 2,
  },
  autoPayTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  autoPaySubtitle: {
    fontSize: 12.5,
    color: '#4B5A78',
    lineHeight: 18,
  },

  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  downloadAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  downloadAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },

  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 14,
    marginBottom: 14,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F7',
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: '#9CA3AF',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F7',
  },
  fileIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#EAF1FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  invoiceId: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    flexShrink: 1,
  },
  billingDate: {
    fontSize: 13,
    color: '#4B5A78',
  },
  amountPaid: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },

  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});
