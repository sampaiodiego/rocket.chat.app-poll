import { IConfigurationExtend, IHttp, ILogger, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { MessageActionType } from '@rocket.chat/apps-engine/definition/messages/MessageActionType';
import { BlockitResponseType, IBlockitAction, IBlockitActionHandler, IBlockitBlockAction, IBlockitResponse, IBlockitViewSubmit } from '@rocket.chat/apps-engine/definition/blockit';
import { BlockElementType, BlockType, IActionsBlock, IButtonElement, TextObjectType } from '@rocket.chat/apps-engine/definition/blocks';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';

// Commands
import { PollCommand } from './src/PollCommand';
import { VoteCommand } from './src/VoteCommand';
import { IPoll } from './src/IPoll';
import { MessageActionButtonsAlignment } from '@rocket.chat/apps-engine/definition/messages/MessageActionButtonsAlignment';
import { buildOptions } from './src/buildOptions';

export function uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export class PollApp extends App implements IBlockitActionHandler {

    constructor(info: IAppInfo, logger: ILogger) {
        super(info, logger);
    }

    public async executeViewSubmitHandler(data: IBlockitViewSubmit, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify) {
        // console.log('executeViewSubmitHandler ->', data);

        const {
            triggerId,
            view: {
                id,
            },
        } = data;

        const { state }: { state?: any } = data.view;

        // console.log('state ->', state);

        // console.log('poll ->', value);
        const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, id);
        const [context] = await read.getPersistenceReader().readByAssociation(association) as Array<{ room: IRoom }>;

        const options = Object.entries<any>(state.poll)
            .filter(([key]) => key !== 'question')
            .map(([, question]) => question);

        // console.log('context ->', context);

        const builder = modify.getCreator().startMessage()
            .setSender(data.user)
            .setRoom(context.room)
            .setAvatarUrl('https://user-images.githubusercontent.com/8591547/44113440-751b9ff8-9fde-11e8-9e8c-8a555e6e382b.png')
            .setText(`_${state.poll.question}_`)
            .setUsernameAlias('Poll');

        try {
            const UUID = uuid();

            const poll: IPoll = {
                messageId: '',
                options,
                totalVotes: 0,
                votes: options.map(() => ({ quantity: 0, voters: [] })),
            };

            builder.addAttachment(buildOptions(options, poll));

            builder.addAttachment({
                color: '#73a7ce',
                actionButtonsAlignment: MessageActionButtonsAlignment.HORIZONTAL,
                actions: options.map((option: string, index: number) => ({
                    type: MessageActionType.BUTTON,
                    text: `${index + 1}`,
                    msg_in_chat_window: true,
                    msg: `/vote ${UUID} ${index}`,
                })),
            });

            poll.messageId = await modify.getCreator().finish(builder);

            const pollAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, UUID);
            await persistence.createWithAssociation(poll, pollAssociation);
        } catch (e) {

            // builder.setText('An error occured when trying to send the gif :disappointed_relieved:');

            // modify.getNotifier().notifyUser(context.getSender(), builder.getMessage());
        }

        return {
            success: true,
        };
    }

    public async executeBlockActionHandler(data: IBlockitBlockAction, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify) {
        // console.log('executeBlockActionHandler ->', data);
        if (data.actionId === 'create') {
            const viewId = uuid();

            const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, viewId);
            await persistence.createWithAssociation({ room: data.room }, association);

            const questions = [] as any;
            for (let i = 0; i < 5; i++) {
                questions.push({
                    type: 'input',
                    blockId: 'poll',
                    optional: true,
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
                notifyOnClose: true,
                viewId,
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
                        element: {
                            type: 'plain_text_input',
                            actionId: 'question',
                        },
                        blockId: 'poll',
                        label: {
                            type: 'plain_text',
                            text: 'Insert your question',
                            emoji: true,
                        },
                    },
                    {
                        type: 'divider',
                    }, {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: '*Add some choices*',
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
