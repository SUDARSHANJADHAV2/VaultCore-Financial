package com.vaultcore.service;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;

import com.vaultcore.model.Account;
import com.vaultcore.model.Ledger;
import com.vaultcore.model.User;
import com.vaultcore.repository.AccountRepository;
import com.vaultcore.repository.LedgerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class StatementService {

    @Autowired private AccountRepository accountRepository;
    @Autowired private LedgerRepository  ledgerRepository;

    // ── Colours as DeviceRgb throughout (never mix with ColorConstants.*) ──
    private static final DeviceRgb COL_PRIMARY  = new DeviceRgb(13,  110, 253);
    private static final DeviceRgb COL_DARK     = new DeviceRgb(33,   37,  41);
    private static final DeviceRgb COL_WHITE    = new DeviceRgb(255, 255, 255); // ✅ Fix 1: DeviceRgb not ColorConstants.WHITE
    private static final DeviceRgb COL_DEBIT    = new DeviceRgb(220,  53,  69);
    private static final DeviceRgb COL_CREDIT   = new DeviceRgb(25,  135,  84);
    private static final DeviceRgb COL_ROW_ALT  = new DeviceRgb(248, 249, 250);
    private static final DeviceRgb COL_GREY     = new DeviceRgb(108, 117, 125);
    private static final DeviceRgb COL_BORDER   = new DeviceRgb(222, 226, 230);

    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm");

    // -----------------------------------------------------------------------
    public byte[] generateMonthlyStatement(String accountNumber, int month, int year)
            throws Exception {

        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new RuntimeException("Account not found: " + accountNumber));
        User user = account.getUser();

        LocalDateTime start = LocalDateTime.of(year, month, 1, 0, 0, 0);
        LocalDateTime end   = start.plusMonths(1).minusSeconds(1);

        List<Ledger> entries = ledgerRepository
                .findByAccountRefAndCreatedAtBetweenOrderByCreatedAtAsc(accountNumber, start, end);

        ByteArrayOutputStream baos   = new ByteArrayOutputStream();
        PdfDocument           pdfDoc = new PdfDocument(new PdfWriter(baos));
        Document              doc    = new Document(pdfDoc);
        doc.setMargins(40, 50, 40, 50);

        buildHeader(doc, month, year);
        buildAccountInfo(doc, account, user, start);
        buildSummary(doc, entries);
        buildTransactionTable(doc, entries);
        buildFooter(doc);

        doc.close();
        return baos.toByteArray();
    }

    // -----------------------------------------------------------------------
    //  Section builders
    // -----------------------------------------------------------------------

    private void buildHeader(Document doc, int month, int year) {
        Table t = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .setWidth(UnitValue.createPercentValue(100));

        Cell left = new Cell()
                .setBorder(Border.NO_BORDER)
                .setBackgroundColor(COL_DARK)
                .setPadding(14);
        left.add(new Paragraph("VaultCore Financial")
                .setFontColor(COL_WHITE).setBold().setFontSize(18));
        left.add(new Paragraph("Monthly Bank Statement")
                .setFontColor(new DeviceRgb(190, 190, 190)).setFontSize(10));
        t.addCell(left);

        Cell right = new Cell()
                .setBorder(Border.NO_BORDER)
                .setBackgroundColor(COL_DARK)
                .setTextAlignment(TextAlignment.RIGHT)
                .setPadding(14);
        right.add(new Paragraph(Month.of(month).name() + " " + year)
                .setFontColor(COL_WHITE).setBold().setFontSize(14));
        right.add(new Paragraph("Generated: " + LocalDateTime.now().format(DT_FMT))
                .setFontColor(new DeviceRgb(190, 190, 190)).setFontSize(9));
        t.addCell(right);

        doc.add(t);
        doc.add(spacer());
    }

    private void buildAccountInfo(Document doc, Account account, User user, LocalDateTime start) {
        Table t = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .setWidth(UnitValue.createPercentValue(100))
                .setMarginBottom(12);

        String periodStart = start.format(DateTimeFormatter.ofPattern("dd MMM yyyy"));
        String periodEnd   = start.plusMonths(1).minusDays(1)
                .format(DateTimeFormatter.ofPattern("dd MMM yyyy"));

        t.addCell(infoCell("Account Holder",   user.getUsername()));
        t.addCell(infoCell("Account Number",   account.getAccountNumber()));
        t.addCell(infoCell("Account Type",     account.getAccountType()));
        t.addCell(infoCell("Email",            user.getEmail() != null ? user.getEmail() : "-"));
        t.addCell(infoCell("Statement Period", periodStart + " to " + periodEnd));
        t.addCell(infoCell("Current Balance",  formatINR(account.getBalance())));

        doc.add(t);
    }

    private void buildSummary(Document doc, List<Ledger> entries) {
        BigDecimal totalDebits = entries.stream()
                .filter(e -> e.getEntryType() == Ledger.EntryType.DEBIT)
                .map(Ledger::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCredits = entries.stream()
                .filter(e -> e.getEntryType() == Ledger.EntryType.CREDIT)
                .map(Ledger::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        Table t = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1}))
                .setWidth(UnitValue.createPercentValue(100))
                .setMarginBottom(14);

        t.addCell(summaryCell("Total Transactions", String.valueOf(entries.size()), COL_PRIMARY));
        t.addCell(summaryCell("Total Credits",  formatINR(totalCredits), COL_CREDIT));
        t.addCell(summaryCell("Total Debits",   formatINR(totalDebits),  COL_DEBIT));

        doc.add(t);
    }

    private void buildTransactionTable(Document doc, List<Ledger> entries) {
        doc.add(new Paragraph("Transaction Details")
                .setBold().setFontSize(13)
                .setFontColor(COL_DARK).setMarginBottom(6));

        if (entries.isEmpty()) {
            doc.add(new Paragraph("No transactions found for this period.")
                    .setFontColor(COL_GREY).setItalic());
            return;
        }

        Table t = new Table(UnitValue.createPercentArray(new float[]{2.5f, 4f, 1.8f, 1.8f, 2f}))
                .setWidth(UnitValue.createPercentValue(100));

        // Header
        for (String h : new String[]{"Date & Time", "Description", "Debit (INR)", "Credit (INR)", "Balance (INR)"}) {
            t.addHeaderCell(new Cell()
                    .setBackgroundColor(COL_DARK)
                    .setBorder(Border.NO_BORDER)
                    .add(new Paragraph(h).setFontColor(COL_WHITE).setBold().setFontSize(8))
                    .setPadding(6));
        }

        // Data rows
        boolean alt = false;
        for (Ledger entry : entries) {
            boolean isDebit = entry.getEntryType() == Ledger.EntryType.DEBIT;

            // ✅ Fix 1: both branches are DeviceRgb — no type mismatch
            DeviceRgb rowBg = alt ? COL_ROW_ALT : COL_WHITE;
            alt = !alt;

            String desc = (entry.getDescription() != null && !entry.getDescription().isBlank())
                    ? entry.getDescription()
                    : (entry.getType() != null ? entry.getType() : "-");

            t.addCell(txnCell(entry.getCreatedAt().format(DT_FMT), rowBg, null, false));
            t.addCell(txnCell(desc, rowBg, null, false));
            t.addCell(txnCell(isDebit  ? formatINR(entry.getAmount()) : "-", rowBg,
                    isDebit  ? COL_DEBIT  : null, isDebit));
            t.addCell(txnCell(!isDebit ? formatINR(entry.getAmount()) : "-", rowBg,
                    !isDebit ? COL_CREDIT : null, !isDebit));
            t.addCell(txnCell(
                    entry.getBalanceAfter() != null ? formatINR(entry.getBalanceAfter()) : "-",
                    rowBg, null, false));
        }

        doc.add(t);
    }

    private void buildFooter(Document doc) {
        doc.add(spacer());
        doc.add(new Paragraph(
                "This is a computer-generated statement and does not require a signature. " +
                        "For queries contact support@vaultcore.com")
                .setFontSize(8).setFontColor(COL_GREY).setItalic()
                .setTextAlignment(TextAlignment.CENTER));
    }

    // -----------------------------------------------------------------------
    //  Cell helpers
    // -----------------------------------------------------------------------

    private Cell infoCell(String label, String value) {
        Cell cell = new Cell()
                // ✅ Fix 2: iText 7 uses setBorder(SolidBorder) — NO setBorderColor() method
                .setBorder(new SolidBorder(COL_BORDER, 1))
                .setPadding(8);
        cell.add(new Paragraph(label)
                .setFontColor(COL_GREY).setFontSize(8).setMarginBottom(2));
        cell.add(new Paragraph(value != null ? value : "-")
                .setBold().setFontSize(10));
        return cell;
    }

    private Cell summaryCell(String label, String value, DeviceRgb accent) {
        Cell cell = new Cell()
                .setBackgroundColor(COL_ROW_ALT)
                // ✅ Fix 2: SolidBorder with accent colour, not setBorderColor()
                .setBorder(new SolidBorder(accent, 2))
                .setPadding(10)
                .setTextAlignment(TextAlignment.CENTER);
        cell.add(new Paragraph(label).setFontSize(8).setFontColor(COL_GREY));
        cell.add(new Paragraph(value).setBold().setFontSize(11).setFontColor(accent));
        return cell;
    }

    private Cell txnCell(String text, DeviceRgb bg, DeviceRgb textColor, boolean bold) {
        Paragraph p = new Paragraph(text != null ? text : "-").setFontSize(8);
        if (textColor != null) p.setFontColor(textColor);
        if (bold)              p.setBold();

        return new Cell()
                .setBackgroundColor(bg)
                // ✅ Fix 2: SolidBorder, not setBorderColor()
                .setBorder(new SolidBorder(COL_BORDER, 0.5f))
                .add(p)
                .setPadding(5);
    }

    // -----------------------------------------------------------------------
    private Paragraph spacer() {
        return new Paragraph("\n").setFontSize(4);
    }

    private String formatINR(BigDecimal amount) {
        if (amount == null) return "-";
        return "Rs " + String.format("%,.2f", amount);
    }
}
