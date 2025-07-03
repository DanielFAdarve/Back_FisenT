class InvoiceInfo {
  constructor({ idInvoice, invoiceNumber, encounterNumber, patient, documentNumber, responsible, invoiceDate, contractNumber, namePlan, invoiceState, countPDF }) {
    this.idInvoice = idInvoice;
    this.invoiceNumber = invoiceNumber;
    this.encounterNumber = encounterNumber;
    this.patient = patient;
    this.documentNumber = documentNumber;
    this.responsible = responsible;
    this.invoiceDate = invoiceDate;
    this.contractNumber = contractNumber;
    this.namePlan = namePlan;
    this.invoiceState = invoiceState;
    this.countPDF = countPDF;
  }
}

module.exports = { InvoiceInfo };