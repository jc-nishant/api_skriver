/**
 * SubscriptionPlanController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const db = sails.getDatastore().manager;
const constants = require('../../config/constants.js').constants;
const credentials = require('../../config/local.js'); //sails.config.env.production;
const stripe = require("stripe")(credentials.PAYMENT_INFO.SECREATKEY);
const ObjectId = require('mongodb').ObjectId;
const Services = require('../services/index');

exports.addSubscriptionPlan = async (req, res) => {
    try {

        let { name, amount } = req.body;

        let get_query = {
            isDeleted: false,
            name: name,
        };
        let get_subscription_plan = await Subscriptionplans.findOne(get_query);
        if (get_subscription_plan) {
            return res.status(200).json({
                success: true,
                message: "Name already exist",
            });
        }

        let created_product = await Services.StripeServices.create_product({
            name: name,
        });
        if (created_product) {
            let plan_payload = {
                nickname: name,
                amount: amount,
                interval: req.body.interval ? req.body.interval : 'month',
                // interval: "day",

                interval_count: req.body.interval_count ? req.body.interval_count : 1,
                trial_period_days: req.body.trial_period_days
                    ? req.body.trial_period_days
                    : 1, // Clients Requirement
                // trial_period_days: 0,         // Clients Requirement

                product_id: created_product.id,
                currency: 'USD',
            };

            let create_plan = await Services.StripeServices.create_plan(plan_payload);

            if (create_plan) {
                req.body.addedBy = req.identity.id;
                req.body.stripe_plan_id = create_plan.id;
                req.body.stripe_product_id = created_product.id;

                let create_subscription_plan = await Subscriptionplans.create(
                    req.body
                ).fetch();
                if (create_subscription_plan) {
                    return res.status(200).json({
                        success: true,
                        message: "Plan added Sucessfully",
                    });
                }
                throw constants.COMMON.SERVER_ERROR;
            }
            return res.status(200).json({
                success: true,
                message: "plan not created",
            });
        }
        return res.status(200).json({
            success: true,
            message: "unable to create product",
        });
    } catch (err) {
        console.log(err, "============================err")
        return res.status(400).json({
            success: false,
            error: { message: "" + err },
        });
    }

};


exports.getPlanById = async (req, res) => {
    try {
        let id = req.param('id');
        if (!id) {
            return res.status(400).json({
                success: true,
                message: "Id is required"
            });
        }

        let get_subscriptionPlan = await Subscriptionplans.findOne({ id: id });
        // console.log(get_subscriptionPlan,"=============================get_subscriptionPlan")

        if (get_subscriptionPlan) {
            if (get_subscriptionPlan.addedBy) {
                let get_added_by_details = await Users.findOne({ id: get_subscriptionPlan.addedBy });
                if (get_added_by_details) {
                    get_subscriptionPlan.addedBy_name = get_added_by_details.fullName;
                }
            }
            if (get_subscriptionPlan.updatedBy) {
                let get_updated_by_details = await Users.findOne({ id: get_subscriptionPlan.updatedBy });
                if (get_updated_by_details) {
                    get_subscriptionPlan.updatedBy_name = get_updated_by_details.fullName;
                }
            }
            return res.status(200).json({
                success: true,
                message: constants.subscriptionplan.GET_PLAN_DATA,
                data: get_subscriptionPlan
            });
        }
        return res.status(400).json({
            success: true,
            message: "Invalid id"
        });
    }
    catch (err) {
        console.log(err,"=================err")
        return res.status(400).json({
            success: false,
            error: { message: "" + err },
        });
    }
};

exports.editsubscriptionPlan = async (req, res) => {
    try {
        let Data = req.body
        // console.log(Data);
        let id = req.body.id;
        if (!id) {
            throw constants.subscriptionplan.ID_REQUIRED;
        }
        Data.updatedBy = req.identity.id;
        req.body["updatedAt"] = new Date()
        let updatePlanData = await SubscriptionPlan.updateOne({ id: id }, Data);
        if (updatePlanData) {
            return res.status(200).json({
                success: true,
                message: constants.subscriptionplan.PLAN_UPDATED,
                data: updatePlanData
            });
        }
        throw constants.subscriptionplan.INVALID_ID;
    } catch (err) {
        // console.log(err);
        return res.status(400).json({
            success: false,
            error: { message: err },
        });
    }
};

// exports.getAllPlans = async (req, res) => {
//     try {

//         let search = req.param('search');
//         let page = req.param('page');
//         let count = req.param('count');
//         let status = req.param('status');
//         if (!page) {
//             page = 1;
//         }
//         if (!count) {
//             count = 10;
//         }
//         let skipNo = (page - 1) * count;
//         let query = {};

//         if (search) {
//             query.$or = [
//                 { name: { $regex: search, '$options': 'i' } },
//             ]
//         }

//         if (status) {
//             query.status = status
//         }

//         // query.$and.push({ isDeleted: false })
//         // console.log(query,"=================query")

//         db.collection("subscriptionplans").aggregate([
//             {
//                 $project: {
//                     id: "$_id",
//                     name: "$name",
//                     amount: "$amount",
//                     interval: "$interval",
//                     interval_count: "$interval_count",
//                     addedBy: "$addedBy",
//                     stripe_plan_id: "$stripe_plan_id",
//                     stripe_product_id: "$stripe_product_id",
//                     createdAt: "$createdAt",
//                     updatedAt: "$updatedAt",
//                     status: "$status",
//                     trial_period_days: "$trial_period_days",
//                     user: "$user",
//                     description: "$description",
//                     updatedBy: "$updatedBy",
//                     deletedBy: "$deletedBy"
//                 },
//             },
//             {
//                 $match: query,
//             },
//             {
//                 $sort: { createdAt: -1 },
//             },
//         ]).toArray((err, totalResult) => {
            
//             if (err) {
//                 return res.status(400).json({
//                     success: false,
//                     error: { message: err },
//                 });
//             }
//             db.collection("subscriptionplans").aggregate([
//                 {
//                     $project: {
//                         id: "$_id",
//                         name: "$name",
//                         amount: "$amount",
//                         interval: "$interval",
//                         interval_count: "$interval_count",
//                         addedBy: "$addedBy",
//                         stripe_plan_id: "$stripe_plan_id",
//                         stripe_product_id: "$stripe_product_id",
//                         createdAt: "$createdAt",
//                         updatedAt: "$updatedAt",
//                         status: "$status",
//                         trial_period_days: "$trial_period_days",
//                         user: "$user",
//                         description: "$description",
//                         updatedBy: "$updatedBy",
//                         deletedBy: "$deletedBy"
//                     },
//                 },
//                 {
//                     $match: query,
//                 },
//                 {
//                     $sort: { createdAt: -1 },
//                 },
//                 {
//                     $skip: skipNo,
//                 },
//                 {
//                     $limit: Number(count),
//                 },
//             ]).toArray((err, result) => {
//                 if (err) {
//                     return res.status(400).json({
//                         success: false,
//                         error: { message: err },
//                     });
//                 } else {

//                     let resData = {
//                         total_count: totalResult.length,
//                         data: result
//                     }

//                     if (!req.param('page') && !req.param('count')) {
//                         resData = {
//                             total_count: totalResult.length,
//                             data: result
//                         }
//                         return res.status(200).json({
//                             success: true,
//                             message: constants.subscriptionplan.ALL_PLAN_DATA,
//                             data: resData
//                         });
//                     }

//                     return res.status(200).json({
//                         success: true,
//                         message: constants.subscriptionplan.ALL_PLAN_DATA,
//                         data: resData
//                     });
//                 }
//             });
//         })
//     }
//     catch (err) {
//         return res.status(400).json({
//             success: false,
//             error: { message: err },
//         });
//     }
// };




exports.getAllPlans= async (req, res) => {
    try {
      var search = req.param('search');
      var role = req.param('role');
      var isDeleted = req.param('isDeleted');
      var page = req.param('page');
      var recordType = req.param('recordType');
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
        query.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
        ];
      }
      query.isDeleted = isDeleted
      if (recordType) {
        query.recordType = recordType;
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
      }
      let findusers = await Subscriptionplans.find(query).sort(sortBy).skip(page).limit(count)
      return res.status(200).json({
        "success": true,
        "total": findusers.length,
        "data": findusers
      })
    }
    catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: err.toString() },
      });
    }
  },
// exports.getAllPlansFrontend = async (req, res) => {
//     try {
//         let search = req.param('search');
//         let page = req.param('page');
//         let count = req.param('count');
//         let planType = req.param('planType');
//         let status = req.param('status');
//         let priceType = req.param('priceType');
//         let addedBy = req.param('addedBy');

//         if (!page) {
//             page = 1;
//         }
//         if (!count) {
//             count = 10;
//         }
//         let skipNo = (page - 1) * count;
//         let query = {};
//         query.$and = [];


//         if (search) {
//             query.$or = [
//                 { name: { $regex: search, '$options': 'i' } },
//                 { planType: { $regex: search, '$options': 'i' } },
//                 { priceType: { $regex: search, '$options': 'i' } },
//             ]
//         }
//         if (addedBy) {
//             query.addedBy = ObjectId(addedBy);
//         }
//         if (planType) {
//             query.planType = planType
//         }


//         if (status) {
//             query.$and.push({ status: status })
//         }
//         if (priceType) {
//             query.$and.push({ priceType: priceType })
//         }

//         query.$and.push({ isDeleted: false })

//         db.collection("subscriptionplan").aggregate([
//             {
//                 $project: {
//                     id: "$_id",
//                     name: "$name",
//                     planType: "$planType",
//                     price: "$price",
//                     features: "$features",
//                     categoryPlanId: "$categoryPlanId",
//                     isDeleted: "$isDeleted",
//                     deletedAt: "$deletedAt",
//                     addedBy: "$addedBy",
//                     category: "$category",
//                     limit: "$limit",
//                     status: "$status",
//                     user: "$user",
//                     priceType: "$priceType",
//                     updatedBy: "$updatedBy",
//                     updatedAt: "$updatedAt",
//                     createdAt: "$createdAt",
//                     deletedBy: "$deletedBy"
//                 },
//             },
//             {
//                 $match: query,
//             },
//             {
//                 $sort: { createdAt: -1 },
//             },
//         ]).toArray((err, totalResult) => {
//             console.log(err);
//             if (err) {
//                 return res.status(400).json({
//                     success: false,
//                     error: { message: "" + err },
//                 });
//             }
//             db.collection("subscriptionplan").aggregate([
//                 {
//                     $project: {
//                         id: "$_id",
//                         name: "$name",
//                         planType: "$planType",
//                         price: "$price",
//                         features: "$features",
//                         categoryPlanId: "$categoryPlanId",
//                         category: "$category",
//                         isDeleted: "$isDeleted",
//                         deletedAt: "$deletedAt",
//                         addedBy: "$addedBy",
//                         status: "$status",
//                         priceType: "$priceType",
//                         limit: "$limit",
//                         paymentType: "$paymentType",
//                         user: "$user",
//                         updatedBy: "$updatedBy",
//                         updatedAt: "$updatedAt",
//                         createdAt: "$createdAt",
//                         deletedBy: "$deletedBy"
//                     },
//                 },
//                 {
//                     $match: query,
//                 },
//                 {
//                     $sort: { createdAt: -1 },
//                 },
//                 {
//                     $skip: skipNo,
//                 },
//                 {
//                     $limit: Number(count),
//                 },
//             ]).toArray((err, result) => {
//                 if (err) {
//                     return res.status(400).json({
//                         success: false,
//                         error: { message: err },
//                     });
//                 } else {

//                     let resData = {
//                         total_count: totalResult.length,
//                         data: result
//                     }

//                     if (!req.param('page') && !req.param('count')) {
//                         resData = {
//                             total_count: totalResult.length,
//                             data: result
//                         }
//                         return res.status(200).json({
//                             success: true,
//                             message: constants.subscriptionplan.ALL_PLAN_DATA,
//                             data: resData
//                         });
//                     }

//                     return res.status(200).json({
//                         success: true,
//                         message: constants.subscriptionplan.ALL_PLAN_DATA,
//                         data: resData
//                     });
//                 }
//             });
//         })
//     }
//     catch (err) {
//         return res.status(400).json({
//             success: false,
//             error: { message: "" + err },
//         });
//     }
// };

exports.purchaseplan = async (req, res) => {
    try {
        let user_id = req.body.user_id
        let card_id = req.body.card_id
        const subscription_plan_id = req.body.id;

        let get_subscription_plan = await Subscriptionplans.findOne({
            id: subscription_plan_id,
            isDeleted: false,
            status: 'active',
        });
        if (!get_subscription_plan) {
            return res.status(400).json({
                success: true,
                message: constants.subscriptionplan.INVALID_ID,
            });
        }

        let get_user = await Users.findOne({ id: user_id });
        if (!get_user) {
            return res.status(400).json({
                success: true,
                message: constants.subscriptionplan.INVALID_ID,
            });
        }

        let card_details = await Cards.findOne({
            userId: get_user.id,
            card_id: card_id,
            isDeleted: false,
        });
        if (!card_details) {
            return res.status(400).json({
                success: true,
                message: constants.subscriptionplan.INVALID_CARD,
            });
        }

        let getSubsQuery = {
            status: 'active',
            user_id: user_id,
        };

        let get_existing_subscription = await Subscription.findOne(getSubsQuery);
        // console.log(get_existing_subscription,"======get_existing_subscription")

        if (
            get_existing_subscription &&
            get_existing_subscription.stripe_subscription_id
        ) {
            try {
                let get_stripe_existing_subscription =
                    await Services.StripeServices.retrieve_subscrition({
                        stripe_subscription_id:
                            get_existing_subscription.stripe_subscription_id,
                    });

                if (get_stripe_existing_subscription) {
                    let delete_old_subscription =
                        await Services.StripeServices.delete_subscription({
                            stripe_subscription_id:
                                get_existing_subscription.stripe_subscription_id,
                        });
                    if (delete_old_subscription) {
                        let updateSubscription = await Subscription.updateOne(
                            { id: get_existing_subscription.id },
                            {
                                status: 'cancelled',
                                updatedBy: req.identity.id,
                            }
                        );
                    }
                }
            } catch (error) {
                console.log(error);
            }
        }

        let create_subscription = await Services.StripeServices.buy_subscription({
            stripe_customer_id: get_user.stripe_customer_id,
            stripe_plan_id: get_subscription_plan.stripe_plan_id,
            card_id: card_id,
        });

        if (create_subscription && ['trialing', 'active'].includes(create_subscription.status)) {
            let get_inactive_subscription = await Subscription.findOne({
                status: 'inactive',
                user_id: user_id,
            });

            if (get_inactive_subscription) {
                let updateSubscription = await Subscription.updateOne(
                    { id: get_inactive_subscription.id },
                    {
                        status: 'cancelled',
                        updatedBy: req.identity.id,
                    }
                );
            }

            let create_subscription_payload = {
                user_id: user_id,
                subscription_plan_id: get_subscription_plan.id,
                stripe_subscription_id: create_subscription.id,
                addedBy: req.identity.id,
                name: get_subscription_plan.name ? get_subscription_plan.name : '',
                amount: get_subscription_plan.amount,
                interval: get_subscription_plan.interval ? get_subscription_plan.interval : 'month',
                interval_count: get_subscription_plan.interval_count ? get_subscription_plan.interval_count : 1,
                trial_period_days: get_subscription_plan.trial_period_days ? get_subscription_plan.trial_period_days : 30,
                valid_upto: new Date(create_subscription.current_period_end * 1000),
            };

            let add_subscription = await Subscription.create(create_subscription_payload).fetch();
            // console.log(add_subscription, "========================add_subscription")
            return res.status(200).json({
                success: true,
                message: "plan purchase successfully",
            });;

        }

    } catch (err) {
        console.log(err, "============================err")
        return res.status(400).json({
            success: false,
            error: { message: "" + err },
        });
    }
};

exports.removePlans = async (req, res) => {
    try {
        let id = req.param('id');

        if (!id) {
            throw constants.subscriptionplan.ID_REQUIRED;
        }
        let query = {}
        query.isDeleted = true
        query.deletedBy = req.identity.id
        query.deletedAt = new Date()
        // console.log(query,"==============================query")

        let delete_plan = await Subscriptionplans.updateOne({ id: id }, query);
        // console.log(delete_plan,"====================delete_plan")
        if (delete_plan) {
            return res.status(200).json({
                success: true,
                message: constants.subscriptionplan.DELETE_PLAN,
                data: delete_plan
            });
        }

        throw constants.subscriptionplan.INVALID_ID;
    }

    catch (err) {
        console.log(err,"==========================err");
        return res.status(400).json({
            success: false,
            error: { message: err },
        });
    }
};



