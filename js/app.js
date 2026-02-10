// ===== Main App Module =====

let currentModule = 'dashboard';

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDatabase();
        await seedDefaults();
        initAuth();
        initSupabase();
        initLoginEvents();
        initNavigation();
        initBackupEvents();
        navigateTo('dashboard');
    } catch (e) {
        console.error('Init error:', e);
    }
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('SW registered:', reg.scope))
        .catch(err => console.log('SW registration failed:', err));
}

// Navigation
function initNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const module = btn.dataset.module;
            if (module === 'dashboard' || module === 'settings') {
                navigateTo(module);
            } else {
                requireLogin(() => navigateTo(module));
            }
        });
    });
}

function navigateTo(module) {
    currentModule = module;

    // Update nav active state
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.module === module);
    });

    // Hide all modules
    document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));

    // Show selected module
    const target = document.getElementById(`${module}Module`);
    if (target) {
        target.classList.add('active');
        loadModule(module);
    }
}

async function loadModule(module) {
    try {
        switch (module) {
            case 'dashboard': await initDashboard(); break;
            case 'treatment': await initTreatment(); break;
            case 'moving': await initMoving(); break;
            case 'pengambilanObat': await initPengambilanObat(); break;
            case 'penambahanObat': await initPenambahanObat(); break;
            case 'penTrial': await initPenTrial(); break;
            case 'settings': await loadSettings(); break;
        }
    } catch (e) {
        console.error(`Error loading module ${module}:`, e);
    }
}

function loadCurrentModule() {
    loadModule(currentModule);
}

// Settings
async function loadSettings() {
    if (isAdmin()) {
        document.getElementById('userManagementSection').style.display = 'block';
        await loadUserManagement();
    } else {
        document.getElementById('userManagementSection').style.display = 'none';
    }
}

// Backup events
function initBackupEvents() {
    document.getElementById('exportBtn')?.addEventListener('click', async () => {
        await exportAllData();
        showToast('Data berhasil di-export!');
    });

    document.getElementById('importBtn')?.addEventListener('click', () => {
        document.getElementById('importFile').click();
    });

    document.getElementById('importFile')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (confirm('Import data akan menimpa data yang ada. Lanjutkan?')) {
                try {
                    await importAllData(file);
                    showToast('Data berhasil di-import!');
                    loadCurrentModule();
                } catch (err) {
                    showToast('Gagal import: ' + err.message, 'error');
                }
            }
            e.target.value = '';
        }
    });

    document.getElementById('syncUpBtn')?.addEventListener('click', syncUp);
    document.getElementById('syncDownBtn')?.addEventListener('click', syncDown);
}
