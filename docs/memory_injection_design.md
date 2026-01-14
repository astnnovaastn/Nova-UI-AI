i want you add this new funtion to the Mem0_ai_organizer.py handles all memory management, summarization, and AI context injection. It ensures nova_ai.py always has the most relevant and structured memory from user interactions.

It automatically summarizes conversations by day, week, or month and sends them to nova_ai.py for context-aware reasoning.

1. Core Responsibilities
1.1 Fetch and Prepare Memory for AI

Fetch from data/nova_ai_memory.json:


current_facts

fact_history

user_preferences.likes

long_term_goals.specific_goal

Full 27-category memory framework

Fetch session conversations:

Minimum: 2–3 weeks

Maximum: 2–3 months

If memory exceeds max, select most recent sessions.

Prepare relevant memory dataset for injection into AI.

1.2 Summarize Conversations

At the end of each day, week, or month:

Summarize all conversations in that period.

Store summaries in the JSON:

{
  "date": "2025-09-21",
  "daily_summary": "User discussed AI project, personal goals, and Python optimizations."
}


Summaries replace raw conversations in memory for optimized context.

1.3 Continuous Memory Injection

Send all summarized conversations, facts, preferences, and goals to nova_ai.py.

AI uses memory to make informed, context-aware decisions.

Older sessions beyond max range are archived but not sent.

1.4 Session Handling Rules

Min session window: 2–3 weeks

Max session window: 2–3 months

Ensures AI receives enough context without overloading.

2. Workflow

User interacts with AI → conversation stored in nova_ai_memory.json.

Organizer checks if day, week, or month has ended:

If yes → summarize period → store summary → update JSON.

Fetch memory for AI:

Pull facts, preferences, goals, summaries, 27-category framework.

Pull recent sessions (2–3 weeks min, 2–3 months max).

Send summarized memory to nova_ai.py for reasoning.

Benefits

Daily, weekly, and monthly summaries reduce AI processing load.

nova_ai.py has up-to-date context across 2–3 weeks to 2–3 months.

Structured context with 27-category framework supports goal tracking and preference-based reasoning.

Sessions beyond max range are archived to maintain memory efficiency.

i want you made of how the mem0_memory_system.py memory system and Mem0_ai_organizer.py the will use the GET = "GET" current_facts, fact_history user_preferences.likes, long_term_goals.specific_goal and all the Comprehensive 27-category memory framework  and 5-9 days of session and if the are more them 5-9 of session but the max session that can be send are 1-3 week of session if are in the josn file data/nova_ai_memory.json  and send it to the ai and how the system will get all it fetches the entire relevant memory dataset, which is then directly injected into the AI’s context, so the AI can make informed decisions based on all past interactions. and make that the Mem0_ai_organizer.py the ai will hhSummarize a whole day conversation and it is always summarized like a full day conversation if that day has ended. For example, the user talked to the AI on Monday and the conversation ended on Monday. The AI will summarize all what was said. Summarize it then and it always summarizes a full day conversation and those full day conversations will be sent to the AI. So it will summarize all day's conversation. Then those conversations will be summarized and sent to the AI all the time.