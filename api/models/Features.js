/**
 * Features.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    name: {
      type: 'String'
    },
    status: {
      type: 'string',
      isIn: ['active', 'deactive'],
      defaultsTo: 'active'
    },
    isDeleted: {
      type: 'Boolean',
      defaultsTo: false
    },
    description: {
      type: 'string',
    },
    updatedBy: {
      model: 'users'
    },
    addedBy: {
      model: 'Users'
    },
    createdAt: { type: 'ref', columnType: 'timestamp', autoCreatedAt: true },
    updatedAt: { type: 'ref', columnType: 'timestamp', autoUpdatedAt: true },



  },

};

