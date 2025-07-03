class User {
    constructor(username, password, officeId, companyId, connectionId) {
        this.username = username;
        this.password = password;
        this.officeId = officeId;
        this.companyId = companyId;
        this.connectionId = connectionId;
    }
}

module.exports = User;
