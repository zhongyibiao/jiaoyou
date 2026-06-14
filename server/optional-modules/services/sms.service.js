/**
 * 短信服务
 * 预留接口，支持接入阿里云、腾讯云、Twilio 等短信服务商
 * 当前为 Mock 实现，可直接替换为真实 SDK 调用
 */

const logger = require('../utils/logger');

class SmsService {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || 'mock';
    this.accessKey = process.env.SMS_ACCESS_KEY || '';
    this.accessSecret = process.env.SMS_ACCESS_SECRET || '';
    this.signName = process.env.SMS_SIGN_NAME || 'jiaoyou';
    this.templateCode = process.env.SMS_TEMPLATE_CODE || '';
    this.rateLimitMap = new Map();
  }

  async sendCode(phone, code) {
    this._checkRateLimit(phone);
    switch (this.provider) {
      case 'aliyun':
        return this._sendAliyun(phone, code);
      case 'tencent':
        return this._sendTencent(phone, code);
      case 'twilio':
        return this._sendTwilio(phone, code);
      default:
        return this._sendMock(phone, code);
    }
  }

  async _sendAliyun(phone, code) {
    // TODO: 接入阿里云短信 SDK
    // const Core = require('@alicloud/pop-core');
    // const client = new Core({ accessKeyId: this.accessKey, accessKeySecret: this.accessSecret, endpoint: 'https://dysmsapi.aliyuncs.com' });
    // const result = await client.request('SendSms', { PhoneNumbers: phone, SignName: this.signName, TemplateCode: this.templateCode, TemplateParam: JSON.stringify({ code }) });
    logger.info(`[SMS-Aliyun] send to ${phone}, code: ${code}`);
    return { success: true, provider: 'aliyun', phone };
  }

  async _sendTencent(phone, code) {
    // TODO: 接入腾讯云短信 SDK
    // const QcloudSms = require('qcloudsms_js');
    // const sms = QcloudSms(this.accessKey, this.accessSecret);
    // const ssender = sms.SmsSingleSender();
    // await ssender.sendWithParam(86, phone, this.templateCode, [code, '5'], this.signName, '', '');
    logger.info(`[SMS-Tencent] send to ${phone}, code: ${code}`);
    return { success: true, provider: 'tencent', phone };
  }

  async _sendTwilio(phone, code) {
    // TODO: 接入 Twilio SDK
    // const twilio = require('twilio')(this.accessKey, this.accessSecret);
    // await twilio.messages.create({ to: phone, from: process.env.TWILIO_FROM, body: `Your code is ${code}` });
    logger.info(`[SMS-Twilio] send to ${phone}, code: ${code}`);
    return { success: true, provider: 'twilio', phone };
  }

  async _sendMock(phone, code) {
    logger.info(`[SMS-Mock] send to ${phone}, code: ${code}`);
    return { success: true, provider: 'mock', phone, code };
  }

  _checkRateLimit(phone) {
    const now = Date.now();
    const record = this.rateLimitMap.get(phone) || { count: 0, firstAt: now };
    if (now - record.firstAt > 60_000) {
      this.rateLimitMap.set(phone, { count: 1, firstAt: now });
      return;
    }
    record.count += 1;
    if (record.count > 1) {
      const err = new Error('请求过于频繁，请稍后再试');
      err.statusCode = 429;
      throw err;
    }
    this.rateLimitMap.set(phone, record);
  }
}

module.exports = new SmsService();
