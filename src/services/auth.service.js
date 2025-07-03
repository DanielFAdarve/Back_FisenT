const axios = require('axios');

const updateSession = async (credentials) => {
    const url = process.env.AUTH_API_URL;

    const params = {
        UserName: credentials.username || process.env.AUTH_USERNAME,
        passwrod: credentials.password || process.env.AUTH_PASSWORD,
        idOffice: credentials.officeId || process.env.AUTH_OFFICE_ID,
        idCompany: credentials.companyId || process.env.AUTH_COMPANY_ID,
        idConnection: credentials.connectionId || process.env.AUTH_CONNECTION_ID,
    };

    const response = await axios.post(url, null, { params, withCredentials: true });
    return response;
};

module.exports = { updateSession };
