/**
 * ContactusController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const credentials = require('../../config/local.js');
const bcrypt = require('bcrypt-nodejs');
var constant = require('../../config/local.js');
const SmtpController = require('../controllers/SmtpController');
var constantObj = sails.config.constants;
module.exports = {

    contactus: async (req, res) => {
        try {
            if (!req.body.email || typeof req.body.email == undefined) {
                return res.status(404).json({
                    success: false,
                    error: { code: 404, message: constantObj.user.EMAIL_REQUIRED },
                });
            }
            req.body.updatedBy = req.identity.id;
            req.body.addedBy = req.identity.id
            const contact = await Contactus.create(req.body).fetch();
            let find = await Users.findOne({id:req.identity.id})
            if (find) {
                sendContactUs({
                    email: find.email,
                    fullName: find.fullName,
                    messagee:contact.message,
                    id: find.id,
                });
                return res.status(200).json({
                    success: true,
                    data: contact,
                    message: "Thankyou for your query we will get back to you soon."
                })
            }
        } catch (err) {
            return res.status(400).json({
                success: false,
                error: { code: 400, message: "" + err }
            })
        }
    },
    getAllContactus: async (req, res) => {
        try {
          var search = req.param('search');
          var status = req.param('status');
          var isDeleted = req.param('isDeleted');
          var page = req.param('page');
          var type = req.param('type');
          var sortBy = req.param('sortBy');
          let company = req.param('company');
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
              { fullName: { like: `%${search}%` } },
              { email: { like: `%${search}%` } },
            ];
          }
          if (company) {
            query.company_id = Number(company);
          }
          if (isDeleted) {
            if (isDeleted === 'true') {
                isDeleted = true;
            } else {
                isDeleted = false;
            }
            query.isDeleted = isDeleted;
        } else {
            query.isDeleted = false;
        }
          if (status) {
            query.status = status;
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
            sortBy = 'updatedAt desc';
          }
    
          let total = await Contactus.count(query);
          let find = await Contactus.find(query)
            .sort(sortBy)
            .skip(skipNo)
            .limit(count)
          return res.status(200).json({
            success: true,
            total: total,
            data: find,
          });
        } catch (err) {
          console.log(err, '====================err');
          return res.status(400).json({
            success: false,
            error: { code: 400, message: err.toString() },
          });
        }
      },

    
};
sendContactUs = async (options) => {
    let email = options.email;
    // console.log(options, "==================options")
    message = '';
    message += `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Forget Password</title>
        </head><body style="font-family:sans-serif;">
            <div class="main" style=" height:100%; width:800px;align-items:center;display:flex; margin: auto;" >
                <div class="email" style="width: 500px; height:fit-content;margin: 50px auto; padding: 2rem; 
                     position:relative;  background-image: url('${credentials.BACK_WEB_URL}images/Email Template (6).jpg'); width: 900px;background-position: center;
                     background-repeat: no-repeat;
                     background-size: cover; border-radius: 40px; border: 1px solid #616666;"><div class="check-mark " style="text-align: center;">
                        <img src="${credentials.BACK_WEB_URL}images/SKRIVER.png" style="width: 160px;height: auto;">
                         <div class="line" style="height: 7px;background: #F1532B;margin-top: 13px;width: 70px;margin: 12px auto;">
                    </div>
                    </div>
                <div class="about_mail" style="
                    text-align: center;left: 50%;background: #e5e5e575;width: 100%; max-width: 80%;padding: 30px; margin:     3rem auto;"><h3 class="heading_mail" style="font-size: 55px;color: #1340B6;margin:0px;"> You’ve Got It!</h3><p class="dashboard" style="margin-bottom: 0px;margin-top: 12px;font-size: 22px;
                    line-height: 33px;"> Dear User, Thanks for your registering with our platform
                    We hope you had a good experience. Below are the features which you got in your package or subscription:.</p>
                </div>
                <div class="center_text" style="text-align: center; margin: 21px auto;width: 300px;margin: auto;">
                        <div class="line" style="height: 7px;background: #F1532B;margin-top: 13px;width: 70px;margin: 12px auto;">
                </div>
         <div class="text" style="display:flex;align-items: center;justify-content: center;height: 40px;"><span>
            <img src="${credentials.BACK_WEB_URL}images/Vector.png" style="height:20px; width:20px; margin-right: 10px;">
         </span>
         <p class="about_time" style="font-size: 16px;color: #514e4e;border-bottom: 1px solid #e3e1e1;padding-bottom: 10px;"> Time Tracking
        </p>
        </div>
        <div class="text" style="display: flex;align-items: center;justify-content: center;height: 40px;"><span>
           <img src="${credentials.BACK_WEB_URL}images/Vector.png" style="height:20px; width:20px; margin-right: 10px;">
        </span>
           <p class="about_time" style="font-size: 16px;color: #514e4e;border-bottom: 1px solid #e3e1e1;padding-bottom: 10px;"> Time Tracking</p>
        </div>
        <div class="text" style="display: flex;align-items: center;justify-content: center;height: 40px;">
        <span>
           <img src="${credentials.BACK_WEB_URL}images/Vector.png" style="height:20px; width:20px; margin-right: 10px;">
        </span>
           <p class="about_time" style="font-size: 16px;color: #514e4e;border-bottom: 1px solid #e3e1e1;padding-bottom: 10px;"> Time Tracking
           </p>
        </div>
        </div>
        <div class="verify" style="text-align: center;margin: 2rem auto; width: 400px;">
        <p class="email_noti" style="font-size: 16px;color: #2f42d4;line-height: 27px;"> ${options.messagee}
        </p>
    <p class="email_noti" style="font-size: 16px;color: #939393;line-height: 27px;"> To help us serve you better in the future, we’d love to hear about your experience with our website. We appreciate your time and we value your feedback
    </p>
      </div>
    </div>
  </div>
    </body>
    </html>
  `;
    SmtpController.sendEmail(email, 'ContactUs', message);
  };
