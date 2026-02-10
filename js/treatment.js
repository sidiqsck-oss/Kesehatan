// ===== Treatment Module =====

async function initTreatment() {
    // Set default date to today
    document.getElementById('treatTanggal').valueAsDate = new Date();

    // Populate all dropdowns
    await populateSelect('treatPJ', 'penanggungJawab', '-- Pilih PJ --');
    await populateSelect('treatShipment', 'shipments', '-- Pilih Shipment --');
    await populateSelect('treatJenisPakan', 'jenisPakan', '-- Pilih Jenis Pakan --');
    await populateSelect('treatDiagnosa', 'diagnosa', '-- Pilih Diagnosa --');
    await populateSelect('treatPenAkhir', 'penAkhir', '-- Pilih Pen --');
    await populateSelect('treatAntibiotic', 'antibiotic', '-- Pilih --');
    await populateSelect('treatAntiInflamasi', 'antiInflamasi', '-- Pilih --');
    await populateSelect('treatAnalgesik', 'analgesik', '-- Pilih --');
    await populateSelect('treatSupportive1', 'supportive', '-- Pilih --');
    await populateSelect('treatSupportive2', 'supportive', '-- Pilih --');
    await populateSelect('treatSupportive3', 'supportive', '-- Pilih --');
    await populateSelect('treatAntiParasitic', 'antiParasitic', '-- Pilih --');
    await populateSelect('treatAntiBloat', 'antiBloat', '-- Pilih --');

    // Load data table
    await loadTreatmentTable();

    // Photo preview
    document.getElementById('treatFoto').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                document.getElementById('treatFotoPreview').innerHTML = `<img src="${ev.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        }
    });
}

async function submitTreatment() {
    const tanggal = document.getElementById('treatTanggal').value;
    const pjId = parseInt(document.getElementById('treatPJ').value);
    const shipmentId = parseInt(document.getElementById('treatShipment').value);
    const eartag = document.getElementById('treatEartag').value.trim();
    const berat = parseFloat(document.getElementById('treatBerat').value) || 0;
    const jenisPakanId = parseInt(document.getElementById('treatJenisPakan').value);
    const treatmentKe = parseInt(document.getElementById('treatKe').value);
    const diagnosaId = parseInt(document.getElementById('treatDiagnosa').value);
    const penAsal = document.getElementById('treatPenAsal').value.trim();
    const penAkhirId = parseInt(document.getElementById('treatPenAkhir').value);

    if (!tanggal || !eartag) {
        showToast('Tanggal dan Eartag harus diisi!', 'error');
        return;
    }

    // Get photo as base64
    let foto = '';
    const fotoInput = document.getElementById('treatFoto');
    if (fotoInput.files[0]) {
        foto = await fileToBase64(fotoInput.files[0]);
    }

    const data = {
        tanggal, pjId, shipmentId, eartag, berat, jenisPakanId,
        treatmentKe, diagnosaId, penAsal, penAkhirId,
        obatAntibioticId: parseInt(document.getElementById('treatAntibiotic').value) || null,
        obatAntibioticDosis: document.getElementById('treatAntibioticDosis').value,
        obatAntiInflamasiId: parseInt(document.getElementById('treatAntiInflamasi').value) || null,
        obatAntiInflamasiDosis: document.getElementById('treatAntiInflamasiDosis').value,
        obatAnalgesikId: parseInt(document.getElementById('treatAnalgesik').value) || null,
        obatAnalgesikDosis: document.getElementById('treatAnalgesikDosis').value,
        obatSupportive1Id: parseInt(document.getElementById('treatSupportive1').value) || null,
        obatSupportive1Dosis: document.getElementById('treatSupportive1Dosis').value,
        obatSupportive2Id: parseInt(document.getElementById('treatSupportive2').value) || null,
        obatSupportive2Dosis: document.getElementById('treatSupportive2Dosis').value,
        obatSupportive3Id: parseInt(document.getElementById('treatSupportive3').value) || null,
        obatSupportive3Dosis: document.getElementById('treatSupportive3Dosis').value,
        obatAntiParasiticId: parseInt(document.getElementById('treatAntiParasitic').value) || null,
        obatAntiParasiticDosis: document.getElementById('treatAntiParasiticDosis').value,
        obatAntiBloatId: parseInt(document.getElementById('treatAntiBloat').value) || null,
        obatAntiBloatDosis: document.getElementById('treatAntiBloatDosis').value,
        treatmentLainnya: document.getElementById('treatLainnya').value,
        foto,
        createdAt: new Date().toISOString()
    };

    try {
        await addItem('treatments', data);
        showToast('Data treatment berhasil disimpan!');
        resetTreatmentForm();
        await loadTreatmentTable();
    } catch (e) {
        showToast('Gagal menyimpan: ' + e.message, 'error');
    }
}

function resetTreatmentForm() {
    document.getElementById('treatEartag').value = '';
    document.getElementById('treatBerat').value = '';
    document.getElementById('treatPenAsal').value = '';
    document.getElementById('treatLainnya').value = '';
    document.getElementById('treatFoto').value = '';
    document.getElementById('treatFotoPreview').innerHTML = '';
    // Reset medicine fields
    ['treatAntibioticDosis', 'treatAntiInflamasiDosis', 'treatAnalgesikDosis',
        'treatSupportive1Dosis', 'treatSupportive2Dosis', 'treatSupportive3Dosis',
        'treatAntiParasiticDosis', 'treatAntiBloatDosis'].forEach(id => {
            document.getElementById(id).value = '';
        });
    ['treatAntibiotic', 'treatAntiInflamasi', 'treatAnalgesik',
        'treatSupportive1', 'treatSupportive2', 'treatSupportive3',
        'treatAntiParasitic', 'treatAntiBloat'].forEach(id => {
            document.getElementById(id).value = '';
        });
}

async function loadTreatmentTable() {
    const items = await getAllItems('treatments');
    const tbody = document.getElementById('treatTableBody');
    tbody.innerHTML = '';

    // Sort by date descending
    items.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    for (const item of items) {
        const pj = await getNameById('penanggungJawab', item.pjId);
        const shipment = await getNameById('shipments', item.shipmentId);
        const diagnosa = await getNameById('diagnosa', item.diagnosaId);
        const penAkhir = await getNameById('penAkhir', item.penAkhirId);
        const jenisPakan = await getNameById('jenisPakan', item.jenisPakanId);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.tanggal}</td>
            <td>${pj}</td>
            <td>${shipment}</td>
            <td><strong>${item.eartag}</strong></td>
            <td>${item.berat}</td>
            <td>${jenisPakan}</td>
            <td>${item.treatmentKe || '-'}</td>
            <td>${diagnosa}</td>
            <td>${item.penAsal}</td>
            <td>${penAkhir}</td>
            <td>${item.foto ? '<span class="has-photo" onclick="viewPhoto(\'' + item.foto + '\')">📷</span>' : '-'}</td>
            <td>
                <button class="btn-icon btn-danger-icon" onclick="deleteTreatment(${item.id})" title="Hapus">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    }

    document.getElementById('treatCount').textContent = `Total: ${items.length} data`;
}

async function deleteTreatment(id) {
    if (confirm('Yakin hapus data treatment ini?')) {
        await deleteItem('treatments', id);
        showToast('Data berhasil dihapus!');
        await loadTreatmentTable();
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function viewPhoto(base64) {
    const modal = document.getElementById('photoModal');
    document.getElementById('photoModalImg').src = base64;
    modal.classList.add('active');
}

function closePhotoModal() {
    document.getElementById('photoModal').classList.remove('active');
}

async function exportTreatment() {
    const items = await getAllItems('treatments');
    const rows = [['Tanggal', 'PJ', 'Shipment', 'Eartag', 'Berat', 'Jenis Pakan', 'Treatment Ke', 'Diagnosa', 'Pen Asal', 'Pen Akhir']];
    for (const item of items) {
        rows.push([
            item.tanggal,
            await getNameById('penanggungJawab', item.pjId),
            await getNameById('shipments', item.shipmentId),
            item.eartag,
            item.berat,
            await getNameById('jenisPakan', item.jenisPakanId),
            item.treatmentKe,
            await getNameById('diagnosa', item.diagnosaId),
            item.penAsal,
            await getNameById('penAkhir', item.penAkhirId)
        ]);
    }
    downloadExcel(rows, 'treatment-data');
}

function downloadExcel(rows, filename, sheetName = 'Data') {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    // Auto-width columns
    const colWidths = rows[0].map((_, colIdx) => {
        const maxLen = Math.max(...rows.map(row => String(row[colIdx] || '').length));
        return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
    });
    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// Export all data to single Excel file with multiple sheets
async function exportAllDataExcel() {
    const wb = XLSX.utils.book_new();

    // Treatment sheet
    const treatments = await getAllItems('treatments');
    const treatRows = [['Tanggal', 'PJ', 'Shipment', 'Eartag', 'Berat', 'Jenis Pakan', 'Treatment Ke', 'Diagnosa', 'Pen Asal', 'Pen Akhir',
        'Antibiotic', 'Dosis AB', 'Anti Inflamasi', 'Dosis AI', 'Analgesik', 'Dosis An',
        'Supportive 1', 'Dosis S1', 'Supportive 2', 'Dosis S2', 'Supportive 3', 'Dosis S3',
        'Anti Parasitic', 'Dosis AP', 'Anti Bloat', 'Dosis ABl', 'Treatment Lainnya']];
    for (const t of treatments) {
        treatRows.push([
            t.tanggal, await getNameById('penanggungJawab', t.pjId),
            await getNameById('shipments', t.shipmentId), t.eartag, t.berat,
            await getNameById('jenisPakan', t.jenisPakanId), t.treatmentKe,
            await getNameById('diagnosa', t.diagnosaId), t.penAsal,
            await getNameById('penAkhir', t.penAkhirId),
            await getNameById('antibiotic', t.obatAntibioticId), t.obatAntibioticDosis || '',
            await getNameById('antiInflamasi', t.obatAntiInflamasiId), t.obatAntiInflamasiDosis || '',
            await getNameById('analgesik', t.obatAnalgesikId), t.obatAnalgesikDosis || '',
            await getNameById('supportive', t.obatSupportive1Id), t.obatSupportive1Dosis || '',
            await getNameById('supportive', t.obatSupportive2Id), t.obatSupportive2Dosis || '',
            await getNameById('supportive', t.obatSupportive3Id), t.obatSupportive3Dosis || '',
            await getNameById('antiParasitic', t.obatAntiParasiticId), t.obatAntiParasiticDosis || '',
            await getNameById('antiBloat', t.obatAntiBloatId), t.obatAntiBloatDosis || '',
            t.treatmentLainnya || ''
        ]);
    }
    addSheetToWorkbook(wb, treatRows, 'Treatment');

    // Moving sheet
    const movings = await getAllItems('movings');
    const movRows = [['Tanggal', 'PJ', 'Shipment', 'Eartag', 'Keterangan', 'Pen Awal', 'Pen Akhir']];
    for (const m of movings) {
        movRows.push([
            m.tanggal, await getNameById('penanggungJawab', m.pjId),
            await getNameById('shipments', m.shipmentId), m.eartag,
            await getNameById('keteranganMoving', m.keteranganId), m.penAwal,
            await getNameById('penAkhir', m.penAkhirId)
        ]);
    }
    addSheetToWorkbook(wb, movRows, 'Moving');

    // Pengambilan Obat sheet
    const po = await getAllItems('pengambilanObat');
    const poRows = [['Tanggal', 'PJ', 'Obat', 'Jumlah']];
    for (const p of po) {
        poRows.push([
            p.tanggal, await getNameById('penanggungJawab', p.pjId),
            await getNameById('obatList', p.obatId), p.jumlah
        ]);
    }
    addSheetToWorkbook(wb, poRows, 'Pengambilan Obat');

    // Penambahan Obat sheet
    const pa = await getAllItems('penambahanObat');
    const paRows = [['Tanggal', 'PJ', 'Obat', 'Jumlah']];
    for (const p of pa) {
        if (p.items) {
            for (const sub of p.items) {
                paRows.push([
                    p.tanggal, await getNameById('penanggungJawab', p.pjId),
                    await getNameById('obatList', sub.obatId), sub.jumlah
                ]);
            }
        }
    }
    addSheetToWorkbook(wb, paRows, 'Penambahan Obat');

    // Stok Obat sheet
    const obatItems = await getAllItems('obatList');
    const stokRows = [['Nama Obat', 'Masuk', 'Keluar', 'Sisa']];
    for (const obat of obatItems) {
        let masuk = 0;
        pa.forEach(p => { if (p.items) p.items.forEach(i => { if (i.obatId === obat.id) masuk += i.jumlah; }); });
        let keluar = 0;
        po.forEach(p => { if (p.obatId === obat.id) keluar += p.jumlah; });
        stokRows.push([obat.name, masuk, keluar, masuk - keluar]);
    }
    addSheetToWorkbook(wb, stokRows, 'Stok Obat');

    // Pen Trial sheet
    const ptData = await getAllItems('penTrialData');
    const groups = await getAllItems('penTrialGroups');
    const today = new Date();
    const ptRows = [['Tanggal', 'PJ', 'Shipment', 'Eartag', 'Group', 'Pen', 'Durasi (Hari)', 'Keterangan']];
    for (const pt of ptData) {
        const group = groups.find(g => g.id === pt.groupId);
        const diffDays = Math.floor((today - new Date(pt.tanggal)) / (1000 * 60 * 60 * 24));
        ptRows.push([
            pt.tanggal, await getNameById('penanggungJawab', pt.pjId),
            await getNameById('shipments', pt.shipmentId), pt.eartag,
            group ? group.name : '-', pt.penNumber, diffDays, pt.keterangan || ''
        ]);
    }
    addSheetToWorkbook(wb, ptRows, 'Pen Trial');

    XLSX.writeFile(wb, `Kesehatan-Data-Lengkap-${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('Seluruh data berhasil di-export ke Excel!');
}

function addSheetToWorkbook(wb, rows, sheetName) {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    if (rows.length > 0) {
        const colWidths = rows[0].map((_, colIdx) => {
            const maxLen = Math.max(...rows.map(row => String(row[colIdx] || '').length));
            return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
        });
        ws['!cols'] = colWidths;
    }
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
}
