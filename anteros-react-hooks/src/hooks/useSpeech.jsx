import { useRef } from 'react';
import useMount from './useMount';
import useSetState from './useSetState';
const voices = typeof window === 'object' && typeof window.speechSynthesis === 'object' ? window.speechSynthesis.getVoices() : [];
const useSpeech = (text, opts = {}) => {
    const [state, setState] = useSetState({
        isPlaying: false,
        lang: opts.lang || 'default',
        voice: opts.voice || voices[0],
        rate: opts.rate || 1,
        pitch: opts.pitch || 1,
        volume: opts.volume || 1,
    });
    const uterranceRef = useRef(null);
    useMount(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        opts.lang && (utterance.lang = opts.lang);
        opts.voice && (utterance.voice = opts.voice);
        utterance.rate = opts.rate || 1;
        utterance.pitch = opts.pitch || 1;
        utterance.volume = opts.volume || 1;
        utterance.onstart = () => setState({ isPlaying: true });
        utterance.onresume = () => setState({ isPlaying: true });
        utterance.onend = () => setState({ isPlaying: false });
        utterance.onpause = () => setState({ isPlaying: false });
        uterranceRef.current = utterance;
        window.speechSynthesis.speak(uterranceRef.current);
    });
    return state;
};
export default useSpeech;