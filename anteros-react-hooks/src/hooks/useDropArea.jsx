import { useMemo, useState } from 'react';
import useMountedState from './useMountedState';
const noop = () => { };

const createProcess = (options, mounted) => (dataTransfer, event) => {
    const uri = dataTransfer.getData('text/uri-list');
    if (uri) {
        (options.onUri || noop)(uri, event);
        return;
    }
    if (dataTransfer.files && dataTransfer.files.length) {
        (options.onFiles || noop)(Array.from(dataTransfer.files), event);
        return;
    }
    if (dataTransfer.items && dataTransfer.items.length) {
        dataTransfer.items[0].getAsString((text) => {
            if (mounted) {
                (options.onText || noop)(text, event);
            }
        });
    }
};
const createBond = (process, setOver) => ({
    onDragOver: (event) => {
        event.preventDefault();
    },
    onDragEnter: (event) => {
        event.preventDefault();
        setOver(true);
    },
    onDragLeave: () => {
        setOver(false);
    },
    onDrop: (event) => {
        event.preventDefault();
        event.persist();
        setOver(false);
        process(event.dataTransfer, event);
    },
    onPaste: (event) => {
        event.persist();
        process(event.clipboardData, event);
    },
});
const useDropArea = (options = {}) => {
    const { onFiles, onText, onUri } = options;
    const isMounted = useMountedState();
    const [over, setOver] = useState(false);
    const process = useMemo(() => createProcess(options, isMounted()), [onFiles, onText, onUri]);
    const bond = useMemo(() => createBond(process, setOver), [process, setOver]);
    return [bond, { over }];
};
export default useDropArea;