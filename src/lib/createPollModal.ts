import { IModify, IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';

import { IModalContext } from '../definition';
import { uuid } from './uuid';

export async function createPollModal({ id = '', question, persistence, data, modify, options = 2 }: {
    id?: string,
    question?: string,
    persistence: IPersistence,
    data: IModalContext,
    modify: IModify,
    options?: number,
}): Promise<IUIKitModalViewParam> {
    const viewId = id || uuid();

    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, viewId);
    await persistence.createWithAssociation(data, association);

    const block = modify.getCreator().getBlockBuilder();
    block.addInputBlock({
        blockId: 'poll',
        element: block.newPlainTextInputElement({ initialValue: question, actionId: 'question' }),
        label: block.newPlainTextObject('Insert your question'),
    })
    .addDividerBlock();

    for (let i = 0; i < options; i++) {
        block.addInputBlock({
            blockId: 'poll',
            optional: true,
            element: block.newPlainTextInputElement({
                actionId: `option-${i}`,
                placeholder: block.newPlainTextObject('Insert an option'),
            }),
            label: block.newPlainTextObject(''),
        });
    }

    block
        .addActionsBlock({
            blockId: 'config',
            elements: [
                block.newStaticSelectElement({
                    placeholder: block.newPlainTextObject('Multiple choices'),
                    actionId: 'mode',
                    initialValue: 'multiple',
                    options: [
                        {
                            text: block.newPlainTextObject('Multiple choices'),
                            value: 'multiple',
                        },
                        {
                            text: block.newPlainTextObject('Single choice'),
                            value: 'single',
                        },
                    ],
                }),
                block.newButtonElement({
                    actionId: 'addChoice',
                    text: block.newPlainTextObject('Add a choice'),
                    value: String(options + 1),
                }),
                block.newStaticSelectElement({
                    placeholder: block.newPlainTextObject('Open vote'),
                    actionId: 'visibility',
                    initialValue: 'open',
                    options: [
                        {
                            text: block.newPlainTextObject('Open vote'),
                            value: 'open',
                        },
                        {
                            text: block.newPlainTextObject('Confidential vote'),
                            value: 'confidential',
                        },
                    ],
                }),
                block.newStaticSelectElement({
                    placeholder: block.newPlainTextObject('Always shows results'),
                    actionId: 'showResults',
                    initialValue: 'always',
                    options: [
                        {
                            text: block.newPlainTextObject('Always shows results'),
                            value: 'always',
                        },
                        {
                            text: block.newPlainTextObject('Show results only after finished'),
                            value: 'finished',
                        },
                    ],
                }),
            ],
        });

    return {
        id: viewId,
        title: block.newPlainTextObject('Create a poll'),
        submit: block.newButtonElement({
            text: block.newPlainTextObject('Create'),
        }),
        close: block.newButtonElement({
            text: block.newPlainTextObject('Dismiss'),
        }),
        blocks: block.getBlocks(),
    };
}
