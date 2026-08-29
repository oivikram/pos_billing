import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = () => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes("your-project") &&
    !supabaseAnonKey.includes("your-anon-key")
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export interface DbSale {
  id?: string;
  invoice: string;
  date: string;
  total: number;
  method: string;
  cash_amount?: number;
  upi_amount?: number;
  received?: number;
  change?: number;
  is_return?: boolean;
  original_invoice?: string;
  items?: Array<{ barcode: string; name: string; price: number; quantity: number }>;
  employee_id?: string;
}

export interface DbShift {
  id: string;
  employee: string;
  closed_at: string;
  opening_float: number;
  cash_sales: number;
  cash_transactions: number;
  split_transactions?: number;
  cash_refunds: number;
  cash_refund_transactions: number;
  upi_sales: number;
  upi_transactions: number;
  gross_revenue: number;
  expected_cash: number;
  actual_cash: number;
  discrepancy: number;
  total_transactions: number;
}

export async function syncSaleToSupabase(sale: {
  invoice: string;
  date: string;
  total: number;
  method: string;
  cashAmount?: number;
  upiAmount?: number;
  received?: number;
  change?: number;
  isReturn?: boolean;
  originalInvoice?: string;
  items?: Array<{ barcode: string; name: string; price: number; quantity: number }>;
  employee?: string;
}) {
  if (!supabase) return { success: false, reason: "Supabase not configured" };

  try {
    const payload: DbSale = {
      invoice: sale.invoice,
      date: sale.date,
      total: sale.total,
      method: sale.method,
      cash_amount: sale.cashAmount,
      upi_amount: sale.upiAmount,
      received: sale.received,
      change: sale.change,
      is_return: sale.isReturn || false,
      original_invoice: sale.originalInvoice,
      items: sale.items || [],
      employee_id: sale.employee || "Cashier",
    };

    const { data, error } = await supabase.from("sales").upsert(payload, {
      onConflict: "invoice",
    });

    if (error) {
      console.warn("Supabase sales sync error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.warn("Supabase sales sync exception:", err);
    return { success: false, error: String(err) };
  }
}

export async function fetchSalesFromSupabase() {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      console.warn("Supabase fetch sales error:", error.message);
      return [];
    }

    return (data || []).map((row: DbSale) => ({
      invoice: row.invoice,
      date: row.date,
      total: row.total,
      method: row.method,
      cashAmount: row.cash_amount,
      upiAmount: row.upi_amount,
      received: row.received,
      change: row.change,
      isReturn: row.is_return,
      originalInvoice: row.original_invoice,
      items: row.items || [],
    }));
  } catch (err) {
    console.warn("Supabase fetch sales exception:", err);
    return [];
  }
}

export async function fetchProductsFromSupabase() {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("products")
      .select("barcode, name, price, stock, category")
      .order("name", { ascending: true });

    if (error) {
      console.warn("Supabase fetch products error:", error.message);
      return [];
    }

    return (data || []).map((row: { barcode: string; name: string; price: number; stock?: number; category?: string }) => ({
      barcode: row.barcode,
      name: row.name,
      price: Number(row.price) || 0,
      stock: row.stock,
      category: row.category,
    }));
  } catch (err) {
    console.warn("Supabase fetch products exception:", err);
    return [];
  }
}

export async function syncShiftToSupabase(shift: DbShift) {
  if (!supabase) return { success: false, reason: "Supabase not configured" };

  try {
    const { data, error } = await supabase.from("shifts").upsert(shift, {
      onConflict: "id",
    });

    if (error) {
      console.warn("Supabase shift sync error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.warn("Supabase shift sync exception:", err);
    return { success: false, error: String(err) };
  }
}

export async function authenticateCashier(identifier: string, pass: string) {
  const cleanEmail = identifier.trim().toLowerCase();

  if (supabase) {
    if (!cleanEmail.includes("@")) {
      return {
        success: false,
        error: "Please enter your registered email address (e.g. vikramgirhe07@gmail.com).",
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: pass,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  if (cleanEmail === "vikramgirhe07@gmail.com" && pass.length >= 4) {
    return { success: true };
  }
  return {
    success: false,
    error: "Invalid credentials. Please log in with vikramgirhe07@gmail.com and your password.",
  };
}
