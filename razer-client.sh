#!/bin/bash
# This script opens and maintains a client-server session with
# the Razer Chroma SDK via REST API.
# We need the unique port generated for this session in order
# for the Pubsub consumer to form requests so we store it in a file.

RAZER_SDK=http://localhost:54235/razer/chromasdk
session_data=`curl -sXPOST $RAZER_SDK --header "Content-Type: application/json" --data-binary '@razer-chroma-app-manifest'`
session_uri=`echo $session_data | jq '.uri' | tr -d '"'`
session_port=`echo $session_uri | grep -o '[0-9]\+'`
echo "$session_port" > razer_sdk_port
echo "Razer Chroma SDK listening on $session_uri"
echo "Press [CTRL + C] to stop."
while :
do
  curl -sXPUT $session_uri/heartbeat --data '' > /dev/null
  sleep 5
done
