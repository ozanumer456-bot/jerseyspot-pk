import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatPKR } from "@/lib/products";
import type { Settings } from "@/lib/settings";
import { waLink } from "@/lib/settings";

export type InvoiceOrder = {
  id: string;
  customer_name: string;
  phone: string;
  city: string;
  address: string;
  postal_code: string | null;
  payment_method: string;
  items: { product_id: string; name: string; size: string; quantity: number; price: number }[];
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  created_at: string;
};

export const invoiceNumber = (id: string) => `INV-${id.slice(0, 8).toUpperCase()}`;

const hexToRgb = (hex: string): [number, number, number] => {
  const h = (hex || "#00FF87").replace("#", "");
  const s = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [parseInt(s.slice(0, 2), 16) || 0, parseInt(s.slice(2, 4), 16) || 255, parseInt(s.slice(4, 6), 16) || 135];
};

export function generateInvoicePDF(order: InvoiceOrder, settings: Settings): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const primary = hexToRgb(settings.primary_color);
  const dark: [number, number, number] = [15, 20, 32];

  // Header band
  doc.setFillColor(...dark);
  doc.rect(0, 0, W, 90, "F");
  doc.setFillColor(...primary);
  doc.rect(0, 90, W, 4, "F");

  // Logo box
  doc.setFillColor(...primary);
  doc.roundedRect(40, 24, 44, 44, 6, 6, "F");
  doc.setTextColor(15, 20, 32);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text((settings.logo_letter || "K").toUpperCase(), 62, 56, { align: "center" });

  // Store name/tagline
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text(settings.store_name || "Store", 100, 46);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text(settings.tagline || "", 100, 62);
  doc.text(`${settings.email || ""}  ·  ${settings.whatsapp_number || ""}`, 100, 76);

  // Invoice title (right)
  doc.setTextColor(...primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("INVOICE", W - 40, 46, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(220, 220, 220);
  doc.text(invoiceNumber(order.id), W - 40, 62, { align: "right" });
  doc.text(new Date(order.created_at).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" }), W - 40, 76, { align: "right" });

  // Bill To
  let y = 130;
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(9);
  doc.text("BILL TO", 40, y);
  doc.text("PAYMENT", W - 40, y, { align: "right" });
  y += 16;
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(order.customer_name, 40, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(order.phone, 40, y + 14);
  const addr = doc.splitTextToSize(`${order.address}, ${order.city}${order.postal_code ? ` - ${order.postal_code}` : ""}`, 260);
  doc.text(addr, 40, y + 28);

  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(order.payment_method, W - 40, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(10);
  doc.text(`Status: ${order.status}`, W - 40, y + 14, { align: "right" });

  // Items table
  const startY = y + 28 + Math.max(addr.length, 2) * 12 + 20;
  autoTable(doc, {
    startY,
    head: [["#", "Product", "Size", "Qty", "Price", "Total"]],
    body: order.items.map((it, i) => [
      String(i + 1),
      it.name,
      it.size || "-",
      String(it.quantity),
      formatPKR(it.price),
      formatPKR(it.price * it.quantity),
    ]),
    styles: { fontSize: 10, cellPadding: 8, lineColor: [230, 230, 230], lineWidth: 0.5 },
    headStyles: { fillColor: dark, textColor: 255, fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 30 }, 3: { halign: "center" }, 4: { halign: "right" }, 5: { halign: "right" } },
    theme: "grid",
    margin: { left: 40, right: 40 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 20;

  // Totals block
  const boxX = W - 260;
  const rows: [string, string, boolean?][] = [
    ["Subtotal", formatPKR(order.subtotal)],
    ["Shipping", order.shipping === 0 ? "FREE" : formatPKR(order.shipping)],
    ["Total", formatPKR(order.total), true],
  ];
  let ty = finalY;
  rows.forEach(([label, value, bold]) => {
    if (bold) {
      doc.setFillColor(...dark);
      doc.rect(boxX, ty - 4, 220, 32, "F");
      doc.setTextColor(...primary);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(label, boxX + 12, ty + 16);
      doc.text(value, boxX + 208, ty + 16, { align: "right" });
      ty += 32;
    } else {
      doc.setTextColor(60, 60, 60);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(label, boxX + 12, ty + 12);
      doc.text(value, boxX + 208, ty + 12, { align: "right" });
      ty += 20;
    }
  });

  // Footer / thank you
  const footY = doc.internal.pageSize.getHeight() - 80;
  doc.setDrawColor(...primary);
  doc.setLineWidth(1);
  doc.line(40, footY, W - 40, footY);
  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Thank you for your order!", W / 2, footY + 22, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`For queries, contact ${settings.whatsapp_number || settings.email || ""}`, W / 2, footY + 38, { align: "center" });

  return doc;
}

export function downloadInvoice(order: InvoiceOrder, settings: Settings) {
  const doc = generateInvoicePDF(order, settings);
  doc.save(`${invoiceNumber(order.id)}.pdf`);
}

export function openInvoicePreview(order: InvoiceOrder, settings: Settings) {
  const doc = generateInvoicePDF(order, settings);
  const url = doc.output("bloburl");
  window.open(url, "_blank");
}

export function invoiceWhatsAppLink(order: InvoiceOrder, settings: Settings): string {
  const lines = [
    `*${settings.store_name} — Invoice ${invoiceNumber(order.id)}*`,
    ``,
    `Hi ${order.customer_name}, thanks for your order!`,
    ``,
    ...order.items.map((it) => `• ${it.name} (${it.size || "-"}) × ${it.quantity} — ${formatPKR(it.price * it.quantity)}`),
    ``,
    `Subtotal: ${formatPKR(order.subtotal)}`,
    `Shipping: ${order.shipping === 0 ? "FREE" : formatPKR(order.shipping)}`,
    `*Total: ${formatPKR(order.total)}*`,
    ``,
    `Payment: ${order.payment_method}`,
    `Ship to: ${order.address}, ${order.city}`,
    ``,
    `Thank you for shopping with ${settings.store_name}!`,
  ];
  return waLink(order.phone, lines.join("\n"));
}
