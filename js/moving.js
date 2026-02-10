// ===== Moving Module =====

async function initMoving() {
    document.getElementById('movTanggal').valueAsDate = new Date();
    await populateSelect('movPJ', 'penanggungJawab', '-- Pilih PJ --');
    await populateSelect('movShipment', 'shipments', '-- Pilih Shipment --');
    await populateSelect('movKeterangan', 'keteranganMoving', '-- Pilih Keterangan --');
    await populateSelect('movPenAkhir', 'penAkhir', '-- Pilih Pen --');
    await loadMovingTable();

    // Photo preview
    document.getElementById('movFoto').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                document.getElementById('movFotoPreview').innerHTML = `<img src="${ev.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        }
    });
}

async function submitMoving() {
    const tanggal = document.getElementById('movTanggal').value;
    const pjId = parseInt(document.getElementById('movPJ').value);
    const shipmentId = parseInt(document.getElementById('movShipment').value);
    const eartag = document.getElementById('movEartag').value.trim();
    const keteranganId = parseInt(document.getElementById('movKeterangan').value);
    const penAwal = document.getElementById('movPenAwal').value.trim();
    const penAkhirId = parseInt(document.getElementById('movPenAkhir').value);

    if (!tanggal || !eartag) {
        showToast('Tanggal dan Eartag harus diisi!', 'error');
        return;
    }

    let foto = '';
    const fotoInput = document.getElementById('movFoto');
    if (fotoInput.files[0]) {
        foto = await fileToBase64(fotoInput.files[0]);
    }

    const data = {
        tanggal, pjId, shipmentId, eartag, keteranganId, penAwal, penAkhirId, foto,
        createdAt: new Date().toISOString()
    };

    try {
        await addItem('movings', data);
        showToast('Data moving berhasil disimpan!');
        resetMovingForm();
        await loadMovingTable();
    } catch (e) {
        showToast('Gagal menyimpan: ' + e.message, 'error');
    }
}

function resetMovingForm() {
    document.getElementById('movEartag').value = '';
    document.getElementById('movPenAwal').value = '';
    document.getElementById('movFoto').value = '';
    document.getElementById('movFotoPreview').innerHTML = '';
}

async function loadMovingTable() {
    const items = await getAllItems('movings');
    const tbody = document.getElementById('movTableBody');
    tbody.innerHTML = '';

    items.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    for (const item of items) {
        const pj = await getNameById('penanggungJawab', item.pjId);
        const shipment = await getNameById('shipments', item.shipmentId);
        const keterangan = await getNameById('keteranganMoving', item.keteranganId);
        const penAkhir = await getNameById('penAkhir', item.penAkhirId);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.tanggal}</td>
            <td>${pj}</td>
            <td>${shipment}</td>
            <td><strong>${item.eartag}</strong></td>
            <td><span class="badge badge-${getKeteranganClass(keterangan)}">${keterangan}</span></td>
            <td>${item.penAwal}</td>
            <td>${penAkhir}</td>
            <td>${item.foto ? '<span class="has-photo" onclick="viewPhoto(\'' + item.foto + '\')">📷</span>' : '-'}</td>
            <td>
                <button class="btn-icon btn-danger-icon" onclick="deleteMoving(${item.id})" title="Hapus">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    }

    document.getElementById('movCount').textContent = `Total: ${items.length} data`;
}

function getKeteranganClass(keterangan) {
    switch (keterangan) {
        case 'Sembuh': return 'success';
        case 'Pemulihan': return 'warning';
        case 'Urgent': return 'danger';
        default: return 'secondary';
    }
}

async function deleteMoving(id) {
    if (confirm('Yakin hapus data moving ini?')) {
        await deleteItem('movings', id);
        showToast('Data berhasil dihapus!');
        await loadMovingTable();
    }
}

async function exportMoving() {
    const items = await getAllItems('movings');
    const rows = [['Tanggal', 'PJ', 'Shipment', 'Eartag', 'Keterangan', 'Pen Awal', 'Pen Akhir']];
    for (const item of items) {
        rows.push([
            item.tanggal,
            await getNameById('penanggungJawab', item.pjId),
            await getNameById('shipments', item.shipmentId),
            item.eartag,
            await getNameById('keteranganMoving', item.keteranganId),
            item.penAwal,
            await getNameById('penAkhir', item.penAkhirId)
        ]);
    }
    downloadExcel(rows, 'moving-data', 'Moving');
}
