import { IModify, IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';

import { IModalContext } from '../definition';
import { uuid } from './uuid';

export async function addUserChoiceModal({ id = '', persistence, data, modify }: {
    id?: string,
    persistence: IPersistence,
    data: IModalContext,
    modify: IModify,
}): Promise<IUIKitModalViewParam> {
    const viewId = id || uuid();

    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, viewId);
    await persistence.createWithAssociation(data, association);

    const block = modify.getCreator().getBlockBuilder();

    block.addInputBlock({
        blockId: 'userChoice',
        optional: true,
        element: block.newPlainTextInputElement({
            actionId: `addUserOption`,
            placeholder: block.newPlainTextObject('Insert an option'),
        }),
        label: block.newPlainTextObject(''),
    });
    block
        .addActionsBlock({
        elements: [
            block.newButtonElement({
                actionId: 'updatePoll',
                text: block.newPlainTextObject('Add choice'),
            })
        ]
})



    return {
        id: viewId,
        title: block.newPlainTextObject('Insert Your Own Option'),
        // submit: block.newButtonElement({
        //     text: block.newPlainTextObject('Add'),
        // }),
        // close: block.newButtonElement({
        //     text: block.newPlainTextObject('Dismiss'),
        // }),
        blocks: block.getBlocks(),
    };
}
