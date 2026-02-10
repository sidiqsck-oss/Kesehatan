// ===== Penambahan Obat Module (Invoice Style) =====

let invoiceItems = [];

async function initPenambahanObat() {
    document.getElementById('paTanggal').valueAsDate = new Date();
    await populateSelect('paPJ', 'penanggungJawab', '-- Pilih PJ --');
    invoiceItems = [];
    renderInvoiceItems();
    addInvoiceRow(); // Start with one row
    await loadPenambahanTable();
}

function addInvoiceRow() {
    const id = Date.now();
    invoiceItems.push({ id, obatId: null, jumlah: 0 });
    renderInvoiceItems();
}

function removeInvoiceRow(id) {
    invoiceItems = invoiceItems.filter(i => i.id !== id);
    renderInvoiceItems();
}

async function renderInvoiceItems() {
    const container = document.getElementById('invoiceRows');
    container.innerHTML = '';
    const obatItems = await getAllItems('obatList');

    invoiceItems.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'invoice-row';
        row.innerHTML = `
            <span class="invoice-no">${index + 1}</span>
            <div class="invoice-field">
                <select id="invoiceObat_${item.id}" onchange="updateInvoiceItem(${item.id}, 'obatId', this.value)">
                    <option value="">-- Pilih Obat --</option>
                    ${obatItems.map(o => `<option value="${o.id}" ${item.obatId == o.id ? 'selected' : ''}>${o.name}</option>`).join('')}
                </select>
            </div>
            <div class="invoice-field">
                <input type="number" placeholder="Jumlah" value="${item.jumlah || ''}" 
                    onchange="updateInvoiceItem(${item.id}, 'jumlah', this.value)" min="0">
            </div>
            <button class="btn-icon btn-danger-icon" onclick="removeInvoiceRow(${item.id})" title="Hapus baris">✕</button>
        `;
        container.appendChild(row);
    });
}

function updateInvoiceItem(id, field, value) {
    const item = invoiceItems.find(i => i.id === id);
    if (item) {
        item[field] = field === 'jumlah' ? parseFloat(value) || 0 : parseInt(value) || null;
    }
}

async function submitPenambahanObat() {
    const tanggal = document.getElementById('paTanggal').value;
    const pjId = parseInt(document.getElementById('paPJ').value);

    const validItems = invoiceItems.filter(i => i.obatId && i.jumlah > 0);
    if (!tanggal || validItems.length === 0) {
        showToast('Tanggal dan minimal 1 item obat harus diisi!', 'error');
        return;
    }

    try {
        await addItem('penambahanObat', {
            tanggal, pjId,
            items: validItems.map(i => ({ obatId: i.obatId, jumlah: i.jumlah })),
            createdAt: new Date().toISOString()
        });
        showToast('Penambahan obat berhasil dicatat!');
        invoiceItems = [];
        addInvoiceRow();
        renderInvoiceItems();
        await loadPenambahanTable();
    } catch (e) {
        showToast('Gagal menyimpan: ' + e.message, 'error');
    }
}

async function loadPenambahanTable() {
    const items = await getAllItems('penambahanObat');
    const tbody = document.getElementById('paTableBody');
    tbody.innerHTML = '';

    items.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    for (const item of items) {
        const pj = await getNameById('penanggungJawab', item.pjId);
        let obatDetails = '';
        if (item.items) {
            for (const sub of item.items) {
                const obatName = await getNameById('obatList', sub.obatId);
                obatDetails += `${obatName} (${sub.jumlah}), `;
            }
            obatDetails = obatDetails.slice(0, -2);
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.tanggal}</td>
            <td>${pj}</td>
            <td>${obatDetails}</td>
            <td>
                <button class="btn-icon btn-danger-icon" onclick="deletePenambahanObat(${item.id})" title="Hapus">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    }

    document.getElementById('paCount').textContent = `Total: ${items.length} invoice`;
}

async function deletePenambahanObat(id) {
    if (confirm('Yakin hapus data penambahan obat ini?')) {
        await deleteItem('penambahanObat', id);
        showToast('Data berhasil dihapus!');
        await loadPenambahanTable();
    }
}

async function exportPenambahanObat() {
    const items = await getAllItems('penambahanObat');
    const rows = [['Tanggal', 'PJ', 'Obat', 'Jumlah']];
    for (const item of items) {
        if (item.items) {
            for (const sub of item.items) {
                rows.push([
                    item.tanggal,
                    await getNameById('penanggungJawab', item.pjId),
                    await getNameById('obatList', sub.obatId),
                    sub.jumlah
                ]);
            }
        }
    }
    downloadExcel(rows, 'penambahan-obat', 'Penambahan Obat');
}
