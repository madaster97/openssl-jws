## Openssl CLI ECDSA Signing Procedure
### Generate ES256 key pair
Generates the key pair to be used. Replace `prime256v1` with your target curve.

```sh
openssl ecparam -name prime256v1 -genkey -noout -out privatekey.pem
openssl ec -in privatekey.pem -pubout > publickey.pem
```
To list other curves, use `openssl ecparam -list_curves`.
### Store JWT payload
```sh
echo -n "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJFUzI1NmluT1RBIiwibmFtZSI6IkpvaG4gRG9lIn0" > data
```
### Sign data with the private key
```sh
openssl dgst -sign privatekey.pem -out signature.bin data
```
### Parse DER encoded signature to valid JWS Signature
Openssl's `dgst` output is not sufficient for JWS signatures. There is extra processing needed to prepare that payload as a proper signature.

See this [Issue](https://github.com/jwtk/jjwt/issues/125#issuecomment-221643124) and this [SO Post](https://stackoverflow.com/questions/59904522/asn1-encoding-routines-errors-when-verifying-ecdsa-signature-type-with-openssl) for more explanation.
```sh
openssl asn1parse -in signature.bin -inform DER > asn1
cat asn1 | perl -n -e'/INTEGER           :([0-9A-Z]*)$/ && print $1' > signature.hex
cat signature.hex | xxd -p -r | base64 | tr -d '\n=' | tr -- '+/' '-_' > signature.sig
```
### Validate at JWT.IO
```sh
echo "$(cat data).$(cat signature.sig)" > token
echo "https://jwt.io/#debugger-io?token=$(cat token)"
echo "Paste public key into jwt.io"
cat publickey.pem
```
