const KJUR = require('jsrsasign')
var constant = require('../../config/local.js');
const crypto = require('crypto');
const axios = require('axios');
// ZoomController.js
authenticate = function (req, res) {
    const clientId = constant.ZOOM_MEETING_SDK_KEY_OR_CLIENT_ID;
    const redirectUri = 'YOUR_REDIRECT_URI'; // URL where Zoom will redirect after authorization
    const authUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
    res.redirect(authUrl);
}
generateVeificationCode = function () {
    // action are perform to generate VeificationCode for user
    var length = 12,
      charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      retVal = '';
  
    for (var i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
  };

// https://www.npmjs.com/package/jsrsasign

module.exports = {

    generatetoken: async (req, res) => {
        try {
            function generateSignature(key, secret, meetingNumber, role) {

                const iat = Math.round(new Date().getTime() / 1000) - 30
                const exp = iat + 60 * 60 * 2
                const oHeader = { alg: 'HS256', typ: 'JWT' }

                const oPayload = {
                    sdkKey: constant.ZOOM_MEETING_SDK_KEY_OR_CLIENT_ID,
                    appKey: constant.ZOOM_MEETING_SDK_KEY_OR_CLIENT_ID,
                    mn: req.body.mn,
                    role: req.body.role,
                    iat: iat,
                    exp: exp,
                    tokenExp: exp
                }

                const sHeader = JSON.stringify(oHeader)
                const sPayload = JSON.stringify(oPayload)
                const sdkJWT = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, secret)
                return sdkJWT
            }
            let token = generateSignature(constant.ZOOM_MEETING_SDK_KEY_OR_CLIENT_ID, constant.ZOOM_MEETING_SDK_SECRET_OR_CLIENT_SECRET, 123456789, 0)
            return res.status(200).json({
                success: true,
                code: 200,
                data: token,

            });
        } catch (err) {
            return res.status(400).json({ success: true, code: 400, error: "" + err });
        }
    },

    generateSignature: async function (req, res) {
        try {
            const meetingNumber = generateVeificationCode()
            const apiKey = constant.ZOOM_MEETING_SDK_KEY_OR_CLIENT_ID;
            const apiSecret = constant.ZOOM_MEETING_SDK_SECRET_OR_CLIENT_SECRET;
            const timestamp = new Date().getTime() - 30000; // 30 seconds before to account for latency
            console.log(timestamp, "==============timestamp")
            const msg = Buffer.from(apiKey + meetingNumber + timestamp + '0').toString('base64');
            const hash = crypto.createHmac('sha256', apiSecret).update(msg).digest('base64');
            const signature = Buffer.from(`${apiKey}.${meetingNumber}.${timestamp}.0.${hash}`).toString('base64');
            return res.status(200).json({
                success: true,
                code: 200,
                signature: signature,
                meetingNumber:meetingNumber,
                timestamp:timestamp

            });
        }
        catch (err) {
            return res.status(400).json({ success: true, code: 400, error: "" + err });

        }
    },

    validateSignature: async (req, res) => {
        const receivedSignature = req.body.signature; // The received signature from the request
        const apiKey = constant.ZOOM_MEETING_SDK_KEY_OR_CLIENT_ID;
        const apiSecret = constant.ZOOM_MEETING_SDK_SECRET_OR_CLIENT_SECRET;
        const meetingNumber = req.body.meetingNumber;
        const timestamp = req.body.timestamp;
        const role = req.body.role;

        const msg = Buffer.from(apiKey + meetingNumber + timestamp + role).toString('base64');
        const hash = crypto.createHmac('sha256', apiSecret).update(msg).digest('base64');
        const recreatedSignature = Buffer.from(`${apiKey}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64');

        if (receivedSignature === recreatedSignature) {
            return res.json({ valid: true });
        } else {
            return res.json({ valid: false });
        }
    },
    // createMeeting: async (req, res) => {
    //     try {
    //         const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZGtLZXkiOiI5QkRRd1NoSFE0YVN0ZHdGaHdUOTRnIiwiYXBwS2V5IjoiOUJEUXdTaEhRNGFTdGR3Rmh3VDk0ZyIsIm1uIjoiNDEwIDI2MSAxMTc5Iiwicm9sZSI6IjAiLCJpYXQiOjE2OTE0OTQxNzMsImV4cCI6MTY5MTUwMTM3MywidG9rZW5FeHAiOjE2OTE1MDEzNzN9.rQhJ5dgejpUQs1ByznH-2Jqhl0EV_36dt-f6KpoGGJw'; // Obtain this through OAuth

    //         const meetingData = {
    //             topic: 'My Meeting',
    //             type: 2, // Scheduled meeting
    //             // Add other meeting properties as needed
    //         };

    //         const response = await axios.post('https://api.zoom.us/v2/users/me/meetings', meetingData, {
    //             headers: {
    //                 'Authorization': `Bearer ${accessToken}`,
    //                 'Content-Type': 'application/json',
    //             },
    //         });

    //         const meetingId = response.data.id;

    //         return res.json({ meetingId });
    //     } catch (error) {
    //         console.error('Error creating meeting:', error);
    //         return res.status(500).json({ error: 'Failed to create meeting' });
    //     }
    // },
    // authenticate: async (req, res) => {
    //     const clientId = constant.ZOOM_MEETING_SDK_KEY_OR_CLIENT_ID;
    //     const redirectUri = 'http://endpoint.jcsoftwaresolution.com:8037/dashboard'; // URL where Zoom will redirect after authorization
    //     const authUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=9BDQwShHQ4aStdwFhwT94g&redirect_uri=http://endpoint.jcsoftwaresolution.com:8037/dashboard`;

    //     res.redirect(authUrl);
    // },


    // callback: async (req, res) => {
    //     // const clientId = constant.ZOOM_MEETING_SDK_KEY_OR_CLIENT_ID;
    //     // const clientSecret = constant.ZOOM_MEETING_SDK_SECRET_OR_CLIENT_SECRET;


    //     const redirectUri = 'http://endpoint.jcsoftwaresolution.com:8037/dashboard';
    //     const tokenUrl = 'https://zoom.us/oauth/token';

    //     const tokenParams = new URLSearchParams({
    //         grant_type: 'authorization_code',
    //         code: req.param('code'),
    //         redirect_uri: redirectUri,
    //     });

    //     try {
    //         const response = await axios.post(
    //             tokenUrl,
    //             tokenParams.toString(), // Send the params as a URL-encoded string in the request body
    //             {
    //                 auth: {
    //                     username: constant.ZOOM_MEETING_SDK_KEY_OR_CLIENT_ID,
    //                     password: constant.ZOOM_MEETING_SDK_SECRET_OR_CLIENT_SECRET,
    //                 },
    //                 headers: {
    //                     'Content-Type': 'application/x-www-form-urlencoded',
    //                 },
    //             }
    //         );


    //         const accessToken = response.data.access_token;
    //         // Now you have the access token to use in your Zoom API requests
    //         return res.redirect(`/zoom/meeting?access_token=${accessToken}`);
    //     } catch (error) {
    //         console.error('Error obtaining access token:', error);
    //         return res.status(500).json({ error: 'Error obtaining access token' });
    //     }
    // }

};
