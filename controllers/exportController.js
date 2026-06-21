const db = require('../lib/db');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Fitur 19: Admin dapat mengexport daftar dokumen ke format Excel
const exportDokumenExcel = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT d.id, d.name, dt.name as kategori_name, d.doc_no, d.scope, d.published,
                   u.name as creator_name, d.created_at
            FROM documents d
            LEFT JOIN document_types dt ON d.document_type_id = dt.id
            LEFT JOIN users u ON d.created_by = u.id
            ORDER BY d.created_at DESC
        `);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Daftar Dokumen');

        // Set columns
        worksheet.columns = [
            { header: 'No', key: 'no', width: 5 },
            { header: 'Nama Dokumen', key: 'name', width: 30 },
            { header: 'Kategori', key: 'kategori', width: 20 },
            { header: 'No. Dokumen', key: 'doc_no', width: 20 },
            { header: 'Ruang Lingkup', key: 'scope', width: 25 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Dibuat Oleh', key: 'created_by', width: 20 },
            { header: 'Tanggal Dibuat', key: 'created_at', width: 20 }
        ];

        // Format header
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF1E3A8A' } // Sleek navy color
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        // Add rows
        rows.forEach((row, index) => {
            worksheet.addRow({
                no: index + 1,
                name: row.name,
                kategori: row.kategori_name || '-',
                doc_no: row.doc_no || '-',
                scope: row.scope || '-',
                status: row.published === 1 ? 'Terpublikasi' : 'Draf',
                created_by: row.creator_name || '-',
                created_at: new Date(row.created_at).toLocaleDateString('id-ID')
            });
        });

        // Add borders and alignments
        worksheet.eachRow({ includeHeader: true }, (row, rowNumber) => {
            row.height = 24;
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
                };
                if (rowNumber > 1) {
                    cell.alignment = { vertical: 'middle' };
                    if (cell.col === 1 || cell.col === 6 || cell.col === 8) {
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    }
                }
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=daftar_dokumen_' + Date.now() + '.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        next(err);
    }
};

// Fitur 20: Admin dapat mengexport daftar dokumen ke format PDF
const exportDokumenPdf = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT d.id, d.name, dt.name as kategori_name, d.doc_no, d.scope, d.published
            FROM documents d
            LEFT JOIN document_types dt ON d.document_type_id = dt.id
            ORDER BY d.created_at DESC
        `);

        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=daftar_dokumen_' + Date.now() + '.pdf');
        
        doc.pipe(res);

        // Header Title
        doc.fillColor('#1e3a8a')
           .fontSize(20)
           .font('Helvetica-Bold')
           .text('Kontrol Dokumen FTI', { align: 'center' });
        doc.fontSize(12)
           .fillColor('#4b5563')
           .font('Helvetica')
           .text('Daftar Dokumen Aktif', { align: 'center' })
           .moveDown(1.5);

        // Draw Table Header
        const startX = 30;
        const startY = doc.y;

        // Draw header background
        doc.rect(startX, startY, 535, 20).fill('#1e3a8a');
        
        doc.fillColor('#ffffff')
           .font('Helvetica-Bold')
           .fontSize(9);

        let currentY = startY + 5;
        doc.text('No', startX + 5, currentY);
        doc.text('Nama Dokumen', startX + 35, currentY);
        doc.text('Kategori', startX + 215, currentY);
        doc.text('No. Dokumen', startX + 325, currentY);
        doc.text('Status', startX + 435, currentY);

        currentY = startY + 20;

        // Draw rows
        doc.fillColor('#374151')
           .font('Helvetica')
           .fontSize(9);

        rows.forEach((row, index) => {
            // Check if page needs to be added
            if (currentY > 750) {
                doc.addPage();
                currentY = 40;
                // Redraw table header
                doc.rect(startX, currentY - 5, 535, 20).fill('#1e3a8a');
                doc.fillColor('#ffffff').font('Helvetica-Bold');
                doc.text('No', startX + 5, currentY);
                doc.text('Nama Dokumen', startX + 35, currentY);
                doc.text('Kategori', startX + 215, currentY);
                doc.text('No. Dokumen', startX + 325, currentY);
                doc.text('Status', startX + 435, currentY);
                currentY += 20;
                doc.fillColor('#374151').font('Helvetica');
            }

            // Zebra striping
            if (index % 2 === 1) {
                doc.rect(startX, currentY - 2, 535, 18).fill('#f3f4f6');
                doc.fillColor('#374151');
            }

            // Draw border line
            doc.strokeColor('#e5e7eb').lineWidth(0.5);
            doc.moveTo(startX, currentY - 2).lineTo(startX + 535, currentY - 2).stroke();

            // Row cells
            doc.text((index + 1).toString(), startX + 5, currentY);
            doc.text(row.name.substring(0, 36) + (row.name.length > 36 ? '...' : ''), startX + 35, currentY);
            doc.text(row.kategori_name || '-', startX + 215, currentY);
            doc.text(row.doc_no || '-', startX + 325, currentY);
            doc.text(row.published === 1 ? 'Terpublikasi' : 'Draf', startX + 435, currentY);

            currentY += 18;
        });

        // Closing bottom line
        doc.strokeColor('#d1d5db').lineWidth(1);
        doc.moveTo(startX, currentY - 2).lineTo(startX + 535, currentY - 2).stroke();

        doc.end();
    } catch (err) {
        next(err);
    }
};

// Fitur 21: Admin dapat mengexport laporan statistik dokumen ke format Excel
const exportStatistikExcel = async (req, res, next) => {
    try {
        // Query 1: Dokumen per Kategori
        const [katStats] = await db.query(`
            SELECT dt.name as kategori_name, COUNT(d.id) as total
            FROM document_types dt
            LEFT JOIN documents d ON dt.id = d.document_type_id
            GROUP BY dt.id, dt.name
            ORDER BY total DESC
        `);

        // Query 2: Dokumen per Status (Publish vs Draft)
        const [statusStats] = await db.query(`
            SELECT 
                SUM(CASE WHEN published = 1 THEN 1 ELSE 0 END) as total_published,
                SUM(CASE WHEN published = 0 THEN 1 ELSE 0 END) as total_draft,
                COUNT(id) as total_all
            FROM documents
        `);

        const workbook = new ExcelJS.Workbook();
        const ws = workbook.addWorksheet('Laporan Statistik');

        // Styles
        const titleFont = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1E3A8A' } };
        const sectionFont = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF374151' } };
        const headerFont = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        const dataFont = { name: 'Arial', size: 10 };
        const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
        const zebraFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
        const borderStyle = {
            top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
        };

        // Title
        ws.mergeCells('B2:E2');
        const titleCell = ws.getCell('B2');
        titleCell.value = 'Laporan Statistik Kontrol Dokumen FTI';
        titleCell.font = titleFont;
        titleCell.alignment = { vertical: 'middle' };
        ws.getRow(2).height = 30;

        // Section 1: Ringkasan Status
        ws.getCell('B4').value = 'I. Ringkasan Status Dokumen';
        ws.getCell('B4').font = sectionFont;

        ws.getRow(5).values = ['', 'No', 'Status Publikasi', 'Jumlah Dokumen', 'Persentase'];
        ws.getRow(5).height = 24;
        ['C5', 'D5', 'E5'].forEach(pos => {
            const cell = ws.getCell(pos);
            cell.font = headerFont;
            cell.fill = headerFill;
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        const totals = statusStats[0] || { total_published: 0, total_draft: 0, total_all: 0 };
        const pubCount = parseInt(totals.total_published || 0, 10);
        const draftCount = parseInt(totals.total_draft || 0, 10);
        const totalCount = parseInt(totals.total_all || 0, 10);

        ws.addRow(['', 1, 'Terpublikasi', pubCount, totalCount > 0 ? (pubCount / totalCount) : 0]);
        ws.addRow(['', 2, 'Draf', draftCount, totalCount > 0 ? (draftCount / totalCount) : 0]);

        // Format Section 1 rows
        [6, 7].forEach((rowNum, idx) => {
            ws.getRow(rowNum).height = 20;
            const r = ws.getRow(rowNum);
            r.getCell(2).alignment = { horizontal: 'center' };
            r.getCell(4).alignment = { horizontal: 'right' };
            r.getCell(5).alignment = { horizontal: 'right' };
            r.getCell(5).numFmt = '0.0%';
            ['B', 'C', 'D', 'E'].forEach(col => {
                const cell = r.getCell(col);
                cell.font = dataFont;
                cell.border = borderStyle;
                if (idx % 2 === 1) cell.fill = zebraFill;
            });
        });

        // Add Total Row for Section 1
        ws.getRow(8).values = ['', 'Total', '', totalCount, '100.0%'];
        ws.getRow(8).height = 20;
        ws.mergeCells('B8:C8');
        const totalRowS1 = ws.getRow(8);
        totalRowS1.getCell(2).font = { name: 'Arial', size: 10, bold: true };
        totalRowS1.getCell(2).alignment = { horizontal: 'center' };
        totalRowS1.getCell(4).font = { name: 'Arial', size: 10, bold: true };
        totalRowS1.getCell(4).alignment = { horizontal: 'right' };
        totalRowS1.getCell(5).font = { name: 'Arial', size: 10, bold: true };
        totalRowS1.getCell(5).alignment = { horizontal: 'right' };
        ['B', 'C', 'D', 'E'].forEach(col => {
            totalRowS1.getCell(col).border = borderStyle;
        });

        // Section 2: Dokumen per Kategori
        ws.getCell('B10').value = 'II. Dokumen berdasarkan Kategori';
        ws.getCell('B10').font = sectionFont;

        ws.getRow(11).values = ['', 'No', 'Nama Kategori', 'Jumlah Dokumen'];
        ws.getRow(11).height = 24;
        ['C11', 'D11'].forEach(pos => {
            const cell = ws.getCell(pos);
            cell.font = headerFont;
            cell.fill = headerFill;
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        let currentLine = 12;
        katStats.forEach((stat, index) => {
            ws.addRow(['', index + 1, stat.kategori_name, parseInt(stat.total || 0, 10)]);
            const row = ws.getRow(currentLine);
            row.height = 20;
            row.getCell(2).alignment = { horizontal: 'center' };
            row.getCell(4).alignment = { horizontal: 'right' };
            ['B', 'C', 'D'].forEach(col => {
                const cell = row.getCell(col);
                cell.font = dataFont;
                cell.border = borderStyle;
                if (index % 2 === 1) cell.fill = zebraFill;
            });
            currentLine++;
        });

        // Adjust column widths
        ws.getColumn('B').width = 8;
        ws.getColumn('C').width = 25;
        ws.getColumn('D').width = 20;
        ws.getColumn('E').width = 15;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=statistik_dokumen_' + Date.now() + '.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        next(err);
    }
};

module.exports = {
    exportDokumenExcel,
    exportDokumenPdf,
    exportStatistikExcel
};
