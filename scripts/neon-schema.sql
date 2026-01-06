-- Memory Safe Guard - Neon Database Schema
-- PostgreSQL schema cho password management system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (cho future authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Passwords table - Main storage cho password entries
CREATE TABLE IF NOT EXISTS passwords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Password data
    service VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    password TEXT NOT NULL, -- Encrypted password
    url VARCHAR(500),
    notes TEXT,
    
    -- Organization
    folder VARCHAR(100),
    tags TEXT[],
    
    -- Security metadata
    encryption_version INTEGER DEFAULT 1,
    password_strength INTEGER CHECK (password_strength >= 0 AND password_strength <= 100),
    is_compromised BOOLEAN DEFAULT false,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT unique_user_service_username UNIQUE(user_id, service, username)
);

-- Audit logs table cho security tracking
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action details
    action VARCHAR(50) NOT NULL, -- CREATE, READ, UPDATE, DELETE, LOGIN, etc.
    resource_type VARCHAR(50) NOT NULL, -- password, user, etc.
    resource_id UUID,
    
    -- Request metadata
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    
    -- Additional data
    metadata JSONB,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table cho authentication
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Indexes cho performance optimization
-- Passwords table indexes
CREATE INDEX IF NOT EXISTS idx_passwords_user_id ON passwords(user_id);
CREATE INDEX IF NOT EXISTS idx_passwords_service ON passwords(service);
CREATE INDEX IF NOT EXISTS idx_passwords_username ON passwords(username);
CREATE INDEX IF NOT EXISTS idx_passwords_user_service ON passwords(user_id, service);
CREATE INDEX IF NOT EXISTS idx_passwords_updated_at ON passwords(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_passwords_tags ON passwords USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_passwords_folder ON passwords(folder) WHERE folder IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_passwords_expires ON passwords(expires_at) WHERE expires_at IS NOT NULL;

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

-- Triggers cho updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_passwords_updated_at 
    BEFORE UPDATE ON passwords 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Policies cho passwords table
CREATE POLICY passwords_user_policy ON passwords
    FOR ALL TO authenticated
    USING (user_id = auth.uid());

-- Policies cho audit_logs table  
CREATE POLICY audit_logs_user_policy ON audit_logs
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Policies cho user_sessions table
CREATE POLICY sessions_user_policy ON user_sessions
    FOR ALL TO authenticated
    USING (user_id = auth.uid());

-- Views cho common queries
CREATE OR REPLACE VIEW password_stats AS
SELECT 
    user_id,
    COUNT(*) as total_passwords,
    COUNT(*) FILTER (WHERE is_compromised = true) as compromised_count,
    COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at < NOW()) as expired_count,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as recent_count,
    MAX(updated_at) as last_updated
FROM passwords
GROUP BY user_id;

-- Sample data cho development (chỉ khi cần)
-- INSERT INTO users (email, username, password_hash) VALUES 
-- ('demo@example.com', 'demo', '$2b$10$example_hash_here');

-- Cleanup old audit logs (older than 1 year)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-audit-logs', '0 2 * * 0', 'SELECT cleanup_old_audit_logs();');