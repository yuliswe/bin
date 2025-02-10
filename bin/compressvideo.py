#!python3
import subprocess
from pathlib import Path

import click


@click.command()
@click.argument("input", type=click.Path(exists=True))
@click.option("--size", type=int, help="Size in MB", default=100)
def compress_video(input, size):
    output = Path(input).with_suffix(f".compressed_{size}MB.mp4")
    # Get the duration of the video in seconds
    duration = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            input,
        ]
    )
    duration = float(duration)

    # Calculate the bitrate
    bitrate = int(size * 8192 / duration)

    # Compress the video
    subprocess.call(
        [
            "ffmpeg",
            "-i",
            input,
            "-b:v",
            f"{bitrate}k",
            "-bufsize",
            f"{bitrate}k",
            output,
        ]
    )


if __name__ == "__main__":
    compress_video()
