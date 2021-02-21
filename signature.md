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
