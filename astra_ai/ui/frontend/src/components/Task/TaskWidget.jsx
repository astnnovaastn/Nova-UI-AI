import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './TaskWidget.css';
import { composerPayload, taskApi, toWidgetActivity, toWidgetTask } from './taskApi.js';

const TRIGGERS = [
  { id: 'prompt_schedule', group: 'Prompt', label: 'Prompt on schedule', help: 'Run a prompt daily, weekly, or on a custom rhythm.', icon: 'message' },
  { id: 'prompt_event', group: 'Prompt', label: 'Prompt on event', help: 'Trigger after a number of sessions or messages.', icon: 'bolt' },
  { id: 'research_schedule', group: 'Research', label: 'Research on schedule', help: 'Run deep research on a topic automatically.', icon: 'search' },
  { id: 'research_event', group: 'Research', label: 'Research on event', help: 'Research after a matching application event.', icon: 'radar' },
  { id: 'action_schedule', group: 'Action', label: 'Action on schedule', help: 'Run maintenance or cleanup on a timer.', icon: 'wand' },
  { id: 'action_event', group: 'Action', label: 'Action on event', help: 'Run an action after session or message activity.', icon: 'workflow' },
  { id: 'webhook', group: 'External', label: 'Webhook triggered', help: 'Start from an authenticated HTTP call.', icon: 'webhook' },
];

const EMPTY_FORM = {
  title: '',
  instruction: '',
  priority: 'Normal',
  tags: '',
  due: '',
  timezone: 'Europe/Rome',
  schedule: 'Weekdays at 09:00',
  eventCount: '10',
  eventType: 'messages',
  webhookName: '',
};

const SMART_VIEW_ICONS = {
  'All tasks': 'tasks',
  Inbox: 'inbox',
  Today: 'today',
  Upcoming: 'upcoming',
  'AI Working': 'spark',
  Waiting: 'waiting',
  Failed: 'failed',
  Completed: 'completed',
};

const Icon = ({ name, size = 18 }) => {
  const paths = {
    tasks: <><path d="M8 6h11M8 12h11M8 18h7"/><path d="m3 6 1 1 2-2m-3 7 1 1 2-2m-3 7 1 1 2-2"/></>,
    overview: <><path d="M4 5h6v6H4zM14 5h6v3h-6zM14 12h6v7h-6zM4 15h6v4H4z"/></>,
    activity: <><path d="M3 12h4l2-6 4 12 2-6h6"/><path d="M4 21h16"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    minus: <path d="M5 12h14"/>,
    pause: <path d="M9 5v14M15 5v14"/>,
    play: <path d="m8 5 11 7-11 7Z"/>,
    stop: <rect x="6" y="6" width="12" height="12" rx="1"/>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    sort: <path d="M8 6h11M8 12h8M8 18h5M4 4v16m0 0-2-2m2 2 2-2"/>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    back: <path d="m15 18-6-6 6-6"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    message: <path d="M4 5h16v11H8l-4 3Z"/>,
    bolt: <path d="m13 2-8 12h7l-1 8 8-12h-7Z"/>,
    radar: <><circle cx="12" cy="12" r="8"/><path d="M12 12 18 6M12 4v2M4 12h2"/><circle cx="12" cy="12" r="2"/></>,
    wand: <><path d="m4 20 12-12 3 3L7 23Z"/><path d="M15 3v3M20 5h3M19 15v3"/></>,
    workflow: <><rect x="3" y="4" width="6" height="5" rx="1"/><rect x="15" y="15" width="6" height="5" rx="1"/><path d="M9 6.5h4a4 4 0 0 1 4 4V15"/></>,
    webhook: <><path d="M7 16a4 4 0 1 1 2-7M17 8a4 4 0 1 1-6 4M10 20a4 4 0 1 1 4-6"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></>,
    tag: <path d="M20 13 13 20 4 11V4h7Z"/>,
    file: <><path d="M6 3h8l4 4v14H6Z"/><path d="M14 3v5h5"/></>,
    retry: <><path d="M20 7v5h-5"/><path d="M18.5 16a8 8 0 1 1 .4-8.5L20 12"/></>,
    refresh: <><path d="M20 7v5h-5"/><path d="M18.5 16a8 8 0 1 1 .4-8.5L20 12"/></>,
    edit: <><path d="m4 20 4-1 11-11-3-3L5 16Z"/><path d="m14 6 3 3"/></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
    archive: <><rect x="4" y="7" width="16" height="13" rx="1"/><path d="M3 4h18v4H3M9 12h6"/></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14"/></>,
    inbox: <><path d="M4 5h16l2 9v5H2v-5Z"/><path d="M2 14h6l2 3h4l2-3h6"/></>,
    today: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M9 15h6"/></>,
    upcoming: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/></>,
    waiting: <><path d="M6 3h12M6 21h12M8 3c0 4 2 5 4 7 2-2 4-3 4-7M8 21c0-4 2-5 4-7 2 2 4 3 4 7"/></>,
    failed: <><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/></>,
    completed: <><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></>,
    spark: <><path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z"/></>,
    shield: <><path d="M12 3 5 6v5c0 4.8 2.8 8 7 10 4.2-2 7-5.2 7-10V6Z"/><path d="m9 12 2 2 4-5"/></>,
    queue: <><path d="M5 6h14M5 12h10M5 18h7"/><circle cx="19" cy="18" r="2"/></>,
    external: <><path d="M14 5h5v5M19 5l-8 8"/><path d="M18 13v6H5V6h6"/></>,
    more: <><circle cx="12" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/></>,
    history: <><path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.6"/><path d="M4 4v4.6h4.6M12 7v5l3 2"/></>,
  };
  return (
    <svg className="task-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] || paths.tasks}
    </svg>
  );
};

const statusLabel = (status) => ({
  running: 'AI working',
  paused: 'Paused',
  waiting: 'Needs approval',
  queued: 'Queued',
  completed: 'Completed',
  failed: 'Failed',
  draft: 'Draft',
}[status] || status);

const taskTypeIcon = (type) => (type === 'research' ? 'search' : type === 'action' ? 'wand' : 'message');

function TaskWidget({ onClose, onMinimize, aiConnectionStatus = 'auto' }) {
  const [view, setView] = useState('overview');
  const [tasks, setTasks] = useState([]);
  const [activity, setActivity] = useState([]);
  const [quickText, setQuickText] = useState('');
  const [createPrompt, setCreatePrompt] = useState('');
  const [createStep, setCreateStep] = useState('select');
  const [search, setSearch] = useState('');
  const [smartView, setSmartView] = useState('All tasks');
  const [sort, setSort] = useState('Priority');
  const [selected, setSelected] = useState([]);
  const [detailId, setDetailId] = useState(null);
  const [activityDetailId, setActivityDetailId] = useState(null);
  const [menuTaskId, setMenuTaskId] = useState(null);
  const [menuOpensUp, setMenuOpensUp] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [triggerId, setTriggerId] = useState('prompt_schedule');
  const [toast, setToast] = useState('');
  const [activityFilter, setActivityFilter] = useState('All');
  const [activitySearch, setActivitySearch] = useState('');
  const [drag, setDrag] = useState(null);
  const [position, setPosition] = useState(null);
  const [size, setSize] = useState({ width: 640, height: 500 });
  const [form, setForm] = useState(EMPTY_FORM);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [approvals, setApprovals] = useState([]);
  const [webhookCredential, setWebhookCredential] = useState(null);
  const shellRef = useRef(null);
  const menuRef = useRef(null);

  const notify = useCallback((message) => {
    setToast(message);
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setToast(''), 2600);
  }, []);

  const refreshDashboard = useCallback(async ({ quiet = false } = {}) => {
    try {
      const snapshot = await taskApi.dashboard();
      const nextTasks = (snapshot.tasks || []).map(toWidgetTask);
      const visibleTaskIds = new Set(nextTasks.map((task) => String(task.id)));
      setTasks(nextTasks);
      setActivity([...(snapshot.activity || [])]
        .filter((event) => event.task_id && visibleTaskIds.has(String(event.task_id)))
        .reverse()
        .map(toWidgetActivity));
      setApprovals(snapshot.approvals || []);
      setConnectionStatus(snapshot.offline ? 'offline' : 'online');
      return !snapshot.offline;
    } catch (error) {
      setConnectionStatus(error.code === 'OFFLINE' ? 'offline' : 'unavailable');
      if (!quiet) notify(error.message);
      return false;
    }
  }, [notify]);

  useEffect(() => {
    let mounted = true;
    let unsubscribe = () => {};
    let subscribed = false;
    const connect = async () => {
      const available = await refreshDashboard({ quiet: true });
      if (!mounted || !available || subscribed) return;
      subscribed = true;
      unsubscribe = taskApi.subscribe(
        () => mounted && refreshDashboard({ quiet: true }),
        (status) => mounted && setConnectionStatus(status),
      );
    };
    connect();
    const onOnline = () => connect();
    window.addEventListener('online', onOnline);
    return () => {
      mounted = false;
      unsubscribe();
      window.removeEventListener('online', onOnline);
    };
  }, [refreshDashboard]);

  useEffect(() => {
    const legacy = localStorage.getItem('astraTasks');
    if (!legacy) return;
    try {
      const items = JSON.parse(legacy);
      if (!Array.isArray(items)) return;
      const imported = items.map((item, index) => ({
        id: `legacy-${item.id || index}`,
        title: item.text || 'Imported task',
        instruction: 'Imported from the previous Tasks widget.',
        type: 'prompt',
        status: item.completed ? 'completed' : 'queued',
        progress: item.completed ? 100 : 0,
        priority: item.priority || 'normal',
        trigger: 'Imported · Manual',
        tags: ['Imported'],
        due: item.createdAt || 'No due date',
        checklist: [],
        runs: [],
      }));
      setTasks((current) => [...current, ...imported.filter((item) => !current.some((task) => task.id === item.id))]);
    } catch { /* Ignore malformed legacy data. */ }
  }, []);

  useEffect(() => {
    const onMove = (event) => {
      if (!drag) return;
      const rect = shellRef.current?.getBoundingClientRect();
      const renderedWidth = rect?.width || size.width;
      const renderedHeight = rect?.height || size.height;
      setPosition({
        x: Math.max(8, Math.min(Math.max(8, window.innerWidth - renderedWidth - 8), event.clientX - drag.x)),
        y: Math.max(8, Math.min(Math.max(8, window.innerHeight - renderedHeight - 8), event.clientY - drag.y)),
      });
    };
    const onUp = () => setDrag(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [drag, size]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      if (menuTaskId) setMenuTaskId(null);
      else if (activityDetailId) setActivityDetailId(null);
      else if (detailId) setDetailId(null);
      else if (createStep === 'form' && view === 'create') {
        setCreateStep('select');
        setEditingId(null);
      } else onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activityDetailId, createStep, detailId, menuTaskId, onClose, view]);

  useEffect(() => {
    setMenuTaskId(null);
    setDetailId(null);
    setActivityDetailId(null);
  }, [view]);

  useEffect(() => {
    if (!menuTaskId) return undefined;
    const closeMenu = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuTaskId(null);
    };
    window.addEventListener('pointerdown', closeMenu);
    return () => window.removeEventListener('pointerdown', closeMenu);
  }, [menuTaskId]);

  const activeTask = tasks.find((task) => task.status === 'running' || task.status === 'paused');
  const waitingTask = tasks.find((task) => task.status === 'waiting');
  const queued = tasks.filter((task) => task.status === 'queued');

  const aegisConnection = useMemo(() => {
    const requested = String(aiConnectionStatus || 'auto').toLowerCase().replaceAll('_', '-');
    const externalState = {
      connected: 'ready',
      online: 'ready',
      idle: 'ready',
      ready: 'ready',
      running: 'working',
      active: 'working',
      working: 'working',
      waiting: 'awaiting',
      'awaiting-approval': 'awaiting',
      approval: 'awaiting',
      disconnected: 'offline',
      unavailable: 'error',
      failed: 'error',
    }[requested] || requested;
    const serviceFailure = connectionStatus === 'offline'
      ? 'offline'
      : connectionStatus === 'unavailable' ? 'error' : null;
    const serviceTransition = connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
      ? connectionStatus
      : null;
    const recentRunFailed = activity[0]?.kind === 'error';

    let state = externalState !== 'auto' ? externalState : null;
    if (!state || state === 'ready') {
      state = serviceFailure
        || (waitingTask || approvals.length ? 'awaiting' : null)
        || (activeTask ? 'working' : null)
        || (recentRunFailed ? 'error' : null)
        || serviceTransition
        || 'ready';
    }

    const approvalCount = Math.max(approvals.length, waitingTask ? 1 : 0);
    const copy = {
      ready: ['Aegis ready', `${queued.length} queued`],
      working: ['Aegis working', activeTask ? `${activeTask.progress || 0}%` : 'Live'],
      awaiting: ['Awaiting approval', `${approvalCount} request${approvalCount === 1 ? '' : 's'}`],
      offline: ['Aegis offline', 'Retry'],
      error: [recentRunFailed ? 'Task run failed' : 'Connection error', 'Retry'],
      reconnecting: ['Aegis reconnecting', 'Please wait'],
      connecting: ['Aegis connecting', 'Please wait'],
    }[state] || ['Aegis ready', `${queued.length} queued`];

    return { state, label: copy[0], detail: copy[1], accessibleLabel: `${copy[0]}. ${copy[1]}` };
  }, [activeTask, activity, aiConnectionStatus, approvals.length, connectionStatus, queued.length, waitingTask]);

  const executionTask = aegisConnection.state === 'awaiting' && waitingTask
    ? waitingTask
    : activeTask || waitingTask;
  const executionAwaitingApproval = executionTask?.status === 'waiting';

  const isToday = (task) => {
    const due = task.raw?.due_at;
    return due ? new Date(due).toDateString() === new Date().toDateString() : /\bToday\b/i.test(task.due || '');
  };
  const isUpcoming = (task) => {
    const due = task.raw?.due_at;
    if (!due) return false;
    const value = new Date(due);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    return value > todayEnd && task.status !== 'completed';
  };

  const counts = useMemo(() => ({
    'All tasks': tasks.length,
    Inbox: tasks.filter((task) => task.status === 'draft' || task.status === 'queued').length,
    Today: tasks.filter(isToday).length,
    Upcoming: tasks.filter(isUpcoming).length,
    'AI Working': tasks.filter((task) => task.status === 'running' || task.status === 'paused').length,
    Waiting: tasks.filter((task) => task.status === 'waiting').length,
    Failed: tasks.filter((task) => task.status === 'failed').length,
    Completed: tasks.filter((task) => task.status === 'completed').length,
  }), [tasks]);

  const filteredTasks = useMemo(() => {
    let result = tasks.filter((task) => `${task.title} ${task.instruction} ${task.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase()));
    const mapping = { Inbox: ['queued', 'draft'], 'AI Working': ['running', 'paused'], Waiting: ['waiting'], Failed: ['failed'], Completed: ['completed'] };
    if (mapping[smartView]) result = result.filter((task) => mapping[smartView].includes(task.status));
    if (smartView === 'Today') result = result.filter(isToday);
    if (smartView === 'Upcoming') result = result.filter(isUpcoming);
    if (sort === 'Priority') {
      result = [...result].sort((a, b) => (
        ({ urgent: 0, high: 1, normal: 2, low: 3 }[a.priority] ?? 2)
        - ({ urgent: 0, high: 1, normal: 2, low: 3 }[b.priority] ?? 2)
      ));
    }
    if (sort === 'Progress') result = [...result].sort((a, b) => b.progress - a.progress);
    if (sort === 'Newest') {
      result = [...result].sort((a, b) => {
        const createdAt = (task) => new Date(task.raw?.created_at || task.createdAt || 0).getTime() || 0;
        return createdAt(b) - createdAt(a);
      });
    }
    return result;
  }, [tasks, search, smartView, sort]);

  const visibleActivity = useMemo(() => {
    const validTaskIds = new Set(tasks.map((task) => String(task.id)));
    return activity.filter((item) => {
      if (!validTaskIds.has(String(item.taskId))) return false;
      if (activityFilter === 'Approvals' && item.kind !== 'approval') return false;
      if (activityFilter === 'Errors' && item.kind !== 'error') return false;
      if (activityFilter === 'Completed' && item.kind !== 'success') return false;
      return `${item.title} ${item.detail}`.toLowerCase().includes(activitySearch.toLowerCase());
    });
  }, [activity, activityFilter, activitySearch, tasks]);

  const taskTagCounts = useMemo(() => {
    const tagCounts = new Map();
    tasks.forEach((task) => task.tags.forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)));
    return [...tagCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 6);
  }, [tasks]);

  const updateTask = (id, patch) => setTasks((current) => current.map((task) => (task.id === id ? { ...task, ...patch } : task)));
  const logAction = (task, title, detailText, kind = 'progress') => {
    setActivity((current) => [{
      id: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      kind,
      title,
      detail: detailText,
      taskId: task.id,
    }, ...current]);
  };

  const runControl = async (task, action) => {
    if (task.remote) {
      try {
        if (action === 'run') await taskApi.run(task.id);
        else if (task.latestRunId) await taskApi.runControl(task.latestRunId, action === 'cancel' ? 'cancel' : action);
        else if (action === 'retry') await taskApi.run(task.id);
        await refreshDashboard({ quiet: true });
        notify(action === 'pause' ? 'Pause requested at the next safe checkpoint' : action === 'cancel' ? 'Run stopped safely' : `Task ${action === 'run' ? 'queued' : `${action}d`}`);
      } catch (error) { notify(error.message); }
      return;
    }
    if (action === 'pause') {
      updateTask(task.id, { status: 'paused', currentStep: 'Paused safely after the current step' });
      logAction(task, `${task.title} paused`, 'Aegis saved the current execution checkpoint.');
      notify('Task paused at a safe checkpoint');
    }
    if (action === 'resume' || action === 'run') {
      updateTask(task.id, { status: 'running', progress: task.progress || 4, currentStep: 'Aegis is preparing the next execution step', elapsed: task.elapsed || '00:04', eta: task.eta || 'Calculating…' });
      logAction(task, `${task.title} ${action === 'run' ? 'started' : 'resumed'}`, 'Aegis is working on the next step.');
      notify(action === 'run' ? 'Task added to the active run' : 'Aegis resumed this task');
    }
    if (action === 'cancel') {
      updateTask(task.id, { status: 'queued', progress: 0, currentStep: undefined });
      logAction(task, `${task.title} stopped`, 'The run stopped safely and remains available in the queue.');
      notify('Run stopped; task returned to queue');
    }
    if (action === 'retry') {
      updateTask(task.id, { status: 'queued', progress: 0, currentStep: 'Queued for a clean retry' });
      logAction(task, `${task.title} queued for retry`, 'Aegis will retry when the active run finishes.');
      notify('Task queued for retry');
    }
  };

  const createQuick = async () => {
    const instruction = quickText.trim();
    if (!instruction) {
      notify('Describe the outcome you want Aegis to deliver');
      return;
    }
    try {
      const created = await taskApi.create({
        title: instruction.slice(0, 240),
        instruction,
        kind: 'prompt',
        priority: 'normal',
        tags: ['Aegis'],
        timezone: 'Europe/Rome',
        trigger: { kind: 'manual', timezone: 'Europe/Rome', enabled: true },
        lifecycle: 'active',
      });
      await taskApi.run(created.id);
      setQuickText('');
      await refreshDashboard({ quiet: true });
      notify('Task created and sent to Aegis');
      return;
    } catch (error) {
      if (error.code !== 'SERVICE_UNAVAILABLE' && error.code !== 'OFFLINE') {
        notify(error.message);
        return;
      }
    }
    const task = {
      id: `task-${Date.now()}`,
      title: instruction,
      instruction,
      type: 'prompt',
      status: activeTask ? 'queued' : 'running',
      progress: activeTask ? 0 : 3,
      priority: 'normal',
      trigger: 'Manual · Quick task',
      tags: ['Aegis'],
      due: 'Created now',
      checklist: [],
      runs: [],
    };
    setTasks((current) => [task, ...current]);
    setQuickText('');
    logAction(task, `${task.title} created`, activeTask ? 'Added behind the active Aegis run.' : 'Aegis started this task.');
    notify(activeTask ? 'Task added to Aegis’s queue' : 'Aegis started the task');
  };

  const resetCreate = () => {
    setEditingId(null);
    setTriggerId('prompt_schedule');
    setForm(EMPTY_FORM);
    setCreatePrompt('');
    setCreateStep('select');
  };

  const beginTrigger = (id) => {
    setEditingId(null);
    setTriggerId(id);
    setForm(EMPTY_FORM);
    setCreateStep('form');
  };

  const draftCreatePrompt = () => {
    const prompt = createPrompt.trim();
    if (!prompt) {
      notify('Describe the task you want to set up');
      return;
    }
    setForm({ ...EMPTY_FORM, title: prompt.slice(0, 120), instruction: prompt });
    setTriggerId('prompt_schedule');
    setCreateStep('form');
  };

  const openEdit = (task) => {
    const rawTrigger = task.raw?.trigger;
    const editTrigger = rawTrigger?.kind === 'webhook'
      ? 'webhook'
      : `${task.type}_${rawTrigger?.kind === 'event' ? 'event' : 'schedule'}`;
    setEditingId(task.id);
    setTriggerId(TRIGGERS.some((item) => item.id === editTrigger) ? editTrigger : 'prompt_schedule');
    setForm({
      title: task.title,
      instruction: task.instruction,
      priority: task.priority.charAt(0).toUpperCase() + task.priority.slice(1),
      tags: task.tags.join(', '),
      due: task.raw?.due_at ? new Date(task.raw.due_at).toISOString().slice(0, 16) : '',
      timezone: task.raw?.timezone || 'Europe/Rome',
      schedule: rawTrigger?.schedule || 'Weekdays at 09:00',
      eventCount: String(rawTrigger?.every_count || 1),
      eventType: rawTrigger?.event_name || 'messages',
      webhookName: '',
    });
    setDetailId(null);
    setCreateStep('form');
    setView('create');
  };

  const saveComposer = async (draft = false) => {
    if (!form.title.trim()) {
      notify('Add a task title before saving');
      return;
    }
    if (!form.instruction.trim()) {
      notify('Add instructions so Aegis knows what to do');
      return;
    }
    const trigger = TRIGGERS.find((item) => item.id === triggerId);
    try {
      const current = tasks.find((item) => item.id === editingId);
      const payload = composerPayload(form, triggerId, draft);
      const created = editingId && current?.remote
        ? await taskApi.update(editingId, payload, current.version)
        : await taskApi.create(payload);
      if (created.trigger?.webhook_secret) {
        setWebhookCredential({
          endpoint: `${window.location.origin}/api/tasks/v1/hooks/${created.trigger.public_id}`,
          secret: created.trigger.webhook_secret,
        });
      }
      await refreshDashboard({ quiet: true });
      notify(created.trigger?.webhook_secret ? 'Secure webhook created — copy its one-time secret' : editingId ? 'Task updated' : draft ? 'Draft saved' : 'Task created and added to the queue');
      resetCreate();
      setView('tasks');
      return;
    } catch (error) {
      if (error.code !== 'SERVICE_UNAVAILABLE' && error.code !== 'OFFLINE') {
        notify(error.message);
        return;
      }
    }
    if (editingId) {
      updateTask(editingId, {
        title: form.title.trim(),
        instruction: form.instruction.trim(),
        priority: form.priority.toLowerCase(),
        tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        trigger: trigger.label,
      });
      notify('Task updated');
      resetCreate();
      setView('tasks');
      return;
    }
    const task = {
      id: `task-${Date.now()}`,
      title: form.title.trim(),
      instruction: form.instruction.trim(),
      type: trigger.group.toLowerCase(),
      status: draft ? 'draft' : 'queued',
      progress: 0,
      priority: form.priority.toLowerCase(),
      trigger: trigger.label,
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      due: form.due || (draft ? 'Draft' : 'Ready to run'),
      checklist: [],
      runs: [],
    };
    setTasks((current) => [task, ...current]);
    logAction(task, draft ? `${task.title} saved as draft` : `${task.title} created`, draft ? 'The task can be completed later.' : `${trigger.label} is configured.`, draft ? 'progress' : 'success');
    notify(draft ? 'Draft saved' : 'Task created and added to the queue');
    resetCreate();
    setView('tasks');
  };

  const selectAll = () => setSelected(selected.length === filteredTasks.length ? [] : filteredTasks.map((task) => task.id));

  const decideApproval = async (task, decision) => {
    const approval = approvals.find((item) => String(item.task_id) === String(task.id));
    if (task.remote && approval) {
      try {
        await taskApi.decideApproval(approval.id, decision);
        await refreshDashboard({ quiet: true });
        notify(decision === 'approved' ? 'Action approved and queued' : 'Action rejected; no changes were made');
      } catch (error) { notify(error.message); }
      return;
    }
    updateTask(task.id, { status: decision === 'approved' ? 'queued' : 'paused', due: decision === 'approved' ? 'Approved · queued' : 'Approval rejected' });
    notify(decision === 'approved' ? 'Action approved and queued' : 'Action rejected; no changes were made');
  };

  const bulkAction = async (action) => {
    if (!selected.length) return;
    const remoteTasks = tasks.filter((task) => selected.includes(task.id) && task.remote);
    if (remoteTasks.length) {
      try {
        for (const task of remoteTasks) {
          if (action === 'archive') await taskApi.remove(task.id);
          else if (action === 'pause' && task.latestRunId) await taskApi.runControl(task.latestRunId, 'pause');
          else if (action === 'resume' && task.latestRunId) await taskApi.runControl(task.latestRunId, 'resume');
          else if (action === 'resume') await taskApi.run(task.id);
        }
        await refreshDashboard({ quiet: true });
        notify(`${remoteTasks.length} tasks updated`);
        setSelected([]);
        return;
      } catch (error) {
        notify(error.message);
        return;
      }
    }
    if (action === 'archive') setTasks((current) => current.filter((task) => !selected.includes(task.id)));
    else setTasks((current) => current.map((task) => (selected.includes(task.id) ? { ...task, status: action === 'resume' ? 'queued' : 'paused' } : task)));
    notify(`${selected.length} tasks ${action === 'archive' ? 'archived' : action === 'resume' ? 'queued' : 'paused'}`);
    setSelected([]);
  };

  const removeTask = async (task, label) => {
    if (task.remote) {
      try {
        await taskApi.remove(task.id);
        await refreshDashboard({ quiet: true });
      } catch (error) {
        notify(error.message);
        return;
      }
    } else setTasks((current) => current.filter((item) => item.id !== task.id));
    setDetailId(null);
    notify(label);
  };

  const toggleTaskDetail = (taskId) => {
    setMenuTaskId(null);
    setDetailId((current) => current === taskId ? null : taskId);
  };

  const openTaskFromOverview = (taskId) => {
    setView('tasks');
    window.setTimeout(() => setDetailId(taskId), 0);
  };

  const openActivityFromOverview = (activityId) => {
    setView('activity');
    window.setTimeout(() => setActivityDetailId(activityId), 0);
  };

  const copyActivityLog = async (item) => {
    try {
      await navigator.clipboard.writeText(`${item.time} · ${item.title}\n${item.detail}`);
      notify('Activity log copied');
    } catch {
      notify('Could not copy this activity log');
    }
  };

  const performMenuAction = async (task, action) => {
    setMenuTaskId(null);
    if (action === 'edit') {
      openEdit(task);
      return;
    }
    if (action === 'history') {
      setDetailId(task.id);
      return;
    }
    if (action === 'delete') {
      await removeTask(task, 'Task moved to trash');
      return;
    }
    await runControl(task, action);
  };

  const onTaskMenuKeyDown = (event) => {
    const items = [...event.currentTarget.querySelectorAll('[role="menuitem"]:not(:disabled)')];
    const currentIndex = items.indexOf(document.activeElement);
    let nextIndex = currentIndex;
    if (event.key === 'ArrowDown') nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
    else if (event.key === 'ArrowUp') nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = items.length - 1;
    else return;
    event.preventDefault();
    items[nextIndex]?.focus();
  };

  const onResizeStart = (event) => {
    if (window.innerWidth < 640) return;
    event.preventDefault();
    const start = { x: event.clientX, y: event.clientY, width: size.width, height: size.height };
    const move = (moveEvent) => {
      const nextWidth = Math.max(520, Math.min(window.innerWidth - 16, start.width + moveEvent.clientX - start.x));
      const nextHeight = Math.max(420, Math.min(window.innerHeight - 16, start.height + moveEvent.clientY - start.y));
      setSize({ width: nextWidth, height: nextHeight });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const viewportWidth = typeof window === 'undefined' ? 1200 : window.innerWidth;
  const viewportHeight = typeof window === 'undefined' ? 800 : window.innerHeight;
  const mobile = viewportWidth < 640;
  const renderedSize = {
    width: mobile ? Math.max(0, viewportWidth - 16) : Math.min(size.width, viewportWidth - 16),
    height: mobile ? Math.max(0, viewportHeight - 16) : Math.min(size.height, viewportHeight - 16),
  };
  const shellStyle = position && !mobile
    ? { left: position.x, top: position.y, transform: 'none', ...renderedSize }
    : renderedSize;

  const navItems = [
    ['overview', 'overview', 'Overview'],
    ['tasks', 'tasks', 'Tasks'],
    ['activity', 'activity', 'Activity'],
    ['create', 'plus', 'Create'],
  ];

  const executionStage = executionTask ? Math.min(3, Math.floor(Math.max(0, executionTask.progress) / 26)) : 0;

  return (
    <section
      ref={shellRef}
      data-aegis-widget="task"
      className={`task-command-widget ${position ? 'is-positioned' : ''}`}
      style={shellStyle}
      aria-label="Aegis Tasks"
      data-aegis-connection={aegisConnection.state}
      data-active-task-id={executionTask?.id || ''}
      data-active-run-id={executionTask?.latestRunId || ''}
    >
      <header
        className="task-window-header"
        onPointerDown={(event) => {
          if (window.innerWidth < 640 || event.button !== 0 || event.target.closest('button, input, textarea, select, a')) return;
          const rect = shellRef.current.getBoundingClientRect();
          event.currentTarget.setPointerCapture?.(event.pointerId);
          setDrag({ x: event.clientX - rect.left, y: event.clientY - rect.top });
        }}
      >
        <div className="task-window-brand">
          <span className="task-brand-mark"><Icon name="tasks" size={18}/></span>
          <div><h2>Tasks</h2><span>Aegis operations</span></div>
        </div>
        <div
          className={`task-live-status is-${aegisConnection.state}`}
          title={`${aegisConnection.accessibleLabel}. Task service: ${connectionStatus}`}
          role="status"
          aria-live="polite"
          aria-label={aegisConnection.accessibleLabel}
          data-aegis-status={aegisConnection.state}
        >
          <span className="task-live-dot"/>
          <span>{aegisConnection.label}</span>
          <span className="task-aegis-signal" aria-hidden="true"><i/></span>
          <b>{aegisConnection.detail}</b>
        </div>
        <div className="task-window-actions">
          <button type="button" className="task-icon-button" onClick={() => onMinimize?.()} aria-label="Minimize Tasks"><Icon name="minus"/></button>
          <button type="button" className="task-icon-button" onClick={() => onClose?.()} aria-label="Close Tasks"><Icon name="close"/></button>
        </div>
      </header>

      <nav className="task-primary-nav" aria-label="Tasks sections">
        {navItems.map(([id, icon, label]) => (
          <button key={id} type="button" className={view === id ? 'is-active' : ''} onClick={() => setView(id)}>
            <Icon name={icon} size={16}/>
            <span>{label}</span>
            {id === 'tasks' && <i>{tasks.length}</i>}
            {id === 'activity' && waitingTask && <i className="is-alert">1</i>}
          </button>
        ))}
      </nav>

      <main className="task-widget-main">
        {view === 'overview' && (
          <div className="task-overview-view">
            <section className="task-outcome-composer task-quick-composer">
              <div className="task-composer-heading">
                <div><div><h3>What should Aegis accomplish?</h3><p>Describe the finished result and Aegis will shape the work.</p></div></div>
                <small>⌘/Ctrl + Enter</small>
              </div>
              <div className="task-outcome-input">
                <Icon name="spark" size={15}/>
                <textarea
                  aria-label="What should Aegis accomplish?"
                  value={quickText}
                  onChange={(event) => setQuickText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) createQuick();
                  }}
                  placeholder="Describe an outcome — e.g. summarize unread email and flag decisions"
                  rows={1}
                />
                <button type="button" onClick={createQuick} disabled={!quickText.trim()} aria-label="Start task">
                  <Icon name="spark" size={13}/><span>Start task</span>
                </button>
              </div>
              <div className="task-suggestions" aria-label="Task suggestions">
                <span>Try</span>
                <button type="button" onClick={() => setQuickText('Research the latest changes in ')}>Research</button>
                <button type="button" onClick={() => setQuickText('Create a weekly decision brief for ')}>Weekly brief</button>
                <button type="button" onClick={() => setQuickText('Organize and safely archive ')}>Organize</button>
              </div>
            </section>

            <section
              className={`task-execution-module ${executionTask ? `is-${executionTask.status}` : 'is-idle'} aegis-is-${aegisConnection.state}`}
              data-aegis-linked={executionTask ? 'true' : 'false'}
            >
              <div className="task-execution-header">
                <div>
                  <span className="task-execution-kicker"><span className="task-running-pulse"/>{executionAwaitingApproval ? 'APPROVAL CHECKPOINT' : 'LIVE EXECUTION'}</span>
                  <h3>{executionTask ? executionTask.title : 'Aegis is ready for a new run'}</h3>
                </div>
                {executionTask ? <span className={`task-status-badge ${executionTask.status}`}>{executionAwaitingApproval ? 'AWAITING APPROVAL' : statusLabel(executionTask.status)}</span> : <span className="task-status-badge ready">READY</span>}
              </div>
              {executionTask ? (
                <>
                  <div className="task-execution-summary">
                    <span className={`task-execution-type ${executionTask.type}`}><Icon name={taskTypeIcon(executionTask.type)} size={16}/></span>
                    <div className="task-execution-step"><small>{executionAwaitingApproval ? 'PAUSED AT' : 'CURRENT STEP'}</small><p>{executionTask.currentStep || (executionAwaitingApproval ? 'Waiting for approval before continuing' : executionTask.status === 'paused' ? 'Paused at a safe checkpoint' : 'Aegis is preparing the next step')}</p></div>
                    <div className="task-execution-metrics"><span><b>{executionTask.progress}%</b><small>complete</small></span><span><b>{executionAwaitingApproval ? 'Saved' : executionTask.elapsed || 'Live'}</b><small>{executionAwaitingApproval ? 'checkpoint' : 'elapsed'}</small></span><span><b>{executionAwaitingApproval ? '—' : executionTask.eta || '—'}</b><small>ETA</small></span></div>
                  </div>
                  <div className="task-stage-rail" aria-label={`${executionTask.progress}% complete`}>
                    {['Accepted', 'Working', 'Review', 'Done'].map((stage, index) => (
                      <span key={stage} className={index < executionStage ? 'is-complete' : index === executionStage ? 'is-current' : ''}>
                        <i>{index < executionStage ? <Icon name="check" size={10}/> : index + 1}</i><b>{stage}</b>
                      </span>
                    ))}
                    <em><i style={{ width: `${executionTask.progress}%` }}/></em>
                  </div>
                  <div className="task-execution-actions">
                    {executionAwaitingApproval ? (
                      <>
                        <button type="button" className="task-action-primary" onClick={() => decideApproval(executionTask, 'approved')}><Icon name="shield" size={13}/>Approve</button>
                        <button type="button" onClick={() => openTaskFromOverview(executionTask.id)}><Icon name="external" size={13}/>Review request</button>
                        <button type="button" className="is-danger" onClick={() => decideApproval(executionTask, 'rejected')}><Icon name="close" size={12}/>Reject</button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="task-action-primary" onClick={() => runControl(executionTask, executionTask.status === 'paused' ? 'resume' : 'pause')}><Icon name={executionTask.status === 'paused' ? 'play' : 'pause'} size={13}/>{executionTask.status === 'paused' ? 'Resume' : 'Pause'}</button>
                        <button type="button" onClick={() => openTaskFromOverview(executionTask.id)}><Icon name="external" size={13}/>Open run</button>
                        <button type="button" className="is-danger" onClick={() => runControl(executionTask, 'cancel')}><Icon name="stop" size={12}/>Stop</button>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="task-execution-idle">
                  <span><Icon name="bolt" size={19}/></span>
                  <div><b>No task is running</b><p>Start an outcome above or open Create for a scheduled automation.</p></div>
                  <button type="button" onClick={() => setView('create')}>Open Create <Icon name="chevron" size={12}/></button>
                </div>
              )}
            </section>

            <div className="task-overview-strip">
              <section>
                <header><span><Icon name="queue" size={14}/>Queue</span><button type="button" onClick={() => setView('tasks')}>View all</button></header>
                {queued.length ? queued.slice(0, 2).map((task, index) => (
                  <button type="button" className="task-compact-row" key={task.id} onClick={() => openTaskFromOverview(task.id)}>
                    <i>{String(index + 1).padStart(2, '0')}</i><span><b>{task.title}</b><small>{task.trigger}</small></span><Icon name="chevron" size={12}/>
                  </button>
                )) : <div className="task-compact-empty"><Icon name="check" size={13}/> Queue is clear</div>}
              </section>
              <section className={waitingTask ? 'has-alert' : ''}>
                <header><span><Icon name="shield" size={14}/>Approvals</span><b>{waitingTask ? 1 : 0}</b></header>
                {waitingTask ? (
                  <div className="task-approval-compact"><button type="button" onClick={() => openTaskFromOverview(waitingTask.id)}><b>{waitingTask.title}</b><small>Protected action needs review</small></button><button type="button" onClick={() => decideApproval(waitingTask, 'approved')}>Approve</button></div>
                ) : <div className="task-compact-empty"><Icon name="shield" size={13}/> Nothing needs review</div>}
              </section>
              <section>
                <header><span><Icon name="activity" size={14}/>Recent</span><button type="button" onClick={() => setView('activity')}>Full log</button></header>
                {visibleActivity.length ? visibleActivity.slice(0, 2).map((item) => (
                  <button type="button" className="task-compact-row" key={item.id} onClick={() => openActivityFromOverview(item.id)}>
                    <i className={`event-${item.kind}`}/><span><b>{item.title}</b><small>{item.time}</small></span><Icon name="chevron" size={12}/>
                  </button>
                )) : <div className="task-compact-empty"><Icon name="activity" size={13}/> No activity yet</div>}
              </section>
            </div>
          </div>
        )}

        {view === 'tasks' && (
          <div className="task-tasks-view task-list-workspace">
            <section className="task-view-heading">
              <div><span>TASK LIBRARY</span><h3>{smartView}</h3><p>{filteredTasks.length} of {tasks.length} tasks</p></div>
              <label className="task-smart-selector">
                <Icon name={SMART_VIEW_ICONS[smartView]} size={16}/>
                <select value={smartView} onChange={(event) => { setSmartView(event.target.value); setSelected([]); }} aria-label="Choose task smart view">
                  {Object.entries(counts).map(([label, count]) => <option key={label} value={label}>{label} — {count}</option>)}
                </select>
                <b>{counts[smartView]}</b>
              </label>
            </section>
            <div className="task-list-tools">
              <label className="task-search-box"><Icon name="search" size={17}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks, instructions, or tags…"/></label>
            </div>
            <div className="task-filter-row">
              <div className="task-view-chips" aria-label="Smart view and task tag filters">
                {Object.entries(counts).slice(0, 5).map(([label, count]) => (
                  <button type="button" key={label} className={smartView === label ? 'is-active' : ''} onClick={() => { setSmartView(label); setSearch(''); setSelected([]); }}>{label}<i>{count}</i></button>
                ))}
                {taskTagCounts.map(([tag, count]) => (
                  <button type="button" key={tag} className={search === tag ? 'is-active' : ''} onClick={() => { setSmartView('All tasks'); setSearch((current) => current === tag ? '' : tag); setSelected([]); }}>#{tag}<i>{count}</i></button>
                ))}
              </div>
              <label className="task-sort-select"><Icon name="sort" size={13}/><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort tasks"><option>Priority</option><option>Progress</option><option>Newest</option></select></label>
            </div>
            {selected.length > 0 && (
              <div className="task-bulk-bar">
                <b>{selected.length} selected</b>
                <button type="button" onClick={() => bulkAction('pause')}><Icon name="pause" size={12}/>Pause</button>
                <button type="button" onClick={() => bulkAction('resume')}><Icon name="play" size={12}/>Queue</button>
                <button type="button" onClick={() => bulkAction('archive')}><Icon name="archive" size={12}/>Archive</button>
                <button type="button" onClick={() => setSelected([])}>Clear</button>
              </div>
            )}
            <div className="task-table-header">
              <label><input type="checkbox" checked={filteredTasks.length > 0 && selected.length === filteredTasks.length} onChange={selectAll}/><span>Task</span></label>
              <span>Status</span><span>Schedule</span><span/>
            </div>
            <div className="task-data-list">
              {filteredTasks.length ? filteredTasks.map((task) => (
                <article key={task.id} className={`task-data-item ${detailId === task.id ? 'is-expanded' : ''}`}>
                  <div className={`task-data-row ${selected.includes(task.id) ? 'is-selected' : ''}`}>
                    <label className="task-row-main">
                      <input type="checkbox" checked={selected.includes(task.id)} onChange={() => setSelected((current) => current.includes(task.id) ? current.filter((id) => id !== task.id) : [...current, task.id])}/>
                      <span className={`task-type-icon ${task.type}`}><Icon name={taskTypeIcon(task.type)} size={15}/></span>
                      <button type="button" onClick={() => toggleTaskDetail(task.id)} aria-expanded={detailId === task.id} aria-controls={`task-inline-${task.id}`}>
                        <span className="task-row-title"><b>{task.title}</b><em className={`priority-${task.priority}`}>{task.priority}</em></span>
                        <small className="task-row-instruction">{task.instruction}</small>
                        {task.tags.length > 0 && <span className="task-row-tags">{task.tags.slice(0, 2).map((tag) => <i key={tag}>#{tag}</i>)}</span>}
                      </button>
                    </label>
                    <span className="task-row-status">
                      <span><i className={`task-status-dot ${task.status}`}/><b>{statusLabel(task.status)}</b></span>
                      <span className="task-row-progress"><i style={{ width: `${task.progress || 0}%` }}/></span>
                      <small>{task.progress || 0}% complete</small>
                    </span>
                    <span className="task-row-schedule"><b>{task.due}</b><small><Icon name="clock" size={11}/>{task.trigger}</small></span>
                    <span className="task-row-menu-anchor" ref={menuTaskId === task.id ? menuRef : null}>
                      <button
                        type="button"
                        className="task-row-more"
                        onClick={(event) => {
                          event.stopPropagation();
                          const opening = menuTaskId !== task.id;
                          if (opening) {
                            const buttonRect = event.currentTarget.getBoundingClientRect();
                            const widgetRect = shellRef.current?.getBoundingClientRect();
                            const widgetMidpoint = widgetRect ? widgetRect.top + (widgetRect.height / 2) : window.innerHeight / 2;
                            const lowerBoundary = Math.min(window.innerHeight - 8, widgetRect?.bottom || window.innerHeight - 8);
                            setMenuOpensUp(buttonRect.top >= widgetMidpoint || buttonRect.bottom + 190 > lowerBoundary);
                          }
                          setMenuTaskId(opening ? task.id : null);
                          if (opening) window.setTimeout(() => menuRef.current?.querySelector('[role="menuitem"]')?.focus(), 0);
                        }}
                        aria-label={`Actions for ${task.title}`}
                        aria-haspopup="menu"
                        aria-expanded={menuTaskId === task.id}
                      ><Icon name="more" size={16}/></button>
                      {menuTaskId === task.id && (
                        <div className={`task-row-actions-menu ${menuOpensUp ? 'opens-up' : ''}`} role="menu" aria-label={`Actions for ${task.title}`} onKeyDown={onTaskMenuKeyDown}>
                          {!['running', 'paused', 'waiting'].includes(task.status) && <button type="button" role="menuitem" onClick={() => performMenuAction(task, task.status === 'failed' ? 'retry' : 'run')}><Icon name={task.status === 'failed' ? 'retry' : 'bolt'} size={14}/>Run now</button>}
                          <button type="button" role="menuitem" onClick={() => performMenuAction(task, 'edit')}><Icon name="edit" size={14}/>Edit</button>
                          {task.status === 'running' && <button type="button" role="menuitem" onClick={() => performMenuAction(task, 'pause')}><Icon name="pause" size={14}/>Pause</button>}
                          {task.status === 'paused' && <button type="button" role="menuitem" onClick={() => performMenuAction(task, 'resume')}><Icon name="play" size={14}/>Resume</button>}
                          <button type="button" role="menuitem" onClick={() => performMenuAction(task, 'history')}><Icon name="history" size={14}/>History</button>
                          <span role="separator"/>
                          <button type="button" role="menuitem" className="is-danger" onClick={() => performMenuAction(task, 'delete')}><Icon name="trash" size={14}/>Delete</button>
                        </div>
                      )}
                    </span>
                  </div>
                  {detailId === task.id && (
                    <section id={`task-inline-${task.id}`} className="task-inline-detail" aria-label={`Details for ${task.title}`}>
                      <div className="task-inline-copy">
                        <span>CURRENT CONTEXT</span>
                        <p>{task.currentStep || task.instruction || 'Aegis will use the saved task instructions when this run starts.'}</p>
                        {task.runs?.[0] && <small><Icon name="history" size={11}/>{task.runs[0].status}: {task.runs[0].detail}</small>}
                      </div>
                      <dl>
                        <div><dt>Trigger</dt><dd>{task.trigger}</dd></div>
                        <div><dt>Due</dt><dd>{task.due}</dd></div>
                        <div><dt>Progress</dt><dd>{task.progress || 0}%</dd></div>
                        <div><dt>Tags</dt><dd>{task.tags.length ? task.tags.join(', ') : 'None'}</dd></div>
                      </dl>
                      <div className="task-inline-actions">
                        {task.status === 'running' ? <button type="button" onClick={() => runControl(task, 'pause')}><Icon name="pause" size={12}/>Pause</button>
                          : <button type="button" onClick={() => runControl(task, task.status === 'paused' ? 'resume' : task.status === 'failed' ? 'retry' : 'run')}><Icon name={task.status === 'failed' ? 'retry' : 'play'} size={12}/>{task.status === 'paused' ? 'Resume' : 'Run now'}</button>}
                        <button type="button" onClick={() => openEdit(task)}><Icon name="edit" size={12}/>Edit</button>
                        <button type="button" onClick={() => toggleTaskDetail(task.id)}><Icon name="chevron" size={12}/>Collapse</button>
                      </div>
                    </section>
                  )}
                </article>
              )) : (
                <div className="task-empty-state">
                  <span><Icon name={search ? 'search' : SMART_VIEW_ICONS[smartView]} size={23}/></span>
                  <h3>{search ? 'No matching tasks' : `No tasks in ${smartView}`}</h3>
                  <p>{search ? 'Try another title, instruction, or tag.' : 'Created and delegated tasks will appear here.'}</p>
                  {!search && <button type="button" onClick={() => setView('create')}>Create a task</button>}
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'activity' && (
          <div className="task-activity-view">
            <section className="task-view-heading">
              <div><span>EXECUTION HISTORY</span><h3>Activity</h3><p>Real checkpoints and results from your tasks.</p></div>
              <button type="button" className="task-refresh-button" onClick={() => refreshDashboard()} aria-label="Refresh task activity"><Icon name="refresh" size={15}/>Refresh</button>
            </section>
            <label className="task-search-box task-activity-search"><Icon name="search" size={14}/><input value={activitySearch} onChange={(event) => setActivitySearch(event.target.value)} placeholder="Search activity…"/></label>
            <div className="task-activity-filters" aria-label="Activity categories">
              {['All', 'Approvals', 'Errors', 'Completed'].map((filter) => (
                <button type="button" key={filter} className={activityFilter === filter ? 'is-active' : ''} onClick={() => setActivityFilter(filter)}>{filter}</button>
              ))}
            </div>
            <div className="task-activity-feed">
              {visibleActivity.map((item) => (
                <article key={item.id} className={`task-feed-item ${activityDetailId === item.id ? 'is-expanded' : ''}`}>
                  <button type="button" className="task-feed-row" onClick={() => setActivityDetailId((current) => current === item.id ? null : item.id)} aria-expanded={activityDetailId === item.id} aria-controls={`activity-inline-${item.id}`}>
                    <span className={`task-feed-signal ${item.kind}`}><i/></span>
                    <span className="task-feed-icon"><Icon name={item.kind === 'error' ? 'failed' : item.kind === 'approval' ? 'shield' : item.kind === 'success' ? 'completed' : 'activity'} size={14}/></span>
                    <span><b>{item.title}</b><small>{item.detail}</small></span>
                    <time>{item.time}</time>
                    <Icon name="chevron" size={13}/>
                  </button>
                  {activityDetailId === item.id && (() => {
                    const linkedTask = tasks.find((task) => String(task.id) === String(item.taskId));
                    return (
                      <section id={`activity-inline-${item.id}`} className="task-activity-inline" aria-label={`Activity details for ${item.title}`}>
                        <div><span>EVENT DETAIL</span><p>{item.detail || 'No additional execution detail was provided.'}</p><small>Linked to {linkedTask?.title || 'this task'} · {item.time}</small></div>
                        <div className="task-activity-inline-actions">
                          {linkedTask && <button type="button" onClick={() => openTaskFromOverview(linkedTask.id)}><Icon name="history" size={12}/>Open task</button>}
                          <button type="button" onClick={() => copyActivityLog(item)}><Icon name="copy" size={12}/>Copy log</button>
                          {linkedTask && item.kind !== 'approval' && <button type="button" onClick={() => runControl(linkedTask, linkedTask.status === 'failed' ? 'retry' : 'run')}><Icon name="retry" size={12}/>Run again</button>}
                        </div>
                      </section>
                    );
                  })()}
                </article>
              ))}
            </div>
            {!visibleActivity.length && (
              <div className="task-empty-state task-activity-empty">
                <span><Icon name={activitySearch ? 'search' : 'activity'} size={23}/></span>
                <h3>{activitySearch ? 'No matching activity' : 'No activity yet'}</h3>
                <p>{activitySearch ? 'Try a different search or category.' : 'Only events connected to your tasks appear here.'}</p>
              </div>
            )}
          </div>
        )}

        {view === 'create' && (
          <div className="task-create-view">
            {createStep === 'select' ? (
              <>
                <section className="task-view-heading">
                  <div><span>NEW AUTOMATION</span><h3>Create a task</h3><p>Draft an outcome or choose exactly how Aegis should start.</p></div>
                </section>
                <div className="task-draft-bar">
                  <Icon name="spark" size={16}/>
                  <input
                    value={createPrompt}
                    onChange={(event) => setCreatePrompt(event.target.value)}
                    onKeyDown={(event) => { if (event.key === 'Enter') draftCreatePrompt(); }}
                    placeholder='Describe a task — e.g. "Every weekday summarize unread email"'
                    aria-label="Describe a task for Aegis to draft"
                  />
                  <button type="button" onClick={draftCreatePrompt} disabled={!createPrompt.trim()}><Icon name="wand" size={13}/>Shape draft</button>
                </div>
                <div className="task-trigger-grid">
                  {TRIGGERS.map((trigger) => (
                    <button type="button" key={trigger.id} onClick={() => beginTrigger(trigger.id)}>
                      <span className={`task-trigger-icon ${trigger.group.toLowerCase()}`}><Icon name={trigger.icon} size={16}/></span>
                      <span><b>{trigger.label}</b><small>{trigger.help}</small></span>
                      <Icon name="chevron" size={14}/>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <form className="task-embedded-form" onSubmit={(event) => { event.preventDefault(); saveComposer(false); }}>
                <header>
                  <button type="button" className="task-back-button" onClick={resetCreate}><Icon name="back" size={14}/>Back</button>
                  <div><span>{editingId ? 'EDIT TASK' : 'TASK SETUP'}</span><h3>{editingId ? 'Update automation' : TRIGGERS.find((item) => item.id === triggerId)?.label}</h3></div>
                  <span className={`task-trigger-icon ${TRIGGERS.find((item) => item.id === triggerId)?.group.toLowerCase()}`}><Icon name={TRIGGERS.find((item) => item.id === triggerId)?.icon} size={16}/></span>
                </header>
                <div className="task-form-scroll">
                  <div className="task-form-column">
                    <label><span>Task title <b>*</b></span><input autoFocus value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Prepare the Monday launch brief"/></label>
                    <label><span>Instructions for Aegis <b>*</b></span><textarea value={form.instruction} onChange={(event) => setForm({ ...form, instruction: event.target.value.slice(0, 1200) })} placeholder="Describe the outcome, sources Aegis can use, and what success looks like…" rows={4}/><small>{form.instruction.length}/1200</small></label>
                    <div className="task-form-row">
                      <label><span>Priority</span><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option>Low</option><option>Normal</option><option>High</option><option>Urgent</option></select></label>
                      <label><span>Due date</span><input type="datetime-local" value={form.due} onChange={(event) => setForm({ ...form, due: event.target.value })}/></label>
                    </div>
                    <div className="task-form-row">
                      <label><span>Tags</span><input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="launch, research"/></label>
                      <label><span>Timezone</span><select value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })}><option>Europe/Rome</option><option>UTC</option><option>America/New_York</option><option>Asia/Tokyo</option></select></label>
                    </div>
                  </div>
                  <aside className="task-trigger-settings">
                    <span>TRIGGER SETTINGS</span>
                    <p>{TRIGGERS.find((item) => item.id === triggerId)?.help}</p>
                    {triggerId.includes('schedule') && <label><span>Schedule</span><input value={form.schedule} onChange={(event) => setForm({ ...form, schedule: event.target.value })} placeholder="Weekdays at 09:00"/></label>}
                    {triggerId.includes('event') && (
                      <div className="task-form-row">
                        <label><span>After</span><input type="number" min="1" value={form.eventCount} onChange={(event) => setForm({ ...form, eventCount: event.target.value })}/></label>
                        <label><span>Event</span><select value={form.eventType} onChange={(event) => setForm({ ...form, eventType: event.target.value })}><option value="messages">messages</option><option value="sessions">sessions</option><option value="app_events">app events</option></select></label>
                      </div>
                    )}
                    {triggerId === 'webhook' && <label><span>Webhook name</span><input value={form.webhookName} onChange={(event) => setForm({ ...form, webhookName: event.target.value })} placeholder="crm-contact-updated"/><small>A signed endpoint is generated after creation.</small></label>}
                    <div className="task-safety-note"><Icon name="shield" size={15}/><span><b>Protected by approval</b><small>High-risk actions pause before making changes.</small></span></div>
                  </aside>
                </div>
                <footer>
                  <span>Required fields are marked *</span>
                  <div>{!editingId && <button type="button" onClick={() => saveComposer(true)}>Save draft</button>}<button type="submit" className="task-create-button"><Icon name={editingId ? 'check' : 'plus'} size={14}/>{editingId ? 'Save changes' : 'Create task'}</button></div>
                </footer>
              </form>
            )}
          </div>
        )}
      </main>

      <div className="task-resize-handle" role="separator" aria-label="Resize Tasks window" onPointerDown={onResizeStart}/>

      {webhookCredential && (
        <div className="task-modal-layer" role="presentation">
          <section className="task-webhook-secret-dialog" role="dialog" aria-modal="true" aria-labelledby="task-webhook-secret-title">
            <header><div><small>ONE-TIME CREDENTIAL</small><h2 id="task-webhook-secret-title">Secure webhook created</h2><p>Copy this secret now. Astra stores only its hash and cannot show it again.</p></div><button type="button" className="task-icon-button" onClick={() => setWebhookCredential(null)} aria-label="Close webhook credentials"><Icon name="close"/></button></header>
            <label><span>Endpoint</span><input readOnly value={webhookCredential.endpoint}/></label>
            <label><span>Webhook token</span><input readOnly value={webhookCredential.secret}/></label>
            <p>Send the token in <code>X-Astra-Webhook-Token</code>, plus the current Unix timestamp and a unique nonce.</p>
            <footer><button type="button" onClick={async () => { await navigator.clipboard.writeText(`${webhookCredential.endpoint}\n${webhookCredential.secret}`); notify('Webhook endpoint and secret copied'); }}>Copy credentials</button><button type="button" className="task-create-button" onClick={() => setWebhookCredential(null)}>I saved the secret</button></footer>
          </section>
        </div>
      )}

      <div className={`task-toast ${toast ? 'is-visible' : ''}`} role="status" aria-live="polite"><Icon name="check" size={13}/>{toast}</div>
    </section>
  );
}

export default TaskWidget;
