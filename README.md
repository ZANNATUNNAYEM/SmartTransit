# SmartTransit

SmartTransit is a full-stack public transportation monitoring and passenger assistance system. The project is built using Next.js (App Router, JavaScript), Socket.io (real-time communication), MongoDB (database), and Redis (caching layer).

---

## Prerequisites

Ensure you have the following installed on your local machine:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

## Setup & Running with Docker

Follow these instructions to run the entire SmartTransit stack (Next.js App + MongoDB + Redis) inside Docker containers.

### 1. Configure Environment Variables
Copy the template `.env.example` file to create your local `.env` configuration:
```bash
cp .env.example .env
```
Inside `.env`, configure the values. The default configuration is already pre-configured to connect to the Docker container network.

### 2. Start the Application Stack
Run the following command to build the Docker image and start the containers in detached mode:
```bash
docker compose up -d --build
```
This command spins up:
- **Next.js Application** on `http://localhost:3000`
- **MongoDB Database** on `localhost:27017`
- **Redis Cache** on `localhost:6379` (password protected)

### 3. Start with Dev Tools (Optional)
If you want to run the database admin UI (**Mongo Express**) alongside the main services, run:
```bash
docker compose --profile dev up -d
```
You can then access Mongo Express at `http://localhost:8081` to manage your database collections.

### 4. Monitor Container Logs
To view the output of the running Next.js application container, run:
```bash
docker compose logs -f app
```

### 5. Stopping the Services
To stop and remove all running containers while keeping the database and cache data:
```bash
docker compose down
```

To stop the containers and wipe the database volumes (starting with a fresh DB next time):
```bash
docker compose down -v
```

---

## Verification & Ports Mapping

| Service | Port | Endpoint / Target |
| :--- | :--- | :--- |
| **Next.js App + Socket.io** | `3000` | [http://localhost:3000](http://localhost:3000) |
| **MongoDB Database** | `27017` | `mongodb://localhost:27017` |
| **Redis Cache** | `6379` | `redis://localhost:6379` |
| **Mongo Express UI (Dev only)** | `8081` | [http://localhost:8081](http://localhost:8081) |

To verify that the database and cache connections are active and fully operational, you can visit the health check endpoint:
- **Health Check Route**: [http://localhost:3000/api/health](http://localhost:3000/api/health)
