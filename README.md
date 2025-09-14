# Information

Item | Value 
--- | ---
Developed by | Shawn Maholick
Description | Example setup using a Docker container, LaTeX, pandoc and the [Eisvogel](https://github.com/Wandmalfarbe/pandoc-latex-template) template to create beautiful PDFs.

This setup converts Markdown files to beautiful PDFs using the pandoc/extra Docker image and the [Eisvogel](https://github.com/Wandmalfarbe/pandoc-latex-template) Markdown template, which is included in pandoc/extra.

Not all Markdown flavours are supported due to pandoc limitations, but vanilla markdown works like a charm.


# Setup Environment
This setup converts Markdown files to beautiful PDFs using pandoc, TeX Live and the Eisvogel Markdown template within a docker container. Not all Markdown flavours are supported due to pandoc limitations, but vanilla markdown works like a charm.

## Requirements
You need following requirements fulfilled to get the environment running:

- Your favorite text editor
- An AMD64 based or Mac with ARM64 CPU
- Docker Engine (see Setup Instructions)

## Components
For this tutorial we are using the pandoc/extra container version 3.1.1.0. Following components are included in the Docker image:

- TeX Live 2022
- Lua 5.4
- Pandoc 3.1.1
- Eisvogel Template 2.4.0
- Alpine Linux 3.16
(Ubuntu 22.04.4 LTS available: [pandoc/extra:3.1.1.0-ubuntu](https://hub.docker.com/layers/pandoc/extra/3.1.1.0-ubuntu/images/sha256-76aa5b4634c9db4b3f1b386fc6c39912ba132eb542bc23b4c48281b46f1a5423?context=explore))

# Using the Docker Image
You can find the prebuilt Docker image ([pandoc/extra:3.1.1.0](https://hub.docker.com/layers/pandoc/extra/3.1.1.0-ubuntu/images/sha256-76aa5b4634c9db4b3f1b386fc6c39912ba132eb542bc23b4c48281b46f1a5423?context=explore)), which is based on the above mentioned repository, on Docker Hub.

## Preparing Folder Structure
I'm working with a simple folder structure for a clear and easy to use environment.
Create and folder and make sure you have following structure:

![Folder Structure](https://maholick.com/media/pages/blog/how-to-convert-markdown-to-beautiful-pdf/fb3078bcf8-1713114541/folder-structure.png)

| Folder/File           | Description                                                                                                 |
|------------------|-------------------------------------------------------------------------------------------------------------|
| **docs**             | Contains all markdown files and assets (e.g. images).                                                        |
| **docs/assets**      | Contains additional assets (e.g. images or pdfs) and is _**optional**_.                                            |
| **output**           | Contains generated PDFs. Folder and file names can be changed in the config files.                            |
| **templates**        | Contains the page layout and a logo (e.g. PDF backgrounds etc.)                                              |
| **pandoc.yaml**      | Contains all pandoc parameter, which we want to use. See [Pandoc Manual](https://pandoc.org/MANUAL.html#options) for all supported parameter/options.  |
| **eisvogel.yaml**    | Contains all Eisvogel Template parameter, which we want to use. See [Wandmalfarbe/pandoc-latex-template](https://github.com/Wandmalfarbe/pandoc-latex-template?tab=readme-ov-file#custom-template-variables) for all supported template variables. |

## Pulling the Image

Download the image over the terminal/console by using the docker pull command:

```bash
[~] # docker pull pandoc/extra:3.1.1.0
```
You should see following output:
```bash
[~] # docker pull pandoc/extra:3.1.1.0
3.1.1.0: Pulling from pandoc/extra
ef5531b6e74e: Pull complete 
4e821479e4b5: Pull complete 
00f1e069c9e8: Pull complete 
c6b7e74dbfd1: Pull complete 
73732c6ec5a1: Pull complete 
13d63ff5f1df: Pull complete 
984e9b553bec: Pull complete 
36f506d57a55: Pull complete 
b4a7ca1217f5: Pull complete 
057ddd0af801: Pull complete 
0e8fc7fd216f: Pull complete 
7a9e5ae8d256: Pull complete 
3e228e84fa73: Pull complete 
bc128267fb7a: Pull complete 
8ba2c6e34513: Pull complete 
331ae81764c8: Pull complete 
291f71adec64: Pull complete 
526ac1392c7e: Pull complete 
bbf7689041b4: Pull complete 
d5f22a0a9693: Pull complete 
fbb2e6fff275: Pull complete 
Digest: sha256:cc98998c5ab9a652b5c760d69c2fbf3395e063c6d0519890cd46dc3efbf9031a
Status: Downloaded newer image for pandoc/extra:3.1.1.0
docker.io/pandoc/extra:3.1.1.0
```

## Run the Container

After we prepared the folder structure and downloaded the image, we can run our example setup with docker run. 

In this configuration I specified the platform linux/amd64, because I'm working on an MacBook with ARM CPU and there is currently no ARM container available.

```
docker run --rm \
    --platform linux/amd64 \
    --volume "$(pwd):/data" \
    --user $(id -u):$(id -g) \
    pandoc/extra:3.1.1.0 docs/*.md --defaults pandoc.yaml --metadata-file eisvogel.yaml
```

Please make sure that you specify the path to the docs directory, which is mentioned folder structure. Depending on your setup, you might need to specify options for pandoc and the "Eisvogel" template. 

See [Pandoc](https://pandoc.org/MANUAL.html#options) and [Eisvogel](https://github.com/Wandmalfarbe/pandoc-latex-template?tab=readme-ov-file#custom-template-variables) manual.

## Example Output
After successfully running the container using the example setup, the example.pdf should be available in the output folder. 

[![Output](https://maholick.com/media/pages/blog/how-to-convert-markdown-to-beautiful-pdf/d7785c092d-1713075479/examplepdf_success.png 'Example Output')](/output/example.pdf)

# Web UI Interface (Alpha)

> **⚠️ ALPHA VERSION**: The web interface is currently in alpha stage. Expect bugs, incomplete features, and breaking changes.

## Web UI Overview

A modern web interface is available in the `frontend` directory that provides a graphical way to convert Markdown files to PDF.

### Features
- Drag-and-drop file upload with reordering capability
- Live configuration editing for Pandoc and Eisvogel settings
- Automatic PDF generation and download
- Real-time progress tracking and error handling
- Multi-file batch processing

### Requirements for Web UI
- Docker and Docker Compose installed
- Node.js 18+ (if running locally without Docker)
- Modern web browser (Chrome, Firefox, Safari, Edge)
- At least 2GB of available RAM
- Port 3000 available for the frontend
- Port 8080 available for the backend API

### Quick Start with Docker Compose

The easiest way to run the entire application:

```bash
# Start all services (frontend, backend, pandoc converter)
docker-compose up -d

# Access the web interface
open http://localhost:3000

# Stop all services
docker-compose down
```

### Documentation
- Web Interface Details: [Frontend README](frontend/README-frontend.md)
- Docker Compose Configuration: See `docker-compose.yaml` in the project root
- Frontend Development: See `frontend/` directory

# Resources
- Docker Setup Instructions (https://docs.docker.com/engine/install/)
- Markdown Tutorial (https://daringfireball.net/projects/markdown/syntax#html)
- Eisvogel LaTeX Template (https://github.com/Wandmalfarbe/pandoc-latex-template)
- Pandoc Manual (https://pandoc.org/MANUAL.html#options)
- Pandoc Extra Docker (https://hub.docker.com/r/pandoc/extra)

# Contribution

If you like this small project and want to contribute, please feel free to add code, templates or other improvements by creating pull requests with git. 