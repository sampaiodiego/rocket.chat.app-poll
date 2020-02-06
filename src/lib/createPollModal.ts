import { IModify, IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit/blocks';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';

import { uuid } from './uuid';

export async function createPollModal({ id = '', question, persistence, data, modify, options = 2 }: {
    id?: string,
    question?: string,
    persistence: IPersistence,
    data,
    modify: IModify,
    options?: number,
}): Promise<IUIKitModalViewParam> {
    const viewId = id || uuid();

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
        element: block.newPlainTextInputElement({ initialValue: question, actionId: 'question' }),
        label: {
            type: TextObjectType.PLAINTEXT,
            text: 'Insert your question',
            emoji: true,
        },
    })
    .addDividerBlock();

    for (let i = 0; i < options; i++) {
        block.addInputBlock({
            blockId: 'poll',
            optional: true,
            element: block.newPlainTextInputElement({
                actionId: `option-${i}`,
                placeholder: {
                    type: TextObjectType.PLAINTEXT,
                    text: 'Insert an option',
                },
                // initialValue: 'Type an option',
            }),
            label: {
                type: TextObjectType.PLAINTEXT,
                text: '',
                emoji: true,
            },
        });
    }

    block
        .addActionsBlock({
            elements: [
                block.newStaticSelectElement({
                    placeholder: {
                        type: TextObjectType.PLAINTEXT,
                        text: 'Multiple choices',
                    },
                    initialValue: ['multiple'],
                    options: [
                        {
                            text: {
                                type: TextObjectType.PLAINTEXT,
                                text: 'Multiple choices',
                            },
                            value: 'multiple',
                        },
                        {
                            text: {
                                type: TextObjectType.PLAINTEXT,
                                text: 'Single choice',
                            },
                            value: 'single',
                        },
                    ],
                    actionId: 'type',
                }),
                block.newButtonElement({
                    actionId: 'addChoice',
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: 'Add a choice',
                    },
                    value: String(options + 1),
                }),
                block.newStaticSelectElement({
                    placeholder: {
                        type: TextObjectType.PLAINTEXT,
                        text: 'Open vote',
                    },
                    initialValue: ['open'],
                    options: [
                        {
                            text: {
                                type: TextObjectType.PLAINTEXT,
                                text: 'Open vote',
                            },
                            value: 'open',
                        },
                        {
                            text: {
                                type: TextObjectType.PLAINTEXT,
                                text: 'Confidential voce',
                            },
                            value: 'confidential',
                        },
                    ],
                    actionId: 'type',
                }),
            ],
        });

    return {
        id: viewId,
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
    };
}

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
