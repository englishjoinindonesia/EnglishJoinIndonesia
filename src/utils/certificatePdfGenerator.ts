import { jsPDF } from 'jspdf';

export interface CertificateData {
  studentName: string;
  testTitle: string;
  testType: string;
  certNumber: string;
  certIssueDate: string;
  listeningScore: number;
  structureScore: number;
  readingScore: number;
  totalScore: number;
  maxScore?: number;
  levelCategory?: string;
}

/**
 * Generates and triggers download of the official TOEFL E-Certificate PDF.
 * Formatted as an official landscape A4 document (297mm x 210mm) with antique gold borders,
 * academic typography, score breakdown, verification seal, and official signatures.
 */
export const downloadCertificatePdf = async (data: CertificateData): Promise<void> => {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = 297;
    const pageHeight = 210;

    // 1. Background Fill (Parchment Ivory)
    doc.setFillColor(252, 250, 242); // #FCFAF2
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // 2. Decorative Outer Border (Antique Gold)
    doc.setDrawColor(200, 155, 60); // #C89B3C
    doc.setLineWidth(1.8);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

    // 3. Inner Thin Border
    doc.setDrawColor(229, 215, 181); // #E5D7B5
    doc.setLineWidth(0.6);
    doc.rect(11, 11, pageWidth - 22, pageHeight - 22);

    // 4. Subtle Inner Inset Border
    doc.setDrawColor(200, 155, 60);
    doc.setLineWidth(0.3);
    doc.rect(13, 13, pageWidth - 26, pageHeight - 26);

    // Decorative Corner Accents
    const corners = [
      [14, 14],
      [pageWidth - 14, 14],
      [14, pageHeight - 14],
      [pageWidth - 14, pageHeight - 14],
    ];
    doc.setFillColor(200, 155, 60);
    corners.forEach(([cx, cy]) => {
      doc.circle(cx, cy, 1.2, 'F');
    });

    // 5. Institution Brand Header
    doc.setTextColor(154, 114, 32); // #9A7220
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('ENGLISH JOIN INDONESIA  •  LANGUAGE TRAINING CENTER', pageWidth / 2, 24, { align: 'center' });

    doc.setTextColor(120, 110, 95);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('Official TOEFL Preparation & Digital Certification Portal • NIB: 290124008912', pageWidth / 2, 28, { align: 'center' });

    // Decorative Line under institution
    doc.setDrawColor(200, 155, 60);
    doc.setLineWidth(0.5);
    doc.line(60, 31, pageWidth - 60, 31);

    // 6. Certificate Title
    doc.setTextColor(15, 23, 42); // #0F172A
    doc.setFont('times', 'bold');
    doc.setFontSize(24);
    doc.text('CERTIFICATE OF ACHIEVEMENT', pageWidth / 2, 42, { align: 'center' });

    doc.setTextColor(100, 116, 139); // Slate 500
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('This is to certify that', pageWidth / 2, 49, { align: 'center' });

    // 7. Student Recipient Name (Bold, Prominent)
    doc.setTextColor(15, 23, 42);
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    const studentName = data.studentName || 'Student Name';
    doc.text(studentName, pageWidth / 2, 62, { align: 'center' });

    // Gold underline below recipient
    const nameWidth = Math.max(doc.getTextWidth(studentName) + 20, 80);
    doc.setDrawColor(200, 155, 60);
    doc.setLineWidth(0.8);
    doc.line((pageWidth - nameWidth) / 2, 65, (pageWidth + nameWidth) / 2, 65);

    // 8. Test Details Description
    doc.setTextColor(51, 65, 85); // Slate 700
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const testTitle = data.testTitle || 'TOEFL ITP Prediction Test';
    const issueDate = data.certIssueDate || '2026';
    doc.text(`has successfully completed the online ${testTitle}`, pageWidth / 2, 73, { align: 'center' });
    doc.text(`held on ${issueDate} with the verified score breakdown shown below:`, pageWidth / 2, 78, { align: 'center' });

    // 9. Score Breakdown Box (4 Columns)
    const boxY = 86;
    const boxHeight = 26;
    const boxWidth = 52;
    const spacing = 7;
    const totalBoxWidth = boxWidth * 4 + spacing * 3;
    const startX = (pageWidth - totalBoxWidth) / 2;

    const sections = [
      { label: 'SECTION 1', sub: 'LISTENING', score: data.listeningScore, max: 68, isTotal: false },
      { label: 'SECTION 2', sub: 'STRUCTURE', score: data.structureScore, max: 68, isTotal: false },
      { label: 'SECTION 3', sub: 'READING', score: data.readingScore, max: 67, isTotal: false },
      { label: 'TOTAL TOEFL SCORE', sub: 'SCALE 310 - 677', score: data.totalScore, max: 677, isTotal: true },
    ];

    sections.forEach((sec, idx) => {
      const bx = startX + idx * (boxWidth + spacing);

      if (sec.isTotal) {
        // Gold Highlight Card for Total Score
        doc.setFillColor(247, 180, 37); // #F7B425
        doc.setDrawColor(200, 155, 60);
        doc.setLineWidth(0.6);
        doc.roundedRect(bx, boxY, boxWidth, boxHeight, 2.5, 2.5, 'FD');

        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text(sec.label, bx + boxWidth / 2, boxY + 6, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(String(sec.score), bx + boxWidth / 2, boxY + 16, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(sec.sub, bx + boxWidth / 2, boxY + 21, { align: 'center' });
      } else {
        // Elegant Cream Card for Sections
        doc.setFillColor(250, 246, 236); // #FAF6EC
        doc.setDrawColor(229, 215, 181);
        doc.setLineWidth(0.4);
        doc.roundedRect(bx, boxY, boxWidth, boxHeight, 2.5, 2.5, 'FD');

        doc.setTextColor(154, 114, 32);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text(sec.label, bx + boxWidth / 2, boxY + 5.5, { align: 'center' });

        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.text(String(sec.score), bx + boxWidth / 2, boxY + 15, { align: 'center' });

        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(`${sec.sub} (Max ${sec.max})`, bx + boxWidth / 2, boxY + 21, { align: 'center' });
      }
    });

    // 10. Level & Proficiency Badge
    const levelText = data.levelCategory || (data.totalScore >= 550 ? 'B2 / C1 — High Intermediate to Advanced' : data.totalScore >= 480 ? 'B1 / B2 — Intermediate Proficiency' : 'A2 / B1 — Elementary to Pre-Intermediate');
    doc.setFillColor(250, 246, 236);
    doc.setDrawColor(200, 155, 60);
    doc.setLineWidth(0.4);
    const badgeWidth = Math.max(doc.getTextWidth(levelText) + 30, 100);
    doc.roundedRect((pageWidth - badgeWidth) / 2, 118, badgeWidth, 7, 3.5, 3.5, 'FD');

    doc.setTextColor(154, 114, 32);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`Proficiency Level: ${levelText}`, pageWidth / 2, 122.8, { align: 'center' });

    // 11. Verification & Security Details (Bottom Left)
    const infoY = 142;
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('CERTIFICATE VERIFICATION', 26, infoY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Certificate No: ${data.certNumber || 'EJI/TOEFL-ITP/2026/0001'}`, 26, infoY + 5);
    doc.text(`Date of Issue: ${data.certIssueDate || issueDate}`, 26, infoY + 9);
    doc.text(`Online Verification: https://englishjoinindonesia.com/verify`, 26, infoY + 13);
    doc.text(`Authenticity: Digitally Encrypted & QR Validated`, 26, infoY + 17);

    // 12. Security Seal Stamp (Center Bottom)
    doc.setDrawColor(200, 155, 60);
    doc.setLineWidth(0.8);
    doc.circle(pageWidth / 2, infoY + 8, 12, 'D');
    doc.setLineWidth(0.3);
    doc.circle(pageWidth / 2, infoY + 8, 10.5, 'D');

    doc.setTextColor(154, 114, 32);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.text('ENGLISH JOIN', pageWidth / 2, infoY + 4, { align: 'center' });
    doc.setFontSize(6.5);
    doc.text('★ OFFICIAL ★', pageWidth / 2, infoY + 7.5, { align: 'center' });
    doc.setFontSize(5.5);
    doc.text('VERIFIED SEAL', pageWidth / 2, infoY + 11, { align: 'center' });
    doc.setFontSize(4.8);
    doc.text('INDONESIA', pageWidth / 2, infoY + 14, { align: 'center' });

    // 13. Official Signatures (Bottom Right)
    doc.setTextColor(15, 23, 42);
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text('Alwi Al Aidit, S.Pd., M.Hum.', pageWidth - 60, infoY + 8, { align: 'center' });

    // Signature line
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.5);
    doc.line(pageWidth - 95, infoY + 10, pageWidth - 25, infoY + 10);

    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Academic Director', pageWidth - 60, infoY + 14, { align: 'center' });

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('English Join Indonesia Language Center', pageWidth - 60, infoY + 18, { align: 'center' });

    // 14. Bottom Legal Footer
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(
      'This document is an official digital E-Certificate issued by English Join Indonesia. Valid for academic evaluations, LPDP, CPNS, BUMN, and professional requirements.',
      pageWidth / 2,
      pageHeight - 16,
      { align: 'center' }
    );

    // 15. Download File
    const sanitizedCertNo = (data.certNumber || '001').replace(/[/\\?%*:|"<>]/g, '-');
    const fileName = `E-Certificate_TOEFL_${sanitizedCertNo}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error generating PDF certificate:', error);
    throw error;
  }
};
