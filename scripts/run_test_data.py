#!/usr/bin/env python3
"""Run test data through virtual_cluster_sim.py non-interactively.

Usage:
  python scripts/run_test_data.py --file ../test_data.txt [--reset-store]

This script pipes the contents of the input file to the simulator's stdin,
captures stdout/stderr, writes a `run_test_output.txt` log and returns the
simulator exit code.
"""
import argparse
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(__file__))
SIMULATOR = os.path.join(os.path.dirname(__file__), 'virtual_cluster_sim.py')
DEFAULT_TEST_FILE = os.path.join(ROOT, 'test_data.txt')
STORE = os.path.join(ROOT, 'data', 'high_virtual_memory.json')


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--file', '-f', default=DEFAULT_TEST_FILE, help='Path to newline-separated test file')
    p.add_argument('--reset-store', action='store_true', help='Remove existing store before running')
    args = p.parse_args()

    test_file = args.file
    if not os.path.isabs(test_file):
        test_file = os.path.join(ROOT, test_file)

    if args.reset_store and os.path.exists(STORE):
        try:
            os.remove(STORE)
            print(f'Removed existing store: {STORE}')
        except Exception as e:
            print(f'Warning: could not remove store: {e}', file=sys.stderr)

    if not os.path.exists(test_file):
        print(f'Test file not found: {test_file}', file=sys.stderr)
        sys.exit(2)

    with open(test_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Ensure trailing newline so simulator sees EOF after last line
    if not content.endswith('\n'):
        content += '\n'

    cmd = [sys.executable, SIMULATOR]
    print('Running:', ' '.join(cmd))

    proc = subprocess.run(cmd, input=content.encode('utf-8'), stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    out = proc.stdout.decode('utf-8', errors='replace')
    err = proc.stderr.decode('utf-8', errors='replace')

    log_path = os.path.join(ROOT, 'run_test_output.txt')
    with open(log_path, 'w', encoding='utf-8') as logf:
        logf.write('--- STDOUT ---\n')
        logf.write(out)
        logf.write('\n--- STDERR ---\n')
        logf.write(err)

    print(out)
    if err:
        print('--- STDERR ---', file=sys.stderr)
        print(err, file=sys.stderr)

    if proc.returncode != 0:
        print(f'Simulator exited with code {proc.returncode}', file=sys.stderr)
    else:
        print(f'Completed successfully. Log written to {log_path}')

    sys.exit(proc.returncode)


if __name__ == '__main__':
    main()
 