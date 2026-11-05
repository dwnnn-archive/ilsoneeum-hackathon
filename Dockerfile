FROM node:22-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build \
    && python3 -m venv /opt/agent-venv \
    && /opt/agent-venv/bin/pip install --no-cache-dir -r agent_service/requirements.txt \
    && mkdir -p /home/data \
    && chown -R node:node /home/data

ENV PORT=8080 \
    DATA_DIR=/home/data \
    PYTHON_EXECUTABLE=/opt/agent-venv/bin/python

EXPOSE 8080
USER node
CMD ["npm", "start"]
