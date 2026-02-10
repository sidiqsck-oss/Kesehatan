// ===== Pengambilan Obat Module =====

async function initPengambilanObat() {
    document.getElementById('poTanggal').valueAsDate = new Date();
    await populateSelect('poPJ', 'penanggungJawab', '-- Pilih PJ --');
    await populateSelect('poObat', 'obatList', '-- Pilih Obat --');
    await loadPengambilanTable();
}

async function submitPengambilanObat() {
    const tanggal = document.getElementById('poTanggal').value;
    const pjId = parseInt(document.getElementById('poPJ').value);
    const obatId = parseInt(document.getElementById('poObat').value);
    const jumlah = parseFloat(document.getElementById('poJumlah').value) || 0;

    if (!tanggal || !obatId || jumlah <= 0) {
        showToast('Semua field harus diisi dengan benar!', 'error');
        return;
    }

    try {
        await addItem('pengambilanObat', {
            tanggal, pjId, obatId, jumlah,
            createdAt: new Date().toISOString()
        });
        showToast('Pengambilan obat berhasil dicatat!');
        document.getElementById('poJumlah').value = '';
        await loadPengambilanTable();
    } catch (e) {
        showToast('Gagal menyimpan: ' + e.message, 'error');
    }
}

async function loadPengambilanTable() {
    const items = await getAllItems('pengambilanObat');
    const tbody = document.getElementById('poTableBody');
    tbody.innerHTML = '';

    items.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    for (const item of items) {
        const pj = await getNameById('penanggungJawab', item.pjId);
        const obat = await getNameById('obatList', item.obatId);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.tanggal}</td>
            <td>${pj}</td>
            <td>${obat}</td>
            <td><strong>${item.jumlah}</strong></td>
            <td>
                <button class="btn-icon btn-danger-icon" onclick="deletePengambilanObat(${item.id})" title="Hapus">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    }

    document.getElementById('poCount').textContent = `Total: ${items.length} data`;
}

async function deletePengambilanObat(id) {
    if (confirm('Yakin hapus data pengambilan obat ini?')) {
        await deleteItem('pengambilanObat', id);
        showToast('Data berhasil dihapus!');
        await loadPengambilanTable();
    }
}

async function exportPengambilanObat() {
    const items = await getAllItems('pengambilanObat');
    const rows = [['Tanggal', 'PJ', 'Obat', 'Jumlah']];
    for (const item of items) {
        rows.push([
            item.tanggal,
            await getNameById('penanggungJawab', item.pjId),
            await getNameById('obatList', item.obatId),
            item.jumlah
        ]);
    }
    downloadExcel(rows, 'pengambilan-obat', 'Pengambilan Obat');
}
