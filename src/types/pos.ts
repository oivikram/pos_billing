export interface Product {
  barcode: string;
  name: string;
  price: number;
  stock?: number;
  category?: string;
}

export interface Line extends Product {
  quantity: number;
}

export interface Sale {
  invoice: string;
  date: string;
  total: number;
  method: string;
  cashAmount?: number;
  upiAmount?: number;
  received?: number;
  change?: number;
  items?: Line[];
  isReturn?: boolean;
  originalInvoice?: string;
  employee?: string;
}

export interface ShiftSummary {
  id: string;
  employee: string;
  closedAt: string;
  openingFloat: number;
  cashSales: number;
  cashTransactions: number;
  splitTransactions: number;
  cashRefunds: number;
  cashRefundTransactions: number;
  upiSales: number;
  upiTransactions: number;
  grossRevenue: number;
  expectedCash: number;
  actualCash: number;
  discrepancy: number;
  totalTransactions: number;
}

