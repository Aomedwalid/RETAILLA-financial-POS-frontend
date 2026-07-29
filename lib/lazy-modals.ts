import dynamic from "next/dynamic";

export const DynamicCreateVendorModal = dynamic(
  () => import("@/features/vendors/components/CreateVendorModal"),
  { ssr: false }
);

export const DynamicVendorDetailPanel = dynamic(
  () => import("@/features/vendors/components/VendorDetailPanel"),
  { ssr: false }
);

export const DynamicReceiptIngestionModal = dynamic(
  () => import("@/features/vendors/components/ReceiptIngestionModal"),
  { ssr: false }
);

export const DynamicCreateBillModal = dynamic(
  () => import("@/features/vendors/components/CreateBillModal"),
  { ssr: false }
);

export const DynamicCreatePurchaseOrderModal = dynamic(
  () => import("@/features/vendors/components/CreatePurchaseOrderModal"),
  { ssr: false }
);

export const DynamicPayBillModal = dynamic(
  () => import("@/features/vendors/components/PayBillModal"),
  { ssr: false }
);

export const DynamicOutstandingBillsWidget = dynamic(
  () => import("@/features/vendors/components/OutstandingBillsWidget"),
  { ssr: false }
);

export const DynamicPendingReceiptBubble = dynamic(
  () => import("@/features/vendors/components/PendingReceiptBubble"),
  { ssr: false }
);

export const DynamicCustomerForm = dynamic(
  () => import("@/features/customers/components/CustomerForm"),
  { ssr: false }
);

export const DynamicCustomerDetailsModal = dynamic(
  () => import("@/features/customers/components/CustomerDetailsModal"),
  { ssr: false }
);

export const DynamicProductForm = dynamic(
  () => import("@/features/products/components/ProductForm"),
  { ssr: false }
);

export const DynamicProductDetailsModal = dynamic(
  () => import("@/features/products/components/ProductDetailsModal"),
  { ssr: false }
);

export const DynamicCreateBudgetModal = dynamic(
  () => import("@/features/budgets/components/CreateBudgetModal"),
  { ssr: false }
);

export const DynamicDeactivateBudgetDialog = dynamic(
  () => import("@/features/budgets/components/DeactivateBudgetDialog"),
  { ssr: false }
);

export const DynamicCheckoutDialog = dynamic(
  () => import("@/features/pos/components/CheckoutDialog"),
  { ssr: false }
);

export const DynamicOrdersTab = dynamic(
  () => import("@/features/pos/components/OrdersTab"),
  { ssr: false }
);
