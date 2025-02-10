#!python3
import sys
from math import inf
from subprocess import run

import click


@click.command()
@click.option("-s", "--shell", required=False)
@click.option("-m", "--max-attempts", type=int, required=False)
@click.argument("args", nargs=-1)
def main(shell, max_attempts, args):
    """Repeat a command until it exists with 0.

    Example:

        untilpass -- cointoss --winrate=0.5

        untilpass -s "cointoss --winrate=0.5"
    """
    if shell and args:
        exit("--shell and args are exclusive.")

    if not args and not shell:
        exit("No command provided.")

    it = 0
    while it < (max_attempts or inf):
        it += 1
        if shell:
            proc = run(shell, shell=True)
        else:
            proc = run(args)
        if proc.returncode == 0:
            sys.exit(proc.returncode)


if __name__ == "__main__":
    main()
