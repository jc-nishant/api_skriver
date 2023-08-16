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
                message: constantObj.roles.UPDATE_SUCCESS
            })
        } catch (err) {
            console.log(err,"====================================err")
            return res.status(400).json({
                success: false,
                error: { code: 400, message: "" + err }
            })
        }
    },
    editRole: async (req, res) => {
        try {
            let id  = req.body.id;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: { code: 400, message: "Id is required" }
                })
            }
            req.body.updatedBy = req.identity.id;
            delete req.body.id;
            
            let update_details = await Roles.updateOne({ id: id }, req.body);
            if (update_details) {
                return res.status(200).json({
                    success: true,
                    data:update_details,
                    message: constantObj.roles.UPDATE_SUCCESS
                })
            } else {
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
            var search = req.param('search');
            var isDeleted = req.param('isDeleted');
            var page = req.param('page');
            var status = req.param('status');
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
            if(status){
                query.status = status
            }
            if (search) {
                query.or = [
                  { role: { 'like': `%${search}%` } },
                ]
              }

            if (isDeleted) {
                if (isDeleted === 'true') {
                  isDeleted = true;
                } else {
                  isDeleted = false;
                }
                query.isDeleted = isDeleted;
              }else{
                query.isDeleted = false;
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
            let total = await Roles.count(query)
            let findroles = await Roles.find(query).sort(sortBy).skip(skipNo).limit(count)
            return res.status(200).json({
                "success": true,
                "total": total,
                "data": findroles
            })
        }
        catch (err) {
            return res.status(400).json({
                success: false,
                error: { code: 400, message: err.toString() },
            });
        }
    },
    //         let search = req.param('search');
    //         let sortBy = req.param('sortBy');
    //         let page = req.param('page');
    //         let count = req.param('count');
    //         let role = req.param('role');

    //         if (!page) { page = 1 }
    //         if (!count) { count = 10 }
    //         let skipNo = (page - 1) * count;
    //         let query = {};


    //         if (sortBy) {
    //             sortBy = sortBy.toString();
    //         } else {
    //             sortBy = 'createdAt desc';
    //         }

    //         if (search) {
    //             query.$or = [
    //                 { role: { $regex: search, '$options': 'i' } },
    //             ]
    //         }
    //         if (role) {
    //             query.role = role
    //         }

    //         query.isDeleted = false

    //         db.collection("roles").aggregate([{
    //             $project: {
    //                 id: "$_id",
    //                 role: "$role",
    //                 permission:"$permission",
    //                 updatedBy: "$updatedBy",
    //                 isDeleted: "$isDeleted",
    //                 updatedAt: "$updatedAt",
    //                 createdAt: "$createdAt"
    //             },
    //         },
    //         {
    //             $match: query,
    //         },
    //         ])
    //             .toArray((err, totalResult) => {
    //                 if (err) {
    //                     return res.status(400).json({
    //                         success: false,
    //                         error: { code: 400, message: "" + err }
    //                     })
    //                 }
    //                 db.collection("roles")
    //                     .aggregate([
    //                         {
    //                             $project: {
    //                                 id: "$_id",
    //                                 role: "$role",
    //                                 permission:"$permission",
    //                                 updatedBy: "$updatedBy",
    //                                 isDeleted: "$isDeleted",
    //                                 updatedAt: "$updatedAt",
    //                                 createdAt: "$createdAt"
    //                             }
    //                         },
    //                         {
    //                             $match: query,
    //                         },

    //                         {
    //                             $skip: skipNo,
    //                         },
    //                         {
    //                             $limit: Number(count),
    //                         },
    //                     ])
    //                     .toArray((err, result) => {
    //                         if (err) {
    //                             return res.status(400).json({
    //                                 success: false,
    //                                 error: { code: 400, message: "" + err }
    //                             })
    //                         } else {

    //                             return res.status(200).json({
    //                                 success: true,
    //                                 data: result,
    //                                 total: totalResult.length
    //                             })
    //                         }
    //                     });
    //             });
    //     } catch (err) {
    //         return res.status(400).json({   
    //             success: false,
    //             error: { code: 400, message: "" + err }
    //         })
    //     }
    // },
    getRole: async (req, res) => {
        try {
            let id = req.query.id;


            let get_permission = await Roles.findOne({ id: id });
            if (get_permission) {
                return res.status(200).json({
                    success: true,
                    message: constantObj.roles.DETAILS_FOUND,
                    data: get_permission
                })
            } else {
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

};

