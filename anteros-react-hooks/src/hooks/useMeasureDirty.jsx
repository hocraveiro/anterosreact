import { useState, useEffect, useRef } from 'react';
import ResizeObserver from 'resize-observer-polyfill';
const useMeasureDirty = (ref) => {
    const frame = useRef(0);
    const [rect, set] = useState({
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    });
    const [observer] = useState(() => new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
            cancelAnimationFrame(frame.current);
            frame.current = requestAnimationFrame(() => {
                set(entry.contentRect);
            });
        }
    }));
    useEffect(() => {
        observer.disconnect();
        if (ref.current) {
            observer.observe(ref.current);
        }
    }, [ref]);
    return rect;
};
export default useMeasureDirty;