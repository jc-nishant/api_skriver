/**
 * Category.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  schema: true,
  attributes: {
    name: {
      type: 'string',
    },
    description: {
      type: 'string',
    },
    image: {
      type: 'string',
      defaultsTo: '',
    },
    cat_type: {
      type: 'string',
    },
    status: {
      type: 'string',
      isIn: ['active', 'deactive'],
      defaultsTo: 'active',
    },

    isDeleted: {
      type: 'Boolean',
      defaultsTo: false,
    },
    deletedBy: {
      model: 'users',
    },
    deletedAt: { type: 'ref', columnType: 'date' },
    updatedBy: {
      model: 'users',
    },
    addedBy: {
      model: 'Users',
    },
    
    createdAt: { type: 'ref', columnType: 'timestamp', autoCreatedAt: true },
    updatedAt: { type: 'ref', columnType: 'timestamp', autoUpdatedAt: true },

    // createdAt: { type: 'ref', columnType: 'date' },
    // updatedAt: { type: 'ref', columnType: 'date' },
  },
};
