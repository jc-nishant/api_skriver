/**
 * Seed Function
 * (sails.config.bootstrap)
 *
 * A function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also create a hook.
 *
 * For more information on seeding your app with fake data, check out:
 * https://sailsjs.com/config/bootstrap
 */

const smtpTransport = require('nodemailer-smtp-transport');
const Services = require('../api/services/index');
const cron = require('node-cron');

module.exports.bootstrap = async function () {
  // By convention, this is a good place to set up fake data during development.
  //
  // For example:
  // ```
  // // Set up fake development data (or if we already have some, avast)
  // if (await User.count() > 0) {
  //   return;
  // }
  //

  /**Seeding the user in db  */
  Users.count().then(async (user) => {
    if (user == 0) {
      await Users.createEach([
        {
          email: 'amit@yopmail.com',
          firstName: 'Amit',
          lastName: 'Kumar',
          status: 'active',
          password: 'Jc@12345',
          isVerified: 'Y',
          // date_verified: new Date(),
          role: 'admin',
        },
        {
          email: 'jc_admin@yopmail.com',
          firstName: 'Amit',
          lastName: 'Kumar',
          status: 'active',
          password: 'Jc@12345',
          isVerified: 'Y',
          // date_verified: new Date(),
          role: 'admin',
        },

        {
          email: 'user@yopmail.com',
          firstName: 'Amit',
          lastName: 'Kumar',
          status: 'active',
          password: 'amit@17231',
          isVerified: 'Y',
          // date_verified: new Date(),
          role: 'user',
        },

        // etc.
      ]);
    }
  });

  /**Seeding SMTP Detail into db */

  if ((await Smtp.count()) == 0) {
    var smtp = await Smtp.create({
      service: 'Gmail',
      host: 'smtp.gmail.com',
      port: 587,
      debug: true,
      sendmail: true,
      requiresAuth: true,
      domains: ['gmail.com', 'googlemail.com'],
      user: 'test@gmail.com',
      pass: 'test!234',
    });
  }
  // subscription cancel
  cron.schedule("0 */12 * * *", async () => {
    let date = new Date();
    date.setDate(date.getDate() - 1)
    let update_subscriptions = await Subscription.update({
      status: { in: ["active", "inactive"] },
      valid_upto: { "<": date }
    },
      {
        status: "cancelled",
      }).fetch();

    if (update_subscriptions && update_subscriptions.length > 0) {
      for await (let item of update_subscriptions) {
        try {
          let update_user = await Users.updateOne({ id: item.user_id }, {
            blue_tick_enabled: false
          });

          let delete_old_subscription = await Services.StripeServices.delete_subscription({
            stripe_subscription_id: item.stripe_subscription_id
          });
        } catch (error) {
          console.log(error, '===error');
        }
      }
    }
  })
};
