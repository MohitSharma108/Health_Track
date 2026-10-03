'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

/** Dev default — writes to ./uploads and serves it back under /uploads
 * (wired up as static middleware in app.js). Swap for S3Storage in
 * production; nothing outside this file needs to change. */
class LocalStorage {
  constructor() {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  /** @param {Buffer} buffer @param {string} mimeType @returns {Promise<{url:string,key:string}>} */
  async save(buffer, mimeType) {
    const ext = (mimeType.split('/')[1] || 'bin').replace('jpeg', 'jpg');
    const key = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, key), buffer);
    return { url: `/uploads/${key}`, key };
  }
  async delete(key) {
    try {
      fs.unlinkSync(path.join(UPLOAD_DIR, key));
    } catch (e) {
      /* already gone — fine */
    }
  }
}

// class S3Storage {
//   constructor() { this.client = new S3Client({ region: process.env.S3_REGION }); }
//   async save(buffer, mimeType) { /* PutObjectCommand to process.env.S3_BUCKET, return CDN/public URL */ }
//   async delete(key) { /* DeleteObjectCommand */ }
// }

function getStorageProvider() {
  // `process.env.STORAGE_PROVIDER === 's3' ? new S3Storage() :`
  return new LocalStorage();
}

module.exports = { getStorageProvider, UPLOAD_DIR };
