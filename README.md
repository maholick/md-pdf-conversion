# Document Control / Repository Information
Item | Value 
--- | ---
Developed by | Shawn Maholick
Description | Example setup using a docker container, latex, pandoc and the [Eisvogel](https://github.com/Wandmalfarbe/pandoc-latex-template) template to create beautiful PDFs.

# Information

This setup converts markdown files to beautiful PDFs using pandoc pandoc, texlive and the [Eisvogel](https://github.com/Wandmalfarbe/pandoc-latex-template) markdown template. Not all markdown flavors are
supported to pandoc limitations, but vanilla markdown works like a charm.

The docker setup uses:

- textlive/textlive docker image (Debian Bookworm / Testing)
- pandoc 2.11.2
- TeX Live (https://tug.org/texlive) version 2021 (with: texlive-latex-extra texlive-fonts-recommended texlive-fonts-extra texlive-font-utils)
- Eisvogel template 2.0.0

# Requirements

- Docker
- An x86_x64 compatible system (ARM not supported at the moment)

# Structure

For using this container you need following structure.

**/docker**  
Contains the Dockerfile for creating docker images.

**/config**  
Contains the yaml config files for pandoc and the eisvogel latex template (metafile).

**/docs**  
Contains all markdown files and assets (e. g. images).

**/docs/assets**  
Contains all files and assets (e. g. images or pdfs). ~~(optional)~~

**/output**  
Contains generated PDFs. Folder and file names can be changed in the config files.

**/templates**  
Contains the Eisvogel latex template, page layout and a logo.

You can download the sample structure here [https://github.com/maholick/md-pdf-conversion/](https://github.com/maholick/md-pdf-conversion/)
The Eisvogel template can additionally be found on GitHub: [https://github.com/Wandmalfarbe/pandoc-latex-template](https://github.com/Wandmalfarbe/pandoc-latex-template)

# Usage

Please clone the repo locally or if you are familar with GitHub Actions, you can use this setup
to run automated PDF conversion directly on GitHub.

## Build Docker Image

From the cloned directory of the repo, build the docker image. This step only needs to be performed a single time.

```
docker build -t md-pdf-conversion -f docker/Dockerfile .
```

## Setup Container

Now, simply create a container using following command. Name of the container of cause can be changed.

```
docker run -v path/to/your/local/folder/:/var/opt/pandoc --name md-pdf-conversion maholick/md-pdf-conversion:latest
```

The container is checking the "./docs/" vor a __.start__ file and will start the conversion by converting all "*.md" files recursively and ordered,
using the configuration in "./config/". 

With the initial setup with default configs, a "example.pdf" in "./output/" will be generated or updated.

Please make sure you first copy your markdown files to the conversion folder and then create the start-file (__.start__).

### Successful conversion
After a successful conversion the conversion folder will be emptied. Make sure that you only copy files here.

### Unsuccessful conversion
The start-file will be removed and you can check your config for errors.

## Use Container

For repeating conversion, just start the container.

```
docker start md-pdf-conversion
```

# Prebuilt docker image

You can also use the prebuilt docker image which can be found here [docker.io > md-pdf-conversion](https://hub.docker.com/r/maholick/md-pdf-conversion)

