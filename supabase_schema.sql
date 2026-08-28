-- ==============================================================================
-- COUNTERPOINT POS BILLING SYSTEM - SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Run this complete script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Products / Catalog Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barcode VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    stock INTEGER NOT NULL DEFAULT 100,
    category VARCHAR(100) DEFAULT 'General',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial catalog products
INSERT INTO public.products (barcode, name, price, stock, category)
VALUES
    ('8901030000001', 'Tata Salt 1kg', 28.00, 150, 'Groceries'),
    ('8901030000002', 'Amul Butter 100g', 44.00, 80, 'Dairy'),
    ('8901030000003', 'Aashirvaad Atta 5kg', 275.00, 45, 'Staples'),
    ('8901030000004', 'Parle-G Biscuit 250g', 30.00, 200, 'Snacks'),
    ('8901030000005', 'Fortune Sunflower Oil 1L', 160.00, 60, 'Oils'),
    ('8901030000006', 'Dettol Soap 75g', 36.00, 120, 'Personal Care')
ON CONFLICT (barcode) DO UPDATE
SET name = EXCLUDED.name, price = EXCLUDED.price;

-- 3. Create Sales / Invoices Table
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice VARCHAR(64) UNIQUE NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total NUMERIC(10, 2) NOT NULL,
    method VARCHAR(32) NOT NULL, -- 'Cash', 'UPI', 'Split', 'Cash Refund'
    cash_amount NUMERIC(10, 2) DEFAULT 0.00,
    upi_amount NUMERIC(10, 2) DEFAULT 0.00,
    received NUMERIC(10, 2),
    change NUMERIC(10, 2),
    is_return BOOLEAN DEFAULT FALSE,
    original_invoice VARCHAR(64),
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    employee_id VARCHAR(64) DEFAULT 'Cashier',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast lookups & timeline queries
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON public.sales (invoice);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales (date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_method ON public.sales (method);

-- 4. Create Shifts / Register Closing Table
CREATE TABLE IF NOT EXISTS public.shifts (
    id VARCHAR(64) PRIMARY KEY,
    employee VARCHAR(64) NOT NULL,
    closed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    opening_float NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    cash_sales NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    cash_transactions INTEGER NOT NULL DEFAULT 0,
    split_transactions INTEGER DEFAULT 0,
    cash_refunds NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    cash_refund_transactions INTEGER NOT NULL DEFAULT 0,
    upi_sales NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    upi_transactions INTEGER NOT NULL DEFAULT 0,
    gross_revenue NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    expected_cash NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    actual_cash NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discrepancy NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_transactions INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shifts_closed_at ON public.shifts (closed_at DESC);

-- 5. Enable Row-Level Security (RLS) & Public / Anon Access Policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- Allow read & write for POS terminals using Anon Key
CREATE POLICY "Allow public read on products" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert/update on products" ON public.products
    FOR ALL USING (true);

CREATE POLICY "Allow public read on sales" ON public.sales
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert/update on sales" ON public.sales
    FOR ALL USING (true);

CREATE POLICY "Allow public read on shifts" ON public.shifts
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert/update on shifts" ON public.shifts
    FOR ALL USING (true);

