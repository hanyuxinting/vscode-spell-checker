import { MessageBus } from './MessageBus';
import { WebviewApi } from './WebviewApi';
import { RequestConfigurationMessage, ConfigurationChangeMessage } from './message';
import { sampleSettings } from '../test/samples/sampleSettings';

describe('Validate MessageBus', () => {
    test('constructor', () => {
        const webviewApi: WebviewApi = {
            postMessage: (_msg: any) => webviewApi,
            onmessage: undefined,
        }

        expect(new MessageBus(webviewApi).vsCodeApi).toBe(webviewApi);
    });

    test('postMessage', () => {
        const postMessageMock = jest.fn((msg: any) => loopBack(webviewApi, msg));
        const webviewApi: WebviewApi = {
            postMessage: postMessageMock,
            onmessage: undefined,
        }

        const bus = new MessageBus(webviewApi);
        bus.postMessage({ command: 'SelectFileMessage', value: '/file.txt' });
        expect(postMessageMock.mock.calls.length).toBe(1);
    });

    test('listener', () => {
        const webviewApi: WebviewApi = {
            postMessage: (msg: any) => loopBack(webviewApi, msg),
            onmessage: undefined,
        }
        const onRequestConfigurationMessage = jest.fn((_msg: RequestConfigurationMessage) => {});
        const onConfigurationChangeMessage = jest.fn((_msg: ConfigurationChangeMessage) => {});
        const bus = new MessageBus(webviewApi);
        const listenerA = bus.listenFor('RequestConfigurationMessage', onRequestConfigurationMessage);
        const listenerB = bus.listenFor('ConfigurationChangeMessage', onConfigurationChangeMessage);

        bus.postMessage({ command: 'RequestConfigurationMessage' });
        bus.postMessage({ command: 'ConfigurationChangeMessage', value: { settings: sampleSettings } });
        bus.postMessage({ command: 'SelectFileMessage', value: '/file.txt' });

        expect(onRequestConfigurationMessage.mock.calls.length).toBe(1);
        expect(onConfigurationChangeMessage.mock.calls.length).toBe(1);

        listenerA.dispose();

        bus.postMessage({ command: 'RequestConfigurationMessage' });
        bus.postMessage({ command: 'ConfigurationChangeMessage', value: { settings: sampleSettings } });
        bus.postMessage({ command: 'SelectFileMessage', value: '/file.txt' });

        expect(onRequestConfigurationMessage.mock.calls.length).toBe(1);
        expect(onConfigurationChangeMessage.mock.calls.length).toBe(2);

        listenerB.dispose();

        bus.postMessage({ command: 'RequestConfigurationMessage' });
        bus.postMessage({ command: 'ConfigurationChangeMessage', value: { settings: sampleSettings } });
        bus.postMessage({ command: 'SelectFileMessage', value: '/file.txt' });

        expect(onRequestConfigurationMessage.mock.calls.length).toBe(1);
        expect(onConfigurationChangeMessage.mock.calls.length).toBe(2);
    });

    test('receiving non-message path', () => {
        const webviewApi: WebviewApi = {
            postMessage: (msg: any) => loopBack(webviewApi, msg),
            onmessage: undefined,
        }
        new MessageBus(webviewApi);
        expect(() => webviewApi.onmessage!({ data: {} })).not.toThrow();
    });
});

function loopBack(webviewApi: WebviewApi, msg: any): WebviewApi {
    if (webviewApi.onmessage) {
        webviewApi.onmessage({ data: msg });
    }
    return webviewApi;
}
