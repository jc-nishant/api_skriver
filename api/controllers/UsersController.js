/**
 * UsersController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const credentials = require('../../config/local.js');
const bcrypt = require('bcrypt-nodejs');
var constantObj = sails.config.constants;
var constant = require('../../config/local.js');
const SmtpController = require('../controllers/SmtpController');
const db = sails.getDatastore().manager;
const reader = require('xlsx');
var fs = require('fs');
const readXlsxFile = require('read-excel-file/node');
var ObjectId = require('mongodb').ObjectID;
const Emails = require('../../Emails/onBoarding.js');
var uuid = require('uuid');

generateVeificationCode = function () {
  // action are perform to generate VeificationCode for user
  var length = 9,
    charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    retVal = '';

  for (var i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
};

generatePassword = function () {
  // action are perform to generate VeificationCode for user
  var length = 4,
    charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    retVal = '';

  for (var i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }

  lowercase = 'abcdefghijklmnopqrstuvwxyz';
  lowercaseCharacterLength = 2;
  for (var i = 0, n = lowercase.length; i < lowercaseCharacterLength; ++i) {
    retVal += lowercase.charAt(Math.floor(Math.random() * n));
  }

  specialCharacter = '@%$#&-!';
  specialCharacterLength = 1;

  for (
    var i = 0, n = specialCharacter.length;
    i < specialCharacterLength;
    ++i
  ) {
    retVal += specialCharacter.charAt(Math.floor(Math.random() * n));
  }
  numeric = '0123456789';
  numericLength = 2;
  for (var i = 0, n = numeric.length; i < numericLength; ++i) {
    retVal += numeric.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
};

generateOTP = function () {
  // action are perform to generate VeificationCode for user
  var length = 6,
    charset = '1234567890',
    retVal = '';

  for (var i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
};

module.exports = {
  /**
   *
   * @param {*} req
   * @param {*} res
   * @returns
   * @description Used to register User
   */
  register: async (req, res) => {
    if (!req.body.email || typeof req.body.email == undefined) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.EMAIL_REQUIRED },
      });
    }

    if (!req.body.password || typeof req.body.password == undefined) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.PASSWORD_REQUIRED },
      });
    }
    var date = new Date();
    try {
      var user = await Users.findOne({
        email: req.body.email.toLowerCase(),
        isDeleted: false,
      });
      if (user) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: constantObj.user.EMAIL_EXIST },
        });
      } else {
        var randomStr = uuid.v4();
        //console.log(randomStr);

        req.body['api_key'] = randomStr;
        req.body['date_registered'] = date;
        req.body['date_verified'] = date;
        req.body['status'] = 'active';
        req.body['role'] = req.body.role ? req.body.role : 'user';

        // if (req.body.firstName && req.body.lastName) {
        //     req.body["fullName"] = req.body.firstName + ' ' + req.body.lastName
        // }
        var newUser = await Users.create(req.body).fetch();
        if (newUser) {
          userVerifyLink({
            email: newUser.email,
            fullName: newUser.fullName,
            id: newUser.id,
          });

          return res.status(200).json({
            success: true,
            code: 200,
            data: newUser,
            message: constantObj.user.SUCCESSFULLY_REGISTERED,
          });
        }
      }
    } catch (err) {
      return res.status(400).json({ success: true, code: 400, error: err });
    }
  },

  /**
   *
   * @reqBody  : {email,password}
   * @param {*} res
   * @returns
   */
  adminSignin: async (req, res) => {
    if (!req.body.email || typeof req.body.email == undefined) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.EMAIL_REQUIRED },
      });
    }

    if (!req.body.password || typeof req.body.password == undefined) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.PASSWORD_REQUIRED },
      });
    }

    var user = await Users.findOne({
      email: req.body.email.toLowerCase(),
      isDeleted: false,
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 404,
          message: constantObj.user.INVALID_USER,
        },
      });
    }

    if (user && user.status == 'deactive') {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.USERNAME_INACTIVE },
      });
    }

    if (user && user.status != 'active' && user.isVerified != 'Y') {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.USERNAME_INACTIVE },
      });
    }

    if (!bcrypt.compareSync(req.body.password, user.password)) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.WRONG_PASSWORD },
      });
    } else {
      var token = jwt.sign(
        { user_id: user.id, fullName: user.fullName },
        { issuer: 'Amit Kumar', subject: user.email, audience: 'public' }
      );

      user.access_token = token;
      const updatedUser = await Users.update(
        { id: user.id },
        { lastLogin: new Date() }
      );
      let findrole = await Roles.findOne({ role: user.role })
      user.role = findrole


      return res.status(200).json({
        success: true,
        code: 200,
        message: constantObj.user.SUCCESSFULLY_LOGGEDIN,
        data: user,
      });
    }
  },

  /*
   *changePassword
   */
  changePassword: async function (req, res) {
    //("in change password")

    if (!req.body.newPassword || typeof req.body.newPassword == undefined) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.PASSWORD_REQUIRED },
      });
    }
    if (
      !req.body.confirmPassword ||
      typeof req.body.confirmPassword == undefined
    ) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.CONPASSWORD_REQUIRED },
      });
    }

    if (
      !req.body.currentPassword ||
      typeof req.body.currentPassword == undefined
    ) {
      return res.status(404).json({
        success: false,
        error: {
          code: 404,
          message: constantObj.user.CURRENTPASSWORD_REQUIRED,
        },
      });
    }

    let data = req.body;
    let newPassword = data.newPassword;
    let currentPassword = data.currentPassword;

    let query = {};
    query.id = req.identity.id;

    Users.findOne(query).then((user) => {
      if (!bcrypt.compareSync(currentPassword, user.password)) {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: constantObj.user.CURRENT_PASSWORD },
        });
      } else {
        var encryptedPassword = bcrypt.hashSync(
          newPassword,
          bcrypt.genSaltSync(10)
        );
        Users.update(
          { id: req.identity.id },
          { password: encryptedPassword }
        ).then(function (user) {
          return res.status(200).json({
            success: true,
            message: constantObj.user.PASSWORD_CHANGED,
          });
        });
      }
    });
  },

  /**
   *
   * @param {*} req.body {email:"",password:""}
   * @param {*} res
   * @returns detail of the user
   * @description: Used to signup for company, manager , employee
   */
  userSignin: async (req, res) => {
    try {
      if (!req.body.email || typeof req.body.email == undefined) {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: constantObj.user.EMAIL_REQUIRED },
        });
      }

      if (!req.body.password || typeof req.body.password == undefined) {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: constantObj.user.PASSWORD_REQUIRED },
        });
      }
      let user = await Users.findOne({
        where: {
          email: req.body.email.toLowerCase(),
          isDeleted: false,
          role: 'user',
        },
      });
      // console.log(user, "==============user")
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: constantObj.user.INVALID_CRED },
        });
      }

      if (user && user.status != 'active') {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: constantObj.user.USERNAME_INACTIVE },
        });
      }
      if (user.isVerified == 'N') {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: constantObj.user.USERNAME_VERIFIED },
        });
      }

      if (!bcrypt.compareSync(req.body.password, user.password)) {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: constantObj.user.INVALID_CRED },
        });
      } else {
        /**Genreating access token for the company and company_admin */

        var token = jwt.sign(
          { user_id: user.id, fullName: user.fullName },
          { issuer: 'Jcsoftware', subject: user.email, audience: 'L3Time' }
        );
        const refreshToken = jwt.sign(
          { user_id: user.id },
          { issuer: 'refresh', subject: 'user', audience: 'L3Time' }
        );
        user.access_token = token;
        user.refresh_token = refreshToken;
        let findrole = await Roles.findOne({ role: user.role })
        user.role = findrole

        return res.status(200).json({
          success: true,
          code: 200,
          message: constantObj.user.SUCCESSFULLY_LOGGEDIN,
          data: user,
        });
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },

  verifiyOtp: (req, res) => {
    try {
      var otp = req.param('otp');
      var email = req.param('email');

      if (!otp || typeof otp == undefined) {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: constantObj.user.OTP_REQUIRED },
        });
      }
      if (!email || typeof email == undefined) {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: constantObj.user.EMAIL_REQUIRED },
        });
      }
      var query = {};
      query.otp = otp;
      query.email = email;
      Users.findOne(query).then((user) => {
        if (user) {
          var token = jwt.sign(
            { user_id: user.id, firstName: user.firstName },
            { issuer: 'Jcsoftware', subject: user.email, audience: 'L3Time' }
          );

          user.access_token = token;

          return res.status(200).json({
            success: true,
            data: user,
          });
        } else {
          return res.status(400).json({
            success: false,
            error: { message: constantObj.user.INVALID_OTP },
          });
        }
      });
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, error: { code: 400, message: '' + err } });
    }
  },

  /*For Get User Details
   * Get Record from Login User Id
   */
  userDetails: async function (req, res) {
    var id = req.param('id');
    if (!id || typeof id == undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Id is required' },
      });
    }

    var userDetails = await Users.find({ where: { id: id } })
      .populate('license_id')
      .populate('company_id');

    return res.status(200).json({
      success: true,
      code: 200,
      data: userDetails,
    });
  },

  /*For Get all Users
   * Param Role
   */

  getAllUsers: async (req, res) => {
    try {
      var search = req.param('search');
      var role = req.param('role');
      var status = req.param('status');
      var isDeleted = req.param('isDeleted');
      var page = req.param('page');
      var type = req.param('type');
      var sortBy = req.param('sortBy');
      let company = req.param('company');
      if (!page) {
        page = 1;
      }
      var count = parseInt(req.param('count'));
      if (!count) {
        count = 1000;
      }
      var skipNo = (page - 1) * count;
      var query = {};
      if (search) {
        query.or = [
          { fullName: { like: `%${search}%` } },
          { email: { like: `%${search}%` } },
        ];
      }
      // console.log(search,"=============search")
      query.role = { '!=': 'admin' };
      if (role) {
        query.role = role;
      }

      if (company) {
        query.company_id = Number(company);
      }

      query.isDeleted = false;
      if (status) {
        query.status = status;
      }
      if (type) {
        query.type = type;
      }
      let sortquery = {};
      if (sortBy) {
        let typeArr = [];
        typeArr = sortBy.split(' ');
        let sortType = typeArr[1];
        let field = typeArr[0];
        sortquery[field ? field : 'updatedAt'] = sortType
          ? sortType == 'desc'
            ? -1
            : 1
          : -1;
      } else {
        sortquery = { updatedAt: -1 };
        sortBy = 'updatedAt desc';
      }

      let total = await Users.count(query);
      let findusers = await Users.find(query)
        .sort(sortBy)
        .skip(skipNo)
        .limit(count)
        .populate('license_id')
        .populate('company_id');
      return res.status(200).json({
        success: true,
        total: total,
        data: findusers,
      });
    } catch (err) {
      console.log(err, '====================err');
      return res.status(400).json({
        success: false,
        error: { code: 400, message: err.toString() },
      });
    }
  },

  /*
   *For Check Email Address Exit or not
   */
  checkEmail: async function (req, res) {
    var email = req.param('email');
    if (!email || typeof email == undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'Email is required' },
      });
    }
    Users.findOne({ email: email }).then((user) => {
      if (user) {
        return res.status(200).json({
          success: false,
          error: { code: 400, message: 'Email already taken' },
        });
      } else {
        return res.status(200).json({
          success: true,
          code: 200,
          message: 'you can use this email',
        });
      }
    });
  },

  userProfileData: async (req, res) => {
    let id = req.identity.id;
    var userDetail = await Users.findOne({ id: id });
    let findrole = await Roles.findOne({ role: userDetail.role })
    userDetail.role = findrole
    if (!userDetail) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    } else {
      return res.status(200).json({
        success: true,
        code: 200,
        data: userDetail,
      });
    }
  },

  userDetail: async (req, res) => {
    let query = {};
    query.id = req.param('id');

    let userDetail = await Users.findOne(query).populate('addedBy');
    //.log(userDetail);
    if (!userDetail) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: 'User not exist.',
      });
    } else {
      return res.status(200).json({
        success: true,
        code: 200,
        data: userDetail,
      });
    }
  },

  forgotPassword: async (req, res) => {
    let data = req.body;
    if (!data.email || data.email == undefined) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.USERNAME_REQUIRED },
      });
    }
    Users.findOne({
      email: data.email.toLowerCase(),
      isDeleted: false,
      role: { in: ['admin'] },
    }).then((data) => {
      // console.log(data,"==============data")
      if (data === undefined) {
        return res.status(404).json({
          success: false,
          error: {
            code: 404,
            message: constantObj.user.INVALID_USER,
          },
        });
      } else {
        var verificationCode = generateVeificationCode();

        Users.update(
          { email: data.email, isDeleted: false },
          {
            verificationCode: verificationCode,
          }
        ).then(async (result) => {
          currentTime = new Date();
          await forgotPasswordEmail({
            email: data.email,
            verificationCode: verificationCode,
            fullName: data.fullName,
            id: data.id,
            time: currentTime.toISOString(),
          });
          return res.status(200).json({
            success: true,
            id: data.id,
            message: constantObj.user.VERIFICATION_SENT,
          });
        });
      }
    });
  },

  forgotPasswordFrontend: async (req, res) => {
    let data = req.body;
    if (!data.email || data.email == undefined) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.USERNAME_REQUIRED },
      });
    }
    Users.findOne({
      email: data.email.toLowerCase(),
      isDeleted: false,
      role: { in: ['user'] },
    }).then((data) => {
      // console.log(data,"==============data")
      if (data === undefined) {
        return res.status(404).json({
          success: false,
          error: {
            code: 404,
            message: constantObj.user.INVALID_USER,
          },
        });
      } else {
        var verificationCode = generateVeificationCode();

        Users.update(
          { email: data.email, isDeleted: false },
          {
            verificationCode: verificationCode,
          }
        ).then(async (result) => {
          currentTime = new Date();
          await forgotPasswordEmail({
            email: data.email,
            verificationCode: verificationCode,
            fullName: data.fullName,
            id: data.id,
            time: currentTime.toISOString(),
          });
          return res.status(200).json({
            success: true,
            id: data.id,
            message: constantObj.user.VERIFICATION_SENT,
          });
        });
      }
    });
  },

  resetPassword: async (req, res) => {
    try {
      const id = req.body.id;

      if (!req.body.password || !req.body.verificationCode) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: '' },
        });
      }

      const user = await Users.findOne({ id: id });

      if (user.verificationCode != req.body.verificationCode) {
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: 'Verification code wrong.',
          },
        });
      }

      const password = await bcrypt.hashSync(
        req.body.password,
        bcrypt.genSaltSync(10)
      );
      await Users.update(
        { id: user.id },
        { password: password, verificationCode: '' }
      );

      return res.status(200).json({
        success: true,
        message: 'Password reset successfully.',
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: err.toString() },
      });
    }
  },

  verifyUser: (req, res) => {
    var id = req.param('id');
    Users.findOne({ id: id }).then((user) => {
      if (user) {
        Users.update({ id: id }, { isVerified: 'Y' }).then((verified) => {
          return res.redirect(`${credentials.FRONT_WEB_URL}login`);
        });
      } else {
        return res.redirect(`${credentials.FRONT_WEB_URL}login`);
      }
    });
  },

  verifyEmail: (req, res) => {
    var id = req.param('id');
    //(id);
    Users.findOne({ id: id }).then((user) => {
      if (user) {
        //(user)
        Users.update({ id: id }, { contact_information: 'Yes' }).then(
          (verified) => {
            return res.redirect(constant.FRONT_WEB_URL);
          }
        );
      } else {
        return res.redirect(constant.FRONT_WEB_URL);
      }
    });
  },

  editProfile: async (req, res) => {
    try {
      let data = req.body;
      // console.log(data,"--------------data")
      var id = req.param('id');
      if (!id || id == undefined) {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: constantObj.user.ID_REQUIRED },
        });
      }
      /**Creating fullName of User using firstName and lastName */
      if (data.firstName && data.lastName) {
        data.fullName = data.firstName + ' ' + data.lastName;
      } else if (data.firstName && !data.lastName) {
        data.fullName = data.firstName;
      }
      if (data.api_key) {
        var randomStr = uuid.v4();
        let obj = {
          licence_id: randomStr,
          has_after_call_transcript: req.body.has_after_call_transcript,
          has_real_time_streaming_transcript:
            req.body.has_real_time_streaming_transcript,
          has_sentiment: req.body.has_sentiment,
          startDate: req.body.startDate,
          endDate: req.body.endDate,
        };
        const created = await License.create(obj).fetch();
        data.license_id = created.id;
      }
      Users.updateOne({ id: id }, data).then(async (user) => {
        return res.status(200).json({
          success: true,
          data: user,
          message: constantObj.user.UPDATED_USER,
        });
      });
    } catch (err) {
      //.log(err);
      return res
        .status(400)
        .json({ success: false, error: { code: 400, message: '' + err } });
    }
  },
  resetPassword: async (req, res) => {
    let data = req.body;
    try {
      var code = data.verificationCode;
      var newPassword = data.newPassword;

      let user = await Users.findOne({ id: data.id, isDeleted: false });
      if (!user || user.verificationCode !== code) {
        return res.status(404).json({
          success: false,
          error: {
            code: 404,
            message: 'Verification code wrong.',
          },
        });
      } else {
        const encryptedPassword = bcrypt.hashSync(
          newPassword,
          bcrypt.genSaltSync(10)
        );
        Users.updateOne({ id: user.id }, { password: encryptedPassword }).then(
          (updatedUser) => {
            return res.status(200).json({
              success: true,
              message: 'Password reset successfully.',
            });
          }
        );
      }
    } catch (err) {
      return res
        .status(400)
        .json({ success: true, error: { code: 400, message: '' + err } });
    }
  },
  addUser: async (req, res) => {
    if (!req.body.email || typeof req.body.email == undefined) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: constantObj.user.EMAIL_REQUIRED },
      });
    }

    var date = new Date();
    try {
      var user = await Users.findOne({
        email: req.body.email.toLowerCase(),
        isDeleted: false,
      });
      // console.log(user,"================user")
      if (user) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: constantObj.user.EMAIL_EXIST },
        });
      } else {
        var randomStr = uuid.v4();
        req.body['api_key'] = randomStr;
        req.body['date_registered'] = date;
        req.body['status'] = 'active';
        req.body['role'] = req.body.role ? req.body.role : 'user';
        req.body['addedBy'] = req.identity.id;
        const password = generatePassword();
        req.body.password = password;
        req.body.isVerified = 'Y';

        if (req.body.recordType != '') {
          req.body['fullName'] = req.body.fullName;
        } else {
          req.body['fullName'] = req.body.firstName + ' ' + req.body.lastName;
        }

        //  if (req.body.firstName && req.body.lastName) {

        if (
          req.body.api_key &&
          req.body.has_after_call_transcript &&
          req.body.has_real_time_streaming_transcript &&
          req.body.has_sentiment
        ) {
          let obj = {
            licence_id: req.body.api_key,
            has_after_call_transcript: req.body.has_after_call_transcript,
            has_real_time_streaming_transcript:
              req.body.has_real_time_streaming_transcript,
            has_sentiment: req.body.has_sentiment,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
          };

          const created = await License.create(obj).fetch();
          req.body.licence_id = created.id;

          var newUser = await Users.create(req.body).fetch();
          const updateuser = await Users.updateOne({ id: newUser.id },
            { license_id: created.id }
          );
        } else {
          var newUser = await Users.create(req.body).fetch();
        }

        if (req.body.role == "sub_admin") {
          add_sub_adminEmail({
            email: newUser.email,
            fullName: newUser.fullName,
            password: password,
            role: newUser.role,
          });

        } else {
          addUserEmail({
            email: newUser.email,
            fullName: newUser.fullName,
            password: password,
            role: newUser.role,
          });

        }

        return res.status(200).json({
          success: true,
          code: 200,
          data: newUser,
          message: 'User added successfully',
        });

      }
    } catch (err) {
      // console.log(err, "================err")
      return res
        .status(400)
        .json({ success: false, error: { code: 400, message: '' + err } });
    }
  },
  deleteuser: async (req, res) => {
    let data = req.body;
    try {
      var id = req.param('id');
      if (!id || id == undefined) {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: constantObj.user.ID_REQUIRED },
        });
      }
      Users.updateOne({ id: id }, { isDeleted: true }).then(async (user) => {
        return res.status(200).json({
          success: true,
          data: user,
          message: 'user deleted successfully',
        });
      });
    } catch (err) {
      //.log(err);
      return res
        .status(400)
        .json({ success: false, error: { code: 400, message: '' + err } });
    }
  },
};

userVerifyLink = async (options) => {
  let email = options.email;
  // console.log(options, "==================options")
  message = '';
  message += `
  <!DOCTYPE html>
  <html lang="en">
  
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  
  <body style="font-family: sans-serif;">
  
      <div style="width:600px;margin: auto;margin-top: 2rem;box-shadow: 0px 0px 20px -15px #000;position: relative;">
          <div style="text-align: center; padding: 3rem 9rem;padding-bottom: 0.5rem;">
              <img src="${credentials.BACK_WEB_URL}/images/check_mark2.png" style="width: 80px; height: 80px;">
              <h1 style="    margin-top: 10px; font-size: 26px;color: #23a2d4;">You’Re In!</h1>
              <p>Thank you for joining SK River, You are Going to love it here. </p>
  
              <img src="${credentials.BACK_WEB_URL}/images/logo_img.png" style="width:170px; height: 85px;margin-top: 20px; object-fit: contain;">
  
              <p style="width: 134px; height: 1px;background: #164E63;margin: 22px auto;    margin-top: 14px;"></p>
  
                  <a href="${credentials.BACK_WEB_URL}verifyUser?id=${options.id}"  style="padding: 8px 25px; font-size: 12px;cursor: pointer; color: #fff; background: #2fc0f9; border-radius: 50px; border: 1px solid #2fc0f9;"
                  type="text">Verify Email</a>
              <p style="color: #626262;font-size: 11px;margin-top: 3rem;">Got Questions? Contact our support team!</p>
  
          </div>
          <p style="width: 20px; height: 185px; background: #164E63; position: absolute;bottom: 0px;left: 0px;margin:0px;">
          </p>
          <!-- <p
              style="width: 50px; height: 18px; background: #164E63; position: absolute;bottom: 0px; right: 0px;margin:0px;">
          </p> -->
          <p style="width: 20px; height: 185px; background: #164E63; position: absolute;top: 0px;right: 0px;margin:0px;">
          </p>
          <!-- <p style="width: 50px; height: 18px; background: #164E63; position: absolute;top: 0px;left: 0px;margin:0px;">
          </p> -->
      </div>
  
  </body>
  
  </html>
`;
  SmtpController.sendEmail(email, 'Email Verification', message);
};
forgotPasswordEmail = function (options) {
  let email = options.email;
  let verificationCode = options.verificationCode;
  var fullName = options.fullName;

  if (!fullName) {
    fullName = email;
  }
  message = '';

  message += ` 
      <!DOCTYPE html>
      <html lang="en">
      
      <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Document</title>
      </head>
      
      <body style="font-family: sans-serif;">
      
          <div style="width:600px;margin: auto;margin-top: 2rem;box-shadow: 0px 0px 20px -15px #000;position: relative;">
              <div style="text-align: center; padding: 3rem 9rem;padding-bottom: 0.5rem;">
                  <h1 style="    margin-top: 10px; font-size: 26px;color: #23a2d4;">Reset Password</h1>
                  <p style="font-size: 15px;"> We have received your request to reset your password.</p>
                  <div style="margin-bottom: 14px; ">
                  <img src="${credentials.BACK_WEB_URL}/images/logo.png" style="width: 80px;"/>
              </div>
              <div style="padding: 15px; border:3px solid rgba(11, 10, 10, 0.54); border-radius: 8px; max-width: 356px; color: #000; margin-left: auto; margin-right:auto; box-shadow: 0px 0px 8px 0px #8080808a;">
              Your verification code is <b>${verificationCode}</b>
              </div><p style="color: #626262;font-size: 11px;margin-top: 3rem;">Got Questions? Contact our support team!</p>
              </div>
              <p style="width: 20px; height: 185px; background: #164E63; position: absolute;bottom: 0px;left: 0px;margin:0px;">
              </p>
          
              <p style="width: 20px; height: 185px; background: #164E63; position: absolute;top: 0px;right: 0px;margin:0px;">
              </p>
        
          </div>
      
      </body>
      
      </html>
    `;

  SmtpController.sendEmail(email, 'Reset Password', message);
};
add_sub_adminEmail = async (options) => {
  let email = options.email;

  let firstName = options.firstName;
  let password = options.password;

  if (!firstName) {
    firstName = email;
  }
  message = '';
  message += `
                    <body style="font-family: sans-serif;">
                    <div style="width:600px;margin: auto;margin-top: 2rem;box-shadow: 0px 0px 20px -15px #000;position: relative;">
                        <div style="text-align: center; padding: 3rem 9rem;padding-bottom: 0.5rem;">
                            <img src="${credentials.BACK_WEB_URL}/images/Check_Mark.png" style="width: 80px; height: 80px;">
                            <h1 style="    margin-top: 10px; 
                            font-style: normal;
                            font-weight: 600;
                            font-size: 20px;
                            line-height: 23px;
                            color: #2759A7;">You’Re In!</h1>
                    <p style="
                    font-size: 16px;
                    font-weight: 200;
                    text-align: center;">Thank you for joining SK River, You are Going to love it here.</p>

              <div style="padding: 15px; font-size: 15px; border:3px solid color: #2759A7; border-radius: 8px; max-width: 356px; background: #fff; color: #2759A7; margin-left: auto; margin-right:auto; box-shadow: 0px 0px 8px 0px #f2f4f7;">
                <p><b>Email:</b>${options.email}</p>
                <p><b>Password:</b>${options.password}</p>
              </div>
              <p style="font-weight: 400; font-size: 15px; padding-bottom: 20px;text-align: center;" >
                Let’s get you logged in to<br>setup your account.
              </p>
              <div style="margin-top: 16px; margin-bottom: 12px;">
                <a href="${credentials.ADMIN_WEB_URL}login" style="background-color: #2759A7; color: #fff; border-radius: 30px; padding: 10px 12px; text-decoration:none"> Log In Now</a>
              </div>
              <p style="font-weight: 400; font-size: 16px; line-height: 24px; color: #626262; text-align: center; position: relative; top: 15px;">
                <a href="${credentials.FRONT_WEB_URL}" taget="_blank" style="text-decoration:none"><b>Go to website</b></a></br>
                <p style="color: #626262;font-size: 11px;margin-top: 3rem;">Got Questions? Contact our <a style="
                color: #0b4eb8;
                text-decoration: auto;" href="">support team!</a> </p>
        </div>
        <p style="
    width: 19px;
    height: 50%; background: #2859a7; position: absolute;bottom: 0px;left: 0px;margin:0px;">
        </p>
   
        <p style="
    width: 19px;
    height: 50%; background: #2859a7; position: absolute;top: 0px;right: 0px;margin:0px;">
        </p>
    </div>
</body>
    `;

  SmtpController.sendEmail(email, 'Registration', message);
};

addUserEmail = async (options) => {
  let email = options.email;

  let firstName = options.firstName;
  let password = options.password;

  if (!firstName) {
    firstName = email;
  }
  message = '';
  message += `
                    <body style="font-family: sans-serif;">
                    <div style="width:600px;margin: auto;margin-top: 2rem;box-shadow: 0px 0px 20px -15px #000;position: relative;">
                        <div style="text-align: center; padding: 3rem 9rem;padding-bottom: 0.5rem;">
                            <img src="${credentials.BACK_WEB_URL}/images/Check_Mark.png" style="width: 80px; height: 80px;">
                            <h1 style="    margin-top: 10px; 
                            font-style: normal;
                            font-weight: 600;
                            font-size: 20px;
                            line-height: 23px;
                            color: #2759A7;">You’Re In!</h1>
                    <p style="
                    font-size: 16px;
                    font-weight: 200;
                    text-align: center;">Thank you for joining SK River, You are Going to love it here.</p>

              <div style="padding: 15px; font-size: 15px; border:3px solid color: #2759A7; border-radius: 8px; max-width: 356px; background: #fff; color: #2759A7; margin-left: auto; margin-right:auto; box-shadow: 0px 0px 8px 0px #f2f4f7;">
                <p><b>Email:</b>${options.email}</p>
                <p><b>Password:</b>${options.password}</p>
              </div>
              <p style="font-weight: 400; font-size: 15px; padding-bottom: 20px;text-align: center;" >
                Let’s get you logged in to<br>setup your account.
              </p>
              <div style="margin-top: 16px; margin-bottom: 12px;">
                <a href="${credentials.FRONT_WEB_URL}login" style="background-color: #2759A7; color: #fff; border-radius: 30px; padding: 10px 12px; text-decoration:none"> Log In Now</a>
              </div>
              <p style="font-weight: 400; font-size: 16px; line-height: 24px; color: #626262; text-align: center; position: relative; top: 15px;">
                <a href="${credentials.FRONT_WEB_URL}" taget="_blank" style="text-decoration:none"><b>Go to website</b></a></br>
                <p style="color: #626262;font-size: 11px;margin-top: 3rem;">Got Questions? Contact our <a style="
                color: #0b4eb8;
                text-decoration: auto;" href="">support team!</a> </p>
        </div>
        <p style="
    width: 19px;
    height: 50%; background: #2859a7; position: absolute;bottom: 0px;left: 0px;margin:0px;">
        </p>
   
        <p style="
    width: 19px;
    height: 50%; background: #2859a7; position: absolute;top: 0px;right: 0px;margin:0px;">
        </p>
    </div>
</body>
    `;

  SmtpController.sendEmail(email, 'Registration', message);
};

userSendOtp = function (options) {
  var email = options.email;
  message = '';
  style = {
    header: `
       padding:30px 15px;
       text-align:center;
       background-color:#f2f2f2;
       `,
    body: `
       padding:15px;
       height: 230px;
       `,
    hTitle: `font-family: 'Raleway', sans-serif;
       font-size: 37px;
       height:auto;
       line-height: normal;
       font-weight: bold;
       background:none;
       padding:0;
       color:#333;
       `,
    maindiv: `
       width:600px;
       margin:auto;
       font-family: Lato, sans-serif;
       font-size: 14px;
       color: #333;
       line-height: 24px;
       font-weight: 300;
       border: 1px solid #eaeaea;
       `,
    textPrimary: `color:#3e3a6e;
       `,
    h5: `font-family: Raleway, sans-serif;
       font-size: 22px;
       background:none;
       padding:0;
       color:#333;
       height:auto;
       font-weight: bold;
       line-height:normal;
       `,
    m0: `margin:0;`,
    mb3: 'margin-bottom:15px;',
    textCenter: `text-align:center;`,
    btn: `padding:10px 30px;
       font-weight:500;
       font-size:14px;
       line-height:normal;
       border:0;
       display:inline-block;
       text-decoration:none;
       `,
    btnPrimary: `
       background-color:#3e3a6e;
       color:#fff;
       `,
    footer: `
       padding:10px 15px;
       font-weight:500;
       color:#fff;
       text-align:center;
       background-color:#000;
       `,
  };

  message +=
    `<div class="container" style="` +
    style.maindiv +
    `">
   <div class="header" style="` +
    style.header +
    `text-align:center">
       <img style="margin-bottom:20px; height: 67%; width: 66%;" src="` +
    constant.FRONT_WEB_URL +
    `/assets/img/logo.jpeg" />
       <h2 style="` +
    style.hTitle +
    style.m0 +
    `">Welcome to Application </h2>
   </div>
   <div class="body" style="` +
    style.body +
    `">
       <h5 style="` +
    style.h5 +
    style.m0 +
    style.mb3 +
    style.textCenter +
    `">Hello ` +
    options.fullName +
    `</h5>
       <p style="` +
    style.m0 +
    style.mb3 +
    style.textCenter +
    `margin-bottom:20px;font-weight: 600">Your otp for login is :   </p>` +
    options.otp +
    `
   </div>
   <div class="footer" style="` +
    style.footer +
    `">
   2023 All Rights Reserved.
   </div>
 </div>`;

  SmtpController.sendEmail(email, 'Otp Verification', message);
};
