const pool = require('../config/db');

async function migrate() {
    try {
        // Add verification columns to voters table
        await pool.query(`
            ALTER TABLE voters
            ADD COLUMN IF NOT EXISTS id_card_path TEXT,
            ADD COLUMN IF NOT EXISTS face_image_path TEXT,
            ADD COLUMN IF NOT EXISTS biometric_verified BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS verification_level INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN DEFAULT FALSE
        `);

        // Add OTP columns to users table (may already exist)
        await pool.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6),
            ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ
        `);

        console.log('✅ Verification migration completed successfully');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrate();
