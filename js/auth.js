// ===== Authentication Module =====

let currentUser = null;

function initAuth() {
    // Check session
    const savedUser = sessionStorage.getItem('kesehatanUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
    }
}

async function login(username, password) {
    const users = await getAllItems('users');
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        currentUser = { id: user.id, username: user.username, role: user.role };
        sessionStorage.setItem('kesehatanUser', JSON.stringify(currentUser));
        updateAuthUI();
        hideLoginPage();
        return true;
    }
    return false;
}

function logout() {
    currentUser = null;
    sessionStorage.removeItem('kesehatanUser');
    updateAuthUI();
    navigateTo('dashboard');
}

function isLoggedIn() {
    return currentUser !== null;
}

function isAdmin() {
    return currentUser && currentUser.role === 'admin';
}

function requireLogin(callback) {
    if (isLoggedIn()) {
        callback();
    } else {
        showLoginPage();
    }
}

function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userInfo = document.getElementById('userInfo');
    const settingsNav = document.getElementById('settingsNav');

    if (isLoggedIn()) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'flex';
        if (userInfo) userInfo.textContent = currentUser.username;
        if (settingsNav) settingsNav.style.display = '';
    } else {
        if (loginBtn) loginBtn.style.display = 'flex';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (userInfo) userInfo.textContent = '';
        if (settingsNav) settingsNav.style.display = '';
    }
}

function showLoginPage() {
    document.getElementById('loginOverlay').classList.add('active');
    document.getElementById('loginUsername').focus();
}

function hideLoginPage() {
    document.getElementById('loginOverlay').classList.remove('active');
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginError').textContent = '';
}

function initLoginEvents() {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const success = await login(username, password);
        if (!success) {
            document.getElementById('loginError').textContent = 'Username atau password salah!';
        }
    });

    document.getElementById('loginClose')?.addEventListener('click', hideLoginPage);
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
}

// ===== User Management (Admin Only) =====
async function loadUserManagement() {
    if (!isAdmin()) return;
    const users = await getAllItems('users');
    const tbody = document.getElementById('userTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.username}</td>
            <td><span class="badge badge-${user.role === 'admin' ? 'primary' : 'secondary'}">${user.role}</span></td>
            <td>
                ${user.username !== 'admin' ? `
                    <button class="btn-icon btn-danger-icon" onclick="deleteUser(${user.id})" title="Hapus">🗑️</button>
                ` : '<span class="text-muted">-</span>'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function addUser() {
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;

    if (!username || !password) {
        showToast('Username dan password harus diisi!', 'error');
        return;
    }

    try {
        await addItem('users', { username, password, role });
        showToast(`User "${username}" berhasil ditambahkan!`);
        document.getElementById('newUsername').value = '';
        document.getElementById('newPassword').value = '';
        await loadUserManagement();
    } catch (e) {
        showToast('Username sudah digunakan!', 'error');
    }
}

async function deleteUser(id) {
    if (confirm('Yakin hapus user ini?')) {
        await deleteItem('users', id);
        showToast('User berhasil dihapus!');
        await loadUserManagement();
    }
}
