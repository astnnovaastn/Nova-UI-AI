"""Small CLI to append conversation messages into data/nova_ai_memory.json

Usage examples:
  python persist_conversation.py --role user --content "Hi, I'm Rich" --session session_123
  python persist_conversation.py --file messages.json  # where messages.json is [{role,content,timestamp,session_id}, ...]
"""
from __future__ import annotations
import argparse
import json
from typing import List, Dict, Any
from astra_ai.memory.conversation_persistence import append_conversation_messages


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--role', choices=['user', 'assistant'], help='Role of single message')
    p.add_argument('--content', help='Content of single message')
    p.add_argument('--session', help='Session id for single message')
    p.add_argument('--timestamp', help='ISO timestamp for single message')
    p.add_argument('--file', help='JSON file with list of messages')
    p.add_argument('--memory-file', default='data/nova_ai_memory.json', help='Path to memory file')
    return p.parse_args()


def main():
    args = parse_args()

    messages: List[Dict[str, Any]] = []

    if args.file:
        with open(args.file, 'r', encoding='utf-8') as f:
            messages = json.load(f)
    elif args.role and args.content:
        messages = [{
            'role': args.role,
            'content': args.content,
            'session_id': args.session,
            'timestamp': args.timestamp
        }]
    else:
        print('Provide either --file or both --role and --content')
        return

    append_conversation_messages(messages, memory_path=args.memory_file)
    print(f'Appended {len(messages)} messages to {args.memory_file}')


if __name__ == '__main__':
    main()
