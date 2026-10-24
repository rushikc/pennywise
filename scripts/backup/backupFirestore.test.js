/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const {walkRootCollections} = require('./backupFirestore');

function fakeDb(nodes) {
  function collectionAt(path) {
    const col = nodes[path] || {docs: {}};
    return {
      id: path.split('/').pop(),
      async listDocuments() {
        return Object.keys(col.docs).map((id) => docAt(path ? `${path}/${id}` : id));
      },
    };
  }

  function docAt(path) {
    const parts = path.split('/');
    const colPath = parts.slice(0, -1).join('/');
    const id = parts[parts.length - 1];
    const col = nodes[colPath] || {docs: {}};
    const record = col.docs[id] || {exists: false, data: {}, collections: []};
    return {
      id,
      async get() {
        return {exists: Boolean(record.exists), data: () => record.data};
      },
      async listCollections() {
        return (record.collections || []).map((name) => collectionAt(`${path}/${name}`));
      },
    };
  }

  return {
    async listCollections() {
      return (nodes.__root || []).map((name) => collectionAt(name));
    },
  };
}

describe('walkRootCollections', () => {
  it('includes nested subcollections when the parent document does not exist', async () => {
    const db = fakeDb({
      __root: ['users'],
      users: {
        docs: {
          uid1: {exists: false, data: {}, collections: ['expense']},
        },
      },
      'users/uid1/expense': {
        docs: {
          exp1: {exists: true, data: {cost: 10, vendor: 'A'}, collections: []},
        },
      },
    });
    const {tree, counts} = await walkRootCollections(db);
    assert.equal(counts.users, 1);
    assert.equal(tree.users[0].id, 'uid1');
    assert.equal(tree.users[0].cost, undefined);
    assert.equal(tree.users[0].__collections.expense[0].id, 'exp1');
    assert.equal(tree.users[0].__collections.expense[0].cost, 10);
  });
});
