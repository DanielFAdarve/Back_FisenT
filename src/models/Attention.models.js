class Attention {
    constructor({ idEncounter, idPatient, idTriage, patientName, patientDocument, patientGenere, nameActualLocation, nameActualService, encounterStart, isDead }) {
        this.idEncounter = idEncounter;
        this.idPatient = idPatient;
        this.idTriage = idTriage;
        this.patientName = patientName;
        this.patientDocument = patientDocument;
        this.patientGenere = patientGenere;
        this.nameActualLocation = nameActualLocation;
        this.nameActualService = nameActualService;
        this.encounterStart = encounterStart;
        this.isDead = isDead;
    }
}

module.exports = {Attention};