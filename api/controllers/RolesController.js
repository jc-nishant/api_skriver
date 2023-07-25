//const Roles = require("../models/Roles");

/**
 * RolesController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const db = sails.getDatastore().manager;
var constantObj = sails.config.constants;

module.exports = {
  
    addRole: async (req, res) => {
        try {
            const data = req.body;

            const role = await Roles.create(data).fetch();
            return res.status(200).json({
                success: true,
                data: role,
                message: "Role added successfully"
            })
        } catch (err) {
            return res.status(400).json({
                success: false,
                error: { code: 400, message: "" + err }
            })
        }
    },
    editRole: async (req, res) => {
        try {
            let { id } = req.body;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: { code: 400, message: constantObj.roles.PAYLOAD_MISSING }
                })
            }
            req.body.updatedBy = req.identity.id;
            delete req.body.role;

            let update_details = await Roles.updateOne({ id: id },req.body);
            if(update_details){
            return res.status(200).json({
                success: true,
                message: constantObj.roles.UPDATE_SUCCESS
            })
        }else{
            return res.status(400).json({
                success: false,
                message: constantObj.roles.FAILED
            })
        }
        } catch (err) {
            return res.status(400).json({
                success: false,
                error: { code: 400, message: "" + err }
            })
        }
    },
    getRolesListing: async (req, res) => {
        try {
            let search = req.param('search');
            let sortBy = req.param('sortBy');
            let page = req.param('page');
            let count = req.param('count');
            let role = req.param('role');

            if (!page) { page = 1 }
            if (!count) { count = 10 }
            let skipNo = (page - 1) * count;
            let query = {};


            if (sortBy) {
                sortBy = sortBy.toString();
            } else {
                sortBy = 'createdAt desc';
            }

            if (search) {
                query.$or = [
                    { role: { $regex: search, '$options': 'i' } },
                ]
            }
            if (role) {
                query.role = role
            }

            query.isDeleted = false

            db.collection("roles").aggregate([{
                $project: {
                    id: "$_id",
                    role: "$role",
                    updatedBy: "$updatedBy",
                    isDeleted: "$isDeleted",
                    //deletedAt: "$deletedAt",
                    updatedAt: "$updatedAt",
                    createdAt: "$createdAt"
                },
            },
            {
                $match: query,
            },
            ])
                .toArray((err, totalResult) => {
                    if (err) {
                        return res.status(400).json({
                            success: false,
                            error: { code: 400, message: "" + err }
                        })
                    }
                    db.collection("roles")
                        .aggregate([
                            {
                                $project: {
                                    id: "$_id",
                                    role: "$role",

                                    updatedBy: "$updatedBy",
                                    isDeleted: "$isDeleted",
                                    //deletedAt: "$deletedAt",
                                    updatedAt: "$updatedAt",
                                    createdAt: "$createdAt"
                                }
                            },
                            {
                                $match: query,
                            },

                            {
                                $skip: skipNo,
                            },
                            {
                                $limit: Number(count),
                            },
                        ])
                        .toArray((err, result) => {
                            if (err) {
                                return res.status(400).json({
                                    success: false,
                                    error: { code: 400, message: "" + err }
                                })
                            } else {

                                return res.status(200).json({
                                    success: true,
                                    data: result,
                                    total: totalResult.length
                                })
                            }
                        });
                });
        } catch (err) {
            return res.status(400).json({
                success: false,
                error: { code: 400, message: "" + err }
            })
        }
    },
    getRole: async (req, res) => {
        try {
            let id = req.query.id;


            let get_permission = await Roles.findOne({ id: id });
            if (get_permission) {
                return res.status(200).json({
                    success: true,
                    message:constantObj.roles.DETAILS_FOUND,
                    data: get_permission
                })
            }else{
                return res.status(400).json({
                    success: false,
                    message:constantObj.roles.FAILED
            })
        }
    }catch (err) {
            return res.status(400).json({
                success: false,
                error: { code: 400, message: "" + err }
            })
        }
    },

};

