// const express = require("express");
// const router = express.Router();
// const { auth } = require("../middlewares/auth");
// const { BlobSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } = require("@azure/storage-blob");

// // Test endpoint to verify authentication
// router.get("/test", auth("teacher"), (req, res) => {
//   res.json({ message: "Authentication working!", user: req.user });
// });

// // Generates a short-lived SAS URL to upload a blob directly from browser
// router.get("/sas", auth("teacher"), async (req, res) => {
//   try {
//     const { filename, contentType } = req.query;
//     if (!filename) return res.status(400).json({ error: "filename is required" });
    
//     const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
//     const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
//     const containerName = process.env.AZURE_STORAGE_CONTAINER || "uploads";
    
//     console.log("Azure Storage Config:", { accountName, containerName, hasKey: !!accountKey });
//     console.log("Original filename:", filename);
    
//     if (!accountName || !accountKey) {
//       return res.status(500).json({ error: "Azure Storage credentials not configured" });
//     }
    
//     // The filename is already encoded by the frontend, so we use it as-is for blob name
//     const blobName = filename; // Already encoded by frontend
    
//     const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

//     const now = new Date();
//     const expiry = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes
    
//     const sas = generateBlobSASQueryParameters({
//       containerName,
//       blobName: blobName,
//       startsOn: now,
//       expiresOn: expiry,
//       permissions: BlobSASPermissions.parse("cw"), // create, write
//       contentType: contentType || undefined,
//     }, sharedKeyCredential).toString();

//     // For the upload URL, we need to encode the blob name again for the URL
//     const uploadUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${encodeURIComponent(blobName)}?${sas}`;
//     // For the blob URL, we also need to encode it for proper URL format
//     const blobUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${encodeURIComponent(blobName)}`;
    
//     console.log("Generated SAS URL for blob:", blobName);
//     console.log("Upload URL:", uploadUrl);
//     console.log("Blob URL:", blobUrl);
    
//     res.json({ uploadUrl, blobUrl, expiresOn: expiry.toISOString() });
//   } catch (e) {
//     console.error("SAS generation error:", e);
//     res.status(500).json({ error: e.message });
//   }
// });

// module.exports = router;
const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/auth");
const { 
  BlobSASPermissions, 
  generateBlobSASQueryParameters, 
  StorageSharedKeyCredential 
} = require("@azure/storage-blob");

// Test authentication
router.get("/test", auth("teacher"), (req, res) => {
  res.json({ message: "Authentication working!", user: req.user });
});

// Generate SAS for direct browser upload
router.get("/sas", auth("teacher"), async (req, res) => {
  try {
    const { filename } = req.query;
    if (!filename) return res.status(400).json({ error: "filename is required" });

    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const containerName = process.env.AZURE_STORAGE_CONTAINER || "uploads";

    if (!accountName || !accountKey) {
      return res.status(500).json({ error: "Azure Storage credentials not configured" });
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

    const now = new Date();
    const expiry = new Date(now.getTime() + 15 * 60 * 1000); // Valid for 15 minutes

    // ✅ Permissions updated to prevent 403 (Create + Write + Read)
    const permissions = BlobSASPermissions.parse("cwr");

    const sasToken = generateBlobSASQueryParameters({
      containerName,
      blobName: filename,
      permissions,
      startsOn: now,
      expiresOn: expiry,
    }, sharedKeyCredential).toString();

    const uploadUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${encodeURIComponent(filename)}?${sasToken}`;
    const blobUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${encodeURIComponent(filename)}`;

    res.json({ uploadUrl, blobUrl, expiresOn: expiry.toISOString() });

  } catch (err) {
    console.error("SAS generation error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;


