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
    const [added] = await client.addSecretVersion({
      parent: name,
      payload: {data: Buffer.from(refreshToken, 'utf8')},
    });
    await destroyOlderSecretVersions(client, name, added && added.name);
  }

  async function destroyOlderSecretVersions(client, parent, keepName) {
    if (!client.listSecretVersions || !client.destroySecretVersion) {
      return;
    }
    const [versions] = await client.listSecretVersions({parent});
    for (const version of versions || []) {
      if (!version || !version.name || version.name === keepName) {
        continue;
      }
      const state = String(version.state || '');
      if (state === 'DESTROYED' || state === '3') {
        continue;
      }
      await client.destroySecretVersion({name: version.name});
    }
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
