#!/bin/bash
set echo off
echo '\033[1mMarkdown to PDF\033[0m'
echo "-> Running conversion"

pandoc --quiet docs/*.md --defaults=config/pandoc.yaml > /dev/null 2>&1
#pandoc docs/*.md --defaults=config/pandoc.yaml
ec=$?  

case $ec in
0)
    #rm -rfv docs/*
    find docs/ -xdev -depth -mindepth 1 -exec rm -Rf {} \;
    echo "-> Conversion successful."
    ;;
*)  
    echo "-> Error converting. Please check your config."
    rm docs/.start 
    ;;
esac

echo "-> End"