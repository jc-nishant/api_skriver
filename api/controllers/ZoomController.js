const KJUR = require('jsrsasign')
const ZOOM_MEETING_SDK_KEY_OR_CLIENT_ID = "9BDQwShHQ4aStdwFhwT94g"
const ZOOM_MEETING_SDK_SECRET_OR_CLIENT_SECRET = "ULfkSNIisdGVn3subZrx0i6e8q1dwoFv"
const crypto = require('crypto');
// https://www.npmjs.com/package/jsrsasign

module.exports = {

    generatetoken: async (req, res) => {
        try {
            function generateSignature(key, secret, meetingNumber, role) {

                const iat = Math.round(new Date().getTime() / 1000) - 30
                const exp = iat + 60 * 60 * 2
                const oHeader = { alg: 'HS256', typ: 'JWT' }

                const oPayload = {
                    sdkKey: req.body.sdkKey,
                    appKey: req.body.appKey,
                    mn: req.body.mn,
                    role: req.body.role,
                    iat: iat,
                    exp: exp,
                    tokenExp: req.body.tokenExp
                }

                const sHeader = JSON.stringify(oHeader)
                const sPayload = JSON.stringify(oPayload)
                const sdkJWT = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, secret)
                return sdkJWT
            }
            let token = generateSignature(ZOOM_MEETING_SDK_KEY_OR_CLIENT_ID, ZOOM_MEETING_SDK_SECRET_OR_CLIENT_SECRET, 123456789, 0)
            // console.log(ZOOM_MEETING_SDK_KEY_OR_CLIENT_ID)

            return res.status(200).json({
                success: true,
                code: 200,
                data: token,

            });
        } catch (err) {
            return res.status(400).json({ success: true, code: 400, error: err });
        }
    },
    // api/controllers/ZoomController.js


  generateSignature: async function (req, res) {
        const meetingNumber = req.body.meetingNumber;
        const apiKey = 'YOUR_API_KEY';
        const apiSecret = 'YOUR_API_SECRET';
        const timestamp = new Date().getTime() - 30000; // 30 seconds before to account for latency

        const msg = Buffer.from(apiKey + meetingNumber + timestamp + '0').toString('base64');
        const hash = crypto.createHmac('sha256', apiSecret).update(msg).digest('base64');
        const signature = Buffer.from(`${apiKey}.${meetingNumber}.${timestamp}.0.${hash}`).toString('base64');
        return res.status(200).json({
            success: true,
            code: 200,
            signature: signature,

        });
    },
};
