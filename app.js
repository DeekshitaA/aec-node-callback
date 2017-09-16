"use strict";

import express from 'express';
import fetch from 'node-fetch';
import responseTime from 'response-time';
import redis from 'redis';
import jose from 'node-jose';
import base64 from 'base-64';

const sharedSecret= "77a0a1f3a2ca4e119168cf68eb5b2008";

// var client = redis.createClient();

// client.on('error', (err) => {
//     console.log('Error' + err);
// });

let app = express();

app.set('port', (process.env.PORT || 5000));

app.use(responseTime());

const getDecryptedData = (encrypted_payload, shared_secret_key) => {
    const secretKey = base64.encode(shared_secret_key);
    console.log('secret key', secretKey);
    return new Promise((resolve, reject) => {
        jose.JWK.asKey({ "kty":"oct", "k":secretKey})
        .then((keys) => {
            jose.JWE.createDecrypt(keys).decrypt(encrypted_payload)
            .then((result_decrypt) => {
                const buf = Buffer.from(result_decrypt.plaintext);
                resolve(JSON.parse(buf));
                }).catch((error) => {
                    reject(Error('Not Data'));
                });
        });
    });
};

app.get('/aec/:encrypt' , (req, res) => {
 var encrypted_payload = req.params.encrypt;
 
 console.log('sharedSecret', sharedSecret);
 getDecryptedData(encrypted_payload, sharedSecret)
         .then((decryptedData) => {
            console.log(decryptedData);
            //  client.setex("requestId", 60, decryptedData.request_id);

             res.send({ "decryped_data": decryptedData,})
         }).catch((response) => {
            if (response.status === 404 ) {
                res.send('No Data');
            } else {
                res.send(response);
            }
         });
});

app.listen(app.get('port'), () => {
    console.log('Server listening on port: ', app.get('port'));
});


