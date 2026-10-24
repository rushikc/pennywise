/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {
  Timestamp,
  GeoPoint,
  DocumentReference,
} = require('firebase-admin/firestore');

function serialize(value) {
  if (value === null || value === undefined) {
    return value;
  }
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value instanceof GeoPoint) {
    return {latitude: value.latitude, longitude: value.longitude};
  }
  if (value instanceof DocumentReference) {
    return value.path;
  }
  if (Array.isArray(value)) {
    return value.map(serialize);
  }
  if (typeof value === 'object' && value.constructor === Object) {
    const out = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = serialize(nested);
    }
    return out;
  }
  return value;
}

function timestampFolderName(date) {
  return date.toISOString().replace(/\.\d+Z$/, '').replace(/:/g, '-');
}

function payloadWithoutId(doc) {
  const {id: _id, ...rest} = doc;
  return rest;
}

module.exports = {
  serialize,
  timestampFolderName,
  payloadWithoutId,
};
