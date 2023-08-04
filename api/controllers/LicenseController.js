/**
 * LicenseController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

//const License = require("../models/License");

var constantObj = sails.config.constants;
var uuid = require('uuid');

module.exports = {
  addLicense: async (req, res) => {
    try {
      let data = req.body;
      data.updatedBy = req.identity.id;
      data.addedBy = req.identity.id;

      var randomStr = uuid.v4();
      data.licence_id = randomStr;
      const add_licence = await License.create(data).fetch();
      if (add_licence) {
        return res.status(200).json({
          success: true,
          data: add_licence,
          message: constantObj.license.UPDATE_SUCCESS,
        });
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },

  getLicense: async (req, res) => {
    try {
      let id = req.query.id;

      let get_license = await License.findOne({ id: id, isDeleted: false });
      if (get_license) {
        return res.status(200).json({
          success: true,
          message: constantObj.license.DETAILS_FOUND,
          data: get_license,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: constantObj.license.FAILED,
        });
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },

  getLicenselisting: async (req, res) => {
    try {
      let search = req.param('search');
      let sortBy = req.param('sortBy');
      let page = req.param('page');
      let count = req.param('count');
      let status = req.param('status');
      let type = req.param('type');

      if (!page) {
        page = 1;
      }
      if (!count) {
        count = 10;
      }
      let skipNo = (page - 1) * count;
      let query = {};

      if (sortBy) {
        sortBy = sortBy.toString();
      } else {
        sortBy = 'createdAt desc';
      }
      if (status) {
        query.status = status;
      }

      if (search) {
        query.or = [
          { license_name: { like: `%${search}%` } },
          { license_number: { like: `%${search}%` } },
        ];
      }

      query.isDeleted = false;

      if (type) {
        query.isAssigned = false;
      }

      let total = await License.count(query);
      const all_users_licenses = await License.find(query)
        .skip(skipNo)
        .limit(count)
        .sort(sortBy);

      if (all_users_licenses) {
        if (all_users_licenses && all_users_licenses.length > 0) {
          for await (let itm of all_users_licenses) {
            const user = await Users.findone({ license_id: itm.id });
            if (user) {
              itm.user = user;
            }
          }
        }
        return res.status(200).json({
          success: true,
          message: constantObj.license.DETAILS_FOUND,
          total: total,
          data: all_users_licenses,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: constantObj.license.FAILED,
        });
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },

  editLicense: async (req, res) => {
    try {
      let { id } = req.body;
      if (!id) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: constantObj.license.ID_MISSING },
        });
      }
      req.body.updatedBy = req.identity.id;

      let update_details = await License.updateOne({ id: id }, req.body);
      if (update_details) {
        return res.status(200).json({
          success: true,
          message: constantObj.license.UPDATE_SUCCESS,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: constantObj.license.FAILED,
        });
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },

  deleteLicense: async (req, res) => {
    try {
      const id = req.param('id');

      if (!id) {
        return res.status(404).json({
          success: false,
          error: { code: 400, message: constantObj.license.ID_MISSING },
        });
      } else {
        let license = await License.findOne({ id: id });
        if (!license) {
          return res.status(400).json({
            success: false,
            error: { code: 400, message: constantObj.license.FAILED },
          });
        } else {
          req.body.updatedBy = req.identity.id;

          let removelicense = await License.updateOne(
            { id: id },
            { isDeleted: true }
          );
          return res.status(200).json({
            success: true,
            message: constantObj.license.DELETED,
          });
        }
      }
    } catch (err) {
      //(err);
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '' + err },
      });
    }
  },
};
