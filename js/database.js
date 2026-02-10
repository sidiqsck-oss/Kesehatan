// ===== IndexedDB Database Module =====
const DB_NAME = 'KesehatanDB';
const DB_VERSION = 1;
let db = null;

// Default data for dropdowns
const DEFAULT_DATA = {
    diagnosa: ['Pincang', 'Kalah Makan', 'Tidak Mau Makan', 'Kurus', 'Gangguan Pencernaan', 'Asidosis', 'Gangguan Pernafasan'],
    penAkhir: ['Hospital 1', 'Hospital 2', 'Hospital 3', 'Hospital 108', 'Hospital 109', 'Drafting 1', 'Drafting 2', 'Drafting 3'],
    antibiotic: ['Limoxin-200 LA', 'Intertrim LA', 'Procaben LA'],
    antiInflamasi: ['Glucortin', 'Banixin', 'Tolfedin'],
    analgesik: ['Sulpidon'],
    supportive: ['Bplex', 'Biodin', 'Fertilife', 'Calcidex'],
    antiParasitic: ['Intermectin'],
    antiBloat: ['Petricone'],
    keteranganMoving: ['Sembuh', 'Pemulihan', 'Urgent'],
    obatList: [
        'Limoxin LA 100ml', 'Vitol 100ml', 'B-Plex 100ml', 'Biodin 100ml',
        'Penstrep 100ml', 'Calcidex 100ml', 'Sulpidon 100ml', 'Intertrim 100ml',
        'Glucortin 50ml', 'Permethyl 25ml', 'Intermectin 50ml', 'Banixin 50ml',
        'Jarum Vaksin', 'Pisau Bedah', 'Vitamin', 'Gunasex Spray', 'Trial',
        'Vaksin PMK', 'Vaksin LSD', 'Tolfedine 50ml', 'Vaksin LSD Lumpyvax',
        'Vaksin PMK 25 Dosis', 'LSD Collection', 'Vaksin LSD Kemin 25 Dosis'
    ],
    penTrialGroups: [
        { name: 'Kandang 1', pens: ['101', '102', '103', '104', '105', '106', '107'] },
        { name: 'Kandang 2', pens: ['201', '202', '203', '204', '205', '206', '207', '208', '209', '210'] },
        { name: 'Kandang 3', pens: ['301', '302', '303', '304', '305', '306', '307', '308', '309', '310'] }
    ]
};

async function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Users store
            if (!database.objectStoreNames.contains('users')) {
                const s = database.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
                s.createIndex('username', 'username', { unique: true });
            }

            // Lookup stores (dropdown items)
            const lookupStores = [
                'penanggungJawab', 'shipments', 'jenisPakan', 'diagnosa',
                'penAkhir', 'antibiotic', 'antiInflamasi', 'analgesik',
                'supportive', 'antiParasitic', 'antiBloat', 'obatList',
                'keteranganMoving'
            ];
            lookupStores.forEach(name => {
                if (!database.objectStoreNames.contains(name)) {
                    const s = database.createObjectStore(name, { keyPath: 'id', autoIncrement: true });
                    s.createIndex('name', 'name', { unique: true });
                }
            });

            // Treatments store
            if (!database.objectStoreNames.contains('treatments')) {
                const s = database.createObjectStore('treatments', { keyPath: 'id', autoIncrement: true });
                s.createIndex('tanggal', 'tanggal', { unique: false });
                s.createIndex('eartag', 'eartag', { unique: false });
                s.createIndex('shipmentId', 'shipmentId', { unique: false });
                s.createIndex('penAkhirId', 'penAkhirId', { unique: false });
            }

            // Movings store
            if (!database.objectStoreNames.contains('movings')) {
                const s = database.createObjectStore('movings', { keyPath: 'id', autoIncrement: true });
                s.createIndex('tanggal', 'tanggal', { unique: false });
                s.createIndex('eartag', 'eartag', { unique: false });
                s.createIndex('keteranganId', 'keteranganId', { unique: false });
            }

            // Pengambilan Obat store
            if (!database.objectStoreNames.contains('pengambilanObat')) {
                const s = database.createObjectStore('pengambilanObat', { keyPath: 'id', autoIncrement: true });
                s.createIndex('tanggal', 'tanggal', { unique: false });
                s.createIndex('obatId', 'obatId', { unique: false });
            }

            // Penambahan Obat store (invoice-style)
            if (!database.objectStoreNames.contains('penambahanObat')) {
                const s = database.createObjectStore('penambahanObat', { keyPath: 'id', autoIncrement: true });
                s.createIndex('tanggal', 'tanggal', { unique: false });
            }

            // Pen Trial Groups config
            if (!database.objectStoreNames.contains('penTrialGroups')) {
                database.createObjectStore('penTrialGroups', { keyPath: 'id', autoIncrement: true });
            }

            // Pen Trial Data
            if (!database.objectStoreNames.contains('penTrialData')) {
                const s = database.createObjectStore('penTrialData', { keyPath: 'id', autoIncrement: true });
                s.createIndex('tanggal', 'tanggal', { unique: false });
                s.createIndex('groupId', 'groupId', { unique: false });
                s.createIndex('penNumber', 'penNumber', { unique: false });
            }

            // Hospital Colors
            if (!database.objectStoreNames.contains('hospitalColors')) {
                const s = database.createObjectStore('hospitalColors', { keyPath: 'penName' });
            }

            // Hospital Notes
            if (!database.objectStoreNames.contains('hospitalNotes')) {
                const s = database.createObjectStore('hospitalNotes', { keyPath: 'id', autoIncrement: true });
                s.createIndex('penName', 'penName', { unique: false });
                s.createIndex('eartag', 'eartag', { unique: false });
            }
        };
    });
}

// Seed default data into lookup stores
async function seedDefaults() {
    for (const [storeName, items] of Object.entries(DEFAULT_DATA)) {
        if (storeName === 'penTrialGroups') {
            const existing = await getAllItems('penTrialGroups');
            if (existing.length === 0) {
                for (const group of items) {
                    await addItem('penTrialGroups', group);
                }
            }
        } else {
            const existing = await getAllItems(storeName);
            if (existing.length === 0) {
                for (const name of items) {
                    try {
                        await addItem(storeName, { name });
                    } catch (e) { /* duplicate, skip */ }
                }
            }
        }
    }
    // Seed default admin user
    const users = await getAllItems('users');
    if (users.length === 0) {
        await addItem('users', { username: 'admin', password: 'admin123', role: 'admin' });
    }
}

// ===== Generic CRUD =====
async function addItem(storeName, item) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.add(item);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function updateItem(storeName, item) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(item);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function deleteItem(storeName, id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

async function getItem(storeName, id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([storeName], 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function getAllItems(storeName) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([storeName], 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function getItemsByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([storeName], 'readonly');
        const store = tx.objectStore(storeName);
        const index = store.index(indexName);
        const req = index.getAll(value);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function getItemByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([storeName], 'readonly');
        const store = tx.objectStore(storeName);
        const index = store.index(indexName);
        const req = index.get(value);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function clearStore(storeName) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

async function getNameById(storeName, id) {
    if (!id) return '-';
    try {
        const item = await getItem(storeName, id);
        return item ? item.name : '-';
    } catch (e) {
        return '-';
    }
}

// ===== Backup / Restore =====
async function exportAllData() {
    const storeNames = Array.from(db.objectStoreNames);
    const data = {};
    for (const name of storeNames) {
        data[name] = await getAllItems(name);
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kesehatan-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

async function importAllData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                for (const [storeName, items] of Object.entries(data)) {
                    if (db.objectStoreNames.contains(storeName)) {
                        await clearStore(storeName);
                        for (const item of items) {
                            await addItem(storeName, item);
                        }
                    }
                }
                resolve();
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

// Populate a <select> from a lookup store
async function populateSelect(selectId, storeName, placeholder = '-- Pilih --') {
    const select = document.getElementById(selectId);
    if (!select) return;
    const items = await getAllItems(storeName);
    select.innerHTML = `<option value="">${placeholder}</option>`;
    items.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.id;
        opt.textContent = item.name;
        select.appendChild(opt);
    });
}

// Show modal to add new item to a lookup store
async function showAddItemModal(storeName, selectId, title = 'Tambah Item Baru') {
    const name = prompt(title);
    if (name && name.trim()) {
        try {
            await addItem(storeName, { name: name.trim() });
            await populateSelect(selectId, storeName);
            // Select the newly added item
            const items = await getAllItems(storeName);
            const newItem = items.find(i => i.name === name.trim());
            if (newItem) {
                document.getElementById(selectId).value = newItem.id;
            }
            showToast(`"${name.trim()}" berhasil ditambahkan!`);
        } catch (e) {
            showToast('Item sudah ada!', 'error');
        }
    }
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
