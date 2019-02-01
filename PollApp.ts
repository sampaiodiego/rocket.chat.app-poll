import { IConfigurationExtend, ILogger } from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';

// Commands
import { PollCommand } from './src/PollCommand';
import { VoteCommand } from './src/VoteCommand';

export class PollApp extends App {

    constructor(info: IAppInfo, logger: ILogger) {
        super(info, logger);
    }

    public async initialize(configuration: IConfigurationExtend): Promise<void> {
        await configuration.slashCommands.provideSlashCommand(new PollCommand());
        await configuration.slashCommands.provideSlashCommand(new VoteCommand());
    }
}
