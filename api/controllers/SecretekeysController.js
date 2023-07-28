/**
 * SecretekeysController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const Services = require('../services/index');
const { constants } = require('../../config/constants');
module.exports = {

    generateKey: async (req, res) => {
        try {
            let { user_id, type } = req.body;
            if (!user_id) {
                return res.status(404).json({
                    success: false,
                    error: { code: 404, message: constants.SECRET_KEY.USER_ID_REQUIRED },
                });
            }

            if (!type) {
                return res.status(404).json({
                    success: false,
                    error: { code: 404, message: constants.SECRET_KEY.TYPE_REQUIRED },
                });
            }

            let get_user_keys = await Secretekeys.findOne({ user_id: user_id, type: type, isDeleted: false });
            if (get_user_keys) {
                let delete_keys = await Secretekeys.updateOne({ id: get_user_keys.id }, { isDeleted: true, updatedBy: req.identity.id });
            }

            let generate_key = Services.CommonServices.makeid(50);
            req.body.addedBy = req.identity.id;
            if (type == "secret_key") {
                req.body.secret_key = generate_key;
            } else if (type == "access_key") {
                req.body.access_key = generate_key;
            }

            let create_keys = await Secretekeys.create(req.body).fetch();
            if (create_keys) {
                return res.status(200).json({
                    success: true,
                    code: 200,
                    data: {},
                    message: constants.SECRET_KEY.ADDED,
                });
            }
            return res.status(404).json({
                success: false,
                error: { code: 404, message: constants.SECRET_KEY.SERVER_ERROR },
            });
        } catch (err) {
            console.log(err, '===========err');
            return res.status(400).json({ success: true, code: 400, error: err });
        }
    },

    getkeysById: async (req, res) => {
        try {
            let { user_id, type } = req.query;
            if (!user_id) {
                return res.status(404).json({
                    success: false,
                    error: { code: 404, message: constants.SECRET_KEY.USER_ID_REQUIRED },
                });
            }

            if (!type) {
                return res.status(404).json({
                    success: false,
                    error: { code: 404, message: constants.SECRET_KEY.TYPE_REQUIRED },
                });
            }

            let get_user_keys = await Secretekeys.findOne({ user_id: user_id, type: type, isDeleted: false });
            if (get_user_keys) {
                return res.status(200).json({
                    success: true,
                    code: 200,
                    data: get_user_keys,
                    message: constants.SECRET_KEY.FETCHED,
                });
            }

            return res.status(404).json({
                success: false,
                error: { code: 404, message: constants.SECRET_KEY.INVALID_ID },
            });
        } catch (err) {
            return res.status(400).json({ success: true, code: 400, error: err });
        }
    },

    getAllKeys: async (req, res) => {
        try {
            var search = req.param('search');
            var isDeleted = req.param('isDeleted');
            var page = req.param('page');
            var user_id = req.param('user_id');
            var type = req.param('type');
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
                query.or = [
                    { secret_key: { $regex: search, $options: 'i' } },
                ];
            }

            query.isDeleted = isDeleted
            if (user_id) {
                query.user_id = user_id;
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
                sortquery[field ? field : 'updatedAt'] = sortType ? sortType == 'desc' ? -1 : 1 : -1;
            } else {
                sortquery = { updatedAt: -1 };
            }
            let total = await Secretekeys.count(query)
            let result = await Secretekeys.find(query).sort(sortBy).skip(page).limit(count)

            return res.status(200).json({
                "success": true,
                "total": total,
                "data": result
            })
        }
        catch (err) {
            console.log(err, "----------err")
            return res.status(400).json({
                success: false,
                error: { code: 400, message: err.toString() },
            });
        }
    },
};

