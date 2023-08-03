/**
 * FeaturesController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

var constantObj = sails.config.constants;
module.exports = {

    addFeatures: async (req, res) => {
        try {
            let data = req.body;
            data.addedBy = req.identity.id;
            data.updatedBy = req.identity.id;

            let query = {}

            query.isDeleted = false;
            query.name = data.name;
            const features_data = await Features.findOne(query);
            // console.log(features_data);
            if (features_data) {
                return res.status(200).json({
                    success: false,
                    message: constantObj.features.ALREADY_EXIST
                });
            } else {
                let createFeatures = await Features.create(data).fetch();
                if (createFeatures) {
                    return res.status(200).json({
                        success: true,
                        message: constantObj.features.FEATURES_SAVED
                    });
                }
            }

        }
        catch (err) {
            console.log(err, "===err");
            return res.status(400).json({
                success: false,
                error: { message: err },
            });
        }
    },

    findSingleFeature: async (req, res) => {
        try {
            let id = req.param('id');
            if (!id) {
                throw constantObj.features.ID_REQUIRED;
            }

            let get_Features = await Features.findOne({ id: id });

            if (get_Features) {
                if (get_Features.addedBy) {
                    let get_added_by_details = await Users.findOne({ id: get_Features.addedBy });
                    if (get_added_by_details) {
                        get_Features.addedBy_name = get_added_by_details.fullName;
                    }
                }
                if (get_Features.updatedBy) {
                    let get_updated_by_details = await Users.findOne({ id: get_Features.updatedBy });
                    if (get_updated_by_details) {
                        get_Features.updatedBy = get_updated_by_details.fullName;
                    }
                }
                return res.status(200).json({
                    success: true,
                    message: constantObj.features.GET_DATA,
                    data: get_Features
                });
            }
            throw constantObj.features.INVALID_ID;
        }
        catch (err) {
            return res.status(400).json({
                success: false,
                error: { message: err },
            });
        }
    },

    editfeature: async (req, res) => {
        try {
            let featureData = req.body
            let id = req.body.id;
            // console.log(id);
            if (!id) {
                throw constantObj.features.ID_REQUIRED;
            }
            featureData.updatedBy = req.identity.id;
            let updatefeatureData = await Features.updateOne({ id: id }, featureData);
            if (updatefeatureData) {
                return res.status(200).json({
                    success: true,
                    message: constantObj.features.UPDATED_FEATURES,
                    data: updatefeatureData
                });
            }
            throw constantObj.features.INVALID_ID;

        } catch (err) {
            console.log(err);
            return res.status(400).json({
                success: false,
                error: { message: err },
            });
        }
    },

    getAllFeatures: async (req, res) => {
        try {
            let search = req.param('search');
            let sortBy = req.param('sortBy');
            let page = req.param('page');
            let count = req.param('count');

            if (!page) { page = 1 }
            if (!count) { count = 10 }
            let skipNo = (page - 1) * count;
            let query = {};
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
                sortBy = "updatedAt desc"
              }

            
            
            if (search) {
                // query.or = [{
                //     // license_number: { 'like': `%${search}%` },
                //     license_name: { 'like': `%${search}%` },
                // }]
                query.or = [
                    { license_name: { 'like': `%${search}%` } },
                    { license_number: { 'like': `%${search}%` } },
                ]
            }

            query.isDeleted = false

            let total = await Features.count(query)
            const all_features = await Features.find(query).skip(skipNo).limit(count).sort(sortBy);

            if (all_features) {
                return res.status(200).json({
                    success: true,
                    message: constantObj.features.ALL_FEATURES,
                    total:total,
                    data: all_features
                })
            } else {
                return res.status(400).json({
                    success: false,
                    message: constantObj.features.NOT_FOUND
                })
            }
        } catch (err) {
            return res.status(400).json({
                success: false,
                error: { code: 400, message: "" + err }
            })
        }
    },
    
    deleteFeature: async (req, res) => {
        try {
            const id = req.param("id");

            if (!id) {
                return res.status(404).json({
                    success: false,
                    error: { code: 400, message: constantObj.features.ID_MISSING }
                })
            } else {
                let features = await Features.findOne({ id: id });
                if (!features) {
                    return res.status(400).json({
                        success: false,
                        error: { code: 400, message: constantObj.features.FAILED }
                    })
                } else {
                    req.body.updatedBy = req.identity.id;

                    let removelicense = await Features.updateOne({ id: id }, { isDeleted: true });
                    return res.status(200).json({
                        success: true,
                        message: constantObj.features.DELETED
                    })
                }
            }
        } catch (err) {
            //(err);
            return res.status(400).json({
                success: false,
                error: { code: 400, message: "" + err }
            })
        }
    },


}

