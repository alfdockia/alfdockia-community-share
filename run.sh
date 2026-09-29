#!/bin/sh
# SPDX-FileCopyrightText: 2026 AIgen Technologies S.L.
# SPDX-License-Identifier: AGPL-3.0-only

export COMPOSE_FILE_PATH="${PWD}/target/classes/docker/docker-compose.yml"

if [ -z "${M2_HOME}" ]; then
  export MVN_EXEC="mvn"
else
  export MVN_EXEC="${M2_HOME}/bin/mvn"
fi

start() {
    docker volume create alfdockia-community-share-acs-volume
    docker volume create alfdockia-community-share-db-volume
    docker volume create alfdockia-community-share-ass-volume
    docker compose -f "$COMPOSE_FILE_PATH" up --build -d
}

start_share() {
    docker compose -f "$COMPOSE_FILE_PATH" up --build -d alfdockia-community-share-share
}

down() {
    if [ -f "$COMPOSE_FILE_PATH" ]; then
        docker compose -f "$COMPOSE_FILE_PATH" down
    fi
}

purge() {
    docker volume rm -f alfdockia-community-share-acs-volume
    docker volume rm -f alfdockia-community-share-db-volume
    docker volume rm -f alfdockia-community-share-ass-volume
}

build() {
    $MVN_EXEC clean package
}

build_share() {
    docker compose -f "$COMPOSE_FILE_PATH" kill alfdockia-community-share-share
    yes | docker compose -f "$COMPOSE_FILE_PATH" rm -f alfdockia-community-share-share
    $MVN_EXEC clean package
}

tail() {
    docker compose -f "$COMPOSE_FILE_PATH" logs -f
}

tail_all() {
    docker compose -f "$COMPOSE_FILE_PATH" logs --tail="all"
}

case "$1" in
  build_start)
    down
    build
    start
    tail
    ;;
  start)
    start
    tail
    ;;
  stop)
    down
    ;;
  purge)
    down
    purge
    ;;
  tail)
    tail
    ;;
  reload_share)
    build_share
    start_share
    tail
    ;;
  *)
    echo "Usage: $0 {build_start|start|stop|purge|tail|reload_share}"
esac
