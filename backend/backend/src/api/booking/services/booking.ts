/**
 * booking service
 */

import { factories } from "@strapi/strapi";
import PDFDocument from "pdfkit";

export default factories.createCoreService(
  "api::booking.booking",
  ({ strapi }) => ({
    /**
     * Generate an invoice PDF for a booking
     */
    async generateInvoice(
      bookingId: number,
      userId: number,
    ): Promise<PDFKit.PDFDocument> {
      // Fetch the booking with related data
      const bookingInfo: any = await strapi.entityService.findOne(
        "api::booking.booking" as any,
        bookingId as any,
        {
          populate: ["user", "space", "equipments", "services"],
        } as any,
      );

      if (!bookingInfo) {
        throw new Error("Réservation non trouvée.");
      }

      // Verify ownership
      if (bookingInfo.user?.id !== userId) {
        throw new Error("Non autorisé à accéder à cette facture.");
      }

      // Create a document
      const doc = new PDFDocument({ margin: 50 });

      // --- Build the PDF content ---

      // Header
      doc
        .fillColor("#2563EB") // Brand Blue
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("SunSpace", 50, 57)
        .fillColor("#444444")
        .fontSize(10)
        .font("Helvetica")
        .text("123 Coworking Street", 200, 50, { align: "right" })
        .text("Tunis, Tunisie, 1000", 200, 65, { align: "right" })
        .text("contact@sunspace.com", 200, 80, { align: "right" })
        .text("+216 12 345 678", 200, 95, { align: "right" })
        .moveDown();

      doc
        .strokeColor("#E5E7EB")
        .lineWidth(2)
        .moveTo(50, 115)
        .lineTo(550, 115)
        .stroke();

      // Invoice Details
      const invoiceNum = `RES-${bookingInfo.id.toString().padStart(5, "0")}`;
      const issueDate = new Date().toLocaleDateString("fr-FR");

      doc
        .fillColor("#1F2937")
        .font("Helvetica-Bold")
        .fontSize(20)
        .text(`Facture ${invoiceNum}`, 50, 135);

      const statusTranslations: Record<string, string> = {
        confirmed: "Payée & Confirmée",
        pending: "En attente de paiement",
        cancelled: "Annulée",
      };
      const statusText =
        statusTranslations[bookingInfo.status] || bookingInfo.status;

      let statusColor = "#444444";
      if (bookingInfo.status === "confirmed") statusColor = "#10B981"; // Green
      if (bookingInfo.status === "cancelled") statusColor = "#EF4444"; // Red
      if (bookingInfo.status === "pending") statusColor = "#F59E0B"; // Orange

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#6B7280")
        .text(`Date d'émission: `, 50, 165)
        .fillColor("#1F2937")
        .text(issueDate, 150, 165)
        .fillColor("#6B7280")
        .text(`Statut: `, 50, 180)
        .fillColor(statusColor)
        .font("Helvetica-Bold")
        .text(statusText, 150, 180);

      // Customer Details
      const customerName =
        bookingInfo.user?.fullname ||
        bookingInfo.user?.username ||
        "Client SunSpace";
      const customerEmail = bookingInfo.user?.email || "";

      doc
        .fillColor("#6B7280")
        .font("Helvetica")
        .text("Facturé à:", 300, 165)
        .fillColor("#1F2937")
        .font("Helvetica-Bold")
        .text(customerName.toUpperCase(), 300, 180)
        .font("Helvetica")
        .fillColor("#4B5563")
        .text(customerEmail, 300, 195);

      const bookingDate = new Date(bookingInfo.start_time).toLocaleDateString(
        "fr-FR",
      );
      const startTime = new Date(bookingInfo.start_time).toLocaleTimeString(
        "fr-FR",
        { hour: "2-digit", minute: "2-digit" },
      );
      const endTime = new Date(bookingInfo.end_time).toLocaleTimeString(
        "fr-FR",
        { hour: "2-digit", minute: "2-digit" },
      );

      doc
        .fillColor("#6B7280")
        .text(`Date Réservation: `, 50, 195)
        .fillColor("#1F2937")
        .text(`${bookingDate} (${startTime} - ${endTime})`, 150, 195);

      doc
        .strokeColor("#E5E7EB")
        .lineWidth(2)
        .moveTo(50, 230)
        .lineTo(550, 230)
        .stroke();

      // Watermark for cancelled
      if (bookingInfo.status === "cancelled") {
        doc
          .save()
          .fillColor("#EF4444")
          .fillOpacity(0.1)
          .font("Helvetica-Bold")
          .fontSize(60)
          .rotate(-30, { origin: [300, 400] })
          .text("ANNULÉ", 150, 350, { width: 400, align: "center" })
          .restore();
      }

      const extras = bookingInfo.extras || {};
      const eqQuantities = extras.equipmentQuantities || {};
      const svQuantities = extras.serviceQuantities || {};

      // Space name resolution
      let spaceName = "Espace Coworking";
      if (extras.spaceName) {
        spaceName = extras.spaceName;
      } else if (bookingInfo.space && bookingInfo.space.name) {
        spaceName = bookingInfo.space.name;
      } else if (bookingInfo.space?.mesh_name) {
        spaceName = bookingInfo.space.mesh_name
          .replace(/bureau_/i, "Bureau ")
          .replace(/_/g, " ");
      }

      // Table Header
      const tableTop = 260;
      doc.fillColor("#4B5563").font("Helvetica-Bold").fontSize(10);
      doc.text("Description", 50, tableTop);
      doc.text("Quantité", 250, tableTop, { width: 60, align: "center" });
      doc.text("Prix unitaire", 330, tableTop, { width: 80, align: "right" });
      doc.text("Total", 430, tableTop, { width: 80, align: "right" });

      doc
        .strokeColor("#E5E7EB")
        .lineWidth(2)
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      let currentTop = tableTop + 30;
      doc.font("Helvetica");

      const start = new Date(bookingInfo.start_time || new Date());
      const end = new Date(bookingInfo.end_time || new Date());
      const durationMs = Math.max(0, end.getTime() - start.getTime());
      const durationHours = durationMs / (1000 * 60 * 60);
      const durationDays = Math.ceil(durationHours / 24) || 1;

      // 1. Base Reservation
      doc.fillColor("#1F2937");
      doc.text(`Réservation : ${spaceName}`, 50, currentTop, { width: 200 });
      doc.text("1", 250, currentTop, {
        width: 60,
        align: "center",
      });
      doc.text("-", 330, currentTop, { width: 80, align: "right" });
      doc.text("-", 430, currentTop, { width: 80, align: "right" });
      currentTop += 20;

      // Helper for formatting unit price with suffix
      const formatUnitPrice = (price: number, type: string) => {
        if (price <= 0) return "-";
        if (type === "hourly") return `${price.toFixed(2)} DT/H`;
        if (type === "daily") return `${price.toFixed(2)} DT/J`;
        return `${price.toFixed(2)} DT`;
      };

      // Helper for calculating subtotal with duration multiplier
      const calculateSubtotal = (price: number, qty: number, type: string) => {
        if (type === "hourly") return price * qty * durationHours;
        if (type === "daily") return price * qty * durationDays;
        return price * qty;
      };

      // 2. Equipments
      if (bookingInfo.equipments && bookingInfo.equipments.length > 0) {
        bookingInfo.equipments.forEach((eq: any) => {
          const qty = eqQuantities[eq.id] || eqQuantities[String(eq.id)] || 1;
          const unitPrice = eq.price ? Number(eq.price) : 0;
          const pt = eq.price_type || "one-time";
          const lineTotal = calculateSubtotal(unitPrice, qty, pt);

          doc.fillColor("#6B7280").fontSize(9);
          doc.text(` + Équipement: ${eq.name}`, 60, currentTop, {
            width: 190,
          });
          doc.text(String(qty), 250, currentTop, {
            width: 60,
            align: "center",
          });
          doc.text(formatUnitPrice(unitPrice, pt), 330, currentTop, {
            width: 80,
            align: "right",
          });
          doc.text(
            lineTotal > 0 ? `${lineTotal.toFixed(2)} DT` : "-",
            430,
            currentTop,
            { width: 80, align: "right" },
          );
          currentTop += 15;
        });
      }

      // 3. Services
      // Render services explicitly from relation
      if (bookingInfo.services && bookingInfo.services.length > 0) {
        bookingInfo.services.forEach((sv: any) => {
          const qty = svQuantities[sv.id] || svQuantities[String(sv.id)] || 1;
          const unitPrice = sv.price ? Number(sv.price) : 0;
          const pt = sv.price_type || "one-time";
          const lineTotal = calculateSubtotal(unitPrice, qty, pt);

          doc.fillColor("#6B7280").fontSize(9);
          doc.text(` + Service: ${sv.name}`, 60, currentTop, {
            width: 190,
          });
          doc.text(String(qty), 250, currentTop, {
            width: 60,
            align: "center",
          });
          doc.text(formatUnitPrice(unitPrice, pt), 330, currentTop, {
            width: 80,
            align: "right",
          });
          doc.text(
            lineTotal > 0 ? `${lineTotal.toFixed(2)} DT` : "-",
            430,
            currentTop,
            { width: 80, align: "right" },
          );
          currentTop += 15;
        });
      }

      // 4. Render 'fallback' virtual services stored directly in extras
      const fallbackServicesMap: Record<
        string,
        { title: string; price: number; type: string }
      > = {
        "fallback-print": { title: "Impression", price: 0.2, type: "one-time" },
        "fallback-catering": {
          title: "Catering / Déjeuner",
          price: 15,
          type: "one-time",
        },
        "fallback-it-support": {
          title: "Support Technique IT",
          price: 25,
          type: "one-time",
        },
        "fallback-coffee": {
          title: "Cafétérie Premium",
          price: 5,
          type: "one-time",
        },
      };

      const svParams = extras.serviceParams || {};

      Object.entries(svQuantities).forEach(([serviceId, quantity]) => {
        if (
          typeof serviceId === "string" &&
          serviceId.startsWith("fallback-")
        ) {
          const fallbackMatch = fallbackServicesMap[serviceId];
          if (fallbackMatch && Number(quantity) > 0) {
            let qty = Number(quantity);

            // Fetch specific quantity (copies, pages...) if defined in params
            const params = svParams[serviceId];
            if (params && Array.isArray(params) && params.length > 0) {
              const firstEntry = params[0];
              qty = Number(
                firstEntry.pages ||
                  firstEntry.copies ||
                  firstEntry.quantite ||
                  qty,
              );
            }

            const lineTotal = calculateSubtotal(
              fallbackMatch.price,
              qty,
              fallbackMatch.type,
            );

            doc.fillColor("#6B7280").fontSize(9);
            doc.text(` + Service: ${fallbackMatch.title}`, 60, currentTop, {
              width: 190,
            });
            doc.text(String(qty), 250, currentTop, {
              width: 60,
              align: "center",
            });
            doc.text(
              formatUnitPrice(fallbackMatch.price, fallbackMatch.type),
              330,
              currentTop,
              { width: 80, align: "right" },
            );
            doc.text(`${lineTotal.toFixed(2)} DT`, 430, currentTop, {
              width: 80,
              align: "right",
            });
            currentTop += 15;
          }
        }
      });

      currentTop += 10;
      doc
        .strokeColor("#E5E7EB")
        .lineWidth(1)
        .moveTo(50, currentTop)
        .lineTo(550, currentTop)
        .stroke();
      currentTop += 15;

      // Financials
      doc.fontSize(10);
      const totalTTC = Number(bookingInfo.total_price || 0);

      // Reconstruct HT if we assume 19% TVA
      const tvaRate = 0.19;
      const totalHT = totalTTC / (1 + tvaRate);
      const tvaAmount = totalTTC - totalHT;

      const subTop = currentTop + 10;
      doc.fillColor("#4B5563").font("Helvetica-Bold");
      doc.text("Sous-total HT:", 330, subTop);
      doc
        .fillColor("#1F2937")
        .font("Helvetica")
        .text(`${totalHT.toFixed(2)} DT`, 430, subTop, { align: "right" });

      doc
        .fillColor("#4B5563")
        .font("Helvetica-Bold")
        .text("TVA (19%):", 330, subTop + 20);
      doc
        .fillColor("#1F2937")
        .font("Helvetica")
        .text(`${tvaAmount.toFixed(2)} DT`, 430, subTop + 20, {
          align: "right",
        });

      const totalsBoxTop = subTop + 35;
      doc.rect(310, totalsBoxTop, 220, 30).fill("#F3F4F6");

      doc
        .fillColor("#1F2937")
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("Total Réservation TTC:", 320, totalsBoxTop + 10);
      doc
        .fillColor("#2563EB")
        .text(`${totalTTC.toFixed(2)} DT`, 450, totalsBoxTop + 10, {
          align: "right",
        });

      // Payment Info
      currentTop = totalsBoxTop + 60;
      doc.fontSize(10).fillColor("#4B5563").font("Helvetica-Bold");
      doc.text("Méthode de paiement :", 50, currentTop);
      doc.font("Helvetica").fillColor("#1F2937");

      const paymentMethodsMap: Record<string, string> = {
        cash: "Espèces (Sur place)",
        on_site: "Espèces (Sur place)",
        card: "Carte Bancaire",
        subscription: "Abonnement",
      };

      let methodKey = bookingInfo.payment_method;
      // If payment_method is missing but the booking was confirmed immediately without manual payment
      if (!methodKey && bookingInfo.status === "confirmed") {
        methodKey = "subscription";
      }

      const methodText =
        paymentMethodsMap[methodKey] || methodKey || "Non spécifiée";
      doc.text(methodText, 50, currentTop + 15);

      // Footer
      doc
        .fontSize(10)
        .fillColor("#9CA3AF")
        .text(
          "Merci d'avoir choisi SunSpace pour vos projets. À très bientôt !",
          50,
          700,
          { align: "center", width: 500 },
        );

      doc.end();

      return doc;
    },
  }),
);
