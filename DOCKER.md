# Docker Setup for google-home-caller

## Quick Start with Docker

1. **Clone the repository** and `cd` into it.

2. **Create your `.env` file** with your Google credentials:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your credentials:
   ```
   EMAIL=your-google-email@gmail.com
   PASSWORD=your-password
   ```

3. **Build and run with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

4. **Check the logs**:
   ```bash
   docker-compose logs -f
   ```

5. **Trigger an automation**:
   ```bash
   curl -X POST http://localhost:8602/command \
     -d '{"command":"Good Morning"}' \
     -H "Content-Type: application/json"
   ```

## Docker Commands

- **Start the service**: `docker-compose up -d`
- **Stop the service**: `docker-compose down`
- **View logs**: `docker-compose logs -f`
- **Rebuild after code changes**: `docker-compose up -d --build`
- **Restart the service**: `docker-compose restart`

## Volumes

The following directories are mounted as volumes:
- `./profile` - Chrome profile data (persists login sessions)
- `./logs` - Application logs

This means your browser profile and logs are preserved between container restarts.

## Troubleshooting

- **First login**: On the first run, Google may require 2FA or verification. Check the logs to see if manual intervention is needed.
- **Chrome crashes**: The container is configured with 2GB shared memory. If you still experience crashes, you can adjust the `shm_size` in `docker-compose.yml`.
- **Port conflicts**: If port 8602 is already in use, change it in `docker-compose.yml` (e.g., `"8603:8602"`).

## Security Note

Your Google credentials are stored in the `.env` file and passed to the container. Make sure to:
- Never commit `.env` to version control
- Keep the `.env` file secure with appropriate file permissions
- Consider the security implications of storing credentials in plain text
