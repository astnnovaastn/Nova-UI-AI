import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';

import CalculatorWidget from './components/Calculator/CalculatorWidget.jsx';
import NotesWidget from './components/Notes/NotesWidget.jsx';
import WeatherWidget from './components/weather/weatherWidget.jsx';
import TicTacToeWidget from './components/TicTacToe/TicTacToeWidget.jsx';
import ImageWidget from './components/IMAGE/ImageWidget.jsx';
import SearchWidget from './components/Search/SearchWidget.jsx';
import NewsWidget from './components/News/NewsWidget.jsx';
import TaskWidget from './components/Task/TaskWidget.jsx';
import ThemeWidget from './components/Theme/themewidget.jsx';
import CalendarWidget from './components/Calendar/Calendar_widget.jsx';
import './components/Theme/theme.js';
import {
  connectAegisWidget,
  disconnectAegisWidget,
  interactWithAegisWidget,
  notifyAegisWidgetVisibility,
  refreshAegisWidgetSnapshot,
} from './aegisWidgetProtocol';

type WidgetName =
  | 'calculator'
  | 'notes'
  | 'weather'
  | 'tictactoe'
  | 'image'
  | 'search'
  | 'news'
  | 'task'
  | 'calendar'
  | 'theme';

type NovaConnectionStatus = 'disconnected' | 'connected' | 'working' | 'failed';

type CalendarWidgetCommand = {
  [key: string]: unknown;
  command: string;
  action?: string;
  view?: string;
  date?: string;
  query?: string;
  text?: string;
  title?: string;
  start?: string;
  end?: string;
  request_id?: string;
  source?: string;
  issuedAt: number;
};

type ImageWidgetCommand = {
  command: string;
  prompt?: string;
  image_number?: number;
  image_id?: string;
  query?: string;
  fit_mode?: string;
  request_id?: string;
  source?: string;
  issuedAt: number;
};

type SearchWidgetCommand = {
  command: string;
  query?: string;
  display_topic?: string;
  display_subtopic?: string;
  answer?: string;
  results?: Array<Record<string, unknown>>;
  search_type?: string;
  loading?: boolean;
  error?: string;
  history_preview?: Array<Record<string, unknown>>;
  view_mode?: string;
  original_transcript?: string;
  request_id_to_restore?: string;
  request_id?: string;
  source?: string;
  issuedAt: number;
};

type NotesWidgetCommand = {
  command: string;
  prompt?: string;
  query?: string;
  category?: string;
  request_id?: string;
  source?: string;
  issuedAt: number;
};

type WeatherWidgetCommand = {
  command: string;
  query?: string;
  location?: string;
  weather_data?: Record<string, unknown>;
  request_id?: string;
  source?: string;
  issuedAt: number;
};

type NewsWidgetCommand = {
  command: string;
  query?: string;
  display_topic?: string;
  display_subtopic?: string;
  articles?: Array<Record<string, unknown>>;
  loading?: boolean;
  error?: string;
  history_preview?: Array<Record<string, unknown>>;
  view_mode?: string;
  request_id_to_restore?: string;
  request_id?: string;
  source?: string;
  issuedAt: number;
};

type SearchWidgetState = {
  query: string;
  display_topic: string;
  display_subtopic: string;
  answer: string;
  results: Array<Record<string, unknown>>;
  search_type: string;
  loading: boolean;
  error: string;
  history_preview: Array<Record<string, unknown>>;
  view_mode: string;
  original_transcript?: string;
  request_id?: string;
  source?: string;
};

type NewsWidgetState = {
  query: string;
  display_topic: string;
  display_subtopic: string;
  articles: Array<Record<string, unknown>>;
  loading: boolean;
  error: string;
  history_preview: Array<Record<string, unknown>>;
  view_mode: string;
  request_id?: string;
  source?: string;
};

const defaultSearchState = (): SearchWidgetState => ({
  query: '',
  display_topic: '',
  display_subtopic: '',
  answer: '',
  results: [],
  search_type: 'web',
  loading: false,
  error: '',
  history_preview: [],
  view_mode: 'current',
  original_transcript: undefined,
  request_id: undefined,
  source: undefined,
});

const buildSearchStateFromPayload = (payload: Record<string, unknown>): SearchWidgetState => ({
  query: typeof payload.query === 'string' ? payload.query : '',
  display_topic: typeof payload.display_topic === 'string' ? payload.display_topic : '',
  display_subtopic: typeof payload.display_subtopic === 'string' ? payload.display_subtopic : '',
  answer: typeof payload.answer === 'string' ? payload.answer : '',
  results: Array.isArray(payload.results) ? payload.results as Array<Record<string, unknown>> : [],
  search_type: typeof payload.search_type === 'string' ? payload.search_type : 'web',
  loading: typeof payload.loading === 'boolean' ? payload.loading : false,
  error: typeof payload.error === 'string' ? payload.error : '',
  history_preview: Array.isArray(payload.history_preview) ? payload.history_preview as Array<Record<string, unknown>> : [],
  view_mode: typeof payload.view_mode === 'string' ? payload.view_mode : 'current',
  original_transcript: typeof payload.original_transcript === 'string' ? payload.original_transcript : undefined,
  request_id: typeof payload.request_id === 'string' ? payload.request_id : undefined,
  source: typeof payload.source === 'string' ? payload.source : undefined,
});

const defaultNewsState = (): NewsWidgetState => ({
  query: '',
  display_topic: '',
  display_subtopic: '',
  articles: [],
  loading: false,
  error: '',
  history_preview: [],
  view_mode: 'current',
  request_id: undefined,
  source: undefined,
});

const buildNewsStateFromPayload = (payload: Record<string, unknown>): NewsWidgetState => ({
  query: typeof payload.query === 'string' ? payload.query : '',
  display_topic: typeof payload.display_topic === 'string' ? payload.display_topic : '',
  display_subtopic: typeof payload.display_subtopic === 'string' ? payload.display_subtopic : '',
  articles: Array.isArray(payload.articles) ? payload.articles as Array<Record<string, unknown>> : [],
  loading: typeof payload.loading === 'boolean' ? payload.loading : false,
  error: typeof payload.error === 'string' ? payload.error : '',
  history_preview: Array.isArray(payload.history_preview) ? payload.history_preview as Array<Record<string, unknown>> : [],
  view_mode: typeof payload.view_mode === 'string' ? payload.view_mode : 'current',
  request_id: typeof payload.request_id === 'string' ? payload.request_id : undefined,
  source: typeof payload.source === 'string' ? payload.source : undefined,
});

const Icon = ({ name }: { name: WidgetName }) => {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  const icons: Record<WidgetName, JSX.Element> = {
    notes: (
      <svg {...common}>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6" />
        <path d="M9 17h4" />
      </svg>
    ),
    weather: (
      <svg {...common} viewBox="0 0 24 24">
        {/* Sun Behind Cloud detailed weather icon */}
        <circle cx="12" cy="10" r="3" fill="currentColor" opacity="0.3" />
        <path d="M12 5V3m0 14v-2M5 10H3m14 0h-2m-1.07-4.93l-1.41-1.41M8.07 14.93l-1.41-1.41m0-9.9l1.41 1.41m5.66 5.66l1.41 1.41" />
        <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M8 16l1 3m3-3l1 3m3-3l1 3" opacity="0.7" />
      </svg>
    ),
    image: (
      <svg {...common}>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="9" cy="9" r="2" />
        <path d="M21 15l-3.5-3.5a2 2 0 0 0-2.8 0L6 20" />
      </svg>
    ),
    search: (
      <svg {...common}>
        <circle cx="10.5" cy="10.5" r="5.4" />
        <path d="m14.5 14.5 5 5" />
        <path d="M3.2 8.2A8 8 0 0 1 15.8 4" />
        <path d="M6.3 17.4A8 8 0 0 0 17.8 8" />
        <circle cx="3.2" cy="8.2" r="1" fill="currentColor" stroke="none" />
        <circle cx="15.8" cy="4" r="1" fill="currentColor" stroke="none" />
        <path d="M10.5 7.8v5.4M7.8 10.5h5.4" opacity=".75" />
      </svg>
    ),
    calculator: (
      <svg {...common}>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 7h8" />
        <path d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />
      </svg>
    ),
    news: (
      <svg {...common}>
        <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
        <path d="M7 9h6M7 13h10M7 17h8" />
      </svg>
    ),
    tictactoe: (
      <svg {...common}>
        <path d="M8 3v18M16 3v18M3 8h18M3 16h18" />
        <path d="M6.5 6.5l3 3m0-3l-3 3" />
        <circle cx="16.5" cy="16.5" r="2.5" />
      </svg>
    ),
    task: (
      <svg {...common}>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    calendar: (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M8 3v4M16 3v4M3 10h18" />
        <rect x="8" y="13" width="3" height="3" rx=".6" fill="currentColor" opacity=".55" />
      </svg>
    ),
    theme: (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1A1.7 1.7 0 0 0 10 3.2V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1Z" />
      </svg>
    ),
  };

  return icons[name];
};

type LauncherItem = {
  widget: WidgetName;
  label: string;
  description: string;
  dock?: 'rail' | 'bottom';
};

const launcherItems: LauncherItem[] = [
  { widget: 'notes', label: 'Notes', description: 'Memory and note capture' },
  { widget: 'search', label: 'Search', description: 'AI live web search' },
  { widget: 'news', label: 'News', description: 'Headlines and updates' },
  { widget: 'image', label: 'Image', description: 'Generate and browse images' },
  { widget: 'weather', label: 'Weather', description: 'Forecast and conditions' },
  { widget: 'task', label: 'Tasks', description: 'To-do and planning' },
  { widget: 'calendar', label: 'Calendar', description: 'Schedule, focus and sync' },
  { widget: 'theme', label: 'Theme', description: 'Live appearance controls', dock: 'bottom' },
];

const hasNewsSession = (state: NewsWidgetState) => (
  Boolean(
    state.loading
    || state.error
    || state.query
    || state.display_topic
    || state.display_subtopic
    || state.request_id
    || state.articles.length,
  )
);

const NOVA_HEADER_SELECTOR = '.notepad-header,.search-header,.news-header,.image-header,.weather-header,.task-window-header,.cal-titlebar,.studio-header,header';

const NovaConnectionPortal = ({ widget, connectionId }: { widget: WidgetName; connectionId?: string }) => {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const locate = () => {
      const root = document.querySelector<HTMLElement>(`[data-nova-widget="${widget}"]`);
      setTarget(root?.querySelector<HTMLElement>(NOVA_HEADER_SELECTOR) || null);
    };
    locate();
    const observer = new MutationObserver(locate);
    observer.observe(document.body, { subtree: true, childList: true });
    return () => observer.disconnect();
  }, [widget]);

  if (!target) return null;
  return createPortal(
    <button
      type="button"
      className="nova-connection-chip"
      aria-label={`${pending ? 'Disconnecting Nova from' : 'Disconnect Nova from'} ${widget}`}
      title={`Nova is observing ${widget}. Disconnect`}
      disabled={pending}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        setPending(true);
        window.dispatchEvent(new CustomEvent('novaWidgetConnectionRequest', { detail: {
          protocol_version: 2, action: 'disconnect', widget, connection_id: connectionId,
        }}));
      }}
    >
      <span aria-hidden="true"/><b>{pending ? 'Disconnecting' : 'Nova linked'}</b><em>{pending ? 'Waiting' : 'Disconnect'}</em>
    </button>,
    target,
  );
};

const WidgetContainer = () => {
  const [activeWidgets, setActiveWidgets] = useState<Record<WidgetName, boolean>>({
    calculator: false,
    notes: false,
    weather: false,
    tictactoe: false,
    image: false,
    search: false,
    news: false,
    task: false,
    calendar: false,
    theme: false,
  });
  const [imageCommand, setImageCommand] = useState<ImageWidgetCommand | null>(null);
  const [imageAiConnected, setImageAiConnected] = useState(false);
  const [searchCommand, setSearchCommand] = useState<SearchWidgetCommand | null>(null);
  const [searchState, setSearchState] = useState<SearchWidgetState>(defaultSearchState);
  const [searchAiConnected, setSearchAiConnected] = useState(false);
  const [notesCommand, setNotesCommand] = useState<NotesWidgetCommand | null>(null);
  const [notesAiConnected, setNotesAiConnected] = useState(false);
  const [weatherCommand, setWeatherCommand] = useState<WeatherWidgetCommand | null>(null);
  const [weatherAiConnected, setWeatherAiConnected] = useState(false);
  const [weatherVisibility, setWeatherVisibility] = useState<'closed' | 'open' | 'minimized'>('closed');
  const [newsCommand, setNewsCommand] = useState<NewsWidgetCommand | null>(null);
  const [newsState, setNewsState] = useState<NewsWidgetState>(defaultNewsState);
  const [newsAiConnected, setNewsAiConnected] = useState(false);
  const [newsVisibility, setNewsVisibility] = useState<'closed' | 'open' | 'minimized'>('closed');
  const [themeVisibility, setThemeVisibility] = useState<'closed' | 'open' | 'minimized'>('closed');
  const [calendarVisibility, setCalendarVisibility] = useState<'closed' | 'open' | 'minimized'>('closed');
  const [taskVisibility, setTaskVisibility] = useState<'closed' | 'open' | 'minimized'>('closed');
  const [calendarCommand, setCalendarCommand] = useState<CalendarWidgetCommand | null>(null);
  const [novaConnections, setNovaConnections] = useState<Record<WidgetName, NovaConnectionStatus>>({
    calculator: 'disconnected',
    notes: 'disconnected',
    weather: 'disconnected',
    tictactoe: 'disconnected',
    image: 'disconnected',
    search: 'disconnected',
    news: 'disconnected',
    task: 'disconnected',
    calendar: 'disconnected',
    theme: 'disconnected',
  });
  const connectionIds = useRef<Record<string, string>>({});

  const reportActionResult = (
    widget: string,
    command: string,
    payload: Record<string, unknown>,
    status: string,
    detail: string,
  ) => {
    window.dispatchEvent(new CustomEvent('novaWidgetActionResult', {
      detail: {
        protocol_version: 2,
        widget,
        command,
        request_id: payload.request_id,
        status,
        detail,
        data: payload.result_data,
        state_revision: payload.state_revision,
      },
    }));
  };

  const normalizeWidget = (widgetName: string): WidgetName | null => {
    const normalized = widgetName.trim().toLowerCase();
    const map: Record<string, WidgetName> = {
      calculator: 'calculator',
      calc: 'calculator',
      notes: 'notes',
      note: 'notes',
      weather: 'weather',
      forecast: 'weather',
      clock: 'weather',
      timer: 'weather',
      search: 'search',
      lookup: 'search',
      browser: 'search',
      web: 'search',
      news: 'news',
      headlines: 'news',
      tictactoe: 'tictactoe',
      'tic tac toe': 'tictactoe',
      game: 'tictactoe',
      task: 'task',
      tasks: 'task',
      todo: 'task',
      todos: 'task',
      theme: 'theme',
      themes: 'theme',
      appearance: 'theme',
      style: 'theme',
      calendar: 'calendar',
      schedule: 'calendar',
      agenda: 'calendar',
      events: 'calendar',
      image: 'image',
      gallery: 'image',
      photo: 'image',
      pictures: 'image',
      img: 'image',
    };

    return map[normalized] ?? null;
  };

  const emitOrbWidgetState = (widget: WidgetName, isOpen: boolean, next: Record<WidgetName, boolean>) => {
    window.dispatchEvent(new CustomEvent('orbWidgetStateChange', {
      detail: { widget, isOpen, hasAnyWidgetOpen: Object.values(next).some((value) => value) },
    }));
  };

  const closeWidget = (widgetName: WidgetName) => {
    if (widgetName === 'news') {
      setActiveWidgets((prev) => {
        const next = { ...prev, news: false };
        emitOrbWidgetState('news', false, next);
        return next;
      });
      setNewsVisibility('closed');
      notifyAegisWidgetVisibility('news', 'closed');
      setNewsCommand(null);
      setNewsState((prev) => ({
        ...defaultNewsState(),
        history_preview: prev.history_preview,
        view_mode: 'current',
      }));
      return;
    }

    if (widgetName === 'weather') {
      setActiveWidgets((prev) => {
        const next = { ...prev, weather: false };
        emitOrbWidgetState('weather', false, next);
        return next;
      });
      setWeatherVisibility('closed');
      notifyAegisWidgetVisibility('weather', 'closed');
      return;
    }

    if (widgetName === 'theme') {
      setActiveWidgets((prev) => {
        const next = { ...prev, theme: false };
        emitOrbWidgetState('theme', false, next);
        return next;
      });
      setThemeVisibility('closed');
      notifyAegisWidgetVisibility('theme', 'closed');
      return;
    }

    if (widgetName === 'calendar') {
      setActiveWidgets((prev) => {
        const next = { ...prev, calendar: false };
        emitOrbWidgetState('calendar', false, next);
        return next;
      });
      setCalendarVisibility('closed');
      notifyAegisWidgetVisibility('calendar', 'closed');
      setCalendarCommand(null);
      return;
    }

    if (widgetName === 'task') {
      setActiveWidgets((prev) => {
        const next = { ...prev, task: false };
        emitOrbWidgetState('task', false, next);
        return next;
      });
      setTaskVisibility('closed');
      notifyAegisWidgetVisibility('task', 'closed');
      return;
    }

    setActiveWidgets((prev) => {
      const next = { ...prev, [widgetName]: false };
      emitOrbWidgetState(widgetName, false, next);
      return next;
    });
    notifyAegisWidgetVisibility(widgetName, 'closed');
  };

  const openWidget = (widgetName: WidgetName) => {
    if (widgetName === 'weather') {
      setWeatherVisibility('open');
    }
    if (widgetName === 'news') {
      setNewsVisibility('open');
    }
    if (widgetName === 'theme') {
      setThemeVisibility('open');
    }
    if (widgetName === 'calendar') {
      setCalendarVisibility('open');
    }
    if (widgetName === 'task') {
      setTaskVisibility('open');
    }
    setActiveWidgets((prev) => {
      const next = { ...prev, [widgetName]: true };
      emitOrbWidgetState(widgetName, true, next);
      return next;
    });
    notifyAegisWidgetVisibility(widgetName, 'open');
  };

  const minimizeNewsWidget = () => {
    setActiveWidgets((prev) => {
      const next = { ...prev, news: false };
      emitOrbWidgetState('news', false, next);
      return next;
    });
    setNewsVisibility('minimized');
    notifyAegisWidgetVisibility('news', 'minimized');
  };

  const minimizeWeatherWidget = () => {
    setActiveWidgets((prev) => {
      const next = { ...prev, weather: false };
      emitOrbWidgetState('weather', false, next);
      return next;
    });
    setWeatherVisibility('minimized');
    notifyAegisWidgetVisibility('weather', 'minimized');
  };

  const minimizeThemeWidget = () => {
    setActiveWidgets((prev) => {
      const next = { ...prev, theme: false };
      emitOrbWidgetState('theme', false, next);
      return next;
    });
    setThemeVisibility('minimized');
    notifyAegisWidgetVisibility('theme', 'minimized');
  };

  const minimizeCalendarWidget = () => {
    setActiveWidgets((prev) => {
      const next = { ...prev, calendar: false };
      emitOrbWidgetState('calendar', false, next);
      return next;
    });
    setCalendarVisibility('minimized');
    notifyAegisWidgetVisibility('calendar', 'minimized');
  };

  const minimizeTaskWidget = () => {
    setActiveWidgets((prev) => {
      const next = { ...prev, task: false };
      emitOrbWidgetState('task', false, next);
      return next;
    });
    setTaskVisibility('minimized');
    notifyAegisWidgetVisibility('task', 'minimized');
  };

  const panelOpen = false;
  const togglePanel = () => {};

  const commandWidget = (widgetName: string, action: string, payload: Record<string, unknown> = {}) => {
    const normalized = normalizeWidget(widgetName);
    if (!normalized) {
      reportActionResult(widgetName, action, payload, 'failed', 'Requested widget is not available.');
      return;
    }

    if (action === 'connect' || action === 'disconnect' || action === 'connection') {
      const rawStatus = action === 'disconnect' ? 'disconnected'
        : action === 'connect' ? 'connected' : String(payload.status || 'connected').toLowerCase();
      const nextStatus: NovaConnectionStatus = rawStatus === 'failed'
        ? 'failed'
        : rawStatus === 'working'
          ? 'working'
          : rawStatus === 'disconnected'
            ? 'disconnected'
            : 'connected';
      setNovaConnections((prev) => ({ ...prev, [normalized]: nextStatus }));
      const isLinked = nextStatus === 'connected' || nextStatus === 'working';
      if (normalized === 'image') setImageAiConnected(isLinked);
      if (normalized === 'search') setSearchAiConnected(isLinked);
      if (normalized === 'notes') setNotesAiConnected(isLinked);
      if (normalized === 'weather') setWeatherAiConnected(isLinked);
      if (normalized === 'news') setNewsAiConnected(isLinked);
      if (nextStatus === 'disconnected') {
        disconnectAegisWidget(normalized);
        delete connectionIds.current[normalized];
      } else if (nextStatus === 'failed') {
        disconnectAegisWidget(normalized, false);
        delete connectionIds.current[normalized];
        const root = document.querySelector<HTMLElement>(`[data-nova-widget="${normalized}"]`);
        if (root) root.dataset.novaConnection = 'failed';
      } else if (isLinked) {
        const connectionId = connectAegisWidget(normalized, typeof payload.connection_id === 'string' ? payload.connection_id : undefined);
        connectionIds.current[normalized] = connectionId;
      }
      reportActionResult(normalized, action, { ...payload, result_data: { connection_id: connectionIds.current[normalized] } }, nextStatus === 'failed' ? 'failed' : 'completed', String(payload.detail || nextStatus));
      return;
    }

    if (action === 'interact') {
      openWidget(normalized);
      window.setTimeout(() => {
        try {
          const result = interactWithAegisWidget(normalized, payload);
          reportActionResult(normalized, action, { ...payload, result_data: result }, 'completed', `Interacted with ${result.label}.`);
        } catch (error) {
          reportActionResult(normalized, action, payload, 'failed', error instanceof Error ? error.message : 'Widget interaction failed.');
        }
      }, 80);
      return;
    }

    if (action === 'snapshot') {
      refreshAegisWidgetSnapshot(normalized);
      reportActionResult(normalized, action, payload, 'completed', 'Semantic snapshot emitted.');
      return;
    }

    const complete = (detail: string) => {
      reportActionResult(normalized, action, payload, 'completed', detail);
    };

    const calendarControlActions = ['open', 'show', 'today', 'search', 'new_event', 'update_event', 'delete_event', 'sync'];
    if (normalized === 'calendar' && calendarControlActions.includes(action)) {
      setCalendarCommand({
        ...payload,
        command: action,
        action,
        view: typeof payload.view === 'string' ? payload.view : undefined,
        date: typeof payload.date === 'string' ? payload.date : undefined,
        query: typeof payload.query === 'string' ? payload.query : undefined,
        text: typeof payload.text === 'string' ? payload.text : undefined,
        title: typeof payload.title === 'string' ? payload.title : undefined,
        start: typeof payload.start === 'string' ? payload.start : undefined,
        end: typeof payload.end === 'string' ? payload.end : undefined,
        request_id: typeof payload.request_id === 'string' ? payload.request_id : undefined,
        source: typeof payload.source === 'string' ? payload.source : undefined,
        issuedAt: Date.now(),
      });
      reportActionResult(normalized, action, payload, 'accepted', `Opening Calendar for ${action}.`);
      openWidget('calendar');
      return;
    }

    const imageControlActions = [
      'open', 'show_gallery', 'open_gallery_image', 'scroll_gallery_to_number',
      'scroll_gallery_top', 'scroll_gallery_bottom', 'scroll_gallery_up', 'scroll_gallery_down',
      'back_to_gallery', 'back_to_create', 'focus_prompt', 'clear_prompt', 'set_prompt',
      'append_prompt', 'generate', 'regenerate_last', 'search_gallery', 'select_latest',
      'set_fit_mode',
    ];
    if (normalized === 'image' && imageControlActions.includes(action)) {
      setImageCommand({
        command: action,
        prompt: typeof payload.prompt === 'string' ? payload.prompt : undefined,
        image_number: typeof payload.image_number === 'number' ? payload.image_number : undefined,
        image_id: typeof payload.image_id === 'string' ? payload.image_id : undefined,
        query: typeof payload.query === 'string' ? payload.query : undefined,
        fit_mode: typeof payload.fit_mode === 'string' ? payload.fit_mode : undefined,
        request_id: typeof payload.request_id === 'string' ? payload.request_id : undefined,
        source: typeof payload.source === 'string' ? payload.source : undefined,
        issuedAt: Date.now(),
      });
      openWidget('image');
      return;
    }

    const searchControlActions = [
      'open', 'show_results', 'set_query', 'set_loading',
      'show_history', 'show_current', 'restore_latest', 'restore_search_result', 'hide_search_result', 'clear_current', 'delete_search_result',
    ];
    if (normalized === 'search' && searchControlActions.includes(action)) {
      const nextCommand = {
        command: action,
        query: typeof payload.query === 'string' ? payload.query : undefined,
        display_topic: typeof payload.display_topic === 'string' ? payload.display_topic : undefined,
        display_subtopic: typeof payload.display_subtopic === 'string' ? payload.display_subtopic : undefined,
        answer: typeof payload.answer === 'string' ? payload.answer : undefined,
        results: Array.isArray(payload.results) ? payload.results as Array<Record<string, unknown>> : undefined,
        search_type: typeof payload.search_type === 'string' ? payload.search_type : undefined,
        loading: typeof payload.loading === 'boolean' ? payload.loading : undefined,
        error: typeof payload.error === 'string' ? payload.error : undefined,
        history_preview: Array.isArray(payload.history_preview) ? payload.history_preview as Array<Record<string, unknown>> : undefined,
        view_mode: typeof payload.view_mode === 'string' ? payload.view_mode : undefined,
        original_transcript: typeof payload.original_transcript === 'string' ? payload.original_transcript : undefined,
        request_id_to_restore: typeof payload.request_id_to_restore === 'string' ? payload.request_id_to_restore : undefined,
        request_id: typeof payload.request_id === 'string' ? payload.request_id : undefined,
        source: typeof payload.source === 'string' ? payload.source : undefined,
        issuedAt: Date.now(),
      } satisfies SearchWidgetCommand;
      setSearchCommand(nextCommand);
      setSearchState((prev) => {
        if (action === 'clear_current') {
          return {
            ...defaultSearchState(),
            history_preview: prev.history_preview,
            view_mode: 'current',
          };
        }
        const merged = buildSearchStateFromPayload({
          ...prev,
          ...payload,
          query: typeof payload.query === 'string' ? payload.query : prev.query,
          display_topic: typeof payload.display_topic === 'string' ? payload.display_topic : prev.display_topic,
          display_subtopic: typeof payload.display_subtopic === 'string' ? payload.display_subtopic : prev.display_subtopic,
          answer: typeof payload.answer === 'string' ? payload.answer : prev.answer,
          results: Array.isArray(payload.results) ? payload.results : prev.results,
          search_type: typeof payload.search_type === 'string' ? payload.search_type : prev.search_type,
          loading: typeof payload.loading === 'boolean' ? payload.loading : prev.loading,
          error: typeof payload.error === 'string' ? payload.error : prev.error,
          history_preview: Array.isArray(payload.history_preview) ? payload.history_preview : prev.history_preview,
          view_mode: typeof payload.view_mode === 'string' ? payload.view_mode : (
            action === 'show_history' ? 'history' : prev.view_mode
          ),
          original_transcript: typeof payload.original_transcript === 'string' ? payload.original_transcript : prev.original_transcript,
          request_id: typeof payload.request_id === 'string' ? payload.request_id : prev.request_id,
          source: typeof payload.source === 'string' ? payload.source : prev.source,
        });
        if (action === 'set_loading') {
          return {
            ...merged,
            answer: '',
            results: [],
            view_mode: 'current',
          };
        }
        if (action === 'show_current' || action === 'restore_latest' || action === 'restore_search_result') {
          return {
            ...merged,
            view_mode: 'current',
          };
        }
        return merged;
      });
      openWidget('search');
      return;
    }

    const notesControlActions = [
      'open', 'show_view', 'show_add', 'set_draft', 'append_draft',
      'clear_draft', 'save_note', 'open_note', 'delete_note', 'improve_note',
      'copy_note', 'copy_draft', 'paste_into_draft', 'show_ai_summaries',
      'open_ai_chat', 'apply_ai_update', 'export_txt', 'export_json',
      'clear_all_notes', 'import_notes',
    ];
    if (normalized === 'notes' && notesControlActions.includes(action)) {
      setNotesCommand({
        command: action,
        prompt: typeof payload.prompt === 'string' ? payload.prompt : undefined,
        query: typeof payload.query === 'string' ? payload.query : undefined,
        category: typeof payload.category === 'string' ? payload.category : undefined,
        request_id: typeof payload.request_id === 'string' ? payload.request_id : undefined,
        source: typeof payload.source === 'string' ? payload.source : undefined,
        issuedAt: Date.now(),
      });
      openWidget('notes');
      return;
    }

    const weatherControlActions = ['open', 'show_weather', 'refresh_weather', 'update_weather'];
    if (normalized === 'weather' && weatherControlActions.includes(action)) {
      setWeatherCommand({
        command: action,
        query: typeof payload.query === 'string' ? payload.query : undefined,
        location: typeof payload.location === 'string' ? payload.location : undefined,
        weather_data: typeof payload.weather_data === 'object' && payload.weather_data !== null
          ? payload.weather_data as Record<string, unknown>
          : undefined,
        request_id: typeof payload.request_id === 'string' ? payload.request_id : undefined,
        source: typeof payload.source === 'string' ? payload.source : undefined,
        issuedAt: Date.now(),
      });
      openWidget('weather');
      return;
    }

    const newsControlActions = [
      'open', 'show_news', 'set_loading', 'show_history',
      'show_current', 'restore_latest', 'restore_news_result',
      'delete_news_result', 'refresh_news',
    ];
    if (normalized === 'news' && newsControlActions.includes(action)) {
      setNewsCommand({
        command: action,
        query: typeof payload.query === 'string' ? payload.query : undefined,
        display_topic: typeof payload.display_topic === 'string' ? payload.display_topic : undefined,
        display_subtopic: typeof payload.display_subtopic === 'string' ? payload.display_subtopic : undefined,
        articles: Array.isArray(payload.articles) ? payload.articles as Array<Record<string, unknown>> : undefined,
        loading: typeof payload.loading === 'boolean' ? payload.loading : undefined,
        error: typeof payload.error === 'string' ? payload.error : undefined,
        history_preview: Array.isArray(payload.history_preview) ? payload.history_preview as Array<Record<string, unknown>> : undefined,
        view_mode: typeof payload.view_mode === 'string' ? payload.view_mode : undefined,
        request_id_to_restore: typeof payload.request_id_to_restore === 'string' ? payload.request_id_to_restore : undefined,
        request_id: typeof payload.request_id === 'string' ? payload.request_id : undefined,
        source: typeof payload.source === 'string' ? payload.source : undefined,
        issuedAt: Date.now(),
      });
      setNewsState((prev) => {
        const merged = buildNewsStateFromPayload({
          ...prev,
          ...payload,
          query: typeof payload.query === 'string' ? payload.query : prev.query,
          display_topic: typeof payload.display_topic === 'string' ? payload.display_topic : prev.display_topic,
          display_subtopic: typeof payload.display_subtopic === 'string' ? payload.display_subtopic : prev.display_subtopic,
          articles: Array.isArray(payload.articles) ? payload.articles : prev.articles,
          loading: typeof payload.loading === 'boolean' ? payload.loading : prev.loading,
          error: typeof payload.error === 'string' ? payload.error : prev.error,
          history_preview: Array.isArray(payload.history_preview) ? payload.history_preview : prev.history_preview,
          view_mode: typeof payload.view_mode === 'string' ? payload.view_mode : (
            action === 'show_history' ? 'history' : prev.view_mode
          ),
          request_id: typeof payload.request_id === 'string' ? payload.request_id : prev.request_id,
          source: typeof payload.source === 'string' ? payload.source : prev.source,
        });
        if (action === 'show_current' || action === 'restore_latest' || action === 'restore_news_result') {
          return { ...merged, view_mode: 'current' };
        }
        return merged;
      });
      openWidget('news');
      return;
    }

    if (action === 'open' || action === 'show' || action === 'activate') {
      reportActionResult(normalized, action, payload, 'accepted', `Opening ${normalized} widget.`);
      openWidget(normalized);
      complete(`${normalized} widget opened.`);
    } else if (action === 'close' || action === 'hide' || action === 'dismiss') {
      reportActionResult(normalized, action, payload, 'accepted', `Closing ${normalized} widget.`);
      closeWidget(normalized);
      complete(`${normalized} widget closed.`);
    } else if (action === 'toggle') {
      reportActionResult(normalized, action, payload, 'accepted', `Toggling ${normalized} widget.`);
      if (normalized === 'news') {
        if (newsVisibility === 'open') {
          closeWidget('news');
          reportActionResult(normalized, action, payload, 'completed', 'news widget closed.');
        } else {
          openWidget('news');
          reportActionResult(normalized, action, payload, 'completed', 'news widget opened.');
        }
        return;
      }

      setActiveWidgets((prev) => {
        const next = { ...prev, [normalized]: !prev[normalized] };
        emitOrbWidgetState(normalized, next[normalized], next);
        reportActionResult(
          normalized,
          action,
          payload,
          'completed',
          `${normalized} widget ${next[normalized] ? 'opened' : 'closed'}.`,
        );
        return next;
      });
    } else {
      reportActionResult(normalized, action, payload, 'accepted', `Opening ${normalized} widget.`);
      openWidget(normalized);
      complete(`${normalized} widget opened.`);
    }
  };

  const commandWidgetRef = useRef(commandWidget);
  commandWidgetRef.current = commandWidget;

  useEffect(() => {
    (window as any).novaWidgetControl = (action: string, widget: string, payload: Record<string, unknown> = {}) => {
      commandWidgetRef.current(widget, action, payload);
    };
    return () => {
      delete (window as any).novaWidgetControl;
    };
  }, []);

  useEffect(() => {
    const markPending = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      const widget = normalizeWidget(String(detail.widget || ''));
      if (widget && detail.action === 'disconnect') {
        setNovaConnections((previous) => ({ ...previous, [widget]: 'working' }));
      }
    };
    window.addEventListener('novaWidgetConnectionRequest', markPending);
    return () => window.removeEventListener('novaWidgetConnectionRequest', markPending);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadSearchState = async () => {
      try {
        const response = await fetch('/api/search/state');
        if (!response.ok) return;
        const payload = await response.json();
        if (cancelled || !payload?.current) return;
        const nextState = buildSearchStateFromPayload(payload.current as Record<string, unknown>);
        if (Array.isArray(payload.history)) {
          nextState.history_preview = payload.history as Array<Record<string, unknown>>;
        }
        setSearchState(nextState);
      } catch {
        // Ignore initial fetch failures; live widget commands still hydrate the state.
      }
    };
    loadSearchState();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleWidget = (widgetName: WidgetName) => {
    if (widgetName === 'news') {
      if (newsVisibility === 'open') {
        closeWidget('news');
      } else {
        openWidget('news');
      }
      return;
    }

    if (widgetName === 'weather') {
      if (weatherVisibility === 'open') {
        closeWidget('weather');
      } else {
        openWidget('weather');
      }
      return;
    }

    if (widgetName === 'theme') {
      if (themeVisibility === 'open') {
        closeWidget('theme');
      } else {
        openWidget('theme');
      }
      return;
    }

    if (widgetName === 'calendar') {
      if (calendarVisibility === 'open') closeWidget('calendar');
      else openWidget('calendar');
      return;
    }

    if (widgetName === 'task') {
      if (taskVisibility === 'open') closeWidget('task');
      else openWidget('task');
      return;
    }

    setActiveWidgets((prev) => {
      const next = { ...prev, [widgetName]: !prev[widgetName] };
      emitOrbWidgetState(widgetName, next[widgetName], next);
      return next;
    });
  };

  return (
    <div id="widget-overlay">
      {(Object.keys(novaConnections) as WidgetName[]).map((widget) => (
        novaConnections[widget] === 'connected' || novaConnections[widget] === 'working'
          ? <NovaConnectionPortal key={widget} widget={widget} connectionId={connectionIds.current[widget]} />
          : null
      ))}
      <div id="widget-launcher-rail" aria-label="Widget launcher">
        {launcherItems.filter((item) => item.dock !== 'bottom').map((item) => {
          const isActive = item.widget === 'news'
            ? newsVisibility === 'open'
            : item.widget === 'weather'
              ? weatherVisibility === 'open'
              : item.widget === 'task'
                ? taskVisibility === 'open'
                : activeWidgets[item.widget];
          const showIndicator = item.widget === 'news'
            ? newsVisibility === 'minimized' && hasNewsSession(newsState)
            : item.widget === 'weather'
              ? weatherVisibility === 'minimized'
              : item.widget === 'task'
                ? taskVisibility === 'minimized'
                : false;
          return (
            <button
              key={item.widget}
              type="button"
              className={`widget-launcher-item${isActive ? ' is-active' : ''}${showIndicator ? ' has-indicator' : ''} nova-${novaConnections[item.widget]}`}
              data-nova-connection={novaConnections[item.widget]}
              onClick={() => toggleWidget(item.widget)}
              title={`${item.label} - ${item.description}`}
              aria-label={item.label}
            >
              <span className="widget-launcher-icon" aria-hidden="true">
                <Icon name={item.widget} />
              </span>
              <span className="widget-launcher-tooltip">
                <span className="widget-launcher-label">{item.label}</span>
                <span className="widget-launcher-copy">{item.description}</span>
              </span>
              {showIndicator ? <span className="widget-launcher-indicator" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
      <div id="widget-launcher-bottom" aria-label="Theme launcher">
        {launcherItems.filter((item) => item.dock === 'bottom').map((item) => {
          const isActive = themeVisibility === 'open';
          const showIndicator = themeVisibility === 'minimized';
          return (
            <button
              key={item.widget}
              type="button"
              className={`widget-launcher-item widget-launcher-item-bottom${isActive ? ' is-active' : ''}${showIndicator ? ' has-indicator' : ''} nova-${novaConnections[item.widget]}`}
              data-nova-connection={novaConnections[item.widget]}
              onClick={() => toggleWidget(item.widget)}
              title={`${item.label} - ${item.description}`}
              aria-label={item.label}
            >
              <span className="widget-launcher-icon" aria-hidden="true">
                <Icon name={item.widget} />
              </span>
              <span className="widget-launcher-tooltip">
                <span className="widget-launcher-label">{item.label}</span>
                <span className="widget-launcher-copy">{item.description}</span>
              </span>
              {showIndicator ? <span className="widget-launcher-indicator" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>

      {panelOpen && (
        <div
          id="widget-panel"
          style={{
            position: 'fixed',
            left: '48px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '248px',
            maxHeight: '80vh',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            pointerEvents: 'auto',
            zIndex: 1199,
            background: 'rgba(6, 10, 18, 0.94)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '0 12px 12px 0',
            boxShadow: '0 18px 48px rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(18px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <div style={{ color: 'rgba(255, 255, 255, 0.88)', fontSize: '13px', fontWeight: 600 }}>
              Widget Launcher
            </div>
            <button
              onClick={togglePanel}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'grid',
                placeItems: 'center',
              }}
              aria-label="Close widget launcher"
            >
              ×
            </button>
          </div>
          <div style={{ display: 'grid', gap: '10px' }}>
            {launcherItems.map((item) => {
              const isActive = item.widget === 'news'
                ? newsVisibility === 'open'
                : item.widget === 'weather'
                  ? weatherVisibility === 'open'
                  : activeWidgets[item.widget];
              const showIndicator = item.widget === 'news'
                ? newsVisibility === 'minimized' && hasNewsSession(newsState)
                : item.widget === 'weather'
                  ? weatherVisibility === 'minimized'
                  : false;
              return (
                <button
                  key={item.widget}
                  onClick={() => toggleWidget(item.widget)}
                  style={{
                    ...buttonStyle,
                    borderColor: (isActive || showIndicator) ? 'var(--accent-strong)' : buttonStyle.border,
                    color: (isActive || showIndicator) ? 'var(--accent-strong)' : buttonStyle.color,
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={item.widget} />
                    </span>
                    {item.label}
                  </span>
                  {showIndicator ? (
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '999px',
                        background: 'var(--accent-strong)',
                        boxShadow: '0 0 12px var(--accent-strong)',
                      }}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeWidgets.calculator && <CalculatorWidget onClose={() => closeWidget('calculator')} />}
      {activeWidgets.notes && (
        <NotesWidget
          onClose={() => closeWidget('notes')}
          aiConnected={notesAiConnected}
          aiCommand={notesCommand}
          onCommandResult={(result: Record<string, unknown>) => {
            window.dispatchEvent(new CustomEvent('novaWidgetActionResult', { detail: result }));
          }}
        />
      )}
      {weatherVisibility === 'open' && activeWidgets.weather && (
        <WeatherWidget
          onClose={() => closeWidget('weather')}
          onMinimize={minimizeWeatherWidget}
          aiConnected={weatherAiConnected}
          aiCommand={weatherCommand}
          onCommandResult={(result: Record<string, unknown>) => {
            window.dispatchEvent(new CustomEvent('novaWidgetActionResult', { detail: result }));
          }}
        />
      )}
      {activeWidgets.tictactoe && <TicTacToeWidget onClose={() => closeWidget('tictactoe')} />}
      {activeWidgets.image && (
        <ImageWidget
          onClose={() => closeWidget('image')}
          aiConnected={imageAiConnected}
          aiCommand={imageCommand}
          onCommandResult={(result: Record<string, unknown>) => {
            window.dispatchEvent(new CustomEvent('novaWidgetActionResult', { detail: result }));
          }}
        />
      )}
      {activeWidgets.search && (
        <SearchWidget
          onClose={() => closeWidget('search')}
          aiConnected={searchAiConnected}
          aiCommand={searchCommand}
          stateSnapshot={searchState}
          onCommandResult={(result: Record<string, unknown>) => {
            window.dispatchEvent(new CustomEvent('novaWidgetActionResult', { detail: result }));
          }}
        />
      )}
      {newsVisibility === 'open' && activeWidgets.news && (
        <NewsWidget
          onClose={() => closeWidget('news')}
          onMinimize={minimizeNewsWidget}
          aiConnected={newsAiConnected}
          aiCommand={newsCommand}
          stateSnapshot={newsState}
          onCommandResult={(result: Record<string, unknown>) => {
            window.dispatchEvent(new CustomEvent('novaWidgetActionResult', { detail: result }));
          }}
        />
      )}
      {themeVisibility === 'open' && activeWidgets.theme && (
        <ThemeWidget
          onClose={() => closeWidget('theme')}
          onMinimize={minimizeThemeWidget}
        />
      )}
      {calendarVisibility === 'open' && activeWidgets.calendar && (
        <CalendarWidget
          onClose={() => closeWidget('calendar')}
          onMinimize={minimizeCalendarWidget}
          command={calendarCommand}
          onCommandResult={(result: Record<string, unknown>) => {
            window.dispatchEvent(new CustomEvent('novaWidgetActionResult', { detail: result }));
          }}
        />
      )}
      {taskVisibility === 'open' && activeWidgets.task && (
        <TaskWidget
          onClose={() => closeWidget('task')}
          onMinimize={minimizeTaskWidget}
          aiConnectionStatus={novaConnections.task}
        />
      )}
    </div>
  );
};

const buttonStyle = {
  padding: '10px 12px',
  background: 'var(--panel-overlay)',
  border: '1px solid var(--border-soft)',
  borderRadius: '20px',
  color: 'var(--text-muted)',
  fontSize: '12px',
  cursor: 'pointer',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  display: 'flex',
  alignItems: 'center',
};

export const initWidgets = () => {
  const container = document.createElement('div');
  container.id = 'react-widgets-root';
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(<WidgetContainer />);
};
