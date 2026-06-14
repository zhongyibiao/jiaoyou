/**
 * 推送服务
 * 预留接口，支持极光、Firebase、APNs、个推
 * 当前为 Mock 实现
 */

const logger = require('../utils/logger');

class PushService {
  constructor() {
    this.provider = process.env.PUSH_PROVIDER || 'mock';
    this.appKey = process.env.PUSH_APP_KEY || '';
    this.masterSecret = process.env.PUSH_MASTER_SECRET || '';
    this.fcmServerKey = process.env.FCM_SERVER_KEY || '';
  }

  async pushToUser(userId, payload) {
    switch (this.provider) {
      case 'jpush':
        return this._pushJpush(userId, payload);
      case 'fcm':
        return this._pushFcm(userId, payload);
      case 'apns':
        return this._pushApns(userId, payload);
      case 'getui':
        return this._pushGetui(userId, payload);
      default:
        return this._pushMock(userId, payload);
    }
  }

  async pushBatch(userIds, payload) {
    return Promise.all(userIds.map((uid) => this.pushToUser(uid, payload)));
  }

  _buildPayload({ title, body, data, badge, sound }) {
    return {
      notification: { title, body, sound: sound || 'default', badge },
      data: data || {},
    };
  }

  async _pushJpush(userId, payload) {
    // TODO: 接入极光推送
    // const JPush = require('jpush-sdk');
    // const client = JPush.buildClient(this.appKey, this.masterSecret);
    // await client.push().setPlatform(JPush.ALL).setAudience(JPush.alias(userId)).setNotification(payload.notification).send();
    logger.info(`[Push-JPush] userId=${userId} title=${payload.notification?.title}`);
    return { success: true, provider: 'jpush' };
  }

  async _pushFcm(userId, payload) {
    // TODO: 接入 FCM
    // const admin = require('firebase-admin');
    // await admin.messaging().send({ token: deviceToken, notification: payload.notification, data: payload.data });
    logger.info(`[Push-FCM] userId=${userId} title=${payload.notification?.title}`);
    return { success: true, provider: 'fcm' };
  }

  async _pushApns(userId, payload) {
    // TODO: 接入 APNs
    // const apn = require('@parse/node-apn');
    // const provider = new apn.Provider({ token: { key, keyId, teamId } });
    // const note = new apn.Notification({ alert: payload.notification.body, topic: bundleId });
    // await provider.send(note, deviceToken);
    logger.info(`[Push-APNs] userId=${userId} title=${payload.notification?.title}`);
    return { success: true, provider: 'apns' };
  }

  async _pushGetui(userId, payload) {
    // TODO: 接入个推
    // const GeTui = require('getui-push-sdk');
    // const gt = new GeTui({ host, appId, appKey, masterSecret });
    // await gt.pushMessageToSingle({ cid: deviceToken, ...payload });
    logger.info(`[Push-Getui] userId=${userId} title=${payload.notification?.title}`);
    return { success: true, provider: 'getui' };
  }

  async _pushMock(userId, payload) {
    logger.info(`[Push-Mock] userId=${userId} title=${payload.notification?.title}`);
    return { success: true, provider: 'mock' };
  }
}

module.exports = new PushService();
