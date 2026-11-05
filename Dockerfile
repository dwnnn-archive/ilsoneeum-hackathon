FROM node:22-bookworm-slim

ENV PORT=8080 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY agent_service/requirements.txt ./agent_service/requirements.txt
RUN python3 -m venv /opt/agent-venv \
    && /opt/agent-venv/bin/pip install --no-cache-dir -r agent_service/requirements.txt

COPY . .

EXPOSE 8080

CMD ["sh", "-c", "/opt/agent-venv/bin/python -m uvicorn agent_service.main:app --host 127.0.0.1 --port 8001 & exec npm start"]
