#!/bin/bash
source /home/ubuntu/.bash_profile
cd /home/ubuntu/servichain-backend
sudo mkdir config
sudo aws s3 cp s3://servichain-backend-dev-config/config ./config --recursive
sudo rm -rf node_modules
sudo npm install