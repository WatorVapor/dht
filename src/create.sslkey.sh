#!/bin/bash
COMMON_NAME=localhost
openssl req \
        -newkey ec:<(openssl ecparam -name prime256v1) \
        -sha256 \
        -keyout $COMMON_NAME.key \
        -nodes \
        -x509 \
        -out $COMMON_NAME.crt \
        -days 365 \
        -subj "/C=JP/ST=/L=/O=/OU=/CN=$COMMON_NAME"
