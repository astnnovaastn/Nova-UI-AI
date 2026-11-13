"""The workflows behind the Work start screen: what each one may use and spend.

All categories share one orchestrator; only these briefs, budgets and tools differ. AEGIS Research
reads the web and what the person pastes. It has no local file, inbox, calendar or code execution
tools here, so each brief says what to do without them instead of pretending to have them.
"""
from dataclasses import dataclass, replace

from .contracts import RunBudget

BUDGETS = {
    'direct': RunBudget(model_calls=3, tokens=16000, searches=0, sources=0, workers=0, deadline_seconds=180, concurrency=1, lead_reserve=8000),
    'quick': RunBudget(model_calls=5, tokens=36000, searches=2, sources=6, workers=1, deadline_seconds=300, concurrency=2, lead_reserve=10000),
    'deep': RunBudget(model_calls=22, tokens=320000, searches=5, sources=18, workers=3, deadline_seconds=1500, concurrency=3, lead_reserve=60000),
    'structured': RunBudget(model_calls=12, tokens=140000, searches=6, sources=12, workers=3, deadline_seconds=1000, concurrency=3, lead_reserve=30000),
}


@dataclass(frozen=True)
class Workflow:
    skill: str
    persona: str
    mode: str
    brief: str
    needs_web: bool = True
    deliverable: str = ''
    map_brief: str = ''


NO_LOCAL = 'You cannot read local files or run code. Work from what the person pasted and from public sources, and say what you could not check.'

WORKFLOWS = {row.skill: row for row in [
    Workflow('explain-code', 'developer', 'structured', 'Explain how the pasted code or named public project works: its flow, its main parts and why. ' + NO_LOCAL, False, deliverable='Explain the entry point, data and control flow, and the important invariants. Cite concrete identifiers from the supplied code.', map_brief='Group by module or layer. Draw actual calls, imports and data flow.'),
    Workflow('map-a-project', 'developer', 'structured', 'Map the named project: its modules, how they connect and where to start reading. Use its public repository and documentation. ' + NO_LOCAL, deliverable='Give a reading order, an architecture overview, module responsibilities and dependency boundaries.', map_brief='Group verified files and packages by architectural layer. Use observed imports or calls for edges.'),
    Workflow('review-a-change', 'developer', 'quick', 'Review the pasted change or public pull request: real problems, exact fixes, and a drafted review comment. ' + NO_LOCAL, deliverable='List findings in severity order, with locations, impact, a concrete fix and a concise review comment.'),
    Workflow('fix-a-bug', 'developer', 'quick', 'Find the likely cause of the pasted failing test and draft a fix. Be plain that the fix has not been run. ' + NO_LOCAL, deliverable='Show the failure, the causal chain, a minimal patch and a targeted test the user can run.'),
    Workflow('ui-teardown', 'designer', 'deep', "Tear down the named product's interface from public material: key screens, moves worth taking, and what it gets wrong.", deliverable='Describe the user journeys and interface patterns, with evidence and specific design implications.'),
    Workflow('moodboard', 'designer', 'quick', 'Gather real references for the direction into one coherent direction, naming each reference and its source.', deliverable='Group the visual references into a coherent direction. For each reference give its source and the visual qualities worth using.'),
    Workflow('competitor-landscape', 'marketing', 'deep', 'Map the competitors of the named product or market: who they are, how each pitches and prices. Only facts from sources.', deliverable='Compare companies on the same dimensions. Mark missing evidence and date any pricing.'),
    Workflow('campaign-plan', 'marketing', 'structured', 'Write a campaign plan with dated steps on the right channels, and draft the launch posts.', deliverable='Lay out audience, channel, schedule, launch copy and measurable milestones.', map_brief='Group by campaign phase and link the actual prerequisites between milestones.'),
    Workflow('plan-my-day', 'manager', 'direct', 'Plan the day from what the person wrote. You cannot read their calendar or messages, so use only what they gave you and ask for nothing you do not need.', False, deliverable='Build a time-ordered agenda from supplied times, priorities and constraints. Flag conflicts and unscheduled tasks.'),
    Workflow('weekly-status', 'manager', 'direct', 'Write a weekly status from the notes the person pasted. You cannot read their accounts. Invent nothing.', False, deliverable='Group completed work, next steps and blockers. Preserve names and dates from the notes.'),
    Workflow('learning-path', 'student', 'deep', 'Write a week-by-week learning path for the subject, with real resources from sources.', deliverable='Sequence topics by prerequisite, with weekly goals, exercises, resources and completion checks.'),
    Workflow('exam-prep', 'student', 'quick', 'Prepare for the named exam: its format, what matters most, a plan and practice questions.', deliverable='Separate sourced exam format, study priorities, practice questions and an answer key.'),
    Workflow('inbox-triage', 'office', 'direct', 'Triage the messages the person pasted: what needs a reply, what can wait, and drafted replies. You cannot read their inbox.', False, deliverable='Group the supplied messages by action and urgency, with a draft reply for each that needs one.'),
    Workflow('meeting-prep', 'office', 'quick', 'Prepare for the named meeting: public background on the people and companies, talking points, and questions to ask.', deliverable='Distinguish supplied agenda, verified background, open questions and proposed talking points.'),
    Workflow('market-map', 'founder', 'structured', 'Map the market: its segments, the companies in each, who raised what, and where the gaps are. Only companies from sources; leave an unknown figure out.', deliverable='Show defined segments, companies and evidence, followed by gaps and unknowns.', map_brief='Group companies by observed market segment. Draw a relationship only when sources support it.'),
    Workflow('pricing-research', 'founder', 'deep', 'Research how comparable products price, compare the plans, and recommend a position. Only prices from sources, with their dates.', deliverable='Compare sourced prices with currency, billing period, scope and date, followed by positioning options.'),
    Workflow('investor-list', 'founder', 'deep', 'List investors who fit the company, with why each fits and their recent relevant investments. Only facts from sources.', deliverable='Give a sourced shortlist with investment thesis, stage, fit and relevant deals.'),
    Workflow('quick-research', 'research', 'quick', 'Answer the question concisely with sources: a short direct answer first, then the key supporting points.', deliverable='Lead with the answer, then the essential evidence and any material caveat.'),
    Workflow('deep-research', 'research', 'deep', 'Research the subject thoroughly: search from several angles, screen sources for quality, cross-check claims, fill gaps, and write a cited report.', deliverable='Produce a sectioned, cited report covering the full request and unresolved questions.'),
    Workflow('knowledge-map', 'research', 'structured', 'Explain the subject as a structured knowledge map: the parts, how they connect, and a detailed document. Let the structure follow what was asked, such as an architecture, a comparison, a flow or a blueprint.', deliverable='Deliver a connected map and a reading guide through its key groups and relationships.', map_brief='Use the requested architecture, sequence or comparison. Label edges by their actual relationship.'),
]}


def budget_for(mode, settings=lambda _name: ''):
    """The mode's budget. A Deep Research source cap can be raised up to a hard limit."""
    budget = BUDGETS.get(mode) or BUDGETS['quick']
    if mode == 'deep':
        try:
            wanted = int(settings('AEGIS_WORK_DEEP_SOURCES') or 0)
        except ValueError:
            wanted = 0
        if wanted:
            budget = replace(budget, sources=max(3, min(40, wanted)))
    return budget
