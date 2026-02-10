// ===== Dashboard Module =====

async function initDashboard() {
    await loadHospitalDashboard();
    await loadStokObat();
    await loadStatusSapi();
    await loadPenTrialDashboard();
}

// ===== Hospital Section =====
async function loadHospitalDashboard() {
    const container = document.getElementById('hospitalContainer');
    container.innerHTML = '';

    const hospitalPens = await getAllItems('penAkhir');
    const treatments = await getAllItems('treatments');
    const colors = await getAllItems('hospitalColors');

    // Filter only hospital/drafting pens
    const relevantPens = hospitalPens.filter(p =>
        p.name.startsWith('Hospital') || p.name.startsWith('Drafting')
    );

    for (const pen of relevantPens) {
        const penColor = colors.find(c => c.penName === pen.name);
        const color = penColor ? penColor.color : '#1e293b';
        const penTreatments = treatments.filter(t => t.penAkhirId === pen.id);

        const card = document.createElement('div');
        card.className = 'hospital-card';
        card.style.borderLeftColor = color;
        card.style.background = `linear-gradient(135deg, ${hexToRgba(color, 0.15)}, rgba(15,15,26,0.9))`;

        let cowList = '';
        if (penTreatments.length > 0) {
            for (const t of penTreatments) {
                const shipment = await getNameById('shipments', t.shipmentId);
                const diagnosa = await getNameById('diagnosa', t.diagnosaId);
                const jenisPakan = await getNameById('jenisPakan', t.jenisPakanId);
                const note = await getHospitalNote(pen.name, t.eartag);

                cowList += `
                    <div class="hospital-cow">
                        <div class="cow-info">
                            <span class="cow-eartag">${t.eartag}</span>
                            <span class="cow-detail">${shipment} | ${diagnosa} | ${jenisPakan}</span>
                        </div>
                        <div class="cow-note">
                            <input type="text" placeholder="Kondisi/catatan..." value="${note}" 
                                onchange="saveHospitalNote('${pen.name}', '${t.eartag}', this.value)" class="note-input">
                        </div>
                    </div>
                `;
            }
        } else {
            cowList = '<div class="empty-pen">Tidak ada sapi</div>';
        }

        card.innerHTML = `
            <div class="hospital-card-header">
                <h4>${pen.name}</h4>
                <div class="hospital-card-actions">
                    <span class="cow-count">${penTreatments.length} ekor</span>
                    <input type="color" value="${color}" onchange="setHospitalColor('${pen.name}', this.value)" 
                        class="color-picker" title="Ubah warna pen">
                </div>
            </div>
            <div class="hospital-cow-list">${cowList}</div>
        `;
        container.appendChild(card);
    }
}

async function setHospitalColor(penName, color) {
    try {
        await updateItem('hospitalColors', { penName, color });
    } catch {
        await addItem('hospitalColors', { penName, color });
    }
    await loadHospitalDashboard();
}

async function getHospitalNote(penName, eartag) {
    const notes = await getAllItems('hospitalNotes');
    const note = notes.find(n => n.penName === penName && n.eartag === eartag);
    return note ? note.note : '';
}

async function saveHospitalNote(penName, eartag, noteText) {
    const notes = await getAllItems('hospitalNotes');
    const existing = notes.find(n => n.penName === penName && n.eartag === eartag);
    if (existing) {
        existing.note = noteText;
        await updateItem('hospitalNotes', existing);
    } else {
        await addItem('hospitalNotes', { penName, eartag, note: noteText });
    }
}

function hexToRgba(hex, alpha) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

// ===== Stok Obat Section =====
async function loadStokObat() {
    const container = document.getElementById('stokObatContainer');
    container.innerHTML = '';

    const obatItems = await getAllItems('obatList');
    const pengambilan = await getAllItems('pengambilanObat');
    const penambahan = await getAllItems('penambahanObat');

    const tbody = document.createElement('tbody');
    let totalStok = 0;

    for (const obat of obatItems) {
        // Calculate masuk
        let masuk = 0;
        penambahan.forEach(pa => {
            if (pa.items) {
                pa.items.forEach(item => {
                    if (item.obatId === obat.id) masuk += item.jumlah;
                });
            }
        });

        // Calculate keluar
        let keluar = 0;
        pengambilan.forEach(po => {
            if (po.obatId === obat.id) keluar += po.jumlah;
        });

        const sisa = masuk - keluar;
        totalStok += sisa;

        const tr = document.createElement('tr');
        tr.className = sisa <= 0 ? 'low-stock' : '';
        tr.innerHTML = `
            <td>${obat.name}</td>
            <td class="text-center text-success">${masuk}</td>
            <td class="text-center text-danger">${keluar}</td>
            <td class="text-center"><strong class="${sisa <= 0 ? 'text-danger' : 'text-success'}">${sisa}</strong></td>
        `;
        tbody.appendChild(tr);
    }

    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Nama Obat</th>
                    <th class="text-center">Masuk</th>
                    <th class="text-center">Keluar</th>
                    <th class="text-center">Sisa</th>
                </tr>
            </thead>
        </table>
    `;
    container.querySelector('table').appendChild(tbody);
}

// ===== Status Sapi Section =====
async function loadStatusSapi() {
    const container = document.getElementById('statusSapiContainer');
    const movings = await getAllItems('movings');
    const keteranganList = await getAllItems('keteranganMoving');

    let sembuh = 0, pemulihan = 0, urgent = 0;

    for (const mov of movings) {
        const ket = keteranganList.find(k => k.id === mov.keteranganId);
        if (ket) {
            switch (ket.name) {
                case 'Sembuh': sembuh++; break;
                case 'Pemulihan': pemulihan++; break;
                case 'Urgent': urgent++; break;
            }
        }
    }

    container.innerHTML = `
        <div class="status-cards">
            <div class="status-card status-sembuh">
                <div class="status-icon">✅</div>
                <div class="status-value">${sembuh}</div>
                <div class="status-label">Sembuh</div>
            </div>
            <div class="status-card status-pemulihan">
                <div class="status-icon">🔄</div>
                <div class="status-value">${pemulihan}</div>
                <div class="status-label">Pemulihan</div>
            </div>
            <div class="status-card status-urgent">
                <div class="status-icon">🚨</div>
                <div class="status-value">${urgent}</div>
                <div class="status-label">Urgent</div>
            </div>
        </div>
    `;
}

// ===== Pen Trial Dashboard =====
async function loadPenTrialDashboard() {
    const container = document.getElementById('penTrialDashContainer');
    container.innerHTML = '';

    const groups = await getAllItems('penTrialGroups');
    const trialData = await getAllItems('penTrialData');
    const today = new Date();

    for (const group of groups) {
        const groupData = trialData.filter(d => d.groupId === group.id);
        if (groupData.length === 0) continue;

        let rows = '';
        for (const item of groupData) {
            const shipment = await getNameById('shipments', item.shipmentId);
            const startDate = new Date(item.tanggal);
            const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

            rows += `
                <tr>
                    <td>${item.penNumber}</td>
                    <td><strong>${item.eartag}</strong></td>
                    <td>${shipment}</td>
                    <td>${item.tanggal}</td>
                    <td><span class="badge badge-info">${diffDays} hari</span></td>
                    <td>${item.keterangan || '-'}</td>
                    <td><button class="btn-icon btn-danger-icon" onclick="deletePenTrialFromDash(${item.id})" title="Hapus">🗑️</button></td>
                </tr>
            `;
        }

        const section = document.createElement('div');
        section.className = 'pen-trial-dash-group';
        section.innerHTML = `
            <h4>${group.name} <span class="badge badge-secondary">${groupData.length} ekor</span></h4>
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Pen</th>
                            <th>Eartag</th>
                            <th>Shipment</th>
                            <th>Tgl Masuk</th>
                            <th>Durasi</th>
                            <th>Keterangan</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
        container.appendChild(section);
    }

    if (container.children.length === 0) {
        container.innerHTML = '<div class="empty-state">Belum ada data pen trial</div>';
    }
}

async function deletePenTrialFromDash(id) {
    if (confirm('Yakin hapus data pen trial ini? (Sapi sudah habis dari pen)')) {
        await deleteItem('penTrialData', id);
        showToast('Data berhasil dihapus!');
        await loadPenTrialDashboard();
    }
}
