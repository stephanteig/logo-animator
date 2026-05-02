# Trace Backend — Manim rendering server
# Build:  docker build -t trace-backend .
# Run:    docker run -p 8000:8000 trace-backend

FROM manimcommunity/manim:stable

# Switch to root for installs, then drop back to user
USER root

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

# Persistent job output directory
RUN mkdir -p /tmp/trace_jobs && chmod 777 /tmp/trace_jobs

EXPOSE 8000

# Run as the manim user (non-root)
USER user

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
