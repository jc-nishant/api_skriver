/**
 * UsersController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

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

      if (!req.body.role || typeof req.body.role == undefined) {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: constantObj.user.ROLE_REQUIRED },
        });
      }

      // , select: ['email', 'role', 'status', 'isVerified', 'password', 'firstName', 'lastName', 'fullName', 'image']
      var userDetails = await Users.find({
        where: {
          email: req.body.email.toLowerCase(),
          isDeleted: false,
          role: req.body.role,
        },
      });
      var user = userDetails[0];

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

    var userDetails = await Users.find({ where: { id: id } });

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
    //.log("In Get all user");
    try {
      var search = req.param('search');
      var role = req.param('role');
      var isDeleted = req.param('isDeleted');
      var page = req.param('page');
      var recordType = req.param('recordType');
      var type = req.param('type');
      var faculty = req.param('faculty');
      var sortBy = req.param('sortBy');

      if (!page) {
        page = 1;
      }
      var count = parseInt(req.param('count'));
      if (!count) {
        count = 10;
      }
      var skipNo = (page - 1) * count;
      var query = {};
      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
        ];
      }
      query.role = { $ne: 'admin' };
      if (role) {
        query.role = role;
      }

      query.isDeleted = false;
      if (recordType) {
        query.recordType = recordType;
      }
      if (type) {
        query.type = type;
      }
      sortquery = {};
      if (sortBy) {
        var order = sortBy.split(' ');

        var field = order[0];
        var sortType = order[1];
      }
      sortquery[field ? field : 'createdAt'] = sortType
        ? sortType == 'desc'
          ? -1
          : 1
        : -1;

      if (faculty) {
        query.faculty_id = ObjectId(faculty);
      }
      console.log(query, '-------------------------query');
      db.collection('users')
        .aggregate([
          {
            $lookup: {
              from: 'scmanagement',
              localField: 'scType',
              foreignField: '_id',
              as: 'scType',
            },
          },
          {
            $unwind: {
              path: '$scType',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'addedBy',
              foreignField: '_id',
              as: 'addedBy',
            },
          },
          {
            $unwind: {
              path: '$addedBy',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'deletedBy',
              foreignField: '_id',
              as: 'deletedBy',
            },
          },
          {
            $unwind: {
              path: '$deletedBy',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'facultyId',
              foreignField: '_id',
              as: 'facultyId',
            },
          },
          {
            $unwind: {
              path: '$facultyId',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'collegeId',
              foreignField: '_id',
              as: 'collegeId',
            },
          },
          {
            $unwind: {
              path: '$collegeId',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              role: '$role',
              isDeleted: '$isDeleted',
              firstName: '$firstName',
              lastName: '$lastName',
              fullName: '$fullName',
              name: '$name',
              email: '$email',
              type: '$type',
              position: '$position',
              facultyId: '$facultyId',
              collegeId: '$collegeId',
              role: '$role',
              scType: '$scType',
              addedBy: '$addedBy',
              recordType: '$recordType',
              status: '$status',
              createdAt: '$createdAt',
              deletedBy: '$deletedBy.fullName',
              deletedAt: '$deletedAt',
              faculty_id: '$facultyId._id',
            },
          },
          {
            $match: query,
          },
        ])
        .toArray((err, totalResult) => {
          db.collection('users')
            .aggregate([
              {
                $lookup: {
                  from: 'scmanagement',
                  localField: 'scType',
                  foreignField: '_id',
                  as: 'scType',
                },
              },
              {
                $unwind: {
                  path: '$scType',
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'addedBy',
                  foreignField: '_id',
                  as: 'addedBy',
                },
              },
              {
                $unwind: {
                  path: '$addedBy',
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'deletedBy',
                  foreignField: '_id',
                  as: 'deletedBy',
                },
              },
              {
                $unwind: {
                  path: '$deletedBy',
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'facultyId',
                  foreignField: '_id',
                  as: 'facultyId',
                },
              },
              {
                $unwind: {
                  path: '$facultyId',
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'collegeId',
                  foreignField: '_id',
                  as: 'collegeId',
                },
              },
              {
                $unwind: {
                  path: '$collegeId',
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $project: {
                  role: '$role',
                  isDeleted: '$isDeleted',
                  firstName: '$firstName',
                  lastName: '$lastName',
                  fullName: '$fullName',
                  name: '$name',
                  email: '$email',
                  type: '$type',
                  position: '$position',
                  facultyId: '$facultyId',
                  collegeId: '$collegeId',
                  role: '$role',
                  scType: '$scType',
                  addedBy: '$addedBy',
                  recordType: '$recordType',
                  status: '$status',
                  createdAt: '$createdAt',
                  deletedBy: '$deletedBy.fullName',
                  deletedAt: '$deletedAt',
                  faculty_id: '$facultyId._id',
                },
              },
              {
                $match: query,
              },
              {
                $sort: sortquery,
              },

              {
                $skip: Number(skipNo),
              },
              {
                $limit: Number(count),
              },
            ])
            .toArray((err, result) => {
              // //.log(err)
              if (err) {
                return res.status(400).json({
                  success: false,
                  code: { code: 400, error: err },
                });
              }
              return res.status(200).json({
                success: true,
                code: 200,
                data: result,
                total: totalResult.length,
              });
            });

          if (err) {
            return res.status(400).json({
              success: false,
              code: { code: 400, error: err },
            });
          }
        });
    } catch (error) {
      //.log(error)
      return res.status(400).json({
        success: false,
        code: 400,
        error: error,
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
    try {
      if (!req.body.email || req.body.email == undefined) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: constantObj.user.USERNAME_REQUIRED },
        });
      }
      var query = {};
      query.email = req.body.email.toLowerCase();
      query.isDeleted = false;
      query.role = { in: ['admin'] };
      const user = await Users.findOne(query);
      if (user) {
        const verificationCode = await generatePassword();

        await Users.updateOne(
          { id: user.id },
          { verificationCode: verificationCode }
        );
        let currentTime = new Date();
        let email_payload = {
          email: user.email,
          verificationCode: verificationCode,
          firstName: user.fullName,
          id: user.id,
          userId: user.id,
          time: currentTime,
          role: user.role,
        };
        await Emails.forgotPasswordEmail(email_payload);
        return res.status(200).json({
          success: true,
          message: constantObj.user.VERIFICATION_SENT,
          id: user.id,
        });
      } else {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: constantObj.user.INVALID_USER },
        });
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: err.toString() },
      });
    }
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
      role: { in: ['student', 'faculty'] },
    }).then((data) => {
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
        { _id: user.id },
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
          return res.redirect(constant.FRONT_WEB_URL);
        });
      } else {
        return res.redirect(constant.FRONT_WEB_URL);
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
    let data = req.body;
    try {
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

  /**
   *
   * @param {*} req
   * @param {*} res
   * @returns
   * @description Used to register User
   */
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
      if (user) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: constantObj.user.EMAIL_EXIST },
        });
      } else {
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

        var newUser = await Users.create(req.body).fetch();
        if (newUser) {
          //.log(newUser, "-------------------->newUser")
          addUserEmail({
            email: newUser.email,
            fullName: newUser.fullName,
            password: password,
            role: newUser.role,
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

  uploadCSVToDB: async (req, res) => {
    try {
      var modelName = 'users';

      req
        .file('file')
        .upload(
          { dirname: '../../assets/' + modelName + '/' },
          async (err, file) => {
            if (err) {
              //.log(err, "err 1");
            }
            console.log(file);
            file.forEach(async (element, index) => {
              typeArr = element.type.split('/');
              fileExt = typeArr[1];
              ////.log(element.fd);
              const file = reader.readFile(element.fd);
              let data = [];
              const sheets = file.SheetNames;
              for (let i = 0; i < sheets.length; i++) {
                const temp = reader.utils.sheet_to_json(
                  file.Sheets[file.SheetNames[i]]
                );
                temp.forEach((res) => {
                  data.push(res);
                });
              }
              var date = new Date();
              var failedEmail = [];
              await (async function () {
                for await (const singleResult of data) {
                  var email = singleResult.email;
                  var usercheck = await Users.findOne({
                    email: email.toLowerCase(),
                  });
                  if (usercheck == undefined) {
                    singleResult.email = email.toLowerCase();
                    const newPassword = generatePassword();

                    singleResult.fullName = singleResult.fullName;

                    singleResult.date_registered = date;
                    singleResult.date_verified = date;
                    singleResult.status = 'active';
                    singleResult.isVerified = 'Y';
                    singleResult.role = singleResult.type;
                    singleResult.recordType = singleResult.recordType;
                    singleResult.mobileNo = singleResult.mobileNo;
                    singleResult.password = newPassword;
                    var addUsers = await Users.create(singleResult).fetch();
                    welcomeEmail({
                      email: addUsers.email,
                      fullName: addUsers.fullName,
                      password: newPassword,
                    });
                  } else {
                    failedEmail.push(email.toLowerCase());
                  }
                }
              })();
              return res.status(200).json({
                success: true,
                message: 'Data uploaded successfully',
                existEmail: failedEmail,
              });
            });
          }
        );
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: { message: error },
      });
    }
  },

  bulkUpload: async (req, res) => {
    try {
      req
        .file('file')
        .upload(
          { maxBytes: 5242880, dirname: '../../assets/csv' },
          async (err, file) => {
            ////(file)
            if (err) {
              if (err.code == 'E_EXCEEDS_UPLOAD_LIMIT') {
                return res.status(404).json({
                  success: false,
                  error: {
                    code: 404,
                    message: 'Image size must be less than 5 MB',
                  },
                });
              }
            }

            var responseData = {};
            var roles = req.param('role');
            var userId = req.identity.id;
            // console.log(userId)
            var date = new Date();
            file.forEach(async (element, index) => {
              var name = generateName();
              //(element.fd);
              typeArr = element.type.split('/');
              fileExt = typeArr[1];
              if (
                // fileExt === 'csv' ||
                fileExt ==
                'vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              ) {
                fs.readFile(file[index].fd, async (err, data) => {
                  if (err) {
                    return res.status(403).json({
                      success: false,
                      error: {
                        code: 403,
                        message: err,
                      },
                    });
                  } else {
                    if (data) {
                      var path = file[index].fd;

                      if (
                        fileExt ==
                        'vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                      ) {
                        fileExt = 'xlsx';
                      }
                      fs.writeFileSync(
                        'assets/csv/' + name + '.' + fileExt,
                        data,

                        function (err, image) {
                          if (err) {
                            //(err);
                            return res.status(400).json({
                              success: false,
                              error: {
                                code: 400,
                                message: err,
                              },
                            });
                          }
                        }
                      );
                      fs.writeFileSync(
                        './.tmp/public/csv/' + name + '.' + fileExt,
                        data,

                        async function (err, image) {
                          if (err) {
                            //(err);
                            return res.status(400).json({
                              success: false,
                              error: {
                                code: 400,
                                message: err,
                              },
                            });
                          }
                        }
                      );

                      responseData.fullpath = name + '.' + fileExt;
                      const csvFilePath = 'assets/csv/' + name + '.' + fileExt;

                      readXlsxFile(csvFilePath).then(async (rows) => {
                        // `rows` is an array of rows
                        // each row being an array of cells.

                        var counter = 0;
                        var labels = [];
                        if (rows && rows.length > 0) {
                          for await (let itm of rows) {
                            if (counter == 0) {
                              labels = itm;
                            } else {
                              if (itm && itm.length > 0) {
                                var index = 0;
                                var obj = {};
                                const newPassword = generatePassword();

                                for await (let data of itm) {
                                  let keyLabel = labels[index];

                                  if (keyLabel == 'Faculty') {
                                    var faculty = await Users.findOne({
                                      email: data,
                                    });
                                    var id = faculty.id;
                                    obj.facultyId = id;
                                  }

                                  // console.log(faculty,"-----------------faculty.")
                                  obj.date_registered = date;
                                  obj.date_verified = date;
                                  obj.role = roles;
                                  obj.addedBy = userId;
                                  obj.isDeleted = 'false';
                                  obj.status = 'active';
                                  obj.isVerified = 'Y';
                                  obj.password = newPassword;

                                  if (keyLabel == 'First Name') {
                                    obj.firstName = data;
                                  }
                                  if (keyLabel == 'Last Name') {
                                    obj.lastName = data;
                                  }
                                  if (keyLabel == 'Full Name') {
                                    obj.fullName = data;
                                  }
                                  if (keyLabel == 'Type') {
                                    obj.type = data;
                                  }
                                  if (keyLabel == 'Email') {
                                    obj.email = data;
                                  }
                                  if (keyLabel == 'Mobile No') {
                                    obj.mobileNo = data;
                                  }
                                  if (keyLabel == 'Password') {
                                    obj.password = newPassword;
                                  }
                                  if (keyLabel == 'Country Code') {
                                    obj.countryCode = data;
                                  }
                                  if (keyLabel == 'Record Type') {
                                    obj.recordType = data;
                                  }
                                  //  if (keyLabel == 'Verified') { obj.isVerified = "Y" }
                                  //  if (keyLabel == 'Role') { obj.role = roles }
                                  //  if (keyLabel == 'Status') { obj.status = "active" }
                                  if (keyLabel == 'Domain') {
                                    obj.domain = data;
                                  }
                                  //  if (keyLabel == 'Deleted') { obj.isDeleted = "false" }
                                  if (keyLabel == 'Bio') {
                                    obj.bio = data;
                                  }
                                  if (keyLabel == 'Intrests') {
                                    obj.intrests = data;
                                  }
                                  if (keyLabel == 'Graduation') {
                                    obj.graduation = data;
                                  }
                                  if (keyLabel == 'Linkedin') {
                                    obj.linkedin = data;
                                  }
                                  if (keyLabel == 'City') {
                                    obj.city = data;
                                  }
                                  if (keyLabel == 'State') {
                                    obj.state = data;
                                  }
                                  if (keyLabel == 'Country') {
                                    obj.country = data;
                                  }
                                  if (keyLabel == 'Pincode') {
                                    obj.pincode = data;
                                  }
                                  if (keyLabel == 'position') {
                                    obj.position = data;
                                  }
                                  if (keyLabel == 'scType') {
                                    obj.scType = data;
                                  }
                                  //  if (keyLabel == 'addedBy') { obj.addedBy = user }
                                  //   if (keyLabel == 'Faculty') { obj.facultyId = facultyId }
                                  //  if (keyLabel == 'collegeId') { obj.collegeId = data }
                                  //  if (keyLabel == 'deletedBy') { obj.deletedBy = data }
                                  //  if (keyLabel == 'updatedBy') { obj.updatedBy = data }
                                  //  if (keyLabel == 'updatedBy') { obj.updatedBy = data }

                                  index++;
                                }
                                try {
                                  console.log(
                                    obj.type,
                                    '---------------------------obj.type'
                                  );
                                  //   console.log(obj.facultyId,"---------------------------obj.facultyId");
                                  Object.keys(obj).forEach((key) => {
                                    if (obj[key] === null) {
                                      delete obj[key];
                                    }
                                  });
                                  const existedUser = await Users.findOne({
                                    email: obj.email.toLowerCase(),
                                    isDeleted: false,
                                  });

                                  if (existedUser) {
                                  } else {
                                    const createdUser = await Users.create(
                                      obj
                                    ).fetch();
                                    // console.log(createdUser,"CreatedUSer")
                                    if (createdUser)
                                      addUserEmail({
                                        email: createdUser.email,
                                        fullName: createdUser.fullName,
                                        password: newPassword,
                                      });
                                  }
                                } catch (err) {
                                  console.log(err);
                                  // return res.status(404).json({
                                  //     success:false,
                                  //     // data:createdUser,
                                  //     error:{code:404, message:err}
                                  //   })
                                }
                              }
                            }
                            counter++;
                          }

                          return res.status(200).json({
                            success: true,
                            message: 'Data uploaded successfully.',
                          });
                        } else {
                          return res.status(200).json({
                            success: true,
                            message: 'Data uploaded successfully.',
                          });
                        }
                      });
                    }
                  }
                }); //end of loop
              } else {
                return res.status(404).json({
                  success: false,
                  error: {
                    code: 404,
                    message: constantObj.messages.NOT_VALID_FILE,
                  },
                });
              }
            });
          }
        );
    } catch (err) {
      //(err);
      return res
        .status(500)
        .json({ success: false, error: { code: 500, message: '' + err } });
    }
  },

  // contactUs: async (req, res) => {
  //     // const name = req.body.name;
  //     const email = req.body.email;
  //     const mobileNo = req.body.mobileNo;
  //     const messages = req.body.message;

  //     sendEmail()

  // },

  contactEmail: async function (req, res) {
    var data = req.body;
    if (!data.firstName || data.firstName == undefined) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: constantObj.user.FIRSTNAME_REQUIRED,
      });
    }
    if (!data.lastName || data.lastName == undefined) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: constantObj.user.LASTNAME_REQUIRED,
      });
    }
    if (!data.email || data.email == undefined) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: constantObj.user.EMAIL_REQUIRED,
      });
    }
    if (!data.message || data.message == undefined) {
      return res
        .status(400)
        .json({ success: false, code: 400, message: 'message is required' });
    }

    if (!data.mobileNo || data.mobileNo == undefined) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: constantObj.user.PHONE_REQUIRED,
      });
    }

    try {
      const sendData = await ContactUs.create(data).fetch();
      if (sendData) {
        contactUsEmail({
          email: data.email,
          fullName: data.firstName + ' ' + data.lastName,
          mobileNo: data.mobileNo,
          message: data.message,
        });
      }

      return res.status(200).json({
        success: true,
        code: 200,
        data: sendData,
        message: constantObj.user.SUCCESSFULLY_SENT,
      });
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, code: 400, message: '' + err });
    }
  },
  contactList: async (req, res) => {
    try {
      var search = req.param('search');
      var page = req.param('page');
      var sortBy = req.param('sortBy');

      if (!page) {
        page = 1;
      }
      var count = parseInt(req.param('count'));
      if (!count) {
        count = 10;
      }
      var skipNo = (page - 1) * count;
      var query = {};
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }
      sortquery = {};
      if (sortBy) {
        var order = sortBy.split(' ');

        var field = order[0];
        var sortType = order[1];
      }
      sortquery[field ? field : 'createdAt'] = sortType
        ? sortType == 'descending'
          ? -1
          : 1
        : -1;

      // query.isDeleted = false

      console.log(sortquery);
      db.collection('contactus')
        .aggregate([
          {
            $project: {
              isDeleted: '$isDeleted',
              firstName: '$firstName',
              lastName: '$lastName',
              fullName: '$fullName',
              email: '$email',
              mobileNo: '$mobileNo',
              message: '$message',
              createdAt: '$createdAt',
              updatedAt: '$updatedAt',
            },
          },
          {
            $match: query,
          },
        ])
        .toArray((err, totalResult) => {
          console.log(err);
          if (err) {
            return res.status(400).json({
              success: false,
              error: { code: 400, message: '' + err },
            });
          }

          db.collection('contactus')
            .aggregate([
              {
                $project: {
                  isDeleted: '$isDeleted',
                  firstName: '$firstName',
                  lastName: '$lastName',
                  fullName: '$fullName',
                  email: '$email',
                  mobileNo: '$mobileNo',
                  message: '$message',
                  createdAt: '$createdAt',
                  updatedAt: '$updatedAt',
                },
              },

              {
                $match: query,
              },
              {
                $sort: sortquery,
              },

              {
                $skip: Number(skipNo),
              },
              {
                $limit: Number(count),
              },
            ])
            .toArray((err, result) => {
              console.log(err);
              if (err) {
                return res.status(400).json({
                  success: false,
                  code: 400,
                  message: '' + err,
                });
              }
              console.log(result);
              return res.status(200).json({
                success: true,
                data: result,
                total: totalResult.length,
              });
            });
        });
    } catch (error) {
      console.log(error);
      return res
        .status(400)
        .json({ success: false, code: 400, error: '' + error });
    }
  },
};

welcomeEmail = function (options) {
  console.log('we are here');
  var email = options.email;
  var password = options.password;
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

  // src="` +
  // constant.FRONT_WEB_URL +
  // `/assets/img/logo.jpeg"

  message +=
    `<div class="container" style="` +
    style.maindiv +
    `">
   <div class="header" style="` +
    style.header +
    `text-align:center">
       <img style="margin-bottom:20px; height: 67%; width: 66%;"  src="` +
    constant.FRONT_WEB_URL +
    `/assets/img/logo.jpeg"  />
      
   </div>
   <div class="body" style="` +
    style.body +
    `">
       <h5 style="` +
    style.h5 +
    style.m0 +
    style.mb3 +
    `">Hello ` +
    options.fullName +
    `</h5>
       <p style="` +
    style.m0 +
    style.mb3 +
    `margin-bottom:20px;font-weight: 600">Your Goodclean account has been created! <br>
       Your login credentials are:</p>
       <div style="">
       <strong>Email : </strong>` +
    email +
    `<br>
       <strong>Password : </strong>` +
    password +
    `<br>
        </div>
   </div>
   <div class="footer" style="` +
    style.footer +
    `">
   2023 All Rights Reserved.
   </div>
 </div>`;

  SmtpController.sendEmail(email, 'Email Verification', message);
};

userVerifyLink = function (options) {
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
    `margin-bottom:20px;font-weight: 600">To complete your registration, please verify your email by clicking button below..</p>
       <div style="` +
    style.textCenter +
    `">
           <a style="text-decoration:none" href="` +
    constant.BACK_WEB_URL +
    'verifyUser?id=' +
    options.id +
    `"><span style="` +
    style.btn +
    style.btnPrimary +
    `">Verify Email</span></a>
       </div>
   </div>
   <div class="footer" style="` +
    style.footer +
    `">
   2023 All Rights Reserved.
   </div>
 </div>`;

  SmtpController.sendEmail(email, 'Email Verification', message);
};

forgotPasswordEmail = function (options) {
  console.log(options);

  var email = options.email;
  var verificationCode = options.verificationCode;
  var fullName = options.fullName;

  if (!fullName) {
    fullName = email;
  }
  message = '';

  message +=
    ` 
   
     <!DOCTYPE html>
     <html lang="en">
     <head>
         <meta charset="UTF-8">
         <meta http-equiv="X-UA-Compatible" content="IE=edge">
         <meta name="viewport" content="width=device-width, initial-scale=1.0">
         <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
         <title>Signup Email Template</title>
     </head>
     <body style="margin: 0px; padding:0; background-color: #f2f3f8;">
         <table width="100%" style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans',sans-serif; font-family: 'Open Sans', sans-serif;">
             <tr>
                 <td>
                     <table style="max-width:670px; margin:0 auto;" width="100%">
                         <tr>
                             <td style="height:20px;">&nbsp;</td>
                         </tr>
                         <tr>
                             <td style="text-align:center;">
                                 <a href="` +
    constant.FRONT_WEB_URL +
    `" title="Goodclean" target="_blank">
                                 <img  style="margin-bottom:20px; height: 67%; width: 66%;" src="` +
    constant.FRONT_WEB_URL +
    `assets/img/logo.jpeg" title="Goodclean" alt="logo">
                               </a>
                             </td>
                         </tr>
                         <tr>
                             <td style="height:10px;">&nbsp;</td>
                         </tr>
                         <tr>
                             <td>
                                 <table width="100%"
                                 style="max-width:670px; background:#fff; border-radius:3px; -webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);    border: 1px solid #e1e1e1;">
                                 <tr>
                                     <td style="height:40px;">&nbsp;</td>
                                 </tr>
                                 <tr>
                                     <td style="padding:0 35px;">
                                         <h1 style="color:#1e1e2d; font-weight:600; margin:0;font-size:22px;font-family:'Rubik',sans-serif;">Reset Password
                                         </h1>
                                         <span
                                         style="display:inline-block; vertical-align:middle; margin:5px 0px; width:100px;"></span>
                                         <p style="font-size:15px; color:#455056; margin:0px 0 0; line-height:24px;">
                                             Hi ${fullName}  </p>
                                        
                                                 <span
                                                 style="display:inline-block; vertical-align:middle; margin:5px 0px; width:100px;"></span>
                                                 <p style="font-size:15px; color:#455056; margin:0px 0 0; line-height:24px;">
                                                 We have received your request to reset your password. Your verification code is ${verificationCode}</p>
                                                 <span
                                                 style="display:inline-block; vertical-align:middle; margin:5px 0px; width:100px;"></span>
                                                 <p style="font-size:15px; color:#455056; margin:0px 0 0; line-height:24px;">
                                                   <strong>Regards</strong><br>Support Team</p> 
   
                                     </td>
                                 </tr>
                                 <tr>
                                     <td style="height:40px;">&nbsp;</td>
                                 </tr>
                             
                             </table>
                             </td>
                         </tr>
                         <tr>
                             <td style="height:20px;">&nbsp;</td>
                         </tr>
                         <tr>
                             <td>
                               
                                <span
                                style="display:inline-block; vertical-align:middle; margin:5px 0px; width:100px;"></span>
     
                                <h3 style="margin-bottom: 10px;">Need Support?</h3>
                                <p style="font-size:15px; color:#455056; margin:8px 0 0; line-height:24px;">Feel free to email us if you have any questions, comments or suggestions. We'll be happy to resolve your issues.</p>
                             </td>
                         </tr>
                         <tr>
                             <td style="height:20px;">&nbsp;</td>
                         </tr>
                     </table>
                 </td>
             </tr>
         </table>
     </body>
     </html>
     `;

  SmtpController.sendEmail(email, 'Reset Password', message);
};

addUserEmail = function (options) {
  //.log(options, "--------------------------options")
  var email = options.email;

  var fullName = options.fullName;
  var password = options.password;

  if (!fullName) {
    fullName = email;
  }
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
    `assets/img/logo.jpeg"  />
          
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
    fullName +
    `</h5>
            <p style="` +
    style.m0 +
    style.mb3 +
    style.textCenter +
    `margin-bottom:20px;font-weight: 600">Your Goodclean account has been created! <br>
            
            </p>
            <p style="` +
    style.m0 +
    style.mb3 +
    style.textCenter +
    `margin-bottom:20px;font-weight: 600">Your login credentials are: <br>
            
            </p>
  
            <p style="` +
    style.m0 +
    style.mb3 +
    style.textCenter +
    `margin-bottom:20px;font-weight: 600">Email: ${options.email} <br>
                
                </p>
  
                <p style="` +
    style.m0 +
    style.mb3 +
    style.textCenter +
    `margin-bottom:20px;font-weight: 600">Password: ${options.password} <br>
                    
                    </p>
          
        </div>
       
        <div class="footer" style="` +
    style.footer +
    `">
        2023 All Rights Reserved
        </div>
      </div>`;

  SmtpController.sendEmail(email, 'Registration', message);
};

contactUsEmail = function (options) {
  console.log(options, '----------------options');
  var email = options.email;
  var fullName = options.fullName;
  //   var Admin_Email=options.Admin_Email
  var mobileNo = options.mobileNo;
  var message = options.message;
  if (!fullName) {
    fullName = email;
  }
  message = '';
  message +=
    ` 

  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
      <title>Contact us email template</title>
  </head>
  <body style="margin: 0px; padding:0; background-color: #f2f3f8;">
      <table width="100%" style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans',sans-serif; font-family: 'Open Sans', sans-serif;">
          <tr>
              <td>
                  <table style="max-width:670px; margin:0 auto;" width="100%">
                      <tr>
                          <td style="height:20px;">&nbsp;</td>
                      </tr>
                      <tr>
                          <td style="text-align:center;">
                              <a href="#" title="logo" target="_blank">
                              <img style="margin-bottom:20px; height: 67%; width: 66%;"  src="` +
    constant.FRONT_WEB_URL +
    `/assets/img/logo.jpeg" title="logo" alt="logo">
                            </a>
                          </td>
                      </tr>
                      <tr>
                          <td style="height:10px;">&nbsp;</td>
                      </tr>
                      <tr>
                          <td>
                              <table width="100%"
                              style="max-width:670px; background:#fff; border-radius:3px; -webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);    border: 1px solid #e1e1e1;">
                              <tr>
                                  <td style="height:40px;">&nbsp;</td>
                              </tr>
                              <tr>
                                  <td style="padding:0 35px;">
                                   
                                      <span
                                      style="display:inline-block; vertical-align:middle; margin:5px 0px; width:100px;"></span>
                                      <p style="font-size:15px; color:#455056; margin:0px 0 0; line-height:24px;">
                                          Hi admin ${fullName} wants to contact with you. </p>
                                    
                                                 
                                                  <span
                                                  style="display:inline-block; vertical-align:middle; margin:5px 0px; width:100px;"></span>
                                                  <p style="font-size:15px; color:#455056; margin:0px 0 0; line-height:24px;">
                                                  Email: ${email} </p> 
                                                  <span
                                                  style="display:inline-block; vertical-align:middle; margin:5px 0px; width:100px;"></span>
                                                  <p style="font-size:15px; color:#455056; margin:0px 0 0; line-height:24px;">
                                                  FullName: ${fullName} </p> 

                                                  <span
                                                  style="display:inline-block; vertical-align:middle; margin:5px 0px; width:100px;"></span>
                                                  <p style="font-size:15px; color:#455056; margin:0px 0 0; line-height:24px;">
                                                  MobileNo: ${mobileNo} </p> 
                                                  <span
                                                  style="display:inline-block; vertical-align:middle; margin:5px 0px; width:100px;"></span>
                                                  <p style="font-size:15px; color:#455056; margin:0px 0 0; line-height:24px;">
                                                  Message: ${options.message} </p> 
                                                      <span
                                                      style="display:inline-block; vertical-align:middle; margin:5px 0px; width:100px;"></span>
                                                      <p style="font-size:15px; color:#455056; margin:0px 0 0; line-height:24px;">
                                                       <strong>Regards</strong><br> The Goodclean Support Team</p> 

                                  </td>
                              </tr>
                              <tr>
                                  <td style="height:40px;">&nbsp;</td>
                              </tr>
                          
                          </table>
                          </td>
                      </tr>
                      <tr>
                          <td style="height:20px;">&nbsp;</td>
                      </tr>
                      <tr>
                          <td>                             
                             <span
                             style="display:inline-block; vertical-align:middle; margin:5px 0px; width:100px;"></span>
  
                             <h3 style="margin-bottom: 10px;">Need Support?</h3>
                             <p style="font-size:15px; color:#455056; margin:8px 0 0; line-height:24px;">Feel free to email us if you have any questions, comments or suggestions. we'll be happy to resolve your issues.</p>
                          </td>
                      </tr>
                      <tr>
                          <td style="height:20px;">&nbsp;</td>
                      </tr>
                  </table>
              </td>
          </tr>
      </table>
  </body>
  </html>
  `;
  SmtpController.sendEmail(constant.Admin_Email, 'Contact Us', message);
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
