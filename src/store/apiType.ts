type BillingState = 'free' | 'paid';

type OrgDetail = {
  billCycle: {
    from: string;
    to: string;
  };
  billGeneratedDate: string;
  dueDate: string;
  totalStudentOnBillDate: number;
  paymentEnable: boolean;
  pricePerStudent: number;
  amount: number;
  state: BillingState;
  appEmailId: string;
};

export type OrgDetailResult = {
  orgDetail: OrgDetail;
};

type Payments = {
  orderId: string;
  amount: string;
  status: string;
  createdAt: string;
};

export type paymentListResult = {
  payments: Payments[];
};
