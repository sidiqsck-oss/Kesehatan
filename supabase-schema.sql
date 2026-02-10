-- =====================================================
-- Supabase SQL Schema untuk Kesehatan Feedlot PWA
-- Paste seluruh kode ini ke Supabase SQL Editor
-- =====================================================

-- Lookup Tables (Dropdown Data)
CREATE TABLE IF NOT EXISTS penanggung_jawab (
    id BIGSERIAL PRIMARY KEY,
    local_id INTEGER,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipments (
    id BIGSERIAL PRIMARY KEY,
    local_id INTEGER,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jenis_pakan (
    id BIGSERIAL PRIMARY KEY,
    local_id INTEGER,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diagnosa (
    id BIGSERIAL PRIMARY KEY,
    local_id INTEGER,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pen_akhir (
    id BIGSERIAL PRIMARY KEY,
    local_id INTEGER,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS antibiotic (
    id BIGSERIAL PRIMARY KEY,
    local_id INTEGER,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS anti_inflamasi (
    id BIGSERIAL PRIMARY KEY,
    local_id INTEGER,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analgesik (
    id BIGSERIAL PRIMARY KEY,
    local_id INTEGER,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supportive (
    id BIGSERIAL PRIMARY KEY,
    local_id INTEGER,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS anti_parasitic (
    id BIGSERIAL PRIMARY KEY,
    local_id INTEGER,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS anti_bloat (
    id BIGSERIAL PRIMARY KEY,
    local_id INTEGER,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS obat_list (
    id BIGSERIAL PRIMARY KEY,
    local_id INTEGER,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS keterangan_moving (
    id BIGSERIAL PRIMARY KEY,
    local_id INTEGER,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Main Data Tables
CREATE TABLE IF NOT EXISTS treatments (
    id BIGSERIAL PRIMARY KEY,
    local_id INTEGER,
    tanggal TEXT,
    pj_id INTEGER,
    shipment_id INTEGER,
    eartag TEXT,
    berat NUMERIC,
    jenis_pakan_id INTEGER,
    treatment_ke INTEGER,
    diagnosa_id INTEGER,
    pen_asal TEXT,
    pen_akhir_id INTEGER,
    obat_antibiotic_id INTEGER,
    obat_antibiotic_dosis TEXT,
    obat_anti_inflamasi_id INTEGER,
    obat_anti_inflamasi_dosis TEXT,
    obat_analgesik_id INTEGER,
    obat_analgesik_dosis TEXT,
    obat_supportive1_id INTEGER,
    obat_supportive1_dosis TEXT,
    obat_supportive2_id INTEGER,
    obat_supportive2_dosis TEXT,
    obat_supportive3_id INTEGER,
    obat_supportive3_dosis TEXT,
    obat_anti_parasitic_id INTEGER,
    obat_anti_parasitic_dosis TEXT,
    obat_anti_bloat_id INTEGER,
    obat_anti_bloat_dosis TEXT,
    treatment_lainnya TEXT,
    foto TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movings (
    id BIGSERIAL PRIMARY KEY,
    local_id INTEGER,
    tanggal TEXT,
    pj_id INTEGER,
    shipment_id INTEGER,
    eartag TEXT,
    keterangan_id INTEGER,
    pen_awal TEXT,
    pen_akhir_id INTEGER,
    foto TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pengambilan_obat (
    id BIGSERIAL PRIMARY KEY,
    local_id INTEGER,
    tanggal TEXT,
    pj_id INTEGER,
    obat_id INTEGER,
    jumlah NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS penambahan_obat (
    id BIGSERIAL PRIMARY KEY,
    local_id INTEGER,
    tanggal TEXT,
    pj_id INTEGER,
    items JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pen_trial_groups (
    id BIGSERIAL PRIMARY KEY,
    local_id INTEGER,
    name TEXT,
    pens JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pen_trial_data (
    id BIGSERIAL PRIMARY KEY,
    local_id INTEGER,
    tanggal TEXT,
    pj_id INTEGER,
    group_id INTEGER,
    pen_number TEXT,
    eartag TEXT,
    shipment_id INTEGER,
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hospital_colors (
    id BIGSERIAL PRIMARY KEY,
    pen_name TEXT UNIQUE,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hospital_notes (
    id BIGSERIAL PRIMARY KEY,
    local_id INTEGER,
    pen_name TEXT,
    eartag TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - semua tabel bisa dibaca/tulis
ALTER TABLE penanggung_jawab ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE jenis_pakan ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosa ENABLE ROW LEVEL SECURITY;
ALTER TABLE pen_akhir ENABLE ROW LEVEL SECURITY;
ALTER TABLE antibiotic ENABLE ROW LEVEL SECURITY;
ALTER TABLE anti_inflamasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE analgesik ENABLE ROW LEVEL SECURITY;
ALTER TABLE supportive ENABLE ROW LEVEL SECURITY;
ALTER TABLE anti_parasitic ENABLE ROW LEVEL SECURITY;
ALTER TABLE anti_bloat ENABLE ROW LEVEL SECURITY;
ALTER TABLE obat_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE keterangan_moving ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE movings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengambilan_obat ENABLE ROW LEVEL SECURITY;
ALTER TABLE penambahan_obat ENABLE ROW LEVEL SECURITY;
ALTER TABLE pen_trial_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE pen_trial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_notes ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all operations with anon key (untuk lingkungan internal perusahaan)
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT unnest(ARRAY[
        'penanggung_jawab','shipments','jenis_pakan','diagnosa','pen_akhir',
        'antibiotic','anti_inflamasi','analgesik','supportive','anti_parasitic',
        'anti_bloat','obat_list','keterangan_moving','treatments','movings',
        'pengambilan_obat','penambahan_obat','pen_trial_groups','pen_trial_data',
        'hospital_colors','hospital_notes'
    ])
    LOOP
        EXECUTE format('CREATE POLICY "Allow all for %I" ON %I FOR ALL USING (true) WITH CHECK (true)', t, t);
    END LOOP;
END $$;
