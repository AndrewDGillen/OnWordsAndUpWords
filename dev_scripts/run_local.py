from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

import hashlib
import json
import shutil
import subprocess
import sys
import tempfile


# Configuration
ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / ".devsite"

HOST = "127.0.0.1"
PORT = 9000

#Builds the package for python
def build_wheel(output_directory):

    print("Building Python package...")

    subprocess.run(
        [
            sys.executable,
            "-m",
            "build",
            "--wheel",
            "--outdir",
            str(output_directory),
        ],
        cwd=ROOT,
        check=True,
    )

    wheels = list(output_directory.glob("*.whl"))

    if len(wheels) != 1:
        raise RuntimeError(
            f"Expected exactly one wheel, found {len(wheels)}"
        )

    return wheels[0]

#Creates the local site
def prepare_site(wheel):

    print("Preparing development website...")

    if SITE.exists():
        shutil.rmtree(SITE)

    SITE.mkdir()

    # Copy static website files
    shutil.copy2(ROOT / "index.html", SITE / "index.html")

    for directory in ("js", "css", "assets"):
        source = ROOT / directory

        if source.exists():
            shutil.copytree(source, SITE / directory)

    # Hash the wheel to give each build a unique URL
    wheel_hash = hashlib.sha256(
        wheel.read_bytes()
    ).hexdigest()[:16]

    wheel_directory = SITE / "dist" / wheel_hash
    wheel_directory.mkdir(parents=True)

    shutil.copy2(wheel, wheel_directory / wheel.name)

    # Generate manifest
    manifest = {
        "wheel": f"{wheel_hash}/{wheel.name}"
    }

    (SITE / "dist" / "manifest.json").write_text(
        json.dumps(manifest, indent=2),
        encoding="utf-8",
    )

#HTTP handler
class DevelopmentHandler(SimpleHTTPRequestHandler):

    def end_headers(self):
        self.send_header(
            "Cache-Control",
            "no-store, no-cache, must-revalidate"
        )

        super().end_headers()

#Starts local development server
def start_server():

    handler = partial(
        DevelopmentHandler,
        directory=str(SITE),
    )

    with ThreadingHTTPServer((HOST, PORT), handler) as server:

        print()
        print("OnWordsAndUpWords development server")
        print(f"Running at http://localhost:{PORT}")
        print("Press Ctrl+C to stop.")
        print()

        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nStopping development server...")


def main():
    with tempfile.TemporaryDirectory() as temporary:
        build_directory = Path(temporary)

        wheel = build_wheel(build_directory)

        prepare_site(wheel)

    start_server()


if __name__ == "__main__":
    main()