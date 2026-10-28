from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import socket

ROOT = Path(__file__).resolve().parent
HOST = '0.0.0.0'
PORT = 8080

class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.mp3':'audio/mpeg', '.m4a':'audio/mp4', '.wav':'audio/wav', '.ogg':'audio/ogg', '.flac':'audio/flac'}


def local_ip():
    s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8',80)); return s.getsockname()[0]
    except Exception:
        return 'YOUR-PC-IP'
    finally: s.close()

if __name__ == '__main__':
    import os
    os.chdir(ROOT)
    print(f'Kartik Music Server running on: http://localhost:{PORT}')
    print(f'On another device on the same Wi-Fi: http://{local_ip()}:{PORT}')
    print('Put your music inside: music-server/music/')
    print('Press Ctrl+C to stop.')
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
