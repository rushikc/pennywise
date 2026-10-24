/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
const {loadGcpNames} = require('../gcpNames');

function refreshTokenSecretId(uid) {
  return `${loadGcpNames().gmailRefreshTokenPrefix}${uid}`;
}

function secretResourceName(projectId, uid) {
  return `projects/${projectId}/secrets/${refreshTokenSecretId(uid)}`;
}

function createTokenStore(client = new SecretManagerServiceClient()) {
  async function saveRefreshToken(projectId, uid, refreshToken) {
    const secretId = refreshTokenSecretId(uid);
    const parent = `projects/${projectId}`;
    const name = secretResourceName(projectId, uid);
    try {
      await client.getSecret({name});
    } catch (error) {
      if (error.code !== 5) {
        throw error;
      }
      await client.createSecret({
        parent,
        secretId,
        secret: {replication: {automatic: {}}},
      });
    }
    await client.addSecretVersion({
      parent: name,
      payload: {data: Buffer.from(refreshToken, 'utf8')},
    });
  }

  async function readRefreshToken(projectId, uid) {
    const name = `${secretResourceName(projectId, uid)}/versions/latest`;
    const [version] = await client.accessSecretVersion({name});
    return Buffer.from(version.payload.data).toString('utf8');
  }

  async function deleteRefreshToken(projectId, uid) {
    try {
      await client.deleteSecret({name: secretResourceName(projectId, uid)});
    } catch (error) {
      if (error.code !== 5) {
        throw error;
      }
    }
  }

  return {saveRefreshToken, readRefreshToken, deleteRefreshToken, refreshTokenSecretId};
}

module.exports = {
  createTokenStore,
  refreshTokenSecretId,
  secretResourceName,
};
