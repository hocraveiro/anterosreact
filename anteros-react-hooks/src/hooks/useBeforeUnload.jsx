import { useCallback, useEffect } from 'react';

const useBeforeUnload = (enabled) => {
  const handler = useCallback(
    (event) => {
      const finalEnabled = typeof enabled === 'function' ? enabled() : true;

      if (!finalEnabled) {
        return;
      }

      event.preventDefault();

      if (message) {
        event.returnValue = message;
      }

      return message;
    },
    [enabled, message]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    window.addEventListener('beforeunload', handler);

    return () => window.removeEventListener('beforeunload', handler);
  }, [enabled, handler]);
};

export default useBeforeUnload;
