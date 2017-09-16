"use strict";

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _nodeFetch = require('node-fetch');

var _nodeFetch2 = _interopRequireDefault(_nodeFetch);

var _responseTime = require('response-time');

var _responseTime2 = _interopRequireDefault(_responseTime);

var _redis = require('redis');

var _redis2 = _interopRequireDefault(_redis);

var _nodeJose = require('node-jose');

var _nodeJose2 = _interopRequireDefault(_nodeJose);

var _base = require('base-64');

var _base2 = _interopRequireDefault(_base);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var sharedSecret = "77a0a1f3a2ca4e119168cf68eb5b2008";

var client = _redis2.default.createClient();

client.on('error', function (err) {
    console.log('Error' + err);
});

var app = (0, _express2.default)();

app.set('port', process.env.PORT || 5000);

app.use((0, _responseTime2.default)());

var getDecryptedData = function getDecryptedData(encrypted_payload, shared_secret_key) {
    var secretKey = _base2.default.encode(shared_secret_key);
    console.log('secret key', secretKey);
    return new Promise(function (resolve, reject) {
        _nodeJose2.default.JWK.asKey({ "kty": "oct", "k": secretKey }).then(function (keys) {
            _nodeJose2.default.JWE.createDecrypt(keys).decrypt(encrypted_payload).then(function (result_decrypt) {
                var buf = Buffer.from(result_decrypt.plaintext);
                //   decrypted_payload = buf.toString('utf8');
                console.log('JSON.parse(buf)', JSON.parse(buf));
                resolve(JSON.parse(buf));
            }).catch(function (error) {
                reject(Error('Not Data'));
            });
        });
    });
};

app.get('/aec/:encrypt', function (req, res) {
    var encrypted_payload = req.params.encrypt;

    console.log('sharedSecret', sharedSecret);
    getDecryptedData(encrypted_payload, sharedSecret).then(function (decryptedData) {
        console.log(decryptedData);
        //  client.setex("requestId", 60, decryptedData.request_id);

        res.send({ "decryped_data": decryptedData });
    }).catch(function (response) {
        if (response.status === 404) {
            res.send('No Data');
        } else {
            res.send(response);
        }
    });
    //  client.get("requestId", (error, result) => {
    //      if (result) {
    //          res.send({ "encrypted_payload": result, "source": "redis cache"});
    //      } else {
    //          getDecryptedData(encrypted_payload, sharedSecret)
    //          .then((decryptedData) => {
    //             console.log(decryptedData);
    //              client.setex("requestId", 60, decryptedData.request_id);

    //              res.send({ "decryped_data": decryptedData,})
    //          }).catch((response) => {
    //             if (response.status === 404 ) {
    //                 res.send('No Data');
    //             } else {
    //                 res.send(response);
    //             }
    //          });
    //      }
    //  });
});

app.listen(app.get('port'), function () {
    console.log('Server listening on port: ', app.get('port'));
});