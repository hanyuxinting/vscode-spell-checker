import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {observable, toJS} from 'mobx';
import {observer} from 'mobx-react';
import DevTools from 'mobx-react-devtools';
import Button from '@material/react-button';
import {Cell, Grid, Row} from '@material/react-layout-grid';
import { UpdateCounterMessage, ConfigurationChangeMessage } from '../api/message';
import { VsCodeWebviewApi } from '../api/vscode/VsCodeWebviewApi';
import { Settings, LocalSetting } from '../api/settings';
import { MessageBus } from '../api';
import { sampleSettings } from '../test/fixtures/sampleSettings';

require('./app.scss');

class AppState {
    @observable counter = 0;
    @observable settings: Settings = {...sampleSettings};
}

type LocalFields = keyof LocalSetting;
const localDisplay: [LocalFields, string][] = [
    ['user', 'Global'],
    ['workspace', 'Workspace'],
    ['folder', 'Folder'],
    ['file', 'File'],
];

@observer
class VsCodeTestWrapperView extends React.Component<{appState: AppState}, {}> {
    render() {
        const appState = this.props.appState;
        const settings = appState.settings;
        return (
            <div>
                <Grid>
                    <Row>
                        <Cell columns={2}>
                            Scope
                        </Cell>
                        <Cell columns={10}>
                            Value
                        </Cell>
                    </Row>
                    {localDisplay.map(([field, name]) => <Row id={field}>
                        <Cell columns={2}>{name}</Cell>
                        <Cell columns={10}>{(settings.locals[field] || ['-']).join(', ')}</Cell>
                    </Row>)}

                </Grid>
                <Grid>
                    <Row>
                        <Cell columns={12}>
                            {appState.counter}
                        </Cell>
                    </Row>
                    <Row>
                        <Cell columns={12}>
                            <Button
                                raised
                                className="button-alternate"
                                onClick={this.onUpdateConfig}
                            >
                                Update
                            </Button>
                        </Cell>
                    </Row>
                </Grid>
                <DevTools />
            </div>
        );
     }

     onUpdateConfig = () => {
         console.log('onUpdateConfig');
         messageBus.postMessage({ command: 'ConfigurationChangeMessage', value: { settings: toJS(appState.settings) } });
     }
}

const appState = new AppState();
/*
reaction(
    () => toJS(appState.settings),
    value => (
        console.log('post ConfigurationChangeMessage'),

        vsCodeApi.postMessage({ command: 'ConfigurationChangeMessage', value: { settings: toJS(appState.settings) } });
    )
);
*/
ReactDOM.render(<VsCodeTestWrapperView appState={appState} />, document.getElementById('root'));

const messageBus = new MessageBus(new VsCodeWebviewApi());

messageBus.listenFor('UpdateCounter', (msg: UpdateCounterMessage) => {
    appState.counter = msg.value;
    messageBus.postMessage({ command: 'UpdateCounter', value: msg.value });
});
messageBus.listenFor(
    'RequestConfigurationMessage',
    () => messageBus.postMessage({ command: 'ConfigurationChangeMessage', value: { settings: toJS(appState.settings) } })
);

messageBus.listenFor(
    'ConfigurationChangeMessage',
    (msg: ConfigurationChangeMessage) => {
        appState.settings = msg.value.settings;
    }
);
