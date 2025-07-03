// const { ShareServiceClient } = require('@azure/storage-file-share');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const { ShareServiceClient, StorageSharedKeyCredential } = require("@azure/storage-file-share");
require("dotenv").config();
// Configuración de Azure Files
const AZURE_STORAGE_ACCOUNT = process.env.AZURE_STORAGE_ACCOUNT;
const AZURE_STORAGE_KEY = process.env.AZURE_STORAGE_KEY;
const SHARE_NAME = process.env.AZURE_SHARE_NAME;

const serviceClient = new ShareServiceClient(
  `https://${AZURE_STORAGE_ACCOUNT}.file.core.windows.net`,
  new StorageSharedKeyCredential(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_KEY)
);

async function uploadBufferToAzure(buffer, remotePath) {
    try {
      const shareClient = serviceClient.getShareClient(SHARE_NAME);
      const pathParts = remotePath.split("/");
      const folderPath = pathParts.slice(0, -1).join("/");
      const fileName = pathParts[pathParts.length - 1];
      const directoryClient = shareClient.getDirectoryClient(folderPath);
  
      if (folderPath) {
        const exists = await directoryClient.exists();
        if (!exists) {
          await directoryClient.create();
        }
      }
  
      const fileClient = directoryClient.getFileClient(fileName);
      console.log(`⬆️ Subiendo archivo: ${remotePath}`);
      await fileClient.create(buffer.length);
      await fileClient.uploadRange(buffer, 0, buffer.length);
  
      console.log("✅Archivo subido con éxito:", remotePath);
    } catch (error) {
      console.error("Error al subir el archivo a Azure Files:", error.message);
    }
  }
  
  const downloadAndUploadPDF = async (url, remotePath) => {
    try {
      const response = await axios.get(url, { responseType: "arraybuffer" });
  
      if (response.status !== 200) {
        throw new Error(`❌ Falló la descarga del PDF. Estado: ${response.status}`);
      }
  
      await uploadBufferToAzure(response.data, remotePath);
    } catch (error) {
      console.warn(`Error en el proceso subiendo a azure: ${error.message}`);
    }
  };


const downloadPDF = async (url, fileName, filePath) => {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });

        if (response.status !== 200) {
            throw new Error(`Failed to download PDF. Status: ${response.status}`);
        }

        const fullPath = path.join(filePath, fileName);
        fs.writeFileSync(fullPath, response.data);

        return fullPath;

    } catch (error) {
        console.error(`Error downloading PDF: ${error.message}`);
        throw error;
    }
};
  
module.exports = {downloadPDF,downloadAndUploadPDF,uploadBufferToAzure};