// ===== Supabase Sync Module =====
// Konfigurasi: Isi SUPABASE_URL dan SUPABASE_KEY dari project Supabase Anda

const SUPABASE_URL = 'https://egbqrtclkrzyhwodppow.supabase.co'; // contoh: 'https://abcdefgh.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnYnFydGNsa3J6eWh3b2RwcG93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MDQwNjcsImV4cCI6MjA4NjI4MDA2N30.rCc21p34UaJerPxhspHOzgNX77Pwi6os7Go-VaVxrUQ'; // anon/public key dari Supabase

let supabaseConfigured = false;

function initSupabase() {
    supabaseConfigured = SUPABASE_URL !== '' && SUPABASE_KEY !== '';
    updateSyncUI();
}

function updateSyncUI() {
    const syncBtn = document.getElementById('syncBtn');
    const syncStatus = document.getElementById('syncStatus');
    if (syncBtn) {
        syncBtn.disabled = !supabaseConfigured;
    }
    if (syncStatus) {
        syncStatus.textContent = supabaseConfigured
            ? (navigator.onLine ? '🟢 Online - Siap sync' : '🔴 Offline')
            : '⚪ Supabase belum dikonfigurasi';
    }
}

// Listen for online/offline
window.addEventListener('online', updateSyncUI);
window.addEventListener('offline', updateSyncUI);

// Generic fetch helper
async function supabaseFetch(table, method = 'GET', body = null, query = '') {
    if (!supabaseConfigured) throw new Error('Supabase not configured');
    const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': method === 'POST' ? 'return=representation' : ''
    };
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`Supabase error: ${res.status}`);

    // Handle 204 No Content or empty body
    if (res.status === 204 || res.headers.get('content-length') === '0') {
        return null;
    }

    return res.json();
}

// Mapping: IndexedDB store name -> Supabase table name
const SYNC_TABLES = {
    'penanggungJawab': 'penanggung_jawab',
    'shipments': 'shipments',
    'jenisPakan': 'jenis_pakan',
    'diagnosa': 'diagnosa',
    'penAkhir': 'pen_akhir',
    'antibiotic': 'antibiotic',
    'antiInflamasi': 'anti_inflamasi',
    'analgesik': 'analgesik',
    'supportive': 'supportive',
    'antiParasitic': 'anti_parasitic',
    'antiBloat': 'anti_bloat',
    'obatList': 'obat_list',
    'keteranganMoving': 'keterangan_moving',
    'treatments': 'treatments',
    'movings': 'movings',
    'pengambilanObat': 'pengambilan_obat',
    'penambahanObat': 'penambahan_obat',
    'penTrialGroups': 'pen_trial_groups',
    'penTrialData': 'pen_trial_data',
    'hospitalColors': 'hospital_colors',
    'hospitalNotes': 'hospital_notes'
};

// Utility: Camel to Snake (for Sync Up)
function toSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function mapObjectToRemote(obj) {
    const newObj = {};
    for (const key in obj) {
        if (key === 'id') continue; // Skip ID, handled separately
        newObj[toSnakeCase(key)] = obj[key];
    }
    return newObj;
}

// Utility: Snake to Camel (for Sync Down)
function toCamelCase(str) {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

function mapObjectToLocal(obj) {
    const newObj = {};
    for (const key in obj) {
        newObj[toCamelCase(key)] = obj[key];
    }
    return newObj;
}

// Sync Up: Push local data to Supabase
async function syncUp() {
    if (!supabaseConfigured || !navigator.onLine) {
        showToast('Tidak dapat sync: ' + (!supabaseConfigured ? 'Supabase belum dikonfigurasi' : 'Offline'), 'error');
        return;
    }

    const syncStatus = document.getElementById('syncStatus');
    if (syncStatus) syncStatus.textContent = '🔄 Uploading...';

    try {
        for (const [localStore, remoteTable] of Object.entries(SYNC_TABLES)) {
            const items = await getAllItems(localStore);
            if (items.length > 0) {
                // Clear remote table and re-insert
                await supabaseFetch(remoteTable, 'DELETE', null, '?id=gt.0');
                // Insert in batches of 100
                for (let i = 0; i < items.length; i += 100) {
                    const batch = items.slice(i, i + 100).map(item => {
                        // Convert to snake_case for Supabase
                        const clean = mapObjectToRemote(item);
                        clean.local_id = item.id;
                        return clean;
                    });
                    await supabaseFetch(remoteTable, 'POST', batch);
                }
            }
        }
        if (syncStatus) syncStatus.textContent = '🟢 Sync upload selesai!';
        showToast('Data berhasil di-upload ke Supabase!');
    } catch (e) {
        console.error('Sync up error:', e);
        if (syncStatus) syncStatus.textContent = '🔴 Sync gagal: ' + e.message;
        showToast('Sync gagal: ' + e.message, 'error');
    }
}

// Sync Down: Pull data from Supabase to local
async function syncDown() {
    if (!supabaseConfigured || !navigator.onLine) {
        showToast('Tidak dapat sync: ' + (!supabaseConfigured ? 'Supabase belum dikonfigurasi' : 'Offline'), 'error');
        return;
    }

    const syncStatus = document.getElementById('syncStatus');
    if (syncStatus) syncStatus.textContent = '🔄 Downloading...';

    try {
        for (const [localStore, remoteTable] of Object.entries(SYNC_TABLES)) {
            const remoteItems = await supabaseFetch(remoteTable, 'GET', null, '?select=*');
            if (remoteItems && remoteItems.length > 0) {
                await clearStore(localStore);
                for (const item of remoteItems) {
                    // Convert back to camelCase for local
                    const clean = mapObjectToLocal(item);

                    if (clean.localId) {
                        clean.id = clean.localId;
                        delete clean.localId;
                    }
                    delete clean.createdAt; // Use local specific logic if needed, or keep it

                    // Special handling to ensure numeric IDs are preserved as numbers if they were strings
                    // (Supabase might return numbers, IDB needs match)

                    await addItem(localStore, clean);
                }
            }
        }
        if (syncStatus) syncStatus.textContent = '🟢 Sync download selesai!';
        showToast('Data berhasil di-download dari Supabase!');
        // Reload current module to show updated data
        if (typeof loadCurrentModule === 'function') loadCurrentModule();
    } catch (e) {
        console.error('Sync down error:', e);
        if (syncStatus) syncStatus.textContent = '🔴 Sync gagal: ' + e.message;
        showToast('Sync gagal: ' + e.message, 'error');
    }
}
