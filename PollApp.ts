import {
    IConfigurationExtend,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import {
    IAppInfo,
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from '@rocket.chat/apps-engine/definition/metadata';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import {
    IUIKitInteractionHandler,
    UIKitBlockInteractionContext,
    UIKitViewSubmitInteractionContext,
} from '@rocket.chat/apps-engine/definition/uikit';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit/blocks';

import { createPollMessage } from './src/createPollMessage';
import { getPoll } from './src/getPoll';
import { IPoll } from './src/IPoll';
import { PollCommand } from './src/PollCommand';
import { storeVote } from './src/storeVote';
import { VoteCommand } from './src/VoteCommand';

// Commands
export function uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export class PollApp extends App implements IUIKitInteractionHandler {

    constructor(info: IAppInfo, logger: ILogger) {
        super(info, logger);
    }

    public async executeViewSubmitHandler(context: UIKitViewSubmitInteractionContext, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify) {
        // console.log('executeViewSubmitHandler ->', data);

        const data = context.getInteractionData();

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
        const [record] = await read.getPersistenceReader().readByAssociation(association) as Array<{ room: IRoom }>;

        const options = Object.entries<any>(state.poll)
            .filter(([key]) => key !== 'question')
            .map(([, question]) => question);

        // console.log('context ->', context);

        const builder = modify.getCreator().startMessage()
            .setSender(data.user)
            .setRoom(record.room)
            .setAvatarUrl('https://user-images.githubusercontent.com/8591547/44113440-751b9ff8-9fde-11e8-9e8c-8a555e6e382b.png')
            // .setText(`_${state.poll.question}_`)
            .setUsernameAlias('Poll');

        try {
            const poll: IPoll = {
                question: state.poll.question,
                msgId: '',
                options,
                totalVotes: 0,
                votes: options.map(() => ({ quantity: 0, voters: [] })),
            };

            const block = modify.getCreator().getBlockBuilder();

            createPollMessage(block, poll.question, options, poll);

            builder.setBlocks(block);

            const messageId = await modify.getCreator().finish(builder);

            poll.msgId = messageId;

            const pollAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, messageId);
            await persistence.createWithAssociation(poll, pollAssociation);
        } catch (e) {

            // builder.setText('An error occured when trying to send the gif :disappointed_relieved:');

            // modify.getNotifier().notifyUser(context.getSender(), builder.getMessage());
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
                if (!data.message) {
                    return {
                        success: true,
                    };
                }
                const poll = await getPoll(String(data.message.id), read);
                if (!poll) {
                    throw new Error('no such poll');
                }

                await storeVote(poll, parseInt(String(data.value), 10), data.user, { persis: persistence });

                const message = await modify.getUpdater().message(data.message.id as string, data.user);
                message.setEditor(message.getSender());

                const block = modify.getCreator().getBlockBuilder();

                createPollMessage(block, poll.question, poll.options, poll);

                message.setBlocks(block);

                await modify.getUpdater().finish(message);

                return {
                    success: true,
                };
            }

            case 'create': {
                const viewId = uuid();

                const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, viewId);
                await persistence.createWithAssociation({ room: data.room }, association);

                // const questions = [] as any;
                // for (let i = 0; i < 5; i++) {
                //     questions.push({
                //         type: 'input',
                //         blockId: 'poll',
                //         optional: true,
                //         element: {
                //             type: 'plain_text_input',
                //             actionId: `option-${ i }`,
                //             initialValue: 'Some option',
                //         },
                //         label: {
                //             type: 'plain_text',
                //             text: `Option (${ i + 1 })`,
                //             emoji: true,
                //         },
                //     });
                // }

                const block = modify.getCreator().getBlockBuilder();
                block.addInputBlock({
                    blockId: 'poll',
                    element: block.newPlainTextInputElement({ actionId: 'question' }),
                    label: {
                        type: TextObjectType.PLAINTEXT,
                        text: 'Insert your question',
                        emoji: true,
                    },
                })
                .addDividerBlock()
                .addSectionBlock({
                    text: {
                        type: TextObjectType.MARKDOWN,
                        text: '*Add some choices',
                    },
                });

                for (let i = 0; i < 5; i++) {
                    block.addInputBlock({
                        blockId: 'poll',
                        optional: true,
                        element: block.newPlainTextInputElement({
                            actionId: `option-${ i }`,
                            initialValue: 'Some option',
                        }),
                        label: {
                            type: TextObjectType.PLAINTEXT,
                            text: `Option (${ i + 1 })`,
                            emoji: true,
                        },
                    });
                }

                return context.modalViewResponse({
                    title: {
                        type: TextObjectType.PLAINTEXT,
                        text: 'Create a poll',
                    },
                    submit: block.newButtonElement({
                        text: {
                            type: TextObjectType.PLAINTEXT,
                            text: 'Create',
                        },
                    }),
                    close: block.newButtonElement({
                        text: {
                            type: TextObjectType.PLAINTEXT,
                            text: 'Dismiss',
                        },
                    }),
                    blocks: block.getBlocks(),
                });

                // return {
                //     success: true,
                //     triggerId: data.triggerId,
                //     type: BlockitResponseType.MODAL, // modal, home
                //     notifyOnClose: true,
                //     viewId,
                //     title: {
                //         type: TextObjectType.PLAINTEXT,
                //         text: 'Create a poll',
                //     },
                //     submit: {
                //         type: TextObjectType.PLAINTEXT,
                //         text: 'Create',
                //     },
                //     close: {
                //         type: TextObjectType.PLAINTEXT,
                //         text: 'Dismiss',
                //     },
                //     blocks: [
                //         {
                //             type: 'input',
                //             element: {
                //                 type: 'plain_text_input',
                //                 actionId: 'question',
                //             },
                //             blockId: 'poll',
                //             label: {
                //                 type: 'plain_text',
                //                 text: 'Insert your question',
                //                 emoji: true,
                //             },
                //         },
                //         {
                //             type: 'divider',
                //         }, {
                //             type: 'section',
                //             text: {
                //                 type: 'mrkdwn',
                //                 text: '*Add some choices*',
                //             },
                //         },
                //         ...questions,
                //     ],
                // };
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
    }
}
