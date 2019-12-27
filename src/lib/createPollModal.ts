import { IModify, IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit/blocks';

import { uuid } from './uuid';

export async function createPollModal({ persistence, data, modify }: {
    persistence: IPersistence,
    data,
    modify: IModify,
}): Promise<IUIKitModalViewParam> {
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
                actionId: `option-${i}`,
                initialValue: 'Some option',
            }),
            label: {
                type: TextObjectType.PLAINTEXT,
                text: `Option (${i + 1})`,
                emoji: true,
            },
        });
    }

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
