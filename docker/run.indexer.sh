#!/bin/bash
SCRIPT_DIR=$(cd $(dirname $0); pwd)
PARENT_DiR=$(dirname $SCRIPT_DIR)
echo "SCRIPT_DIR:=${SCRIPT_DIR}"
echo "PARENT_DiR:=${PARENT_DiR}"
DOCKER_MAME=ermu.indexer
docker stop ${DOCKER_MAME}
docker rm ${DOCKER_MAME}
docker run -d \
  -v /etc/group:/etc/group:ro \
  -v /etc/passwd:/etc/passwd:ro \
  -v /storage/dhtfs/cluster:/storage/dhtfs/cluster \
  -v /dev/shm/:/dev/shm/ \
  -v ${PARENT_DiR}:${PARENT_DiR} \
  -u $(id -u $USER):$(id -g $USER) \
  -w ${PARENT_DiR} \
  --net host \
  --memory=512M \
  --cpu-shares=1024 \
  --name "${DOCKER_MAME}" \
  --restart=always \
  -e TZ=Asia/Tokyo \
  node:lts node ./indexer/app.js >/dev/null