/**
 * License.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    api_key: {
      type: 'string',
    },
    has_after_call_transcript: {
      type: 'string',
    },
    has_real_time_streaming_transcript: {
      type: 'string',
    },
    has_sentiment: {
      type: 'string',
    },
    
    isDeleted: {
      type: 'Boolean',
      defaultsTo: false,
    },
  
    createdAt: { type: 'ref', columnType: 'timestamp', autoCreatedAt: true },
    updatedAt: { type: 'ref', columnType: 'timestamp', autoUpdatedAt: true },
  },
};
