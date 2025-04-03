#!/bin/bash

scp html/* root@rickastley.mooo.com:/var/www/html/
scp jsapp/* root@rickastley.mooo.com:/var/www/jsapp/
ssh root@rickastley.mooo.com "cd /var/www/jsapp/ && npm i && systemctl restart jsapp"

