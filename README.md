# Overview
I'm attempting to use openssl for JWS ES256 signature creation and validation.

I've not been able to properly sign, so as a first step I'm trying to validate the example signature from RFC 7515.

For reference, [JWT.IO properly](https://jwt.io/#debugger-io?token=eyJhbGciOiJFUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.DtEhU3ljbEg8L38VWAfUAqOyKAM6-Xx-F4GawxaepmXFCgfTjDxw5djxLa8ISlSApmWQxfKTUJqPP3-Kg6NU1Q&publicKey=-----BEGIN%20PUBLIC%20KEY-----%0AMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEf83OJ3D2xF1Bg8vub9tLe1gHMzV7%0A6e8Tus9uPHvRVEXH8UTNG72bfocs3%2B257rn0s2ldbqkLJK2KRiMohYjlrQ%3D%3D%0A-----END%20PUBLIC%20KEY-----) validates that signature, but when I try to do the same with openssl I get the following errors:
```
Error Verifying Data
139722910762304:error:0D07207B:asn1 encoding routines:ASN1_get_object:header too long:../crypto/asn1/asn1_lib.c:101:
139722910762304:error:0D068066:asn1 encoding routines:asn1_check_tlen:bad object header:../crypto/asn1/tasn_dec.c:1118:
139722910762304:error:0D07803A:asn1 encoding routines:asn1_item_embed_d2i:nested asn1 error:../crypto/asn1/tasn_dec.c:290:Type=ECDSA_SIG
```

For signature creation, I attempted the methods in these articles ([1](https://learn.akamai.com/en-us/webhelp/iot/jwt-access-control/GUID-054028C7-1BF8-41A5-BD2E-A3E00F6CA550.html),[2](https://jumpnowtek.com/security/Code-signing-with-openssl.html),[3](https://gist.github.com/timmc/d2814d7da19521dda1883dd3cc046217)), but was not able to succesfully validate the signatures in JWT.IO (however, openssl is able to validate the signatures it creates).

## Openssl CLI ECDSA Signing Procedure
### Generate ES256 key pair
Generates the key pair to be used. Replace `prime256v1` with your target curve.

```sh
openssl ecparam -name prime256v1 -genkey -noout -out privatekey.pem
openssl ec -in privatekey.pem -pubout > publickey.pem
```
To list other curves, use `openssl ecparam -list_curves`. Ex: ES384 is `secp384r1`.
### Store JWT payload
```sh
echo -n "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJFUzI1NmluT1RBIiwibmFtZSI6IkpvaG4gRG9lIn0" > data
```
Remember to switch out the `alg` header for different signing algorithms. Here is an example ES384 JOSE header: `eyJhbGciOiJFUzM4NCIsInR5cCI6IkpXVCJ9`.
### Sign data with the private key
Note the default digest is `sha256`. Use `openssl dgst -list` to list digest types, and replace the `-sha256` flag with your needed digest (ex: `-sha384` for ES384).
```sh
openssl dgst -sha256 -sign privatekey.pem -out signature.bin data
```
### Parse DER encoded signature to valid JWS Signature
Openssl's `dgst` output is not sufficient for JWS signatures. There is extra processing needed to prepare that payload as a proper signature.

See this [Issue](https://github.com/jwtk/jjwt/issues/125#issuecomment-221643124) and this [SO Post](https://stackoverflow.com/questions/59904522/asn1-encoding-routines-errors-when-verifying-ecdsa-signature-type-with-openssl) for more explanation.
```sh
openssl asn1parse -in signature.bin -inform DER > asn1
cat asn1 | perl -n -e'/INTEGER           :([0-9A-Z]*)$/ && print $1' > signature.hex
cat signature.hex | xxd -p -r | base64 | tr -d '\n=' | tr -- '+/' '-_' > signature.sig
```
These are the processing steps I used:
1. Use openssl's `asn1parse` to parse the DER signature. Here's an example output:
```
    0:d=0  hl=2 l=  69 cons: SEQUENCE
    2:d=1  hl=2 l=  33 prim: INTEGER           :DBA805DFAC77A488FD42DFB2649EE5CC989AD4989104B171680CB11BA44FF465
   37:d=1  hl=2 l=  32 prim: INTEGER           :578B760F5427BA70CC9025A4730DFBE624497B381E451C0627F1EE4E4A705183
```
2. Use a regex to extract the R and S big-endian integers from that output.
3. Use xxd to parse the integers as hex (that's how asn1parse outputs them) and then base64url encode the binary output.

### Validate at JWT.IO
```sh
echo "$(cat data).$(cat signature.sig)" > token
echo "https://jwt.io/#debugger-io?token=$(cat token)"
echo "Paste public key into jwt.io"
cat publickey.pem
```
