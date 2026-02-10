// ===== Pen Trial Module =====

async function initPenTrial() {
    document.getElementById('ptTanggal').valueAsDate = new Date();
    await populateSelect('ptPJ', 'penanggungJawab', '-- Pilih PJ --');
    await populateSelect('ptShipment', 'shipments', '-- Pilih Shipment --');
    await renderPenTrialGroups();
    await loadPenTrialTable();
}

async function renderPenTrialGroups() {
    const groups = await getAllItems('penTrialGroups');
    const container = document.getElementById('penTrialGroupsContainer');
    container.innerHTML = '';

    groups.forEach(group => {
        const card = document.createElement('div');
        card.className = 'pen-trial-group-card';
        card.innerHTML = `
            <div class="pen-trial-group-header">
                <h4>${group.name}</h4>
                <button class="btn-icon btn-danger-icon" onclick="deletePenTrialGroup(${group.id})" title="Hapus Group">✕</button>
            </div>
            <div class="pen-trial-pens">
                <select id="ptPen_${group.id}" class="pen-select">
                    <option value="">-- Pilih Pen --</option>
                    ${group.pens.map(p => `<option value="${p}">${p}</option>`).join('')}
                </select>
                <button class="btn-sm btn-primary-sm" onclick="addPenToGroup(${group.id})">+ Pen</button>
            </div>
        `;
        container.appendChild(card);
    });
}

async function addPenTrialGroup() {
    const name = prompt('Nama Group Baru (contoh: Kandang 4):');
    if (!name || !name.trim()) return;
    const pensInput = prompt('Nomor-nomor Pen (pisahkan koma, contoh: 401,402,403):');
    if (!pensInput) return;

    const pens = pensInput.split(',').map(p => p.trim()).filter(p => p);
    try {
        await addItem('penTrialGroups', { name: name.trim(), pens });
        showToast(`Group "${name}" berhasil ditambahkan!`);
        await renderPenTrialGroups();
    } catch (e) {
        showToast('Gagal menambah group!', 'error');
    }
}

async function addPenToGroup(groupId) {
    const penNumber = prompt('Nomor Pen baru:');
    if (!penNumber || !penNumber.trim()) return;

    const group = await getItem('penTrialGroups', groupId);
    if (group) {
        if (!group.pens.includes(penNumber.trim())) {
            group.pens.push(penNumber.trim());
            await updateItem('penTrialGroups', group);
            showToast(`Pen ${penNumber} ditambahkan ke ${group.name}!`);
            await renderPenTrialGroups();
        } else {
            showToast('Pen sudah ada!', 'error');
        }
    }
}

async function deletePenTrialGroup(id) {
    if (confirm('Yakin hapus group pen trial ini?')) {
        await deleteItem('penTrialGroups', id);
        showToast('Group berhasil dihapus!');
        await renderPenTrialGroups();
    }
}

async function submitPenTrial() {
    const tanggal = document.getElementById('ptTanggal').value;
    const pjId = parseInt(document.getElementById('ptPJ').value);
    const shipmentId = parseInt(document.getElementById('ptShipment').value);
    const eartag = document.getElementById('ptEartag').value.trim();
    const keterangan = document.getElementById('ptKeterangan').value.trim();

    if (!tanggal || !eartag) {
        showToast('Tanggal dan Eartag harus diisi!', 'error');
        return;
    }

    // Collect selected pen from each group
    const groups = await getAllItems('penTrialGroups');
    let selectedGroup = null;
    let selectedPen = null;

    for (const group of groups) {
        const select = document.getElementById(`ptPen_${group.id}`);
        if (select && select.value) {
            selectedGroup = group.id;
            selectedPen = select.value;
            break;
        }
    }

    if (!selectedPen) {
        showToast('Pilih salah satu pen!', 'error');
        return;
    }

    try {
        await addItem('penTrialData', {
            tanggal, pjId, shipmentId, eartag, keterangan,
            groupId: selectedGroup, penNumber: selectedPen,
            createdAt: new Date().toISOString()
        });
        showToast('Data pen trial berhasil disimpan!');
        document.getElementById('ptEartag').value = '';
        document.getElementById('ptKeterangan').value = '';
        // Reset pen selects
        groups.forEach(g => {
            const sel = document.getElementById(`ptPen_${g.id}`);
            if (sel) sel.value = '';
        });
        await loadPenTrialTable();
    } catch (e) {
        showToast('Gagal menyimpan: ' + e.message, 'error');
    }
}

async function loadPenTrialTable() {
    const items = await getAllItems('penTrialData');
    const tbody = document.getElementById('ptTableBody');
    tbody.innerHTML = '';

    items.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    const today = new Date();
    const groups = await getAllItems('penTrialGroups');

    for (const item of items) {
        const pj = await getNameById('penanggungJawab', item.pjId);
        const shipment = await getNameById('shipments', item.shipmentId);
        const group = groups.find(g => g.id === item.groupId);
        const groupName = group ? group.name : '-';
        const startDate = new Date(item.tanggal);
        const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.tanggal}</td>
            <td>${pj}</td>
            <td>${shipment}</td>
            <td><strong>${item.eartag}</strong></td>
            <td>${groupName}</td>
            <td>${item.penNumber}</td>
            <td><span class="badge badge-info">${diffDays} hari</span></td>
            <td>${item.keterangan || '-'}</td>
            <td>
                <button class="btn-icon btn-danger-icon" onclick="deletePenTrial(${item.id})" title="Hapus">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    }

    document.getElementById('ptCount').textContent = `Total: ${items.length} data`;
}

async function deletePenTrial(id) {
    if (confirm('Yakin hapus data pen trial ini? (Sapi sudah habis dari pen)')) {
        await deleteItem('penTrialData', id);
        showToast('Data berhasil dihapus!');
        await loadPenTrialTable();
    }
}

async function exportPenTrial() {
    const items = await getAllItems('penTrialData');
    const groups = await getAllItems('penTrialGroups');
    const today = new Date();
    const rows = [['Tanggal', 'PJ', 'Shipment', 'Eartag', 'Group', 'Pen', 'Durasi (Hari)', 'Keterangan']];
    for (const item of items) {
        const group = groups.find(g => g.id === item.groupId);
        const diffDays = Math.floor((today - new Date(item.tanggal)) / (1000 * 60 * 60 * 24));
        rows.push([
            item.tanggal,
            await getNameById('penanggungJawab', item.pjId),
            await getNameById('shipments', item.shipmentId),
            item.eartag,
            group ? group.name : '-',
            item.penNumber,
            diffDays,
            item.keterangan || ''
        ]);
    }
    downloadExcel(rows, 'pen-trial-data', 'Pen Trial');
}
