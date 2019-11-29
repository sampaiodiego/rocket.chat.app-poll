import { IConfigurationExtend, IHttp, ILogger, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { BlockitResponseType, IBlockitAction, IBlockitActionHandler, IBlockitBlockAction, IBlockitResponse, IBlockitViewSubmit } from '@rocket.chat/apps-engine/definition/blockit';
import { BlockElementType, BlockType, IActionsBlock, IButtonElement, TextObjectType } from '@rocket.chat/apps-engine/definition/blocks';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';

// Commands
import { PollCommand } from './src/PollCommand';
import { VoteCommand } from './src/VoteCommand';

export class PollApp extends App implements IBlockitActionHandler {

    constructor(info: IAppInfo, logger: ILogger) {
        super(info, logger);
    }

    public async executeViewSubmitHandler(data: IBlockitViewSubmit, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify) {

        console.log('data ->', data);

        return {
            success: true,
        };
    }

    public async executeBlockActionHandler(data: IBlockitAction, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify) {
        if (data.actionId === 'create') {
            const questions = [] as any;
            for (let i = 0; i < 5; i++) {
                questions.push({
                    type: 'input',
                    blockId: 'poll',
                    element: {
                        type: 'plain_text_input',
                        actionId: `option-${ i }`,
                        initialValue: 'Some option',
                    },
                    label: {
                        type: 'plain_text',
                        text: `Option (${ i + 1 })`,
                        emoji: true,
                    },
                });
            }

            return {
                success: true,
                triggerId: data.triggerId,
                type: BlockitResponseType.MODAL, // modal, home
                title: {
                    type: TextObjectType.PLAINTEXT,
                    text: 'Create a poll',
                },
                submit: {
                    type: TextObjectType.PLAINTEXT,
                    text: 'Create',
                },
                close: {
                    type: TextObjectType.PLAINTEXT,
                    text: 'Dismiss',
                },
                blocks: [
                    {
                        type: 'input',
                        blockId: 'poll',
                        element: {
                            type: 'plain_text_input',
                            actionId: 'question',
                            initialValue: 'Your question',
                        },
                        label: {
                            type: 'plain_text',
                            text: 'Question',
                            emoji: true,
                        },
                    },
                    ...questions,
                ],
            };
        }

        return {
            success: true,
            triggerId: data.triggerId,
        };
    }

    public async initialize(configuration: IConfigurationExtend): Promise<void> {
        await configuration.slashCommands.provideSlashCommand(new PollCommand());
        await configuration.slashCommands.provideSlashCommand(new VoteCommand(this));
    }
}
