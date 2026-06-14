/**
 * 图片/文件存储服务
 * 预留接口，支持阿里云 OSS、腾讯云 COS、AWS S3、七牛云
 * 当前为 Mock 实现，生成可访问的占位 URL
 */

const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

class StorageService {
  constructor() {
    this.provider = process.env.STORAGE_PROVIDER || 'mock';
    this.bucket = process.env.STORAGE_BUCKET || 'jiaoyou';
    this.region = process.env.STORAGE_REGION || 'oss-cn-hangzhou';
    this.endpoint = process.env.STORAGE_ENDPOINT || '';
    this.accessKey = process.env.STORAGE_ACCESS_KEY || '';
    this.accessSecret = process.env.STORAGE_ACCESS_SECRET || '';
    this.cdnDomain = process.env.STORAGE_CDN_DOMAIN || 'https://cdn.jiaoyou.example.com';
    this.allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    this.maxSize = 10 * 1024 * 1024; // 10MB
  }

  async uploadFile(buffer, originalName, mimeType) {
    this._validateFile(buffer, mimeType);
    const ext = path.extname(originalName) || this._extFromMime(mimeType);
    const filename = this._genFilename(ext);
    switch (this.provider) {
      case 'aliyun-oss':
        return this._uploadAliyun(buffer, filename, mimeType);
      case 'tencent-cos':
        return this._uploadTencent(buffer, filename, mimeType);
      case 'aws-s3':
        return this._uploadS3(buffer, filename, mimeType);
      case 'qiniu':
        return this._uploadQiniu(buffer, filename, mimeType);
      default:
        return this._uploadMock(filename);
    }
  }

  async deleteFile(url) {
    logger.info(`[Storage] delete ${url}`);
    // TODO: 真实实现调用 provider 删除接口
    return { success: true };
  }

  async generateUploadSignature(prefix) {
    // 预留：客户端直传签名
    // TODO: 使用 provider 签名算法
    return {
      provider: this.provider,
      bucket: this.bucket,
      prefix: prefix || 'uploads/',
      expires: Math.floor(Date.now() / 1000) + 600,
      signature: crypto.randomBytes(16).toString('hex'),
    };
  }

  _validateFile(buffer, mimeType) {
    if (!this.allowedTypes.includes(mimeType)) {
      const err = new Error('不支持的文件类型');
      err.statusCode = 400;
      throw err;
    }
    if (buffer.length > this.maxSize) {
      const err = new Error('文件大小超过限制');
      err.statusCode = 413;
      throw err;
    }
  }

  _extFromMime(mimeType) {
    const map = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
    return map[mimeType] || '.bin';
  }

  _genFilename(ext) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
    const hash = crypto.randomBytes(8).toString('hex');
    return `${date}/${hash}${ext}`;
  }

  async _uploadAliyun(buffer, filename, mimeType) {
    // TODO: 接入阿里云 OSS SDK
    // const OSS = require('ali-oss');
    // const client = new OSS({ region: this.region, accessKeyId: this.accessKey, accessKeySecret: this.accessSecret, bucket: this.bucket });
    // const result = await client.put(filename, buffer, { headers: { 'Content-Type': mimeType } });
    return { url: `${this.cdnDomain}/${filename}`, provider: 'aliyun-oss' };
  }

  async _uploadTencent(buffer, filename, mimeType) {
    // TODO: 接入腾讯云 COS SDK
    // const COS = require('cos-nodejs-sdk-v5');
    // const cos = new COS({ SecretId: this.accessKey, SecretKey: this.accessSecret });
    // await cos.putObject({ Bucket: this.bucket, Region: this.region, Key: filename, Body: buffer });
    return { url: `${this.cdnDomain}/${filename}`, provider: 'tencent-cos' };
  }

  async _uploadS3(buffer, filename, mimeType) {
    // TODO: 接入 AWS S3 SDK
    // const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    // const client = new S3Client({ region: this.region, credentials: { accessKeyId: this.accessKey, secretAccessKey: this.accessSecret } });
    // await client.send(new PutObjectCommand({ Bucket: this.bucket, Key: filename, Body: buffer, ContentType: mimeType }));
    return { url: `${this.cdnDomain}/${filename}`, provider: 'aws-s3' };
  }

  async _uploadQiniu(buffer, filename, mimeType) {
    // TODO: 接入七牛云 SDK
    // const qiniu = require('qiniu');
    // const mac = new qiniu.auth.digest.Mac(this.accessKey, this.accessSecret);
    // const config = new qiniu.conf.Config({ zone: qiniu.zone.Zone_z0 });
    // const formUploader = new qiniu.form_up.FormUploader(config);
    // const putExtra = new qiniu.form_up.PutExtra();
    // const token = new qiniu.rs.PutPolicy({ scope: this.bucket }).uploadToken(mac);
    // await formUploader.put(token, filename, buffer, putExtra);
    return { url: `${this.cdnDomain}/${filename}`, provider: 'qiniu' };
  }

  async _uploadMock(filename) {
    return { url: `${this.cdnDomain}/${filename}`, provider: 'mock' };
  }
}

module.exports = new StorageService();
