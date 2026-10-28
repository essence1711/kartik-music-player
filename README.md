# Kartik Music v4

A personal, local/offline music player. It stores imported audio, embedded artwork, playlists, wallpaper and playback position in the browser's IndexedDB.

## Run it correctly
Do not double-click index.html. Run the included server instead:

Windows:
1. Install Python 3.
2. Open Command Prompt in this folder.
3. Run `python -m http.server 8000 --bind 0.0.0.0`
4. Open `http://localhost:8000`.

Then other devices on the same Wi-Fi can use `http://YOUR-PC-IP:8000` if Windows Firewall permits it.

## Music server
See `music-server/README.md` and `music-server/server.py` for a simple LAN music library server. Put your legally owned audio files in `music-server/music/` and start the server with `python server.py`.

## Browser autoplay limitation
The app remembers the last track and playback position and attempts to resume it after refresh. Modern browsers can block audible autoplay after a refresh, so if that happens one Play click is required. A web page cannot reliably bypass this browser security policy.
