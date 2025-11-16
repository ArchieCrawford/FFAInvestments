-- Member Data Database Schema
-- This file contains all the SQL commands to create tables for permanent member data storage

-- Members Table - Basic member information
CREATE TABLE IF NOT EXISTS members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_name VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(50),
    join_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Member Dues Table - Track payment history and status
CREATE TABLE IF NOT EXISTS member_dues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    payment_status VARCHAR(50) NOT NULL, -- 'Credit Balance', 'Owes Money', 'Current'
    latest_amount_owed DECIMAL(12, 2) DEFAULT 0,
    total_payments DECIMAL(12, 2) DEFAULT 0,
    total_contribution DECIMAL(12, 2) DEFAULT 0,
    last_payment_date DATE,
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Member Unit Values Table - Track individual member unit holdings
CREATE TABLE IF NOT EXISTS member_unit_values (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    unit_value DECIMAL(12, 4) NOT NULL,
    total_units DECIMAL(12, 4) DEFAULT 0,
    total_value DECIMAL(12, 2) DEFAULT 0,
    valuation_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(member_id, valuation_date)
);

-- Member Personal Data Table - Extended member information
CREATE TABLE IF NOT EXISTS member_personal_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE UNIQUE,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    date_of_birth DATE,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    investment_experience VARCHAR(100),
    risk_tolerance VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Member Portfolio Data Table - Track individual holdings and performance
CREATE TABLE IF NOT EXISTS member_portfolio_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    company_name VARCHAR(255),
    shares DECIMAL(12, 4) DEFAULT 0,
    purchase_price DECIMAL(12, 4),
    current_price DECIMAL(12, 4),
    market_value DECIMAL(12, 2),
    gain_loss DECIMAL(12, 2),
    gain_loss_percent DECIMAL(8, 4),
    purchase_date DATE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Club Values Table - Track overall club performance and metrics
CREATE TABLE IF NOT EXISTS club_values (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    valuation_date DATE NOT NULL UNIQUE,
    total_club_value DECIMAL(15, 2) NOT NULL,
    unit_value DECIMAL(12, 4) NOT NULL,
    total_units_outstanding DECIMAL(12, 4) NOT NULL,
    total_cash DECIMAL(12, 2) DEFAULT 0,
    total_investments DECIMAL(12, 2) DEFAULT 0,
    monthly_return_percent DECIMAL(8, 4),
    ytd_return_percent DECIMAL(8, 4),
    total_members INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment History Table - Detailed payment tracking
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    payment_type VARCHAR(50) NOT NULL, -- 'Monthly Dues', 'Initial Investment', 'Additional Contribution', 'Withdrawal'
    payment_method VARCHAR(50), -- 'Cash', 'Check', 'Bank Transfer', 'Online'
    payment_date DATE NOT NULL,
    description TEXT,
    processed_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_member_dues_member_id ON member_dues(member_id);
CREATE INDEX IF NOT EXISTS idx_member_dues_status ON member_dues(payment_status);
CREATE INDEX IF NOT EXISTS idx_member_unit_values_member_id ON member_unit_values(member_id);
CREATE INDEX IF NOT EXISTS idx_member_unit_values_date ON member_unit_values(valuation_date);
CREATE INDEX IF NOT EXISTS idx_member_portfolio_member_id ON member_portfolio_data(member_id);
CREATE INDEX IF NOT EXISTS idx_member_portfolio_symbol ON member_portfolio_data(symbol);
CREATE INDEX IF NOT EXISTS idx_club_values_date ON club_values(valuation_date);
CREATE INDEX IF NOT EXISTS idx_payment_history_member_id ON payment_history(member_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_date ON payment_history(payment_date);

-- Row Level Security (RLS) Policies
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_dues ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_unit_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_personal_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_portfolio_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (adjust based on your authentication needs)
CREATE POLICY "Users can view all member data" ON members FOR SELECT USING (true);
CREATE POLICY "Users can view all dues data" ON member_dues FOR SELECT USING (true);
CREATE POLICY "Users can view all unit values" ON member_unit_values FOR SELECT USING (true);
CREATE POLICY "Users can view all personal data" ON member_personal_data FOR SELECT USING (true);
CREATE POLICY "Users can view all portfolio data" ON member_portfolio_data FOR SELECT USING (true);
CREATE POLICY "Users can view all club values" ON club_values FOR SELECT USING (true);
CREATE POLICY "Users can view all payment history" ON payment_history FOR SELECT USING (true);

-- Admin policies (modify based on your role system)
CREATE POLICY "Admins can manage members" ON members FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can manage dues" ON member_dues FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can manage unit values" ON member_unit_values FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can manage personal data" ON member_personal_data FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can manage portfolio data" ON member_portfolio_data FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can manage club values" ON club_values FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can manage payment history" ON payment_history FOR ALL USING (auth.jwt() ->> 'role' = 'admin');