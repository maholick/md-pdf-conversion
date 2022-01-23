#!/bin/bash
set echo off
clear

while true 
do
    if [[ -f "/var/opt/pandoc/docs/.start" ]]; then
        sh /pandoc.sh
    fi
    sleep 1
done