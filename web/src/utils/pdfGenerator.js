/**
 * Genuine Vector PDF Slip Generator for AgriSync National APMC Platform.
 * Generates official, binary-compliant %PDF-1.4 documents with selectable text,
 * precise A4 layout, vector borders, certified badges, safe character escaping,
 * and dynamic weight calculation & validation.
 */

// 1. Data Sanitization & Weight Validation Helpers

export const escapeHtml = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const escapePdfString = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\r/g, '')
    .replace(/\n/g, ' ');
};

export const sanitizeValue = (val, fallback = '—') => {
  if (val === null || val === undefined || val === '') return fallback;
  return String(val);
};

export const parseWeightKg = (val) => {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return isNaN(val) ? null : Math.max(0, val);
  const cleaned = String(val).replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : Math.max(0, num);
};

export const validateAndFormatWeights = (gross, tare) => {
  const grossKg = parseWeightKg(gross);
  const tareKg = parseWeightKg(tare);

  if (grossKg === null && tareKg === null) {
    return null;
  }

  if (grossKg === null || tareKg === null) {
    return {
      isValid: false,
      errorMessage: 'Both Gross Weight and Tare Weight must be provided as valid positive numbers.',
      grossDisplay: grossKg !== null ? `${grossKg.toLocaleString('en-IN')} kg` : '—',
      tareDisplay: tareKg !== null ? `${tareKg.toLocaleString('en-IN')} kg` : '—',
      netKg: null,
      netDisplay: 'VALIDATION ERROR',
      subtext: 'Incomplete scale readings'
    };
  }

  if (tareKg > grossKg) {
    return {
      isValid: false,
      errorMessage: `Validation Error: Tare Weight (${tareKg.toLocaleString('en-IN')} kg) cannot exceed Gross Weight (${grossKg.toLocaleString('en-IN')} kg).`,
      grossDisplay: `${grossKg.toLocaleString('en-IN')} kg`,
      tareDisplay: `${tareKg.toLocaleString('en-IN')} kg`,
      netKg: null,
      netDisplay: 'INVALID WEIGHT',
      subtext: 'Scale Tare exceeds Gross weight'
    };
  }

  const netKg = grossKg - tareKg;
  const quintals = (netKg / 100).toFixed(2);
  const tonnes = (netKg / 1000).toFixed(2);

  return {
    isValid: true,
    grossKg,
    tareKg,
    netKg,
    grossDisplay: `${grossKg.toLocaleString('en-IN')} kg`,
    tareDisplay: `${tareKg.toLocaleString('en-IN')} kg`,
    netDisplay: `${netKg.toLocaleString('en-IN')} kg`,
    subtext: `${quintals} Quintals (${tonnes} Metric Tonnes)`
  };
};

export const formatWeightDisplay = (gross, tare) => {
  const result = validateAndFormatWeights(gross, tare);
  if (!result || !result.isValid) return null;
  return result;
};

// 2. Binary PDF-1.4 Generator (Pure JS, Selectable Text, Vector Shapes)

/**
 * Builds an authentic, binary-compliant PDF 1.4 document buffer.
 * Standard A4 Page: 595.28 x 841.89 points (72 points per inch).
 */
export const buildGenuinePdfBlob = (data = {}) => {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  // Track lines of PDF drawing instructions
  const streamLines = [];

  // Helper drawing primitives
  const drawRect = (x, y, w, h, fillRGB = null, strokeRGB = null, lineWidth = 1) => {
    streamLines.push('q');
    if (lineWidth) streamLines.push(`${lineWidth} w`);
    if (strokeRGB) streamLines.push(`${strokeRGB[0]} ${strokeRGB[1]} ${strokeRGB[2]} RG`);
    if (fillRGB) streamLines.push(`${fillRGB[0]} ${fillRGB[1]} ${fillRGB[2]} rg`);
    streamLines.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re`);
    if (fillRGB && strokeRGB) streamLines.push('B');
    else if (fillRGB) streamLines.push('f');
    else if (strokeRGB) streamLines.push('S');
    streamLines.push('Q');
  };

  const drawLine = (x1, y1, x2, y2, strokeRGB = [0.2, 0.2, 0.2], lineWidth = 1) => {
    streamLines.push('q');
    streamLines.push(`${lineWidth} w`);
    streamLines.push(`${strokeRGB[0]} ${strokeRGB[1]} ${strokeRGB[2]} RG`);
    streamLines.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m`);
    streamLines.push(`${x2.toFixed(2)} ${y2.toFixed(2)} l`);
    streamLines.push('S');
    streamLines.push('Q');
  };

  const drawText = (text, x, y, options = {}) => {
    const font = options.bold ? '/F2' : '/F1';
    const size = options.size || 10;
    const color = options.color || [0.06, 0.09, 0.16]; // #0f172a
    const escaped = escapePdfString(text);

    streamLines.push('BT');
    streamLines.push(`${font} ${size} Tf`);
    streamLines.push(`${color[0]} ${color[1]} ${color[2]} rg`);
    streamLines.push(`${x.toFixed(2)} ${y.toFixed(2)} Td`);
    streamLines.push(`(${escaped}) Tj`);
    streamLines.push('ET');
  };

  // Outer Slip Border (Forest Green APMC styling)
  drawRect(margin, margin, contentWidth, pageHeight - margin * 2, [1, 1, 1], [0.015, 0.47, 0.34], 2);

  let currentY = pageHeight - margin - 30;

  // Header Organization Banner
  const org = sanitizeValue(data.organization, 'AGRISYNC NATIONAL APMC NETWORK');
  drawText(org.toUpperCase(), margin + 20, currentY, { bold: true, size: 9, color: [0.015, 0.47, 0.34] });

  // Official Certificate Badge (Top Right)
  const badgeWidth = 120;
  const badgeHeight = 20;
  const badgeX = margin + contentWidth - 20 - badgeWidth;
  const badgeY = currentY - 6;
  drawRect(badgeX, badgeY, badgeWidth, badgeHeight, [0.86, 0.99, 0.91], [0.73, 0.97, 0.82], 1);
  drawText('CERTIFIED OFFICIAL SLIP', badgeX + 8, badgeY + 6, { bold: true, size: 8, color: [0.08, 0.5, 0.24] });

  currentY -= 20;
  const docTitle = sanitizeValue(data.title, 'OFFICIAL TRANSACTION CERTIFICATE');
  drawText(docTitle, margin + 20, currentY, { bold: true, size: 15, color: [0.06, 0.09, 0.16] });

  if (data.subtitle) {
    currentY -= 14;
    drawText(sanitizeValue(data.subtitle), margin + 20, currentY, { bold: false, size: 9, color: [0.35, 0.42, 0.5] });
  }

  // Reference number & issue date
  if (data.referenceNo) {
    const refText = `REF: ${sanitizeValue(data.referenceNo)}`;
    drawText(refText, badgeX, currentY, { bold: true, size: 9, color: [0.015, 0.47, 0.34] });
  }
  const dtText = `Issued: ${sanitizeValue(data.dateTime, new Date().toLocaleString('en-IN'))}`;
  drawText(dtText, badgeX, currentY - 12, { bold: false, size: 7.5, color: [0.45, 0.5, 0.58] });

  currentY -= 22;
  // Header divider line
  drawLine(margin + 20, currentY, margin + contentWidth - 20, currentY, [0.015, 0.47, 0.34], 2);
  currentY -= 20;

  // Optional Weights Card Section
  const weightData = validateAndFormatWeights(data.grossWeight, data.tareWeight);
  if (weightData) {
    const cardWidth = (contentWidth - 50) / 2;
    const cardHeight = 44;

    // Gross Weight Card
    drawRect(margin + 20, currentY - cardHeight, cardWidth, cardHeight, [0.97, 0.98, 0.99], [0.88, 0.91, 0.94], 1);
    drawText('SCALE GROSS WEIGHT', margin + 30, currentY - 14, { bold: true, size: 8, color: [0.4, 0.45, 0.55] });
    drawText(weightData.grossDisplay, margin + 30, currentY - 32, { bold: true, size: 13, color: [0.06, 0.09, 0.16] });

    // Tare Weight Card
    const tareX = margin + 20 + cardWidth + 10;
    drawRect(tareX, currentY - cardHeight, cardWidth, cardHeight, [0.97, 0.98, 0.99], [0.88, 0.91, 0.94], 1);
    drawText('VEHICLE TARE WEIGHT', tareX + 10, currentY - 14, { bold: true, size: 8, color: [0.4, 0.45, 0.55] });
    drawText(weightData.tareDisplay, tareX + 10, currentY - 32, { bold: true, size: 13, color: [0.06, 0.09, 0.16] });

    currentY -= (cardHeight + 16);
  }

  // Key-Value Information Table
  const fields = Array.isArray(data.fields) ? data.fields : [];
  if (fields.length > 0) {
    const tableWidth = contentWidth - 40;
    const rowHeight = 22;
    const tableX = margin + 20;

    fields.forEach((f, idx) => {
      const isEven = idx % 2 === 0;
      const bg = isEven ? [1, 1, 1] : [0.97, 0.98, 0.99];
      const rowY = currentY - rowHeight;

      drawRect(tableX, rowY, tableWidth, rowHeight, bg, [0.88, 0.91, 0.94], 0.5);

      const label = sanitizeValue(f.label, '').toUpperCase();
      const val = sanitizeValue(f.value, '—');

      drawText(label, tableX + 10, rowY + 7, { bold: true, size: 8.5, color: [0.3, 0.35, 0.42] });
      // Truncate long value string if necessary
      const displayVal = val.length > 48 ? val.substring(0, 46) + '...' : val;
      const valX = tableX + tableWidth - (displayVal.length * 6.2) - 10;
      drawText(displayVal, Math.max(tableX + 180, valX), rowY + 7, { bold: true, size: 9, color: [0.06, 0.09, 0.16] });

      currentY -= rowHeight;
    });

    currentY -= 16;
  }

  // Highlight Final Result Card (Net weight / DBT amount / Grade)
  const highlight = data.highlightResult || (weightData && weightData.isValid ? {
    label: 'CERTIFIED NET HARVEST PRODUCE WEIGHT',
    value: weightData.netDisplay,
    subtext: weightData.subtext
  } : null);

  if (highlight) {
    const hlHeight = 56;
    const hlWidth = contentWidth - 40;
    const hlX = margin + 20;
    const hlY = currentY - hlHeight;

    // Green highlighted card
    drawRect(hlX, hlY, hlWidth, hlHeight, [0.94, 0.99, 0.96], [0.73, 0.97, 0.82], 1.5);

    const hlLabel = sanitizeValue(highlight.label, 'CERTIFIED FINAL RESULT').toUpperCase();
    drawText(hlLabel, hlX + hlWidth / 2 - (hlLabel.length * 2.8), hlY + 38, { bold: true, size: 8.5, color: [0.08, 0.5, 0.24] });

    const hlValue = sanitizeValue(highlight.value, '—');
    drawText(hlValue, hlX + hlWidth / 2 - (hlValue.length * 5.2), hlY + 18, { bold: true, size: 16, color: [0.015, 0.47, 0.34] });

    if (highlight.subtext) {
      const sub = sanitizeValue(highlight.subtext);
      drawText(sub, hlX + hlWidth / 2 - (sub.length * 2.6), hlY + 6, { bold: false, size: 8, color: [0.08, 0.4, 0.2] });
    }

    currentY -= (hlHeight + 20);
  }

  // Footer Section
  const footerObj = data.footer || {};
  const operator = sanitizeValue(footerObj.operator, 'Authorized APMC System Terminal');
  const location = sanitizeValue(footerObj.location, 'National APMC Network');
  const terminal = footerObj.terminal ? ` • ${footerObj.terminal}` : '';
  const disclaimer = sanitizeValue(footerObj.disclaimer, 'Authenticated via Aadhaar e-KYC & AgriSync Escrow Smart Contract');
  const timestamp = sanitizeValue(footerObj.timestamp, new Date().toLocaleString('en-IN'));

  // Dashed footer line
  drawLine(margin + 20, margin + 45, margin + contentWidth - 20, margin + 45, [0.8, 0.83, 0.88], 1);

  drawText(`Operator: ${operator}${terminal}`, margin + 20, margin + 30, { bold: true, size: 8, color: [0.2, 0.25, 0.3] });
  drawText(`Location: ${location}`, margin + 20, margin + 19, { bold: false, size: 7.5, color: [0.4, 0.45, 0.5] });
  drawText(`[SECURE] ${disclaimer}`, margin + 20, margin + 8, { bold: true, size: 7.5, color: [0.015, 0.47, 0.34] });

  drawText('AgriSync National Network', margin + contentWidth - 130, margin + 30, { bold: true, size: 8, color: [0.06, 0.09, 0.16] });
  drawText(`Printed: ${timestamp}`, margin + contentWidth - 130, margin + 19, { bold: false, size: 7.5, color: [0.4, 0.45, 0.5] });

  // Compile PDF Object tree
  const contentStream = streamLines.join('\n');
  const streamLength = contentStream.length;

  const objects = [];
  objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`);
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj`);
  objects.push(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj`);
  objects.push(`4 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream\nendobj`);
  objects.push(`5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`);
  objects.push(`6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj`);

  // Build binary PDF file with accurate xref table
  let pdf = `%PDF-1.4\n%\xE2\xE3\xCF\xD3\n`;
  const xrefOffsets = [0];

  objects.forEach((obj) => {
    xrefOffsets.push(pdf.length);
    pdf += obj + '\n';
  });

  const startxref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    const offsetStr = String(xrefOffsets[i]).padStart(10, '0');
    pdf += `${offsetStr} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
};

// 3. HTML Slip Renderer (Used for in-browser Print Dialog iframe)

export const renderHtmlSlip = (data = {}) => {
  const weightData = validateAndFormatWeights(data.grossWeight, data.tareWeight);
  const org = escapeHtml(sanitizeValue(data.organization, 'AGRISYNC NATIONAL APMC NETWORK'));
  const docTitle = escapeHtml(sanitizeValue(data.title, 'OFFICIAL TRANSACTION SLIP'));
  const sub = data.subtitle ? `<p style="margin: 3px 0 0 0; font-size: 11px; color: #475569; font-weight: 600;">${escapeHtml(data.subtitle)}</p>` : '';
  const ref = data.referenceNo ? `<div style="font-size: 11px; font-weight: 800; color: #047857; margin-top: 4px;">REF: ${escapeHtml(data.referenceNo)}</div>` : '';
  const dt = escapeHtml(sanitizeValue(data.dateTime, new Date().toLocaleString('en-IN')));

  let weightsHtml = '';
  if (weightData) {
    weightsHtml = `
      <div style="display: flex; gap: 12px; margin-bottom: 16px;">
        <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center;">
          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Scale Gross Weight</div>
          <div style="font-size: 16px; font-weight: 900; color: #0f172a; margin-top: 4px;">${escapeHtml(weightData.grossDisplay)}</div>
        </div>
        <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center;">
          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Vehicle Tare Weight</div>
          <div style="font-size: 16px; font-weight: 900; color: #0f172a; margin-top: 4px;">${escapeHtml(weightData.tareDisplay)}</div>
        </div>
      </div>
    `;
  }

  const fields = Array.isArray(data.fields) ? data.fields : [];
  const rowsHtml = fields.map((f, idx) => {
    const label = escapeHtml(sanitizeValue(f.label, ''));
    const value = escapeHtml(sanitizeValue(f.value, '—'));
    const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    return `
      <tr style="background: ${bg}; border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px 12px; width: 42%; color: #475569; font-weight: 600; font-size: 11px; text-transform: uppercase;">${label}</td>
        <td style="padding: 8px 12px; width: 58%; color: #0f172a; font-weight: 800; font-size: 12px; text-align: right;">${value}</td>
      </tr>
    `;
  }).join('');

  const highlight = data.highlightResult || (weightData && weightData.isValid ? {
    label: 'CERTIFIED NET HARVEST PRODUCE WEIGHT',
    value: weightData.netDisplay,
    subtext: weightData.subtext
  } : null);

  let highlightHtml = '';
  if (highlight) {
    highlightHtml = `
      <div style="background: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 12px; padding: 14px; text-align: center; margin-bottom: 16px;">
        <div style="font-size: 11px; font-weight: 900; color: #15803d; text-transform: uppercase;">${escapeHtml(highlight.label)}</div>
        <div style="font-size: 22px; font-weight: 900; color: #047857; margin-top: 4px;">${escapeHtml(highlight.value)}</div>
        ${highlight.subtext ? `<div style="font-size: 11px; color: #166534; font-weight: 700; margin-top: 4px;">${escapeHtml(highlight.subtext)}</div>` : ''}
      </div>
    `;
  }

  const footer = data.footer || {};
  const operator = escapeHtml(sanitizeValue(footer.operator, 'Authorized APMC System Terminal'));
  const location = escapeHtml(sanitizeValue(footer.location, 'APMC Yard Network'));
  const terminal = footer.terminal ? ` • ${escapeHtml(footer.terminal)}` : '';
  const disclaimer = escapeHtml(sanitizeValue(footer.disclaimer, 'Authenticated via Aadhaar e-KYC & AgriSync Escrow Smart Contract'));
  const printTime = escapeHtml(new Date().toLocaleString('en-IN'));

  return `
    <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border: 2px solid #047857; border-radius: 12px; padding: 24px; font-family: system-ui, -apple-system, Arial, sans-serif; color: #0f172a;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #047857; padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <div style="font-size: 10px; font-weight: 900; color: #047857; text-transform: uppercase; letter-spacing: 0.5px;">${org}</div>
          <h1 style="margin: 4px 0 0 0; font-size: 18px; font-weight: 900; color: #0f172a;">${docTitle}</h1>
          ${sub}
        </div>
        <div style="text-align: right;">
          <div style="background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; padding: 4px 8px; border-radius: 6px; font-weight: 800; font-size: 10px; display: inline-block;">
            ✓ OFFICIAL CERTIFICATE
          </div>
          ${ref}
          <div style="font-size: 9px; color: #64748b; margin-top: 4px;">Issued: ${dt}</div>
        </div>
      </div>

      ${weightsHtml}

      <div style="border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; margin-bottom: 16px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>

      ${highlightHtml}

      <div style="border-top: 2px dashed #cbd5e1; padding-top: 12px; margin-top: 16px; display: flex; justify-content: space-between; align-items: center; font-size: 9.5px; color: #64748b;">
        <div>
          <div style="font-weight: 700; color: #334155;">Operator: ${operator}${terminal}</div>
          <div>Location: ${location}</div>
          <div style="color: #047857; font-weight: 700; margin-top: 2px;">🔒 ${disclaimer}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 700; color: #0f172a;">AgriSync National Network</div>
          <div>Printed: ${printTime}</div>
        </div>
      </div>
    </div>
  `;
};

// 4. Primary Exported Functions

/**
 * Generates and downloads a real vector PDF document, while also activating the browser print preview.
 */
export const generateSlipPDF = (data = {}, filename = 'Official_Slip.pdf') => {
  if (!data) return;

  // 1. Generate real binary %PDF-1.4 Blob
  const pdfBlob = buildGenuinePdfBlob(data);
  const pdfUrl = URL.createObjectURL(pdfBlob);

  // 2. Trigger instant genuine .pdf file download
  const cleanFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
  const downloadLink = document.createElement('a');
  downloadLink.href = pdfUrl;
  downloadLink.download = cleanFilename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  // Revoke object URL after brief download initiation
  setTimeout(() => URL.revokeObjectURL(pdfUrl), 10000);

  // 3. Also open browser print preview dialog via isolated iframe
  try {
    let iframe = document.getElementById('agrisync-pdf-print-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'agrisync-pdf-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const frameDoc = iframe.contentWindow.document;
    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${escapeHtml(data.title || 'Official Slip')}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { 
              background: #ffffff !important; 
              padding: 20px !important; 
              margin: 0 !important; 
              font-family: system-ui, -apple-system, Arial, sans-serif;
              color: #0f172a;
            }
            @media print {
              body { padding: 0 !important; }
            }
          </style>
        </head>
        <body>
          ${renderHtmlSlip(data)}
        </body>
      </html>
    `);
    frameDoc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.warn('Print preview notice:', e);
      }
    }, 400);
  } catch (err) {
    console.warn('Print dialog notice:', err);
  }
};

/**
 * Backward-compatible helper for legacy string-array calls.
 */
export const downloadPDFDocument = (filename, title, textLines = [], elementId = null) => {
  const fields = [];
  let highlightResult = null;
  let grossWt = null;
  let tareWt = null;

  if (Array.isArray(textLines)) {
    textLines.forEach((line) => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join(':').trim();

        if (key.toLowerCase().includes('gross')) grossWt = val;
        else if (key.toLowerCase().includes('tare')) tareWt = val;
        else if (key.toLowerCase().includes('net') || key.toLowerCase().includes('dbt') || key.toLowerCase().includes('total')) {
          highlightResult = { label: key.toUpperCase(), value: val };
        } else {
          fields.push({ label: key, value: val });
        }
      }
    });
  }

  generateSlipPDF({
    organization: 'AGRISYNC NATIONAL APMC NETWORK',
    title: title || 'OFFICIAL TRANSACTION SLIP',
    referenceNo: filename.replace(/\.pdf$/i, '').toUpperCase(),
    fields: fields,
    grossWeight: grossWt,
    tareWeight: tareWt,
    highlightResult: highlightResult,
    footer: {
      disclaimer: 'Authenticated via Aadhaar e-KYC & Escrow Smart Contract'
    }
  }, filename);
};

export default {
  generateSlipPDF,
  downloadPDFDocument,
  buildGenuinePdfBlob,
  validateAndFormatWeights,
  formatWeightDisplay,
  escapePdfString,
  escapeHtml,
  sanitizeValue,
  parseWeightKg
};
