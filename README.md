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