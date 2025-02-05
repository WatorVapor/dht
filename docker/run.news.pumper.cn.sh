#!/bin/bash
SCRIPT_DIR=$(cd $(dirname $0); pwd)
PARENT_DiR=$(dirname $SCRIPT_DIR)
echo "SCRIPT_DIR:=${SCRIPT_DIR}"
echo "PARENT_DiR:=${PARENT_DiR}"
DOCKER_MAME=ermu.news.pumper.cn
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
  --memory=128M \
  --cpu-shares=256 \
  --name "${DOCKER_MAME}" \
  -e TZ=Asia/Tokyo \
  node:lts node ./news_pumper/appCN.js