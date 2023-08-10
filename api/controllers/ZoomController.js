const KJUR = require('jsrsasign')
var constant = require('../../config/local.js');
const crypto = require('crypto');
const axios = require('axios');
var request = require('request');
const { Console } = require('console');

// const refreshToken = 'eyJhbGciOiJIUzUxMiIsInYiOiIyLjAiLCJraWQiOiI8S0lEPiJ9.eyJ2ZXIiOiI2IiwiY2xpZW50SWQiOiI8Q2xpZW50X0lEPiIsImNvZGUiOiI8Q29kZT4iLCJpc3MiOiJ1cm46em9vbTpjb25uZWN0OmNsaWVudGlkOjxDbGllbnRfSUQ-IiwiYXV0aGVudGljYXRpb25JZCI6IjxBdXRoZW50aWNhdGlvbl9JRD4iLCJ1c2VySWQiOiI8VXNlcl9JRD4iLCJncm91cE51bWJlciI6MCwiYXVkIjoiaHR0cHM6Ly9vYXV0aC56b29tLnVzIiwiYWNjb3VudElkIjoiPEFjY291bnRfSUQ-IiwibmJmIjoxNTgwMTQ2OTkzLCJleHAiOjIwNTMxODY5OTMsInRva2VuVHlwZSI6InJlZnJlc2hfdG9rZW4iLCJpYXQiOjE1ODAxNDY5OTMsImp0aSI6IjxKVEk-IiwidG9sZXJhbmNlSWQiOjI1fQ.Xcn_1i_tE6n-wy6_-3JZArIEbiP4AS3paSD0hzb0OZwvYSf-iebQBr0Nucupe57HUDB5NfR9VuyvQ3b74qZAfA';
// const clientId = 'cuqUzwYJT66ZXG1aJTqIjg';
// const clientSecret = 'N09S1FUHby8TXwlKVVlSg7LyE8O3Go45';
// ZoomController.js
authenticate = function (req, res) {
    const clientId = constant.ZOOM_MEETING_SDK_KEY_OR_CLIENT_ID;
    const redirectUri = 'YOUR_REDIRECT_URI'; // URL where Zoom will redirect after authorization
    const authUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
    res.redirect(authUrl);
}
generateOTP = function () {
    // action are perform to generate VeificationCode for user
    var length = 12,
        charset = '1234567890',
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



    // card_1NdC4XASL6ACfqPSO0B9ZrCr

    generateSignature: async function (req, res) {
        try {
            // const meetingNumber = 74282522589
            // const apiKey = constant.ZOOM_MEETING_SDK_KEY_OR_CLIENT_ID;
            // const apiSecret = constant.ZOOM_MEETING_SDK_SECRET_OR_CLIENT_SECRET;
            // const timestamp = new Date().getTime() - 30000; // 30 seconds before to account for latency
            // console.log(timestamp, "==============timestamp")
            // const msg = Buffer.from(apiKey + meetingNumber + timestamp + '0').toString('base64');
            // const hash = crypto.createHmac('sha256', apiSecret).update(msg).digest('base64');
            // const signature = Buffer.from(`${apiKey}.${meetingNumber}.${timestamp}.0.${hash}`).toString('base64');
            // return res.status(200).json({
            //     success: true,
            //     code: 200,
            //     signature: signature,
            //     meetingNumber: meetingNumber,
            //     timestamp: timestamp

            // });

            const KJUR = require('jsrsasign')
            // https://www.npmjs.com/package/jsrsasign

            function generateSignature(key, secret, meetingNumber, role) {

                const iat = Math.round(new Date().getTime() / 1000) - 30
                const exp = iat + 60 * 602
                const oHeader = { alg: 'HS256', typ: 'JWT' }


                const oPayload = {
                    sdkKey: key,
                    appKey: key,
                    mn: meetingNumber,
                    role: role,
                    iat: iat,
                    exp: exp,
                    tokenExp: exp
                }
                const sHeader = JSON.stringify(oHeader)
                const sPayload = JSON.stringify(oPayload)
                // const sdkJWT = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, secret)

                let sdkJWT = HMACSHA256(
                    base64UrlEncode(oHeader) + '.' + base64UrlEncode(oPayload),
                    constant.ZOOM_MEETING_SDK_SECRET_OR_CLIENT_SECRET
                );
                console.log(sdkJWT, '==============sdkJWT');
                return sdkJWT
            }
            let meetingNumber = req.body.meetingNumber
            let role = req.body.role
            let signature = (generateSignature(constant.ZOOM_MEETING_SDK_KEY_OR_CLIENT_ID, constant.ZOOM_MEETING_SDK_SECRET_OR_CLIENT_SECRET, meetingNumber, role))
            return res.status(200).json({
                success: true,
                code: 200,
                data: signature,

            });

        }
        catch (err) {
            return res.status(400).json({ success: false, code: 400, error: "" + err });

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

    createMeeting: async (req, res) => {
        try {


            const accessToken = req.body.token;
            let type = req.body.type
            let topic = req.body.topic
            // const meetingData = {

            //     topic: topic,
            //     type: type, // 2 for scheduled meeting, 1 for instant meeting
            //     settings: {
            //         host_video: true, // Host video on when the meeting starts
            //         participant_video: true, // Participant video on when the meeting starts
            //         join_before_host: true, // Participants can't join before host
            //         mute_upon_entry: true, // Participants are muted upon entry
            //         watermark: false, // No watermark on videos
            //         // approval_type: 0, // Automatically approve participants
            //         // audio: 'both', // Both telephony and VoIP audio options available
            //         // auto_recording: 'none', // No auto
            //     }
            // }

            // try {
            //     const response = await axios.post('https://api.zoom.us/v2/users/me/meetings', meetingData, {
            //         headers: {
            //             'Authorization': `Bearer ${accessToken}`,
            //             'Content-Type': 'application/json',
            //         },
            //     });
            //     return res.status(200).json({
            //         success: true,
            //         code: 200,
            //         data: response,
            //     });

            //     // Process the response
            // } catch (error) {
            //     console.error('Error creating meeting:', error);
            // }

            const meetingData = {
                topic: topic,
                type: type, // Scheduled meeting
                // approval_type: 2,
                // Add other meeting properties as needed
                settings: {
                    host_video: true, // Host video on when the meeting starts
                    participant_video: true, // Participant video on when the meeting starts
                    join_before_host: true, // Participants can't join before host
                    mute_upon_entry: true, // Participants are muted upon entry
                    watermark: false, // No watermark on videos
                    in_meeting: true,
                    approval_type: 2, // Automatically approve participants
                    audio: 'both', // Both telephony and VoIP audio options available
                    // auto_recording: 'none', // No auto,
                    show_join_info: true
                }
            };

            const { data } = await axios.post('https://api.zoom.us/v2/users/me/meetings', meetingData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            return res.status(200).json({
                success: true,
                code: 200,
                data: data,
            });
        } catch (error) {
            return res.status(500).json({ error: error });

        }


    },

    getToken: async (req, res) => {

        const refreshToken = 'eyJhbGciOiJIUzUxMiIsInYiOiIyLjAiLCJraWQiOiI8S0lEPiJ9.eyJ2ZXIiOiI2IiwiY2xpZW50SWQiOiI8Q2xpZW50X0lEPiIsImNvZGUiOiI8Q29kZT4iLCJpc3MiOiJ1cm46em9vbTpjb25uZWN0OmNsaWVudGlkOjxDbGllbnRfSUQ-IiwiYXV0aGVudGljYXRpb25JZCI6IjxBdXRoZW50aWNhdGlvbl9JRD4iLCJ1c2VySWQiOiI8VXNlcl9JRD4iLCJncm91cE51bWJlciI6MCwiYXVkIjoiaHR0cHM6Ly9vYXV0aC56b29tLnVzIiwiYWNjb3VudElkIjoiPEFjY291bnRfSUQ-IiwibmJmIjoxNTgwMTQ2OTkzLCJleHAiOjIwNTMxODY5OTMsInRva2VuVHlwZSI6InJlZnJlc2hfdG9rZW4iLCJpYXQiOjE1ODAxNDY5OTMsImp0aSI6IjxKVEk-IiwidG9sZXJhbmNlSWQiOjI1fQ.Xcn_1i_tE6n-wy6_-3JZArIEbiP4AS3paSD0hzb0OZwvYSf-iebQBr0Nucupe57HUDB5NfR9VuyvQ3b74qZAfA';
        const clientId = 'cuqUzwYJT66ZXG1aJTqIjg';
        const clientSecret = 'N09S1FUHby8TXwlKVVlSg7LyE8O3Go45';
        try {
            const response = await axios.post('https://zoom.us/oauth/token', null, {
                params: {
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                    client_id: clientId,
                    client_secret: clientSecret,
                },
            });
            const newAccessToken = response.data.access_token;
            return res.status(200).json({
                success: true,
                code: 200,
                data: newAccessToken,
            });
            // Use the new access token for your API requests
        } catch (error) {
            console.error('Error refreshing access token:', error);
        }
    },
    authenticate: async (req, res) => {
        try {
            let code = req.body.code
            // console.log(code,"===============code")
            // var options = {
            //     method: 'POST',
            //     url: 'https://zoom.us/oauth/token',
            //     qs: {
            //         grant_type: 'authorization_code',
            //         //The code below is a sample Authorization Code. Replace it with your actual Authorization Code while making requests.
            //         code: code,
            //         //The uri below is a sample redirect_uri. Replace it with your actual redirect_uri while making requests.
            //         redirect_uri: 'https://portal.jcsoftwaresolution.in/zoom',
            //         code_verifier: "QhFM2njqjoT6g6BVsxkUU41vI90xxYDe2sblQ6ANDU8"
            //     },
            //     headers: {
            //         /**The credential below is a sample base64 encoded credential. Replace it with "Authorization: 'Basic ' + Buffer.from(your_app_client_id + ':' + your_app_client_secret).toString('base64')"
            //          **/
            //         // "Authorization": `Basic ${Buffer.from("cuqUzwYJT66ZXG1aJTqIjg:N09S1FUHby8TXwlKVVlSg7LyE8O3Go45").toString('base64')}`,
            //         "Authorization": 'Basic ' + Buffer.from(constant.ZOOM_MEETING_SDK_KEY_OR_CLIENT_ID + ':' + constant.ZOOM_MEETING_SDK_SECRET_OR_CLIENT_SECRET).toString('base64'),
            //         "Content-Type": "application/x-www-form-urlencoded"

            //     },
            // };

            // request(options, function (error, response, body) {
            //     if (error) throw new Error(error);
            //     else {
            //         return res.status(200).json({
            //             data: body,
            //         });
            //     }
            // });

            var FormData = require('form-data');
            var bodyFormData = new FormData();
            bodyFormData.append('code', code);
            bodyFormData.append('grant_type', 'authorization_code');
            bodyFormData.append('redirect_uri', 'https://skriver.jcsoftwaresolution.in/zoom');
            bodyFormData.append('code_verifier', 'QhFM2njqjoT6g6BVsxkUU41vI90xxYDe2sblQ6ANDU8');
            let url = 'https://zoom.us/oauth/token';

            var config = {
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${constant.ZOOM_MEETING_SDK_KEY_OR_CLIENT_ID}:${constant.ZOOM_MEETING_SDK_SECRET_OR_CLIENT_SECRET}:`).toString('base64')}`,
                    ...bodyFormData.getHeaders()
                },
            };

            let { data } = await axios.post(url, bodyFormData, config);
            return res.status(200).json({
                data: data,
            });

        } catch (err) {
            return res.status(500).json({ error: 'Error obtaining access token' });
        }

    },


    callback: async (req, res) => {
        // const clientId = constant.ZOOM_MEETING_SDK_KEY_OR_CLIENT_ID;
        // const clientSecret = constant.ZOOM_MEETING_SDK_SECRET_OR_CLIENT_SECRET;


        const redirectUri = 'https://locahost:44328/zoom/oaouthredirect';
        const tokenUrl = 'https://zoom.us/oauth/token';

        const tokenParams = new URLSearchParams({
            grant_type: 'authorization_code',
            code: req.param('code'),
            redirect_uri: redirectUri,
        });

        try {
            const response = await axios.post(
                tokenUrl,
                tokenParams.toString(), // Send the params as a URL-encoded string in the request body
                {
                    auth: {
                        username: constant.ZOOM_MEETING_SDK_KEY_OR_CLIENT_ID,
                        password: constant.ZOOM_MEETING_SDK_SECRET_OR_CLIENT_SECRET,
                    },
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );


            const accessToken = response.data.access_token;
            // Now you have the access token to use in your Zoom API requests
            return res.redirect(`/zoom/meeting?access_token=${accessToken}`);
        } catch (error) {
            console.error('Error obtaining access token:', error);
            return res.status(500).json({ error: 'Error obtaining access token' });
        }
    },
    getSignature: async (req, res) => {
        // const iat = Math.round((new Date().getTime() - 30000) / 1000)
        // const exp = iat + 60  60  2

        // const oHeader = { alg: 'HS256', typ: 'JWT' }

        // const oPayload = {
        //   sdkKey: config.ZOOM_SDK_KEY,
        //   mn: req.body.meetingNumber,
        //   role: req.body.role,
        //   iat: iat,
        //   exp: exp,
        //   appKey: config.ZOOM_SDK_KEY,
        //   tokenExp: iat + 60  60  2
        // }

        // const sHeader = JSON.stringify(oHeader)
        // const sPayload = JSON.stringify(oPayload)
        // const signature = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, config.ZOOM_SDK_SECRET)

        // res.json({
        //   signature: signature
        // })
        // const signature = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, config.ZOOM_SDK_SECRET)
        // console.log(config.ZOOM_SDK_KEY,config.ZOOM_SDK_SECRET,req.body.meetingNumber,req.body.role)
        // const signature = await generateSignature(config.ZOOM_SDK_KEY,config.ZOOM_SDK_SECRET,req.body.meetingNumber,req.body.role)
        const signature = generateSignature(
            config.ZOOM_SDK_KEY,
            config.ZOOM_SDK_SECRET,
            req.body.meetingNumber,
            req.body.role
        );
        console.log(signature);
        res.json({
            signature: signature,
        });
    },

    //   scheduleMeeting: async (req, res) => {
    //     const playload = req.body;
    //     const config = {
    //       token:
    //         'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOm51bGwsImlzcyI6Im1KR0VteUZ3VGYyR3dEZkloN3JISGciLCJleHAiOjE5MDIxOTk0NDAsImlhdCI6MTY0OTEzNTg2MH0.GttDJW6qSYjdX7LAHiLnxjg-ZY3PgZWWeTEnU3zYze0',
    //       email: 'mailto:amitkjcsoftwaresolution@gmail.com',
    //     };
    //     try {
    //       var options = {
    //         url: `https://api.zoom.us/v2/users/${config.email}/meetings`,
    //         method: 'POST',
    //         auth: {
    //           bearer: config.token,
    //         },
    //         json: true,
    //         body: {
    //           start_time: new Date(playload.meeting_Date),
    //           timezone: 'Asia/Kolkata',
    //           duration: playload.duration,
    //           topic: playload.topic,
    //           type: 2,
    //         },
    //       };

    //       console.log({ start_time: new Date(playload.meeting_Date) });

    //       request(options, (error, response, body) => {
    //         console.log(response.statusCode);
    //         if (!error && response.statusCode === 201) {
    //           let meetingData = {};
    //           meetingData.addedBy = req.identity.id;
    //           meetingData.host_id = body.host_id;
    //           meetingData.start_url = body.start_url;
    //           meetingData.join_url = body.join_url;
    //           meetingData.data = body;
    //           meetingData.meeting_Date = req.body.meeting_Date;
    //           // console.log(response)
    //           // res.send(response)
    //           Meeting.create(meetingData).then(async (created) => {
    //             await emailToAdmin({
    //               email: 'mailto:admin@puffski.com',
    //               userEmail: req.identity.email,
    //               username: req.identity.username1,
    //               meetingDate: new Date(playload.meeting_Date),
    //               start_url: body.start_url,
    //             });
    //             await emailToUser({
    //               email: 'mailto:admin@puffski.com',
    //               userEmail: req.identity.email,
    //               username: req.identity.username1,
    //               meetingDate: new Date(playload.meeting_Date),
    //               start_url: body.join_url,
    //             });
    //             return res.status(200).json({
    //               success: true,
    //               message: 'Meeting has been successfully created',
    //               response: response,
    //               body: body,
    //             });
    //           });
    //           // res.send({ message: "meeting has been successfully created " ,response:response,body:body});
    //         } else {
    //           console.log(body);
    //           res.send({ message: body.message });
    //         }
    //       });
    //     } catch (e) {
    //       res.status(500).send(e.toString());
    //     }
    //   },

};
