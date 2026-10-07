export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export interface Logger {
  debug(message: string, detail?: unknown): void;
  info(message: string, detail?: unknown): void;
  warn(message: string, detail?: unknown): void;
  error(message: string, detail?: unknown): void;
  child(scope: string): Logger;
}

export interface LogSink {
  write(level: LogLevel, scope: string, message: string, detail?: unknown): void;
}

export const consoleSink: LogSink = {
  write(level, scope, message, detail) {
    const line = `[${scope}] ${message}`;
    const fn = level === 'debug' ? console.debug : level === 'info' ? console.info : level === 'warn' ? console.warn : console.error;
    if (detail === undefined) fn(line);
    else fn(line, detail);
  },
};

export function createLogger(scope: string, minLevel: LogLevel = 'info', sink: LogSink = consoleSink): Logger {
  const emit = (level: LogLevel, message: string, detail?: unknown): void => {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return;
    sink.write(level, scope, message, detail);
  };
  return {
    debug: (m, d) => emit('debug', m, d),
    info: (m, d) => emit('info', m, d),
    warn: (m, d) => emit('warn', m, d),
    error: (m, d) => emit('error', m, d),
    child: (childScope) => createLogger(`${scope}:${childScope}`, minLevel, sink),
  };
}

/** A logger that discards everything. Useful as a default in tests. */
export const silentLogger: Logger = createLogger('silent', 'error', { write() {} });
