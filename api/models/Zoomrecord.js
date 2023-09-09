/**
 * Zoomrecord.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    fileid: {
      type: 'string',
    },
    created_on: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    metadata: {
      type: 'string',
    },
    status: {
      type: 'string',
    },
    type: {
      type: 'string',
    },
    language: {
      type: 'string',
    },
    addedBy: {
      model: 'users',
    },
    createdAt: { type: 'ref', columnType: 'timestamp', autoCreatedAt: true },
    updatedAt: { type: 'ref', columnType: 'timestamp', autoUpdatedAt: true },

  },

};

