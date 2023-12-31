/**
 * License.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    license_number: {
      type: 'string'
    },
    license_name: {
      type: 'string'
    },
    front_img: {
      type: 'string'
    },
    back_img: {
      type: 'string'
    },
    status: {
      type: 'string',
      isIn: ['active', 'deactive'],
      defaultsTo: 'deactive',
    },
    isDeleted: {
      type: "Boolean",
      defaultsTo: false
    },
    updatedBy:{
      model:'users'
    },
    createdAt: {
      type: "ref",
      autoCreatedAt: true,
    },
    updatedAt: {
      type: "ref",
      autoUpdatedAt: true,
    },


  },

};

