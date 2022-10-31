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

export class PollApp extends App implements IUIKitInteractionHandler {

    constructor(info: IAppInfo, logger: ILogger) {
        super(info, logger);
    }

    public async executeViewSubmitHandler(context: UIKitViewSubmitInteractionContext, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify) {
        const data = context.getInteractionData();

        const { state }: {
            state: {
                poll: {
                    question: string,
                    [option: string]: string,
                },
                config?: {
                    mode?: string,
                    visibility?: string,
                    showResults?: string,
                },
            },
        } = data.view as any;

        if (!state) {
            return context.getInteractionResponder().viewErrorResponse({
                viewId: data.view.id,
                errors: {
                    question: 'Error creating poll',
                },
            });
        }

        try {
            await createPollMessage(data, read, modify, persistence, data.user.id);
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

        const { actionId } = data;

        switch (actionId) {
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

            case 'addChoice': {
                const modal = await createPollModal({ id: data.container.id, data, persistence, modify, options: parseInt(String(data.value), 10) });

                return context.getInteractionResponder().updateModalViewResponse(modal);
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
        await configuration.settings.provideSetting({
            id : 'use-user-name',
            i18nLabel: 'Use name attribute to display voters, instead of username',
            i18nDescription: 'When checked, display voters as full user names instead of username',
            required: false,
            type: SettingType.BOOLEAN,
            public: true,
            packageValue: false,
        });
    }
}
