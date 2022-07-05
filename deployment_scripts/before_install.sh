#!/bin/bash
source /home/ubuntu/.bash_profile
FILE=/home/ubuntu/servichain-backend/server.ts
if test -f "$FILE"; then
   echo "$FILE exists"
   cd /home/ubuntu/servichain-backend
   sudo pm2 stop npm
   sudo pm2 delete npm
   sudo killall -9 node
else 
    echo "$FILE does not exist."
fi
cd /home/ubuntu/
sudo rm -rf servichain-backend
sudo mkdir servichain-backend
chmod -R 777 servichain-backend