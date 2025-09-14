FROM pandoc/extra:3.1.1.0

# Install fontconfig and available font packages from Alpine
RUN apk add --no-cache \
    fontconfig \
    ttf-liberation \
    ttf-dejavu \
    ttf-freefont \
    font-noto \
    font-noto-cjk \
    font-noto-extra \
    font-noto-emoji \
    ttf-opensans \
    ttf-font-awesome \
    ttf-hack \
    ttf-inconsolata \
    font-vollkorn \
    font-ipa \
    font-sony-misc \
    font-jis-misc \
    font-cronyx-cyrillic \
    font-screen-cyrillic \
    font-winitzki-cyrillic \
    font-misc-cyrillic \
    font-croscore \
    font-adobe-100dpi \
    font-adobe-75dpi \
    && fc-cache -f -v

# Keep container running
ENTRYPOINT ["/bin/sh", "-c", "sleep infinity"]