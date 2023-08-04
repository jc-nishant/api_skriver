/**
 * License.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    licence_id: {
      type: 'string',
    },
    has_after_call_transcript: {
      type: 'Boolean',
      defaultsTo: false,
    },
    has_real_time_streaming_transcript: {
      type: 'Boolean',
      defaultsTo: false,
    },
    has_sentiment: {
      type: 'Boolean',
      defaultsTo: false,
    },

    isDeleted: {
      type: 'Boolean',
      defaultsTo: false,
    },

    isAssigned: {
      type: 'Boolean',
      defaultsTo: false,
    },
    status: {
      type: 'string',
      isIn: ['active', 'deactive'],
      defaultsTo: 'active',
    },

    startDate: {
      type: 'ref',
      columnType: 'timestamp',
    },

    endDate: {
      type: 'ref',
      columnType: 'timestamp',
    },

    createdAt: { type: 'ref', columnType: 'timestamp', autoCreatedAt: true },
    updatedAt: { type: 'ref', columnType: 'timestamp', autoUpdatedAt: true },
  },
};
