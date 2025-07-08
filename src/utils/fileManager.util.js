const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const path = require('path');

const createFolder = (folderPath) => {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`Carpeta creada en: ${folderPath}`);
    } else {
        console.log('La carpeta ya existe.');
    }
};


const mergePDFs = async (pdfPath1, pdfPath2, outputPath) => {
    try {
        const pdf1Bytes = fs.readFileSync(pdfPath1);
        const pdf2Bytes = fs.readFileSync(pdfPath2);

        const pdf1Doc = await PDFDocument.load(pdf1Bytes);
        const pdf2Doc = await PDFDocument.load(pdf2Bytes);

        const mergedPdf = await PDFDocument.create();

        const copiedPages1 = await mergedPdf.copyPages(pdf1Doc, pdf1Doc.getPageIndices());
        copiedPages1.forEach((page) => mergedPdf.addPage(page));

        const copiedPages2 = await mergedPdf.copyPages(pdf2Doc, pdf2Doc.getPageIndices());
        copiedPages2.forEach((page) => mergedPdf.addPage(page));

        const mergedPdfBytes = await mergedPdf.save();
        fs.writeFileSync(outputPath, mergedPdfBytes);

        console.log(`✅ PDF combinado guardado en: ${outputPath}`);
        return outputPath;
    } catch (error) {
        console.error('❌ Error al combinar los PDFs:', error);
        throw error;
    }
}
const combineInvoices = async (downloadFolder, invoiceNumber) => {
    const pdfDetallado = path.join(downloadFolder, `${invoiceNumber}_detalle.pdf`);
    const pdfProducto = path.join(downloadFolder, `${invoiceNumber}_producto.pdf`);
    const pdfFinal = path.join(downloadFolder, `${invoiceNumber}_completo.pdf`);

    if (fs.existsSync(pdfDetallado) && fs.existsSync(pdfProducto)) {
        return await mergePDFs(pdfDetallado, pdfProducto, pdfFinal);
    } else {
        console.error('❌ No se encontraron ambos PDFs para combinar.');
        return null;
    }
};


module.exports = {createFolder , combineInvoices};
