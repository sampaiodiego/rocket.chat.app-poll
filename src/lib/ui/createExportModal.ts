import { IModify, IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';

export async function createExportModal(
    pollId: string,
    roomId: string,
    modify: IModify,
    persistence: IPersistence
): Promise<IUIKitModalViewParam> {
    const viewId = `export-${pollId}`;

    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, viewId);
    await persistence.createWithAssociation({ pollId, roomId }, association);

    const block = modify.getCreator().getBlockBuilder();

    block.addSectionBlock({
        text: block.newPlainTextObject('Choose how you want to receive the exported results.'),
    });

    block.addDividerBlock();

    block.addInputBlock({
        blockId: 'export',
        element: block.newStaticSelectElement({
            actionId: 'destination',
            initialValue: 'dm',
            placeholder: block.newPlainTextObject('Select destination'),
            options: [
                { text: block.newPlainTextObject('Send to me (private message)'), value: 'dm' },
                { text: block.newPlainTextObject('Post in this Room'), value: 'room' },
            ],
        }),
        label: block.newPlainTextObject('Destination'),
    });

    block.addDividerBlock();

    block.addContextBlock({
        elements: [
            block.newPlainTextObject('💡 To download: After export, copy the text and save as a .txt file'),
        ],
    });

    return {
        id: viewId,
        title: block.newPlainTextObject('Export Poll Results'),
        submit: block.newButtonElement({
            text: block.newPlainTextObject('Export'),
        }),
        close: block.newButtonElement({
            text: block.newPlainTextObject('Cancel'),
        }),
        blocks: block.getBlocks(),
    };
}
