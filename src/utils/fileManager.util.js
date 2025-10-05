const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const path = require('path');

/**
 * The `createFolder` function checks if a folder exists at the specified path and creates it if it
 * doesn't.
 * @param folderPath - The `folderPath` parameter in the `createFolder` function is the path where you
 * want to create a new folder. It is a string that represents the directory path where the new folder
 * will be created.
 */
const createFolder = (folderPath) => {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`Carpeta creada en: ${folderPath}`);
    } else {
        console.log('La carpeta ya existe.');
    }
};

/**
 * The function `mergePDFs` combines two PDF files into a single PDF file and saves it to a specified
 * output path.
 * @param pdfPath1 - The `pdfPath1` parameter in the `mergePDFs` function is the file path to the first
 * PDF that you want to merge.
 * @param pdfPath2 - The `pdfPath2` parameter in the `mergePDFs` function refers to the file path of
 * the second PDF that you want to merge with the first PDF specified by `pdfPath1`. This function
 * reads both PDF files, combines their pages into a new PDF document, and saves the merged
 * @param outputPath - The `outputPath` parameter in the `mergePDFs` function refers to the file path
 * where the combined PDF file will be saved after merging the contents of the PDF files specified by
 * `pdfPath1` and `pdfPath2`. This parameter should be a string representing the file path where you
 * @returns The function `mergePDFs` is returning the `outputPath` where the merged PDF file is saved.
 */

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
/**
 * The `combineInvoices` function merges two PDF files into a single PDF file if both files exist in
 * the specified download folder.
 * @param downloadFolder - The `downloadFolder` parameter in the `combineInvoices` function represents
 * the directory where the PDF files are located. It is a string that specifies the path to the folder
 * where the PDF files for the invoices are stored.
 * @param invoiceNumber - The `invoiceNumber` parameter in the `combineInvoices` function represents
 * the unique identifier or number associated with the invoice for which you want to combine the
 * detailed and product PDF files into a single complete PDF file.
 * @returns The `combineInvoices` function returns the result of merging two PDF files (`pdfDetallado`
 * and `pdfProducto`) into a single PDF file (`pdfFinal`) using the `mergePDFs` function if both input
 * PDF files exist in the specified `downloadFolder`. If either of the input PDF files is missing, it
 * logs an error message and returns `null`.
 */
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
