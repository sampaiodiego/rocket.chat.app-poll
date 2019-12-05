import { IConfigurationExtend, ILogger } from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';

// Commands
import { PollCommand } from './src/PollCommand';
import { VoteCommand } from './src/VoteCommand';
import { SettingType } from '@rocket.chat/apps-engine/definition/settings';

export class PollApp extends App {

    constructor(info: IAppInfo, logger: ILogger) {
        super(info, logger);
    }

    public async initialize(configuration: IConfigurationExtend): Promise<void> {
        await configuration.slashCommands.provideSlashCommand(new PollCommand());
        await configuration.slashCommands.provideSlashCommand(new VoteCommand(this));
        await configuration.settings.provideSetting({
            id : "use-user-name",
            i18nLabel: "Use name attribute to display voters, instead of username",
            i18nDescription: "when checked, display voters as full user names instead of @name",
            required: false,
            type: SettingType.BOOLEAN,
            public: true,
            packageValue: false
        });
    }

}
