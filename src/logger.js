import log from 'loglevel';

if (process.env.NODE_ENV === 'development') {
  log.setLevel('debug');
} else {
  log.setLevel('warn');
}

export default log;