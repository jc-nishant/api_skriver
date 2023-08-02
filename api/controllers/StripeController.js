/**
 * StripeController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const db = sails.getDatastore().manager;
var constantObj = sails.config.constants;
var ObjectId = require('mongodb').ObjectID;
const Services = require('../services/index');
var payment_const = require('../../config/local.js');
const stripe = require('stripe')(payment_const.PAYMENT_INFO.SECREATKEY);
//  const html_to_pdf = require('html-pdf-node');
generateNumber = function () {
    // action are perform to generate VeificationCode for user
    var length = 9,
        charset = '0123456789',
        retVal = '';

    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
};
generateNumberTime = function () {
    var length = 9,
        charset = '0123456789',
        retVal = '';
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
};
module.exports = {

    /**Add Card */

    addCard: async (req, res) => {
        stripe.tokens.create(
            {
                card: {
                    number: req.body.card_number,
                    exp_month: req.body.exp_month,
                    exp_year: req.body.exp_year,
                    cvc: req.body.cvc,
                    name: req.identity.fullName,
                },
            },
            async (err, token) => {
                if (err) {
                    console.log(err)
                    return res.status(404).json({
                        success: false,
                        error: { code: 404, message: err.raw.message },
                        // error: { code: 404, message: constantObj.card.WRONG_DETAIL },
                    });
                } else {
                    /**If user is alreadyregistered on stripe  */
                    console.log(req.identity.id, "====req.identity.id")
                    console.log(req.identity.stripe_customer_id, "====req.customer_id")

                    if (req.identity.stripe_customer_id != undefined && req.identity.stripe_customer_id != '') {
                        // console.log("adding new card")

                        var cardNumber = String(req.body.card_number);
                        last4 = cardNumber.slice(cardNumber.length - 4);
                        console.log(last4)
                        const cards = await Cards.find({ userId: req.identity.id, last4: last4 })
                        console.log(cards, "-------------------cardexist");
                        /**User can't add same card multiple time */
                        if (cards && cards.length > 0) {
                            return res.status(400).json({
                                success: false,
                                error: {
                                    code: 400,
                                    message: constantObj.CARD.CARD_EXIST,
                                },
                            });
                        }

                        stripe.customers.createSource(
                            req.identity.stripe_customer_id,
                            {
                                source: token.id,
                            },
                            async (err, customer) => {
                                if (err) {
                                    return res.status(404).json({
                                        success: false,
                                        error: { code: 404, message: "" + err },
                                    });
                                }
                                try {
                                    /**Making last added card default on stripe */
                                    const updatedcustomer = await stripe.customers.update(
                                        req.identity.stripe_customer_id,
                                        {
                                            default_source: customer.id,
                                        }
                                    );
                                } catch (err) {
                                    return res.status(400).json({
                                        success: false,
                                        error: { code: 404, message: '' + err },
                                    });
                                }

                                addedCard = {
                                    userId: req.identity.id,
                                    card_id: customer.id,
                                    last4: customer.last4,
                                    exp_month: customer.exp_month,
                                    exp_year: customer.exp_year,
                                    brand: customer.brand,
                                    firstName: req.body.firstName,
                                    lastName: req.body.lastName,
                                    zipCode: req.body.zipCode,
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                    // isDefault: true,
                                };
                                // console.log(req.identity.customer_id, "-----------------------addedCard")
                                const existedUserCards = await Cards.find({ userId: req.identity.id })
                                if (existedUserCards && existedUserCards.length == 0) {
                                    addedCard.isDefault = true
                                }
                                /**adding added card into user and making it default */

                                var createdCard = await Cards.create(addedCard)
                                var updated = Users.updateOne({ id: req.identity.id }, {
                                    stripe_customer_id: customer.id,
                                })
                                console.log(updated, "updated")

                                return res.status(200).json({
                                    success: true,
                                    data: customer,
                                    message: constantObj.CARD.CARD_ADDED,
                                });
                            }
                        );

                    } else {
                        /**If user is not registered on stripe */
                        // console.log("------else")
                        stripe.customers.create(
                            {
                                description: req.identity.email,
                                email: req.identity.email,
                                name: req.identity.fullName,
                                source: token.id, // obtained with Stripe.js
                            },
                            (err, customer) => {
                                if (err) {
                                    return res.status(404).json({
                                        success: false,
                                        error: { code: 404, message: err.raw.message },
                                    });
                                }

                                var query =
                                {
                                    userId: req.identity.id,
                                    card_id: customer.default_source,
                                    last4: token.card.last4,
                                    exp_month: token.card.exp_month,
                                    exp_year: token.card.exp_year,
                                    brand: token.card.brand,
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                    isDefault: true,
                                }
                                console.log(req.identity.id, "=============req.identity.id")
                                Users.update(
                                    { id: req.identity.id },
                                    {
                                        stripe_customer_id: customer.id,
                                    }
                                ).then(async (data) => {
                                    // updateExistingCards = await Cards.update({userId:req.identity.id},{isDefault:false})
                                    var createdCard = await Cards.create(query)
                                    return res.status(200).json({
                                        success: true,
                                        data: customer,
                                        message: constantObj.CARD.CARD_ADDED,
                                    });
                                });
                                // console.log(users, "--------------users");
                            }
                        );
                    }
                }
            }
        )
    },

    /** Cards Listing */

    getCards: async (req, res) => {

        try {
            const userId = req.identity.id
            const cards = await Cards.find({ userId: userId })
            if (cards && cards.length > 0) {
                for await (const data of cards) {
                    var date = new Date()
                    var currentMonth = date.getUTCMonth() + 1
                    var currentYear = date.getUTCFullYear()
                    if (Number(data.exp_year) < Number(currentYear)) {
                        data.isExpired = true
                    } else if (Number(data.exp_month) < Number(currentMonth) && Number(data.exp_year) <= Number(currentYear)) {
                        data.isExpired = true
                    } else {
                        data.isExpired = false
                    }
                }
            }

            return res.status(200).json({
                success: true,
                data: cards
            })
        } catch (err) {
            return res.status(400).json({
                success: false,
                error: { code: 400, message: "" + err }
            })
        }
    },
    getAllCards: async (req, res) => {
        try {
            var search = req.param('search');
            var status = req.param('status');
            var page = req.param('page');
            var type = req.param('type');
            var sortBy = req.param('sortBy');
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
                    { fullName: { 'like': `%${search}%` } },
                    { email: { 'like': `%${search}%` } },
                ]
            }
            query.isDeleted = false
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
            }
            let total = await Cards.count(query)
            let findusers = await Cards.find(query).sort(sortBy).skip(skipNo).limit(count)
            return res.status(200).json({
                "success": true,
                "total": total,
                "data": findusers
            })
        }
        catch (err) {
            console.log(err, "====================err")
            return res.status(400).json({
                success: false,
                error: { code: 400, message: err.toString() },
            });
        }
    },


    /** Delete Card */

    deleteCard: async (req, res) => {
        var customer_id = req.identity.stripe_customer_id;
        const card_id = req.param('card_id');
        if (!card_id || card_id == undefined) {
            return res.status(404).json({
                success: false,
                error: { code: 404, message: constantObj.card.PAYLOAD_MISSING }
            })
        }
        const id = req.identity.id;
        // console.log(id, "=======================id")
        try {
            // stripe.customers.deleteSource(
            //     customer_id,
            //     card_id,
            //     async (err, confirmation) => {
            //         if (err) {
            //             return res.status(400).json({
            //                 success: false,
            //                 code: 400,
            //                 message: '' + err,
            //             });
            //         } else {
            //             var card = await Cards.findOne({ userId: id, card_id: card_id })
            //             if (card) {
            //                 if (card.isDefault == true) {
            //                     const cards = await Cards.find({ userId: id, isDefault: false })
            //                     if (cards && cards.length > 0) {
            //                         updatedCard = await Cards.update({ id: cards[0].id }, { isDefault: true })
            //                     }
            //                 }
                            const removedCard = await Cards.destroy({ userId: id, card_id: card_id })
                            return res.status(200).json({
                                success: true,
                                message: constantObj.CARD.CARD_DELETED
                            })
        //                 }

        //             }
        //         }
        //     );

        } 
        catch (err) {
            // console.log(err, "======================err")
            return res.status(400).json({
                success: false,
                error: {
                    code: 400,
                    message: '' + err,
                },
            });
        }
    },
    setPrimaryCard: async (req, res) => {
        try {
            const id = req.body.id;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: "Card id is required",

                })
            }

            let get_card = await Cards.findOne({ id: id, isDeleted: false });
            if (get_card) {
                let get_user = await Users.findOne({ id: get_card.userId });
                // console.log(get_user,"===================get_user")
                if (!get_user) {
                    return res.status(400).json({
                        success: false,
                        message: "User not found",

                    })
                }
                if (get_user.id != req.identity.id) {
                    return res.status(400).json({
                        success: false,
                        message: "User is not authorized",
                    })
                }

                let update_default_source = await Services.StripeServices.update_stripe_customer({
                    stripe_customer_id: get_user.stripe_customer_id,
                    source_id: get_card.card_id
                })
                if (update_default_source) {
                    let update_other_cards = await Cards.update({ userId: req.identity.id }, { isDefault: false, updatedBy: req.identity.id }).fetch()
                    if (update_other_cards && update_other_cards.length > 0) {
                        const set_primary_card = await Cards.updateOne({ userId: req.identity.id, card_id: get_card.card_id }, { isDefault: true });
                        if (set_primary_card) {
                            return res.status(200).json({
                                success: true,
                                message: "Card set as primary card successfully",
                            })
                        }
                    } else {
                        return res.status(400).json({
                            success: false,
                            message: "Something Went Wrong. Please try again",
                        })
                    }
                } else {
                    return res.status(400).json({
                        success: false,
                        message: "Something Went Wrong. Please try again",
                    })
                }
            }
            return res.status(400).json({
                success: false,
                message: " INVALID_ID",
            })
        } catch (error) {
            console.log(error,"==================error")
            return res.status(400).json({
                success: false,
                error: { code: 400, message: "" + error }
            })
        }
    },

    // webhook: async (request, response) => {
    //     try {
    //         const event = request.body;
    //         // Handle the event
    //         switch (event.type) {
    //             case 'customer.subscription.updated':
    //                 var event_object = event.data.object;
    //                 if (event_object.status == "active") {
    //                     let update_subscription = await Subscriptions.updateOne({ stripe_subscription_id: event_object.id }, {
    //                         valid_upto: new Date(event_object.current_period_end * 1000),
    //                         status: "active"
    //                     });
    //                 }
    //                 break;

    //             case 'invoice.payment_succeeded':
    //                 var event_object = event.data.object;

    //                 if (event_object.subscription) {

    //                     let get_subscription_data = await Subscriptions.findOne({
    //                         stripe_subscription_id: event_object.subscription
    //                     });


    //                     if (get_subscription_data) {
    //                         let get_subscription_plan = await SubscriptionPlans.findOne({
    //                             id: get_subscription_data.subscription_plan_id
    //                         });

    //                         let transaction_payload = {
    //                             user_id: get_subscription_data.user_id,
    //                             paid_to: get_subscription_plan ? get_subscription_plan.addedBy : null,
    //                             transaction_type: "buy_subscription",
    //                             subscription_plan_id: get_subscription_plan.id,
    //                             transaction_id: event_object.id,
    //                             subscription_id: get_subscription_data.id,
    //                             stripe_charge_id: event_object.id,
    //                             currency: event_object.currency,
    //                             amount: event_object.amount_paid ? event_object.amount_paid : 0,
    //                             stripe_subscription_id: event_object.subscription,
    //                             transaction_status: event_object.status,
    //                         }

    //                         if (event_object.status == "paid") {
    //                             transaction_payload.transaction_status = "successful";
    //                         }

    //                         let create_transacton = await Transactions.create(transaction_payload).fetch();
    //                         if (create_transacton) {
    //                             if (create_transacton.transaction_type == "buy_subscription") {

    //                                 //----------- update dashboard ----------//
    //                                 let total_subscription_payment = await Services.Dashboard.get_key(create_transacton.user_id, "total_subscription_payment");
    //                                 total_subscription_payment = total_subscription_payment > 0 ? Number(total_subscription_payment) + Number(create_transacton.amount) : Number(create_transacton.amount);
    //                                 let update_dashboard = await Services.Dashboard.update_dashboard(create_transacton.user_id, { total_subscription_payment: total_subscription_payment });
    //                                 //----------- update dashboard ----------//

    //                                 let get_plan_added_by = await Users.findOne({ id: get_subscription_plan.addedBy });
    //                                 let get_subscriber = await Users.findOne({ id: get_subscription_data.user_id });
    //                                 let email_payload_to_admin = {
    //                                     email: get_plan_added_by.email,
    //                                     subscription_id: get_subscription_data.id,
    //                                     user_id: get_plan_added_by.id,
    //                                     subscribed_by: get_subscription_data.user_id,
    //                                     transaction_id: create_transacton.id
    //                                 }

    //                                 let email_payload_to_user = {
    //                                     email: get_subscriber.email,
    //                                     subscription_id: get_subscription_data.id,
    //                                     user_id: get_subscriber.id,
    //                                     subscribed_by: get_subscriber.id,
    //                                     transaction_id: create_transacton.id
    //                                 }

    //                                 await Emails.OnboardingEmails.subscription_transaction_email(email_payload_to_admin);
    //                                 await Emails.OnboardingEmails.subscription_transaction_email(email_payload_to_user);
    //                             }
    //                         }
    //                     }

    //                 }

    //                 break;

    //             case 'customer.subscription.trial_will_end':
    //                 var event_object = event.data.object;
    //                 if (event_object.id) {

    //                     let get_subscription_data = await Subscriptions.updateOne({
    //                         stripe_subscription_id: event_object.id
    //                     },
    //                         {
    //                             trial_period_end_date: new Date(event_object.trial_end * 1000)
    //                         }
    //                     );

    //                     if (get_subscription_data) {
    //                         let get_user_notification_email = await Services.UserServices.get_user_notification_email(get_subscription_data.user_id)
    //                         let email_payload_to_user = {
    //                             email: get_user_notification_email,
    //                             subscription_id: get_subscription_data.id,
    //                             user_id: get_subscription_data.user_id,
    //                             subscribed_by: get_subscription_data.user_id,
    //                         }

    //                         await Emails.OnboardingEmails.trial_will_end_email(email_payload_to_user)
    //                     }

    //                 }
    //                 break;

    //             case 'customer.subscription.deleted':
    //                 var event_object = event.data.object;
    //                 if (event_object.status == "canceled") {
    //                     let update_subscription = await Subscriptions.updateOne({ stripe_subscription_id: event_object.id }, {
    //                         status: "cancelled"
    //                     });
    //                 }
    //                 break;

    //             case 'invoice.upcoming':
    //                 var event_object = event.data.object;

    //                 if (event_object.subscription) {

    //                     let get_subscription_data = await Subscriptions.findOne({
    //                         stripe_subscription_id: event_object.subscription
    //                     });


    //                     if (get_subscription_data) {
    //                         let get_subscription_plan = await SubscriptionPlans.findOne({
    //                             id: get_subscription_data.subscription_plan_id
    //                         });

    //                         let get_plan_added_by = await Users.findOne({ id: get_subscription_plan.addedBy });
    //                         let get_subscriber = await Users.findOne({ id: get_subscription_data.user_id });
    //                         // let email_payload_to_admin = {
    //                         //     email: get_plan_added_by.email,
    //                         //     subscription_id: get_subscription_data.id,
    //                         //     user_id: get_plan_added_by.id,
    //                         //     subscribed_by: get_subscription_data.user_id,
    //                         //     amount_due: event_object.amount_due
    //                         // }

    //                         let email_payload_to_user = {
    //                             email: get_subscriber.email,
    //                             subscription_id: get_subscription_data.id,
    //                             user_id: get_subscriber.id,
    //                             subscribed_by: get_subscriber.id,
    //                             amount_due: event_object.amount_due,
    //                             period_end: event_object.period_end,
    //                         }
    //                         // await Emails.OnboardingEmails.subscriptiohn_transaction_email(email_payload_to_admin);
    //                         await Emails.OnboardingEmails.upcomming_invoice_email(email_payload_to_user);
    //                     }

    //                 }

    //                 break;

    //             default:
    //                 console.log(`Unhandled event type ${event.type}`);
    //         }

    //         // Return a response to acknowledge receipt of the event
    //         response.json({ received: true });

    //     } catch (error) {
    //         console.log(error, '=============error');
    //     }
    // }

};
function randomString(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
