import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, Client } from '../types';

export const generateOrderPDF = (order: Order, client: Client) => {
  const doc = new jsPDF({ orientation: 'landscape' });

  // --- TRATAMENTO DA DATA (CORREÇÃO) ---
  let dateDisplay = '';
  
  const formatDate = (dateValue: any) => {
    if (!dateValue) return new Date().toLocaleDateString('pt-BR');
    
    // Caso 1: Timestamp do Firebase (possui .seconds)
    if (dateValue.seconds) {
      return new Date(dateValue.seconds * 1000).toLocaleDateString('pt-BR');
    }
    
    // Caso 2: Objeto Date ou String de data
    const d = new Date(dateValue);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('pt-BR');
    }
    
    // Caso 3: Fallback para data atual se tudo falhar
    return new Date().toLocaleDateString('pt-BR');
  };

  dateDisplay = formatDate(order.date);

  // --- NUMERAÇÃO DO PEDIDO (CURTA E SÓ NÚMEROS) ---
  // Extraímos apenas os números do ID aleatório ou pegamos os últimos 6 caracteres
  const orderNumber = order.id.replace(/\D/g, '') || order.id.substring(order.id.length - 6).toUpperCase();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(40, 50, 75);
  doc.text("PEDIDO DE VENDA", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Data: ${dateDisplay}`, 14, 28);
  doc.text(`Pedido Nº: ${orderNumber}`, 14, 33); // Exibe o número curto

  // ... (Restante do código de informações do cliente permanece igual)
  doc.setDrawColor(200);
  doc.setFillColor(245, 247, 250);
  doc.rect(14, 38, 270, 36, 'FD');

  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text("Dados do Cliente", 18, 46);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  doc.setFont("helvetica", "bold");
  doc.text("Empresa:", 18, 53);
  doc.setFont("helvetica", "normal");
  doc.text(client.companyName || client.name, 36, 53);

  doc.setFont("helvetica", "bold");
  doc.text("Resp:", 130, 53);
  doc.setFont("helvetica", "normal");
  doc.text(client.name, 142, 53);
  
  let phoneText = client.phone;
  if (client.phone2) phoneText += ` / ${client.phone2}`;
  doc.text(`Tel: ${phoneText}`, 210, 53);
  
  let addressLine = client.address;
  if (client.number) addressLine += `, ${client.number}`;
  if (client.neighborhood) addressLine += ` - ${client.neighborhood}`;
  addressLine += ` - ${client.city}`;
  if (client.state) addressLine += `/${client.state}`;
  if (client.zipCode) addressLine += ` - CEP: ${client.zipCode}`;

  doc.text(`End: ${addressLine}`, 18, 59);
  
  doc.setFont("helvetica", "bold");
  doc.text("CNPJ/CPF:", 160, 59);
  doc.setFont("helvetica", "normal");
  doc.text(client.cpfCnpj || '-', 182, 59);

  if (client.stateRegistration) {
    doc.setFont("helvetica", "bold");
    doc.text("IE:", 225, 59);
    doc.setFont("helvetica", "normal");
    doc.text(client.stateRegistration, 232, 59);
  }

  const freight = order.freight || 'FOB';
  const payTerms = order.paymentTerms || '-';
  const payMethod = order.paymentMethod || '-';

  doc.setFont("helvetica", "bold");
  doc.text(`Frete:`, 18, 67);
  doc.setFont("helvetica", "normal");
  doc.text(freight, 30, 67);

  doc.setFont("helvetica", "bold");
  doc.text(`Cond. Pagto:`, 60, 67);
  doc.setFont("helvetica", "normal");
  doc.text(payTerms, 85, 67);

  doc.setFont("helvetica", "bold");
  doc.text(`Forma Pagto:`, 150, 67);
  doc.setFont("helvetica", "normal");
  doc.text(payMethod, 175, 67);

  const SIZES = ['33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];

  const tableBody = order.items.map(item => {
    const sizeColumns = SIZES.map(size => item.sizes[size] ? item.sizes[size].toString() : '');
    
    return [
      item.reference,
      item.description,
      item.sole || '-',
      item.material || '-',
      item.color,
      ...sizeColumns,
      item.quantity.toString(),
      `R$ ${item.unitPrice.toFixed(2).replace('.', ',')}`,
      `R$ ${item.total.toFixed(2).replace('.', ',')}`
    ];
  });

  const head = [
    ['REF', 'DESCRIÇÃO', 'SOLADO', 'COURO', 'COR', ...SIZES, 'QTD', 'UNIT.', 'TOTAL']
  ];

  autoTable(doc, {
    startY: 80,
    head: head,
    body: tableBody,
    theme: 'grid',
    headStyles: { 
      fillColor: [255, 255, 255], 
      textColor: [0, 0, 0], 
      lineColor: [0, 0, 0], 
      lineWidth: 0.1,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      valign: 'middle'
    },
    styles: { 
      fontSize: 7, 
      cellPadding: 1.5,
      lineColor: [0, 0, 0], 
      lineWidth: 0.1,
      textColor: [0, 0, 0],
      halign: 'center',
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'left' },
      1: { cellWidth: 60, halign: 'left' },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      19: { cellWidth: 10, fontStyle: 'bold' },
      20: { cellWidth: 18 },
      21: { cellWidth: 20, fontStyle: 'bold' }
    },
    foot: [['', '', '', '', 'TOTAL GERAL:', ...SIZES.map(() => ''), '', '', `R$ ${order.totalValue.toFixed(2).replace('.', ',')}`]],
    footStyles: { 
      fillColor: [240, 240, 240], 
      textColor: [0, 0, 0], 
      fontStyle: 'bold',
      halign: 'right'
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("Obrigado pela preferência!", 14, finalY);
  
  if (order.notes) {
    doc.text(`Obs: ${order.notes}`, 14, finalY + 5);
  }

  return doc;
};