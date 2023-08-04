/**
 * SubscriptionPlanController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const db = sails.getDatastore().manager;
const constants = require('../../config/constants.js').constants;
const credentials = require('../../config/local.js'); //sails.config.env.production;
const stripe = require('stripe')(credentials.PAYMENT_INFO.SECREATKEY);
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
        message: 'Name already exist',
      });
    }

    let created_product = await Services.StripeServices.create_product({
      name: name,
    });
    console.log(created_product, '===========================created_product');
    if (created_product) {
      let pricing = req.body.pricing;
      // console.log(pricing,"======================pricing")
      if (pricing && pricing.length > 0) {
        for (let itm of pricing) {
          // console.log(itm,"==========itm")
          // console.log(itm.price,"=====================itm2")
          let plan_payload = {
            nickname: name,
            amount: itm.price,
            interval: itm.interval ? itm.interval : 'month',
            interval_count: itm.interval_count ? itm.interval_count : 1,
            trial_period_days: itm.trial_period_days
              ? itm.trial_period_days
              : 7,
            product_id: created_product.id,
            currency: 'USD',
          };

          // console.log(plan_payload,"====================plan_payload")
          let create_plan = await Services.StripeServices.create_plan(
            plan_payload
          );
          console.log(create_plan, '==========================create_plan');
          if (create_plan) {
            req.body.addedBy = req.identity.id;
            req.body.stripe_plan_id = create_plan.id;
            req.body.stripe_product_id = created_product.id;
            // console.log(req.body, "===================create_subscription_plan")
            let create_subscription_plan = await Subscriptionplans.create(
              req.body
            ).fetch();
            // console.log(create_subscription_plan, "==================create_subscription_plan111")
            if (create_subscription_plan) {
              return res.status(200).json({
                success: true,
                message: 'Plan added Sucessfully',
              });
            }
          }
        }
      } else {
        let plan_payload = {
          nickname: name,
          amount: 0,
          product_id: created_product.id,
          currency: 'USD',
        };

        // console.log(plan_payload,"====================plan_payload")
        let create_plan = await Services.StripeServices.create_plan(
          plan_payload
        );
        // console.log(create_plan,"============create_plan")
        req.body.addedBy = req.identity.id;
        req.body.stripe_plan_id = create_plan.id;
        // req.body.stripe_product_id = created_product.id;
        let create_subscription_plan = await Subscriptionplans.create(
          req.body
        ).fetch();
        // console.log(create_subscription_plan, "==================create_subscription_plan111")
        if (create_subscription_plan) {
          return res.status(200).json({
            success: true,
            message: 'Plan added Sucessfully',
          });
        }
      }
    }
    return res.status(200).json({
      success: false,
      message: 'unable to create product',
    });
  } catch (err) {
    // console.log(err, "============================err")
    return res.status(400).json({
      success: false,
      error: { message: '' + err },
    });
  }
};

exports.getPlanById = async (req, res) => {
  try {
    let id = req.param('id');
    if (!id) {
      return res.status(400).json({
        success: true,
        message: 'Id is required',
      });
    }

    let get_subscriptionPlan = await Subscriptionplans.findOne({ id: id });
    let featuresdata = [];
    if (get_subscriptionPlan.features) {
      if (get_subscriptionPlan.features.length > 0) {
        let features = get_subscriptionPlan.features;
        let find = await Features.find({ id: { in: features } });
        let newKey = 'checked';
        let newValue = true;
        find.forEach((obj) => {
          obj[newKey] = newValue;
        });
        get_subscriptionPlan.featuresdata = find;
      }
    }

    if (get_subscriptionPlan) {
      if (get_subscriptionPlan.addedBy) {
        let get_added_by_details = await Users.findOne({
          id: get_subscriptionPlan.addedBy,
        });
        if (get_added_by_details) {
          get_subscriptionPlan.addedBy_name = get_added_by_details.fullName;
        }
      }
      if (get_subscriptionPlan.updatedBy) {
        let get_updated_by_details = await Users.findOne({
          id: get_subscriptionPlan.updatedBy,
        });
        if (get_updated_by_details) {
          get_subscriptionPlan.updatedBy_name = get_updated_by_details.fullName;
        }
      }
      // get_subscriptionPlan.featuresdata = featuresdata
      return res.status(200).json({
        success: true,
        message: constants.subscriptionplan.GET_PLAN_DATA,
        data: get_subscriptionPlan,
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Invalid id',
    });
  } catch (err) {
    console.log(err, '=================err');
    return res.status(400).json({
      success: false,
      error: { message: '' + err },
    });
  }
};

exports.editsubscriptionPlan = async (req, res) => {
  try {
    let Data = req.body;
    // console.log(Data);
    const id = req.body.id;
    if (!id) {
      throw constants.subscriptionplan.ID_REQUIRED;
    }
    Data.updatedBy = req.identity.id;
    req.body['updatedAt'] = new Date();
    delete req.body.id;
    let updatePlanData = await Subscriptionplans.updateOne({ id: id }, Data);
    if (updatePlanData) {
      return res.status(200).json({
        success: true,
        message: 'Subscription plan is updated',
        data: updatePlanData,
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

exports.getAllPlans = async (req, res) => {
  try {
    var search = req.param('search');
    var role = req.param('role');
    var isDeleted = req.param('isDeleted');
    var page = req.param('page');
    var recordType = req.param('recordType');
    let status = req.param('status');
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
      query.or = [{ name: { like: `%${search}%` } }];
    }
    query.isDeleted = false;

    if (status) {
      query.status = status;
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
    let total = await Subscriptionplans.count(query);
    let get_subscriptionPlan = await Subscriptionplans.find(query)
      .sort(sortBy)
      .skip(skipNo)
      .limit(count);
    for (let itm of get_subscriptionPlan) {
      if (itm.features) {
        if (itm.features.length > 0) {
          let features = itm.features;
          itm.features = await Features.find({ id: { in: features } });
          console.log();
          let newKey = 'checked';
          let newValue = true;
          itm.features.forEach((obj) => {
            obj[newKey] = newValue;
          });
        }
      }
    }
    await (async function () {
      for await (let data of get_subscriptionPlan) {
        if (req.identity && req.identity.subscription_plan_id == data.id) {
          let find_subscription = await Subscription.findOne({
            subscription_plan_id: req.identity.subscription_plan_id,
            user_id: req.identity.id,
          });
          data.isActive = true;
          data.valid_upto = find_subscription.valid_upto;
          data.interval_count = find_subscription.interval_count;
        } else {
          data.isActive = false;
        }
      }
    })();

    return res.status(200).json({
      success: true,
      total: total,
      data: get_subscriptionPlan,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: { code: 400, message: err.toString() },
    });
  }
};
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
    let user_id = req.body.user_id;
    let card_id = req.body.card_id;
    const subscription_plan_id = req.body.id;

    let get_subscription_plan = await Subscriptionplans.findOne({
      id: subscription_plan_id,
      isDeleted: false,
      status: 'active',
    });
    // console.log(get_subscription_plan,"================================get_subscription_plan")
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
    // console.log(card_details,"=============card_details")
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
    console.log(getSubsQuery);
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
    // console.log(create_subscription,"=================================create_subscription")
    if (
      create_subscription &&
      ['trialing', 'active'].includes(create_subscription.status)
    ) {
      let get_inactive_subscription = await Subscription.findOne({
        status: 'inactive',
        user_id: user_id,
      });
      // console.log(get_inactive_subscription,"======================================get_inactive_subscription")
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
        interval: get_subscription_plan.interval
          ? get_subscription_plan.interval
          : 'month',
        interval_count: get_subscription_plan.interval_count
          ? get_subscription_plan.interval_count
          : 1,
        trial_period_days: get_subscription_plan.trial_period_days
          ? get_subscription_plan.trial_period_days
          : 30,
        valid_upto: new Date(create_subscription.current_period_end * 1000),
      };

      let add_subscription = await Subscription.create(
        create_subscription_payload
      ).fetch();
      let update = await Users.updateOne(
        { id: user_id },
        {
          stripe_subscription_id: create_subscription.id,
          subscription_plan_id: get_subscription_plan.id,
        }
      );
      return res.status(200).json({
        success: true,
        message: 'plan purchase successfully',
      });
    }
  } catch (err) {
    console.log(err, '============================err');
    return res.status(400).json({
      success: false,
      error: { message: '' + err },
    });
  }
};

exports.removePlans = async (req, res) => {
  try {
    let id = req.param('id');

    if (!id) {
      throw constants.subscriptionplan.ID_REQUIRED;
    }
    let query = {};
    query.isDeleted = true;
    query.deletedBy = req.identity.id;
    query.deletedAt = new Date();
    // console.log(query,"==============================query")

    let delete_plan = await Subscriptionplans.updateOne({ id: id }, query);
    // console.log(delete_plan,"====================delete_plan")
    if (delete_plan) {
      return res.status(200).json({
        success: true,
        message: constants.subscriptionplan.DELETE_PLAN,
        data: delete_plan,
      });
    }

    throw constants.subscriptionplan.INVALID_ID;
  } catch (err) {
    console.log(err, '==========================err');
    return res.status(400).json({
      success: false,
      error: { message: err },
    });
  }
};
