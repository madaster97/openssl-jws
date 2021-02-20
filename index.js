const b64url = require('base64url');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { JWK } = require('jose');

// RFC 7515 Example Values: https://tools.ietf.org/html/rfc7515#appendix-A.3
const jwt = 'eyJhbGciOiJFUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.DtEhU3ljbEg8L38VWAfUAqOyKAM6-Xx-F4GawxaepmXFCgfTjDxw5djxLa8ISlSApmWQxfKTUJqPP3-Kg6NU1Q';
const jwk = {
    "kty": "EC",
    "crv": "P-256",
    "x": "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
    "y": "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
    "d": "jpsQnnGQmL-YBIffH1136cspYG6-0iY7X1fCE9-E9LI"
};

// Parse JWT and save items
const [b64Header, b64Body, b64Sign] = jwt.split('.');

// Save payload
const payload = [b64Header, b64Body].join('.');
const payloadPath = path.join(__dirname, 'data')
fs.writeFileSync(payloadPath, payload, { encoding: 'utf-8' });

// Write signature to file with B64 encoding
const signature = b64url.toBase64(b64Sign);
const signaturePath = path.join(__dirname, 'data.sig');
fs.writeFileSync(signaturePath, signature, { encoding: 'base64' });

// Save public key
const key = JWK.asKey(jwk);
const keyPath = path.join(__dirname, 'pubkey.pem');
fs.writeFileSync(keyPath, key.toPEM());

const cmd = `openssl dgst -verify ${keyPath} -signature ${signaturePath} ${payloadPath}`;

exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(stdout);
});