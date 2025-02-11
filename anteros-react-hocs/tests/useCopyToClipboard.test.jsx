import writeText from 'copy-to-clipboard';
import { renderHook, act } from '@testing-library/react-hooks';
import useCopyToClipboard  from '../src/hooks/useCopyToClipboard';

const valueToRaiseMockException = 'fake input causing exception in copy to clipboard';

jest.mock('copy-to-clipboard', () =>
  jest.fn().mockImplementation(input => {
    if (input === valueToRaiseMockException) {
      throw new Error(input);
    }
    return true;
  })
);
jest.spyOn(global.console, 'error').mockImplementation(() => {});

describe('useCopyToClipboard', () => {
  let hook;

  beforeEach(() => {
    hook = renderHook(() => useCopyToClipboard());
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('deve ser definido', () => {
    expect(useCopyToClipboard).toBeDefined();
  });

  it('deve passar um determinado valor para copiar para a área de transferência e definir o estado', () => {
    const testValue = 'test';
    let [state, copyToClipboard] = hook.result.current;
    act(() => copyToClipboard(testValue));
    [state, copyToClipboard] = hook.result.current;

    expect(writeText).toBeCalled();
    expect(state.value).toBe(testValue);
    expect(state.noUserInteraction).toBe(true);
    expect(state.error).not.toBeDefined();
  });

  it('não deve chamar writeText se passar uma entrada inválida e definir o estado', () => {
    let testValue = {}; // Valor inválido
    let [state, copyToClipboard] = hook.result.current;
    act(() => copyToClipboard(testValue));
    [state, copyToClipboard] = hook.result.current;

    expect(writeText).not.toBeCalled();
    expect(state.value).toBe(testValue);
    expect(state.noUserInteraction).toBe(true);
    expect(state.error).toBeDefined();

    testValue = ''; // empty string is also invalid
    act(() => copyToClipboard(testValue));
    [state, copyToClipboard] = hook.result.current;

    expect(writeText).not.toBeCalled();
    expect(state.value).toBe(testValue);
    expect(state.noUserInteraction).toBe(true);
    expect(state.error).toBeDefined();
  });

  it('deve capturar a exceção lançada por copiar para a área de transferência e definir o estado', () => {
    let [state, copyToClipboard] = hook.result.current;
    act(() => copyToClipboard(valueToRaiseMockException));
    [state, copyToClipboard] = hook.result.current;

    expect(writeText).toBeCalledWith(valueToRaiseMockException);
    expect(state.value).toBe(valueToRaiseMockException);
    expect(state.noUserInteraction).not.toBeDefined();
    expect(state.error).toStrictEqual(new Error(valueToRaiseMockException));
  });

  it('deve retornar ao estado inicial enquanto desmontado', () => {
    hook.unmount();
    const [state, copyToClipboard] = hook.result.current;

    act(() => copyToClipboard('value'));
    expect(state.value).not.toBeDefined();
    expect(state.error).not.toBeDefined();
    expect(state.noUserInteraction).toBe(true);
  });

  it('deve console de erro se em ambiente dev', () => {
    debugger
    const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
    const testValue = {}; // Valor inválido

    process.env.NODE_ENV = 'development';
    let [state, copyToClipboard] = hook.result.current;
    act(() => copyToClipboard(testValue));
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;

    [state, copyToClipboard] = hook.result.current;

    expect(writeText).not.toBeCalled();
    // expect(console.error).toBeCalled();
    expect(state.value).toBe(testValue);
    expect(state.noUserInteraction).toBe(true);
    expect(state.error).toBeDefined();
  });
});