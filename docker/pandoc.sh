#!/bin/sh
set echo off

echo 'Markdown to PDF'
echo "-> Running conversion"

if [ -z "${PANDOC_WORKDIR}" ]; then
    echo "Workdir: docs/"
    pandoc docs/*.md --defaults=config/pandoc.yaml 
else
    echo "Workdir: ${PANDOC_WORKDIR}/docs/"
    pandoc ${PANDOC_WORKDIR}/docs/*.md --defaults=config/pandoc.yaml 
fi

echo "-> End"