FROM node:22-bookworm-slim

# Install Chromium, chromedriver, Xvfb and minimal deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    chromium-driver \
    xvfb \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Point selenium at the system Chromium and chromedriver
ENV CHROME_BIN=/usr/bin/chromium
ENV CHROMEDRIVER_PATH=/usr/bin/chromedriver
ENV CHROMEDRIVER_SKIP_DOWNLOAD=true

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN chmod +x ghome-call.sh && mkdir -p logs profile

# Run as non-root
RUN groupadd -r app && useradd -r -g app -d /app app \
    && chown -R app:app /app
USER app

EXPOSE 8602

CMD ["./ghome-call.sh"]
