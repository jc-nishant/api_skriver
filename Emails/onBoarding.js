const SmtpController = require('../api/controllers/SmtpController');
const safeCreds = require('../config/local');

const forgotPasswordEmail = (options) => {
  let email = options.email;
  let verificationCode = options.verificationCode;
  let firstName = options.firstName;
  userId = options.userId;

  if (!firstName) {
    firstName = email;
  }
  message = '';

  message += `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forgot Password</title>
</head>
<body>
    

        <div class="email_section" style=" height: 100%; 
          width: 100%;
        max-width: 900px;
        margin: 2rem auto;
        border: 1px solid #7561a2;
        border-radius: 20px;
        padding: 30px;">
        <div class="bg_image" style="position:relative;">
        <img src="${safeCreds.BACK_WEB_URL}/static/bg.png" style="width: 900px;height:100%;">
       


            <div class="about_mail" style="position: absolute;
            top: 135px;
            text-align: center;
            left: 50%;
            transform: translate(-49%, 11%);">
                <h3 class="heading_mail" style="font-size: 51px;
                color: #7561a2;margin:0px;"> Hello ${firstName}</h3>
    
                <p class="dashboard" style="margin-bottom: 0px;
                margin-top: 12px;
                font-size: 18px;">  We have received your request to reset your password.</p>
            </div>
    
            <div class="verify" style="position: absolute;
            bottom: 0;  left: 50%;
            transform: translate(-49%, 11%); text-align: center;">
                <button type="button" class="send_mail" style="border: none;
                background: #7561a2;
                width: 217px;
                color: #fff;
                height: 50px;
                border-radius: 40px;
                font-size: 20px;
            ">`;
  if (options.role != 'admin') {
    message += `<a href="${safeCreds.FRONT_WEB_URL}/resetpassword?id=${userId}&code=${verificationCode}" taget="_blank" style="text-decoration:none" > Reset Password</a>`;
  } else {
    message += `<a href="${safeCreds.ADMIN_WEB_URL}/resetpassword?id=${userId}&code=${verificationCode}" taget="_blank" style="text-decoration:none" > Reset Password</a>`;
  }
  message += `</button >
    
                <p class="email_noti" style="font-size: 19px;
                color: #939393;
            "> Got Questions? Contact our Support Team </p>
            </div>

        </div>

       

        </div>

   
</body>
</html>`;

  SmtpController.sendEmail(email, 'Reset Password', message);
};

const add_user_email = (options) => {
  let email = options.email;

  let firstName = options.firstName;
  let password = options.password;

  if (!firstName) {
    firstName = email;
  }
  message = '';
  message += `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forgot Password</title>
</head>
<body>
    

        <div class="email_section" style=" height: 100%; 
          width: 100%;
        max-width: 900px;
        margin: 2rem auto;
        border: 1px solid #7561a2;
        border-radius: 20px;
        padding: 30px;">
        <div class="bg_image" style="position:relative;">
        <img src="${safeCreds.BACK_WEB_URL}/static/bg.png" style="width: 900px;height:100%;">
       


            <div class="about_mail" style="position: absolute;
            top: 135px;
            text-align: center;
            left: 50%;
            transform: translate(-49%, 11%);">
                <h3 class="heading_mail" style="font-size: 51px;
                color: #7561a2;margin:0px;"> You'Re In !</h3>
    
                <p class="dashboard" style="margin-bottom: 0px;
                margin-top: 12px;
                font-size: 18px;"> Thank you for joining Dashboards, You are going to love it here.</p>
            </div>
    
            <div class="verify" style="position: absolute;bottom:0;width:100%;text-align:center;">

            <p class="dashboard" style="margin-bottom: 0px;
            margin-top: 12px;
            font-size: 22px;"> Email:${email}</p>
            <p class="dashboard" style="margin-bottom: 0px;
            margin-top: 12px;
            font-size: 22px;"> Password:${options.password}</p>

          
                <p class="email_noti" style="font-size: 19px;
                color: #939393;
            "> 
            Got Questions ? Contact our Support Team </p>
            </div>

        </div>

       

        </div>

   
</body>
</html>`;

  SmtpController.sendEmail(email, 'Registration', message);
};

const userVerifyLink = async (options) => {
  let email = options.email;
  message = '';

  message += `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forgot Password</title>
</head>
<body>
    

        <div class="email_section" style=" height: 100%; 
          width: 100%;
        max-width: 900px;
        margin: 2rem auto;
        border: 1px solid #7561a2;
        border-radius: 20px;
        padding: 30px;">
        <div class="bg_image" style="position:relative;">
        <img src="${
          safeCreds.BACK_WEB_URL
        }/static/bg.png" style="width: 900px;height:100%;">
       


            <div class="about_mail" style="position: absolute;
            top: 135px;
            text-align: center;
            left: 50%;
            transform: translate(-49%, 11%);">
                <h3 class="heading_mail" style="font-size: 51px;
                color: #7561a2;margin:0px;"> Hello ${
                  options.fullName ? options.fullName : options.email
                }</h3>
    
                <p class="dashboard" style="margin-bottom: 0px;
                margin-top: 12px;
                font-size: 18px;">Thank you for joining Dazhboards, You are Going to love it here. </p>
            </div>
    
            <div class="verify" style="position: absolute;
            bottom: 0;  left: 50%;
            transform: translate(-49%, 11%); text-align: center;">
                <button type="button" class="send_mail" style="border: none;
                background: #7561a2;
                width: 217px;
                color: #fff;
                height: 50px;
                border-radius: 40px;
                font-size: 20px;
            "><a href="${safeCreds.BACK_WEB_URL}/api/verify/user?id=${
    options.id
  }">Verify Email</a></button>
    
                <p class="email_noti" style="font-size: 19px;
                color: #939393;
            "> Got Questions? Contact our Support Team </p>
            </div>

        </div>

       

        </div>

   
</body>
</html>`;
  SmtpController.sendEmail(email, 'Email Verification', message);
};

const updatePasswordEmail = (options) => {
  let email = options.email;
  let verificationCode = options.verificationCode;
  let fullName = options.fullName;
  userId = options.userId;

  if (!fullName) {
    fullName = email;
  }
  message = '';

  message += `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forgot Password</title>
</head>
<body>
    

        <div class="email_section" style=" height: 100%; 
          width: 100%;
        max-width: 900px;
        margin: 2rem auto;
        border: 1px solid #7561a2;
        border-radius: 20px;
        padding: 30px;">
        <div class="bg_image" style="position:relative;">
        <img src="${safeCreds.BACK_WEB_URL}/static/bg.png" style="width: 900px;height:100%;">
       


            <div class="about_mail" style="position: absolute;
            top: 135px;
            text-align: center;
            left: 50%;
            transform: translate(-49%, 11%);">
                <h3 class="heading_mail" style="font-size: 49px;
                color: #7561a2;margin:0px;"> Hello ${fullName}</h3>
    
                <p class="dashboard" style="margin-bottom: 0px;
                margin-top: 12px;
                font-size: 22px;">  Your updated password is <b>${options.password}</b></p>
            </div>
    
            <div class="verify" style="position: absolute;
            bottom: 0;  left: 50%;
            transform: translate(-49%, 11%); text-align: center;">
                
    
                <p class="email_noti" style="font-size: 19px;
                color: #939393;
            "> Got Questions? Contact our Support Team </p>
            </div>

        </div>

       

        </div>

   
</body>
</html>`;

  SmtpController.sendEmail(email, 'Password Update', message);
};

module.exports = {
  forgotPasswordEmail,
  add_user_email,
  userVerifyLink,
  updatePasswordEmail,
};
