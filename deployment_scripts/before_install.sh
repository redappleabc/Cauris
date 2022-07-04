#!/bin/bash
FILE=/home/ubuntu/servichain-backend-dev/server.ts
if test -f "$FILE"; then
   echo "$FILE exists"
   cd /home/ubuntu/servichain-backend-dev
   sudo pm2 stop --silent server.ts
   sudo pm2 delete server.ts
   sudo killall -9 node
else 
    echo "$FILE does not exist."
fi
cd /home/ubuntu/
sudo rm -rf servichain-backend-dev
sudo mkdir servichain-backend-dev