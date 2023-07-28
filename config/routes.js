/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {
  /***************************************************************************
   *                                                                          *
   * Make the view located at `views/homepage.ejs` your home page.            *
   *                                                                          *
   * (Alternatively, remove this and add an `index.html` file in your         *
   * `assets` directory)                                                      *
   *                                                                          *
   ***************************************************************************/

  '/': { view: 'pages/homepage' },

  /***************************************************************************
   *                                                                          *
   * More custom routes here...                                               *
   * (See https://sailsjs.com/config/routes for examples.)                    *
   *                                                                          *
   * If a request to a URL doesn't match any of the routes in this file, it   *
   * is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
   * not match any of those, it is matched against static assets.             *
   *                                                                          *
   ***************************************************************************/

  'post /admin/signin': 'UsersController.adminSignin',
  'put /change/password': 'UsersController.changePassword',
  'post /register': 'UsersController.register',
  'post /user/signin': 'UsersController.userSignin',
  'post /forgot/password': 'UsersController.forgotPassword',
  'put /reset/password': 'UsersController.resetPassword',
  'post /add/user': 'UsersController.addUser',
  'get /users/list': 'UsersController.getAllUsers',
  'post /forgot/password/frontend': 'UsersController.forgotPasswordFrontend',
  'get /user/details': 'UsersController.userDetails',
  'get /check/Email': 'UsersController.checkEmail',
  //  'delete /remove/user': 'UsersController.removeUser',
  'get /profile': 'UsersController.userProfileData',
  'get /user/detail': 'UsersController.userDetail',
  'put /edit/profile': 'UsersController.editProfile',
  'put /edit/profile': 'UsersController.deleteuser',

  /** CommonController */

  'post /upload/image': 'CommonController.uploadImage',
  'put /change/status': 'CommonController.changeStatus',
  'delete /delete': 'CommonController.commonDelete',
  'post /uploadvideos': 'CommonController.uploadVideos',
  //  "delete /deleteVideo": "CommonController.removeVideo",
  'get /verifyUser': 'UsersController.verifyUser',

  /**CategoryController  */

  'post /category': 'CategoryController.addCategory',
  'get /categories': 'CategoryController.listCategory',
  'put /category': 'CategoryController.editCategory',
  'delete /category': 'CategoryController.deleteCategory',
  'get /category': 'CategoryController.categoryDetail',

  /**Roles And Permissions Routes */
  'post /role': "RolesController.addRole",
  'get /roles': "RolesController.getRoleslisting",
  'get /role': "RolesController.getRole",
  'put /role': "RolesController.editRole",




    /**License Routes */
    'post /license': "LicenseController.addLicense",
    'get /licenses': "LicenseController.getLicenselisting",
    'get /license': "LicenseController.getLicense",
    'put /license': "LicenseController.editLicense",
    'delete /license': "LicenseController.deleteLicense",



  // Stripe Controller routes
  'post /add/card': 'StripeController.addCard',
  'get /getCards': 'StripeController.getCards',
  'delete /Cards': 'StripeController.deleteCard',
  // 'post /subscribe/newsletter':
  //   'NewsletterSubscriptionController.subscribeToNewsLetter',



  /**SubscriptionPlansController routes */

  'post /subscriptionplan': 'SubscriptionPlansController.addSubscriptionPlan',
  'get /subscriptionplan': 'SubscriptionPlansController.getPlanById',
  'put /subscriptionplan': 'SubscriptionPlansController.editsubscriptionPlan',
  'get /subscriptionplans': 'SubscriptionPlansController.getAllPlans',
  // 'get /subscriptionplans/frontend':'SubscriptionPlansController.getAllPlansFrontend',
  'delete /subscriptionplan': 'SubscriptionPlansController.removePlans',
  'post /purchaseplan': 'SubscriptionPlansController.purchaseplan',



};
