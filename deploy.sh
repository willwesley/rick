#!/bin/bash

scp jsapp/* root@rickastley.mooo.com:/var/www/jsapp/
ssh root@rickastley.mooo.com systemctl restart jsapp

