/**
 * License.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    company_name: {
      type: 'string',
    },
    status: {
      type: 'string',
      isIn: ['active', 'deactive'],
      defaultsTo: 'active',
    },
    addedBy: {
      model: 'users',
    },
    isDeleted: {
      type: 'Boolean',
      defaultsTo: false,
    },
    updatedBy: {
      model: 'users',
    },
    createdAt: { type: 'ref', columnType: 'timestamp', autoCreatedAt: true },
    updatedAt: { type: 'ref', columnType: 'timestamp', autoUpdatedAt: true },
  },
};