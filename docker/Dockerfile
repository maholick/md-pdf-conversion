# Download base image texlive/texlive
FROM texlive/texlive:TL2021-historic

# LABEL about the custom image
LABEL maintainer="shawn@maholick.com"
LABEL version="0.1"
LABEL description="This is custom Docker Image for \
converting markdown to PDF using eisvolgel template."

# Disable Prompt During Packages Installation
ARG DEBIAN_FRONTEND=noninteractive

# Update Ubuntu
RUN apt-get update
RUN apt-get upgrade -yq

# Add pandoc groovy archive to /etc/apt/sources.list
RUN apt-get update
RUN apt-get install -yq software-properties-common
#RUN add-apt-repository "deb http://de.archive.ubuntu.com/ubuntu groovy main universe"

# Update Ubuntu Software repository
RUN apt-get update

# Install Tools
RUN apt install -yq wget curl perl

# Update LaTeX
RUN tlmgr init-usertree
RUN tlmgr update --self --all --verify-repo=none
RUN tlmgr install adjustbox babel-german background bidi collectbox csquotes everypage filehook footmisc footnotebackref framed fvextra letltxmacro ly1 mdframed mweights needspace pagecolor sourcecodepro sourcesanspro titling ucharcat ulem unicode-math upquote xecjk xurl zref 

# initialization for tlmgr
#RUN apt-get -yq install xzdec
#RUN tlmgr init-usertree

# install pdftoppm for rendering the PDFs
RUN apt-get -yq install poppler-utils

# for executing python based pandoc filters install python and pip
RUN apt-get -yq install python3
RUN apt-get -yq install python3-pip
RUN pip3 install --upgrade setuptools
RUN pip3 install wheel

# install python filters
RUN pip3 install pandoc-latex-environment

# Install pandoc
#RUN apt-get install -yq pandoc
ARG PANDOC_VERSION="2.11.2"
ARG pandoc_deb="pandoc-${PANDOC_VERSION}-1-amd64.deb"
RUN wget "https://github.com/jgm/pandoc/releases/download/${PANDOC_VERSION}/${pandoc_deb}"
RUN dpkg -i ${pandoc_deb}
RUN rm ${pandoc_deb}

# Install Ghostscript
RUN apt-get -yq install ghostscript 

# Cleanup
RUN rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Set workdir
WORKDIR /var/opt/pandoc

# Entrypoint
COPY ./docker/pandoc.sh /
RUN ["chmod", "+x", "/pandoc.sh"]
COPY ./docker/wait.sh /
RUN ["chmod", "+x", "/wait.sh"]
ENTRYPOINT ["/wait.sh"]

# Set TERM
RUN export TERM=xterm
RUN echo "export TERM=xterm" >> ~/.bashrc