import PDFDocument from 'pdfkit';

export const generateInvoicePDF = (invoice, res) => {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename=Invoice-${invoice.invoiceNumber}.pdf`);

  doc.pipe(res);

  // Header
  doc.fontSize(24).fillColor('#1E293B').text('BUILDCONNECT INVOICE', { align: 'right' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#64748B').text(`Invoice #: ${invoice.invoiceNumber}`, { align: 'right' });
  doc.text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, { align: 'right' });
  doc.text(`Status: ${invoice.status}`, { align: 'right' });

  doc.moveDown(1);
  doc.lineWidth(1).strokeColor('#CBD5E1').moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(1);

  // Details
  doc.fontSize(12).fillColor('#0F172A').text('Billed From (Worker):');
  doc.fontSize(10).fillColor('#475569').text(invoice.worker?.name || 'Professional');

  doc.moveDown(0.5);
  doc.fontSize(12).fillColor('#0F172A').text('Billed To (Client):');
  doc.fontSize(10).fillColor('#475569').text(invoice.client?.name || 'Valued Client');

  doc.moveDown(1.5);

  // Items Table Header
  doc.fontSize(11).fillColor('#1E293B').text('Description', 50, doc.y, { width: 350 });
  doc.text('Amount (INR)', 400, doc.y - 12, { align: 'right' });
  doc.moveDown(0.5);

  // Items
  invoice.items.forEach((item) => {
    doc.fontSize(10).fillColor('#334155').text(item.description, 50, doc.y, { width: 350 });
    doc.text(`INR ${item.amount.toLocaleString()}`, 400, doc.y - 10, { align: 'right' });
    doc.moveDown(0.5);
  });

  doc.moveDown(1);
  doc.lineWidth(0.5).strokeColor('#E2E8F0').moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(1);

  // Summary
  doc.fontSize(10).fillColor('#475569').text('Subtotal:', 300, doc.y);
  doc.text(`INR ${invoice.subtotal.toLocaleString()}`, 450, doc.y - 10, { align: 'right' });
  doc.moveDown(0.5);

  doc.text('Tax:', 300, doc.y);
  doc.text(`INR ${invoice.tax.toLocaleString()}`, 450, doc.y - 10, { align: 'right' });
  doc.moveDown(0.5);

  doc.fontSize(12).fillColor('#0F172A').text('Total Amount:', 300, doc.y);
  doc.fontSize(12).fillColor('#2563EB').text(`INR ${invoice.totalAmount.toLocaleString()}`, 450, doc.y - 12, { align: 'right' });

  doc.moveDown(3);
  doc.fontSize(9).fillColor('#94A3B8').text('Thank you for choosing BuildConnect for your home services!', { align: 'center' });

  doc.end();
};
