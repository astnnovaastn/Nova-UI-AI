/*
 * Manager, Student and Office workflows: Plan My Day, Weekly Status, Learning Path,
 * Exam Preparation, Inbox Triage, Meeting Preparation.
 *
 * The person's own apps (calendar, mail, Slack, Linear) are simulated: every message, name
 * and meeting below is invented and is not anyone's real data. The service hosts are the
 * real apps' names so the lab can show how route.rs decides between a connection and the
 * website; nothing is ever opened.
 */
import type { WorkflowFixture } from "../types";
import { page, results } from "../web";
import { create, fact, finish, hr, hs, ifApproved, part, say, skill, turn } from "./kit";

const MAIL = "https://mail.google.com/";
const SLACK = "https://app.slack.com/";
page(MAIL, "Inbox (sample)", ["14 unread"], {
  records: [
    { name: "Ana Ruiz — Q3 deck", ask: "Can you send the Q3 deck by Friday?", when: "Mon 09:12", url: "https://mail.google.com/mail/u/0/#inbox/sample-1" },
    { name: "Lee Park — Renewal call", ask: "Does 14:00 still work?", when: "Mon 10:40", url: "https://mail.google.com/mail/u/0/#inbox/sample-2" },
    { name: "Billing — Invoice 2207", ask: "Approve the invoice", when: "Sun 18:02", url: "https://mail.google.com/mail/u/0/#inbox/sample-3" },
    { name: "Newsletter — Weekly digest", ask: "", when: "Sun 07:00", url: "https://mail.google.com/mail/u/0/#inbox/sample-4" },
  ],
});
page(SLACK, "Slack (sample workspace)", ["3 unread DMs, 2 mentions"], {
  records: [
    { name: "Priya in #checkout", ask: "Blocked on the tax table for NL", when: "Mon 11:05", url: "https://app.slack.com/client/sample/C1" },
    { name: "Dana (DM)", ask: "Can you review PR 42 today?", when: "Mon 08:50", url: "https://app.slack.com/client/sample/D1" },
  ],
});
page("https://linear.app/", "Linear (sample team)", ["Cycle 14"]);

/** One entry question for the parts started together (hands.rs EntryDesk), answered once for both. */
const ENTRY = { question: "Work in your Gmail and Slack?", options: ["Allow", "Always for these", "Not now"], answer: "Allow", purpose: "entry" as const, shared: "entry" };

export const planMyDay: WorkflowFixture = {
  id: "plan-my-day",
  title: "Plan My Day",
  persona: "manager",
  skill: "plan-my-day",
  origin: "zephium",
  prompt: "Plan my day",
  examples: ["Plan my day", "What should I do today?"],
  needs: ["personal", "browser", "session", "connections"],
  aegisMode: "direct",
  fidelity: "Follows plan-my-day: day_sources (asked once), list_tasks, then one part per place the day lives, all in one turn. Gmail and Slack started together share one entry question, as hands.rs EntryDesk does; Calendar goes through the person's connection after route.rs's way question. All data is invented.",
  turns: [
    say("Finding where your day lives", skill("plan-my-day"), { tool: "day_sources" }, { tool: "list_tasks" }),
    say(
      "Reading the calendar, mail and Slack together",
      part({
        key: "calendar",
        title: "Calendar",
        helper: "connection",
        service: "Google Calendar",
        goal: "Today's events with times, place and who",
        asks: { question: "Use your Google Calendar connection, or work on the website?", options: ["Use connection", "Use the website", "Always the website", "Not now"], answer: "Use connection", purpose: "connection" },
        turns: [turn("Reading today", { tool: "connection", service: "calendar", tool_name: "calendar__list_events", verb: "events", target: "today" })],
        finish: { summary: "4 events", digest: "09:30 standup; 11:00 design review; 14:00 Acme renewal (Lee Park, Dana Cole); 16:30 1:1 Priya." },
      }),
      part({
        key: "gmail",
        title: "Gmail",
        helper: "browser",
        service: "mail.google.com",
        goal: "Mail from the last two days that asks something of you",
        asks: ENTRY,
        turns: [turn("Reading the inbox view", { tool: "browse", start: "mail.google.com", goal: "Unread mail that asks something", mine: true, view: true })],
        finish: { summary: "3 asks", digest: "Ana: Q3 deck by Friday; Lee: confirm 14:00; Billing: approve invoice 2207. One newsletter skipped." },
      }),
      part({
        key: "slack",
        title: "Slack",
        helper: "browser",
        service: "app.slack.com",
        goal: "Unread DMs, mentions and waiting threads",
        asks: ENTRY,
        turns: [turn("Reading what is new", { tool: "browse", start: "app.slack.com", goal: "Unread DMs and mentions", mine: true, view: true })],
        finish: { summary: "2 waiting on you", digest: "Priya blocked on the NL tax table; Dana asks for a PR 42 review today." },
      }),
    ),
    say(
      "Planning the rest of today",
      ifApproved(create(
        "plan",
        "Today",
        {
          checkable: false,
          steps: [
            { when: "09:30–09:45", title: "Standup", kind: "event", place: "Meet" },
            { when: "09:45–10:30", title: "Send Ana the Q3 deck", detail: "Due Friday; blocks her board prep", kind: "task" },
            { when: "11:00–12:00", title: "Design review", kind: "event" },
            { when: "12:00–12:45", title: "Review PR 42 for Dana", kind: "task" },
            { when: "14:00–14:45", title: "Acme renewal with Lee and Dana", kind: "event" },
            { when: "16:30–17:00", title: "1:1 with Priya: unblock the NL tax table", kind: "event" },
          ],
        },
        ["call:calendar:today", MAIL, SLACK],
      )),
      ifApproved(create(
        "list",
        "To do today",
        {
          style: "todo",
          items: [
            { title: "Send Ana the Q3 deck", priority: "high", due: "Fri", from: { app: "Gmail", host: "mail.google.com", who: "Ana Ruiz", when: "Mon 09:12", quote: "Can you send the Q3 deck by Friday?", url: "https://mail.google.com/mail/u/0/#inbox/sample-1" } },
            { title: "Unblock Priya on the NL tax table", priority: "high", from: { app: "Slack", host: "app.slack.com", who: "Priya", when: "Mon 11:05", quote: "Blocked on the tax table for NL", url: "https://app.slack.com/client/sample/C1" } },
            { title: "Review PR 42", from: { app: "Slack", host: "app.slack.com", who: "Dana", when: "Mon 08:50", quote: "Can you review PR 42 today?", url: "https://app.slack.com/client/sample/D1" } },
            { title: "Confirm 14:00 with Lee", from: { app: "Gmail", host: "mail.google.com", who: "Lee Park", when: "Mon 10:40", quote: "Does 14:00 still work?", url: "https://mail.google.com/mail/u/0/#inbox/sample-2" } },
            { title: "Send board deck to Ana", from: { app: "Zephium" } },
            { title: "Approve invoice 2207", from: { app: "Gmail", host: "mail.google.com", who: "Billing", when: "Sun 18:02", url: "https://mail.google.com/mail/u/0/#inbox/sample-3" } },
          ],
        },
        [MAIL, SLACK, "personal:list_tasks"],
      )),
    ),
    say(
      "Done",
      finish(
        { headline: "4 meetings, 6 things to do; Ana's deck first", text: "Two items block someone: **Ana's deck** and **Priya's tax table**." },
        "Plan and checklist are on the canvas.",
        [MAIL, SLACK],
        [],
        { headline: "Calendar only: Gmail and Slack were not read", text: "You chose not now for Gmail and Slack, so the plan holds only your calendar and tasks." },
      ),
    ),
  ],
};

export const weeklyStatus: WorkflowFixture = {
  id: "weekly-status",
  title: "Weekly Status",
  persona: "manager",
  skill: "weekly-status",
  origin: "zephium",
  prompt: "Write my weekly status update",
  examples: ["Write my weekly status update", "Weekly status from Linear and GitHub"],
  needs: ["connections", "browser", "session"],
  aegisMode: "direct",
  fidelity: "Follows weekly-status: Linear and GitHub through the person's connections, Slack on its website in their session; parts place nothing; a Slack draft, a \"Needs attention\" list and a reply with figures.",
  turns: [
    say(
      "Reading Linear, GitHub and Slack together",
      skill("weekly-status"),
      part({
        key: "linear",
        title: "Linear",
        helper: "connection",
        service: "Linear",
        goal: "Issues completed, in progress and blocked in the last seven days",
        asks: { question: "Use your Linear connection, or work on the website?", options: ["Use connection", "Use the website", "Always the website", "Not now"], answer: "Use connection", purpose: "connection" },
        turns: [turn("Listing issues", { tool: "connection", service: "linear", tool_name: "linear__list_issues", verb: "issues", target: "my issues" })],
        finish: { summary: "4 issues", digest: "Done: HS-12. In progress: HS-15, HS-18. Blocked: HS-21 (flaky cart test)." },
      }),
      part({
        key: "github",
        title: "GitHub",
        helper: "connection",
        service: "GitHub",
        goal: "Pull requests merged and open this week",
        turns: [turn("Listing pull requests", { tool: "connection", service: "github", tool_name: "github_prs", verb: "prs", target: "merged this week" })],
        finish: { summary: "5 merged", digest: "5 merged; #42 open (checks failing)." },
      }),
      part({
        key: "slack",
        title: "Slack",
        helper: "browser",
        service: "app.slack.com",
        goal: "Decisions, blockers and asks from the last seven days",
        asks: { question: "Work in your Slack?", options: ["Allow", "Always for Slack", "Not now"], answer: "Allow", purpose: "entry" },
        turns: [turn("Reading channels", { tool: "browse", start: "app.slack.com", goal: "Decisions and blockers this week", mine: true, view: true })],
        finish: { summary: "2 blockers", digest: "Priya blocked on NL tax; Dana waiting on review." },
      }),
    ),
    say(
      "Writing the status",
      ifApproved(create("draft", "Weekly status", { destination: "slack", to: "#team-checkout", body: "*Shipped*\n• HS-12 Checkout v2 copy\n• 5 pull requests merged\n\n*In progress*\n• HS-15 Refund flow\n• HS-18 Tax for NL\n\n*Blocked*\n• HS-21 Flaky cart test\n\n*Next week*\n• Merge #42 after the rounding fix" }, ["call:linear:my issues", "call:github:merged this week", SLACK])),
      ifApproved(create("list", "Needs attention", { style: "todo", items: [{ title: "Unblock Priya: NL tax table", priority: "high", from: { app: "Slack", host: "app.slack.com", who: "Priya", url: "https://app.slack.com/client/sample/C1" } }] }, [SLACK])),
    ),
    say(
      "Done",
      finish(
        { headline: "6 shipped, 1 blocked; NL tax slips", text: "The flaky cart test blocks HS-21.", figures: [{ label: "Shipped", value: "6" }, { label: "In progress", value: "2" }, { label: "Blocked", value: "1" }] },
        "Status draft is on the canvas.",
        ["call:linear:my issues"],
        ["Post the status"],
        { headline: "No status: a source was declined", text: "You said not now to one of the places the week lives; its row shows how to allow it, and no status was written from part of the week." },
      ),
    ),
  ],
};

/* ───────── Student ───────── */
const OCW = "https://open-courses.example";
page(`${OCW}/compilers`, "Compilers — open course (sample)", ["24 lectures, assignments with solutions", "Prerequisite: data structures"]);
page("https://open-books.example/crafting", "Crafting a Compiler — open textbook (sample)", ["Free online; 30 chapters"]);
page("https://videos.example/playlist/compilers", "Compilers lecture series (sample)", ["24 videos, 75 minutes each"], {
  records: [
    { name: "Lecture 1 · Overview", url: "https://videos.example/watch/c1", duration: "74:10" },
    { name: "Lecture 2 · Lexing", url: "https://videos.example/watch/c2", duration: "76:02" },
  ],
});
results("free university compilers course", [`${OCW}/compilers`]);
results("open compilers textbook", ["https://open-books.example/crafting"]);

export const learningPath: WorkflowFixture = {
  id: "learning-path",
  title: "Learning Path",
  persona: "student",
  skill: "learning-path",
  origin: "zephium",
  prompt: "I want to learn how compilers work",
  examples: ["I want to learn how compilers work", "Study plan for compilers"],
  needs: ["web", "browser"],
  aegisMode: "deep",
  fidelity: "Follows learning-path: Courses and Books research parts and a Videos browser part in one turn, each placing its own picks; the lead adds a week-by-week plan and one media object for the first lecture.",
  turns: [
    say(
      "Finding courses, books and lectures",
      skill("learning-path"),
      part({ key: "courses", title: "Courses", helper: "research", goal: "Free university courses with syllabus and assignments", turns: [turn("Searching", hs("free university compilers course")), turn("Reading", hr(`${OCW}/compilers`))], create: { kind: "picks", title: "Courses", data: { facet: "course", items: [{ name: "Compilers", subtitle: "Open course · 24 lectures", url: `${OCW}/compilers`, facts: [fact("Length", "12 weeks"), fact("Level", "Intermediate")], why: "The spine of the path" }] }, sources: [`${OCW}/compilers`] }, finish: { summary: "1 course", digest: "Open course with solutions." } }),
      part({ key: "books", title: "Books", helper: "research", goal: "The standard free textbook", turns: [turn("Searching", hs("open compilers textbook")), turn("Reading", hr("https://open-books.example/crafting"))], create: { kind: "picks", title: "Books", data: { facet: "article", items: [{ name: "Crafting a Compiler", subtitle: "Open textbook", url: "https://open-books.example/crafting", facts: [fact("Chapters", "30")], why: "Readable companion to the lectures" }] }, sources: ["https://open-books.example/crafting"] }, finish: { summary: "1 book", digest: "Free online textbook." } }),
      part({ key: "videos", title: "Videos", helper: "browser", service: "videos.example", goal: "A full lecture series", turns: [turn("Opening the playlist", { tool: "browse", start: "https://videos.example/playlist/compilers", goal: "Lecture videos with url and duration" })], create: { kind: "picks", title: "Lectures", data: { facet: "video", items: [{ name: "Lecture 1 · Overview", url: "https://videos.example/watch/c1", duration: "74:10", why: "Start here" }, { name: "Lecture 2 · Lexing", url: "https://videos.example/watch/c2", duration: "76:02", why: "Week 2" }] }, sources: ["https://videos.example/playlist/compilers"] }, finish: { summary: "2 lectures", digest: "24-part series." } }),
    ),
    say(
      "Laying out the weeks",
      create("plan", "Twelve weeks", { checkable: true, steps: [{ when: "Week 1", title: "Week 1 · Overview", detail: "Lecture 1; book ch. 1–2", kind: "milestone" }, { when: "Week 2", title: "Week 2 · Lexing", detail: "Lecture 2; assignment 1", kind: "milestone" }, { when: "Week 3", title: "Week 3 · Parsing", kind: "milestone" }, { when: "Weeks 4–12", title: "Types, IR, codegen", kind: "milestone" }] }, [`${OCW}/compilers`, "https://open-books.example/crafting"]),
      create("media", "Lecture 1 · Overview", { medium: "video", url: "https://videos.example/watch/c1", title: "Lecture 1 · Overview", provider: "file", duration: "74:10" }, ["https://videos.example/playlist/compilers"]),
    ),
    say("Done", finish({ headline: "12 weeks from lexing to code generation", text: "Start with **Lecture 1** and chapter 1 this week." }, "The path is on the canvas.", [`${OCW}/compilers`])),
  ],
};

page("https://exams.example/cs201/syllabus", "CS201 Algorithms — exam syllabus (sample)", ["Dynamic programming 30%", "Graphs 25%", "Sorting 15%"]);
page("https://exams.example/cs201/past", "CS201 past papers (sample)", ["2025 paper with solutions", "2024 paper with solutions"]);
results("cs201 algorithms exam syllabus", ["https://exams.example/cs201/syllabus"]);
results("cs201 past papers solutions", ["https://exams.example/cs201/past"]);

export const examPrep: WorkflowFixture = {
  id: "exam-prep",
  title: "Exam Preparation",
  persona: "student",
  skill: "exam-prep",
  origin: "zephium",
  prompt: "Help me prepare for my CS201 algorithms exam on 28 November",
  examples: ["Help me prepare for my CS201 algorithms exam on 28 November", "Exam prep for my algorithms final"],
  needs: ["web", "personal"],
  aegisMode: "quick",
  fidelity: "Follows exam-prep: one question for the missing time per day, search_notes for the person's own notes (asked once), Syllabus and Past papers research parts placing nothing; a revision plan, a picks of material and ten practice questions (four shown).",
  turns: [
    say("Asking for your time and reading your notes", skill("exam-prep"), { tool: "ask", question: "How much time a day can you study?", options: ["1 hour a day", "2–3 hours a day", "Full days"], answer: "2–3 hours a day" }, { tool: "search_notes", query: "CS201 algorithms" }),
    say(
      "Syllabus and past papers",
      part({ key: "syllabus", title: "Syllabus", helper: "research", goal: "Topics and weights", turns: [turn("Searching", hs("cs201 algorithms exam syllabus")), turn("Reading", hr("https://exams.example/cs201/syllabus"))], finish: { summary: "6 topics", digest: "DP 30%, graphs 25%, sorting 15% [s]." } }),
      part({ key: "papers", title: "Past papers", helper: "research", goal: "Past exams with solutions", turns: [turn("Searching", hs("cs201 past papers solutions")), turn("Reading", hr("https://exams.example/cs201/past"))], finish: { summary: "2 papers", digest: "2025 and 2024 with solutions." } }),
    ),
    say(
      "Planning to the exam",
      create("plan", "Revision plan", { checkable: true, steps: [{ when: "Mon 17 Nov", title: "Dynamic programming", detail: "2025 paper Q3–Q5", kind: "task" }, { when: "Wed 19 Nov", title: "Graphs", kind: "task" }, { when: "Tue 25 Nov", title: "Mock exam: 2024 paper", kind: "milestone" }, { when: "Thu 27 Nov", title: "Light review", kind: "task" }] }, ["https://exams.example/cs201/syllabus"]),
      create("picks", "Material", { facet: "course", items: [{ name: "2025 paper", url: "https://exams.example/cs201/past", facts: [fact("Year", "2025"), fact("Solutions", "yes", "yes")], why: "Closest to this year" }, { name: "Syllabus", url: "https://exams.example/cs201/syllabus", why: "Topic weights" }] }, ["https://exams.example/cs201/past", "https://exams.example/cs201/syllabus"]),
      create("list", "Practice questions", { style: "requirements", items: [{ title: "When does a greedy choice fail for coin change?", detail: "When coin values are not canonical, e.g. 1, 3, 4 for 6." }, { title: "Run time of Dijkstra with a binary heap?", detail: "O((V + E) log V)." }, { title: "What makes a problem suit dynamic programming?", detail: "Optimal substructure and overlapping subproblems." }, { title: "Is merge sort stable?", detail: "Yes." }] }),
    ),
    say("Done", finish({ headline: "11 days, 6 topics, one mock exam", text: "Today: **dynamic programming**, the heaviest topic." }, "Plan, material and questions are on the canvas.", ["https://exams.example/cs201/syllabus"])),
  ],
};

/* ───────── Office ───────── */
export const inboxTriage: WorkflowFixture = {
  id: "inbox-triage",
  title: "Inbox Triage",
  persona: "office",
  skill: "inbox-triage",
  origin: "zephium",
  prompt: "Go through my inbox",
  examples: ["Go through my inbox", "Triage my email"],
  needs: ["browser", "session"],
  aegisMode: "direct",
  fidelity: "Follows inbox-triage: one Gmail browser part in the person's session (the app asks first), placing nothing; a \"Needs you\" list, up to three reply drafts and a reply with figures. Nothing is sent, archived or marked read; sending would go through Confirm.",
  turns: [
    say(
      "Reading your inbox",
      skill("inbox-triage"),
      part({ key: "gmail", title: "Gmail", helper: "browser", service: "mail.google.com", goal: "Unread mail and the last three days: who, what they ask, the link", asks: { question: "Work in your Gmail?", options: ["Allow", "Always for Gmail", "Not now"], answer: "Allow", purpose: "entry" }, turns: [turn("Reading the inbox view", { tool: "browse", start: "mail.google.com", goal: "Unread and recent mail with sender, subject and ask", mine: true, view: true })], finish: { summary: "3 need you · 1 newsletter", digest: "Ana: Q3 deck by Friday; Lee: confirm 14:00; Billing: approve invoice 2207; 1 newsletter." } }),
    ),
    say(
      "Sorting and drafting",
      ifApproved(create("list", "Needs you", { style: "messages", items: [{ title: "Ana needs the Q3 deck by Friday", due: "Fri", priority: "high", from: { app: "Gmail", host: "mail.google.com", who: "Ana Ruiz", when: "Mon 09:12", quote: "Can you send the Q3 deck by Friday?", url: "https://mail.google.com/mail/u/0/#inbox/sample-1" } }, { title: "Lee asks whether 14:00 still works", priority: "high", from: { app: "Gmail", host: "mail.google.com", who: "Lee Park", when: "Mon 10:40", quote: "Does 14:00 still work?", url: "https://mail.google.com/mail/u/0/#inbox/sample-2" } }, { title: "Approve invoice 2207", from: { app: "Gmail", host: "mail.google.com", who: "Billing", url: "https://mail.google.com/mail/u/0/#inbox/sample-3" } }] }, [MAIL])),
      ifApproved(create("draft", "Re: Q3 deck", { destination: "email", to: "ana.ruiz@sample.example", subject: "Re: Q3 deck", body: "Hi Ana,\n\nYou'll have it by ____.\n\nBest" })),
      ifApproved(create("draft", "Re: Renewal call", { destination: "email", to: "lee.park@sample.example", subject: "Re: Renewal call", body: "Hi Lee,\n\n14:00 works. See you then.\n\nBest" })),
    ),
    say("Done", finish({ headline: "3 need replies today, 1 can be archived", figures: [{ label: "Needs reply", value: "3" }, { label: "Can archive", value: "1" }], text: "Ana's deck is the one with a deadline." }, "Triage and two drafts are on the canvas.", [MAIL], ["Archive the rest"], { headline: "The inbox was not read", text: "You chose not now for Gmail; its row shows how to allow it." })),
  ],
};

page("https://acme-co.example/team", "Acme — our team (sample)", ["Lee Park, Head of Operations", "Dana Cole, Procurement lead"]);
page("https://acme-co.example/news", "Acme newsroom (sample)", ["Acme opens a Rotterdam office (October)"]);
results("acme co lee park dana cole", ["https://acme-co.example/team", "https://acme-co.example/news"]);

export const meetingPrep: WorkflowFixture = {
  id: "meeting-prep",
  title: "Meeting Preparation",
  persona: "office",
  skill: "meeting-prep",
  origin: "zephium",
  prompt: "Prep me for my next meeting",
  examples: ["Prep me for my next meeting", "Meeting prep for the Acme renewal"],
  needs: ["connections", "browser", "session", "web"],
  aegisMode: "quick",
  fidelity: "Follows meeting-prep: Calendar first through the person's connection, then Mail in their session and a People research part for outside attendees; a picks of people, a \"To raise\" list and a reply. Only attendees' names and company go into a search, never the person's text.",
  turns: [
    say(
      "Finding the next meeting",
      skill("meeting-prep"),
      part({ key: "calendar", title: "Calendar", helper: "connection", service: "Google Calendar", goal: "The next meeting: time, link, attendees", asks: { question: "Use your Google Calendar connection, or work on the website?", options: ["Use connection", "Use the website", "Always the website", "Not now"], answer: "Use connection", purpose: "connection" }, turns: [turn("Reading the next event", { tool: "connection", service: "calendar", tool_name: "calendar__next_event", verb: "event", target: "next" })], finish: { summary: "Acme renewal at 14:00", digest: "Acme renewal, 14:00, Meet; Lee Park and Dana Cole (acme-co.example)." } }),
    ),
    say(
      "History and people, together",
      part({ key: "mail", title: "Mail", helper: "browser", service: "mail.google.com", goal: "Last month's threads with Lee and Dana", asks: { question: "Work in your Gmail?", options: ["Allow", "Always for Gmail", "Not now"], answer: "Allow", purpose: "entry" }, turns: [turn("Searching your mail", { tool: "browse", start: "mail.google.com", goal: "Threads with Lee Park or Dana Cole this month", mine: true })], finish: { summary: "2 threads", digest: "Lee asked to keep last year's price; Dana wants a 2-year term." } }),
      part({ key: "people", title: "People", helper: "research", goal: "Lee Park and Dana Cole: role, company news", turns: [turn("Searching by name and company", hs("acme co lee park dana cole")), turn("Reading", hr("https://acme-co.example/team"), hr("https://acme-co.example/news"))], finish: { summary: "2 people · 1 news item", digest: "Lee: Head of Operations; Dana: Procurement lead; Acme opened Rotterdam in October." } }),
    ),
    say(
      "Composing the brief",
      create("picks", "Who is coming", { facet: "person", items: [{ name: "Lee Park", subtitle: "Head of Operations, Acme", logo_host: "acme-co.example", url: "https://acme-co.example/team", facts: [fact("Last contact", "Mon, price")] }, { name: "Dana Cole", subtitle: "Procurement lead, Acme", logo_host: "acme-co.example", url: "https://acme-co.example/team", facts: [fact("Wants", "2-year term")] }] }, ["https://acme-co.example/team"]),
      ifApproved(create("list", "To raise", { style: "todo", items: [{ title: "Settle the renewal price Lee asked about", from: { app: "Gmail", who: "Lee Park", url: "https://mail.google.com/mail/u/0/#inbox/sample-2" } }, { title: "Answer Dana on a 2-year term", from: { app: "Gmail", who: "Dana Cole" } }] }, [MAIL])),
    ),
    say("Done", finish({ headline: "Acme renewal at 14:00 with Lee and Dana", text: "Settle **the price**: Lee wants last year's.", points: ["Acme opened Rotterdam in October"] }, "Brief is on the canvas.", ["https://acme-co.example/news"], [], { headline: "Acme renewal at 14:00 with Lee and Dana", text: "Your mail was not read, so there is no history with them; the public background is on the canvas." })),
  ],
};
