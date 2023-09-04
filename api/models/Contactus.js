/**
 * Contactus.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    firstName: {
      type: 'string',
    },
    lastName: {
      type: 'string',
    },
    fullName: {
      type: 'string',
    },
    email: {
      type: 'string',
      isEmail: true,
    },
    message: {
      type: 'string',
    },
    addedBy: { model: 'users' },
    updatedBy: { model: 'users' },
    isDeleted: { type: 'Boolean', defaultsTo: false },
    createdAt: { type: 'ref', columnType: 'timestamp', autoCreatedAt: true },
    updatedAt: { type: 'ref', columnType: 'timestamp', autoUpdatedAt: true },

  },

};

