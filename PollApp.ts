import {
    IConfigurationExtend,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { SettingType } from '@rocket.chat/apps-engine/definition/settings';
import {
    IUIKitInteractionHandler,
    UIKitBlockInteractionContext,
    UIKitViewSubmitInteractionContext,
} from '@rocket.chat/apps-engine/definition/uikit';

import { createPollMessage } from './src/lib/createPollMessage';
import { createPollModal } from './src/lib/createPollModal';
import { finishPollMessage } from './src/lib/finishPollMessage';
import { votePoll } from './src/lib/votePoll';
import { PollCommand } from './src/PollCommand';
import { VoteCommand } from './src/VoteCommand';

export class PollApp extends App implements IUIKitInteractionHandler {

    constructor(info: IAppInfo, logger: ILogger) {
        super(info, logger);
    }

    public async executeViewSubmitHandler(context: UIKitViewSubmitInteractionContext, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify) {
        // console.log('executeViewSubmitHandler ->', data);

        const data = context.getInteractionData();

        const { state }: {
            state: {
                poll: {
                    question: string,
                    [option: string]: string,
                },
            },
        } = data.view as any;

        if (!state) {
            return context.getInteractionResponder().viewErrorResponse({
                viewId: data.view.id,
                errors: {
                    question: 'Erro no recebimento',
                },
            });
        }

        try {
            await createPollMessage(data, read, modify, persistence);
        } catch (err) {
            return context.getInteractionResponder().viewErrorResponse({
                viewId: data.view.id,
                errors: err,
            });
        }

        return {
            success: true,
        };
    }

    public async executeBlockActionHandler(context: UIKitBlockInteractionContext, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify) {

        const data = context.getInteractionData();

        // console.log('executeBlockActionHandler ->', data);
        switch (data.actionId) {
            case 'vote': {
                await votePoll({ data, read, persistence, modify });

                return {
                    success: true,
                };
            }

            case 'create': {
                const modal = await createPollModal({ data, persistence, modify });

                return context.getInteractionResponder().openModalViewResponse(modal);
            }

            case 'finish': {

                try {
                    await finishPollMessage({ data, read, persistence, modify });
                } catch (e) {

                    const { room } = context.getInteractionData();
                    const errorMessage = modify
                         .getCreator()
                         .startMessage()
                         .setSender(context.getInteractionData().user)
                         .setText(e.message)
                         .setUsernameAlias('Poll');

                    if (room) {
                            errorMessage.setRoom(room);
                    }
                    modify
                         .getNotifier()
                         .notifyUser(
                             context.getInteractionData().user,
                             errorMessage.getMessage(),
                         );
                }
            }
        }

        return {
            success: true,
            triggerId: data.triggerId,
        };
    }

    public async initialize(configuration: IConfigurationExtend): Promise<void> {
        await configuration.slashCommands.provideSlashCommand(new PollCommand());
        await configuration.slashCommands.provideSlashCommand(new VoteCommand(this));
        await configuration.settings.provideSetting({
            id : 'use-user-name',
            i18nLabel: 'Use name attribute to display voters, instead of username',
            i18nDescription: 'When checked, display voters as full user names instead of @name',
            required: false,
            type: SettingType.BOOLEAN,
            public: true,
            packageValue: false,
        });
    }

}
