# google-home-caller

This is a personal project to trigger Google Home automations from an HTTP request, command line or other scripts.

## What it does

- Runs a headless Chrome browser (with Selenium) to log into [home.google.com](https://home.google.com) and keeps the page open and waiting.
- Clicks on a named automation (routine) when you send a POST request to the HTTP server.
- Useful for triggering Google Home routines from scripts, cron jobs, or other systems that can't talk to Google Home directly.
- Daemonizable: works well as a systemd service.

## How to use

1. **Clone this repo** and `cd` into it.

2. **Install dependencies** (Node.js 18+ recommended):

   ```
   npm install
   ```

3. **Set up your credentials**:

   - Copy `.env.example` to `.env` (if exists) or just create a `.env` file.
   - Add your Google account email and password:
     ```
     EMAIL=your-google-email@gmail.com
     PASSWORD=your-password
     ```
   - **Warning:** This stores your password in plain text. Be careful.

4. **Run the script**:

   ```
   ./ghome-call.sh
   ```

   This will start a local server on port 8602.

5. **Trigger an automation**:

   Send a POST request to `http://localhost:8602/command` with a JSON body like:
   ```json
   { "command": "My Routine Name" }
   ```

   Example using `curl`:
   ```
   curl -X POST http://localhost:8602/command -d '{"command":"Good Morning"}' -H "Content-Type: application/json"
   ```

   The routine name must match exactly as it appears in Google Home.

## Notes

- The first run will log in to Google and save a browser profile in `profile/`.
- If Google asks for 2FA or other verification, you may need to complete it manually the first time.
- Logs are saved in `logs/last_run.log`.
- This is a hacky script for personal use. Use at your own risk.

## Why?

Because Google doesn't provide an API for this, and I wanted to automate my routines from scripts.

## License

No license. Use however you want, but don't blame me
