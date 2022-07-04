#!/bin/bash
source /home/ubuntu/.bash_profile
FILE=/home/ubuntu/servichain-backend-dev/server.ts
if test -f "$FILE"; then
   echo "$FILE exists"
   cd /home/ubuntu/servichain-backend-dev
   sudo pm2 stop npm
   sudo pm2 delete npm
   sudo killall -9 node
else 
    echo "$FILE does not exist."
fi
cd /home/ubuntu/
sudo rm -rf servichain-backend-dev
sudo mkdir servichain-backend-dev
chmod -R 777 servichain-backend-dev