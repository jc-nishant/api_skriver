/**
 * Users.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */
var bcrypt = require('bcrypt-nodejs');
module.exports = {
  attributes: {
    api_key: {
      type: 'string',
    },
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
    mobileNo: {
      type: 'ref',
      columnType: 'bigint',
      // isNumber: true,
      // defaultsTo: 0
    },
    otp: {
      type: 'string',
    },
    countryCode: {
      type: 'string',
    },
    image: {
      type: 'string',
    },
    password: {
      type: 'string',
      columnName: 'encryptedPassword',
      minLength: 8,
    },
    isVerified: {
      type: 'string',
      isIn: ['Y', 'N'],
      defaultsTo: 'N',
    },
    role: {
      type: 'string',
    },
    verificationCode: {
      type: 'string',
    },
   

    domain: {
      type: 'string',
      isIn: ['web', 'ios', 'andriod'],
      defaultsTo: 'web',
    },
    isDeleted: {
      type: 'Boolean',
      defaultsTo: false,
    },
    addedBy: {
      model: 'users',
    },

    deletedBy: {
      model: 'users',
    },
    updatedBy: {
      model: 'users',
    },

    address: {
      type: 'string',
    },
    city: {
      type: 'string',
    },
    state: {
      type: 'string',
    },
    country: {
      type: 'string',
    },
    pincode: {
      type: 'string',
    },
    dialCode: {
      type: 'string',
      allowNull: true,
    },
    lastLogin: { type: 'ref', columnType: 'date' },
    createdAt: { type: 'ref', columnType: 'date' },
    zipCode: {
      type: 'string',
    },
    createdAt: { type: 'ref', columnType: 'timestamp', autoCreatedAt: true },
    updatedAt: { type: 'ref', columnType: 'timestamp', autoUpdatedAt: true },
    stripe_customer_id: { type: 'string', },
    api_key: {
      type: 'string',
      allowNull: true,
    },
    role_id: { model: 'roles', },

    license_id: { model: 'license', },
    company_id: {model: 'company',},

    status: {
      type: 'string',
      isIn: ['active', 'deactive'],
      defaultsTo: 'active',
    },


  },

  beforeCreate: function (user, next) {
    if (user.firstName && user.lastName) {
      user.fullName = user.firstName + ' ' + user.lastName;
    }

    if (user.hasOwnProperty('password')) {
      user.password = bcrypt.hashSync(user.password, bcrypt.genSaltSync(10));
      next(false, user);
    } else {
      next(null, user);
    }
  },
  authenticate: function (email, password) {
    console.log('in auth    ');
    var query = {};
    query.email = email;
    query.$or = [{ roles: ['SA', 'A'] }];

    return Users.findOne(query)
      .populate('roleId')
      .then(function (user) {
        //return API.Model(Users).findOne(query).then(function(user){
        return user && user.date_verified && user.comparePassword(password)
          ? user
          : null;
      });
  },
  customToJSON: function () {
    // Return a shallow copy of this record with the password and ssn removed.
    return _.omit(this, ['password', 'verificationCode']);
  },
};
