/**
 * Secretekeys.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  schema: true,
  primaryKey: "id",
  attributes: {
    type: { type : 'string', isIn : ["secret_key", "access_key"] },
    user_id: { model: 'users' },
    secret_key: { type: 'string', },
    access_key: { type: 'string', },

    isDeleted: { type: 'Boolean', defaultsTo: false, },
    addedBy: { model: 'users', },
    updatedBy: { model: 'users', },
    createdAt: { type: 'ref', columnType: 'date' },
    updatedAt: { type: 'ref', columnType: 'date' },
  },
};

