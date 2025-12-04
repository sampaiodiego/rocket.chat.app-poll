import { IModify, IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';

import { IModalContext } from '../../definition';
import { uuid } from '../utils/uuid';

export async function createPollModal({
    id = '',
    question,
    persistence,
    data,
    modify,
    options = 2,
}: {
    id?: string;
    question?: string;
    persistence: IPersistence;
    data: IModalContext;
    modify: IModify;
    options?: number;
}): Promise<IUIKitModalViewParam> {
    const viewId = id || uuid();

    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, viewId);
    await persistence.createWithAssociation(data, association);

    const block = modify.getCreator().getBlockBuilder();

    block.addInputBlock({
        blockId: 'poll',
        element: block.newPlainTextInputElement({
            actionId: 'question',
            initialValue: question,
            placeholder: block.newPlainTextObject('Insert your question'),
        }),
        label: block.newPlainTextObject('Insert your question'),
    });

    for (let i = 0; i < Math.max(options, 2); i++) {
        block.addInputBlock({
            blockId: 'poll',
            optional: i >= 2,
            element: block.newPlainTextInputElement({
                actionId: `option-${i}`,
                placeholder: block.newPlainTextObject(`Insert an option`),
            }),
            label: block.newPlainTextObject(i === 0 ? 'Insert your choices' : ' '),
        });
    }

    block.addActionsBlock({
        blockId: 'addChoice',
        elements: [
            block.newButtonElement({
                actionId: 'addChoice',
                text: block.newPlainTextObject('Add a choice'),
                value: String(options + 1),
            }),
        ],
    });

    block.addDividerBlock();

    block.addInputBlock({
        blockId: 'config',
        element: block.newStaticSelectElement({
            actionId: 'visibility',
            initialValue: 'open',
            placeholder: block.newPlainTextObject('Select vote type'),
            options: [
                { text: block.newPlainTextObject('Open vote'), value: 'open' },
                { text: block.newPlainTextObject('Confidential vote'), value: 'confidential' },
                { text: block.newPlainTextObject('Mixed Visibility vote'), value: 'mixed' },
            ],
        }),
        label: block.newPlainTextObject('Vote type'),
    });

    block.addInputBlock({
        blockId: 'config',
        element: block.newStaticSelectElement({
            actionId: 'addChoices',
            initialValue: 'no',
            placeholder: block.newPlainTextObject('Select permission'),
            options: [
                { text: block.newPlainTextObject('Users can add choices'), value: 'yes' },
                { text: block.newPlainTextObject('Users cannot add choices'), value: 'no' },
            ],
        }),
        label: block.newPlainTextObject('Add choices'),
    });

    block.addInputBlock({
        blockId: 'config',
        element: block.newStaticSelectElement({
            actionId: 'mode',
            initialValue: 'single',
            placeholder: block.newPlainTextObject('Select mode'),
            options: [
                { text: block.newPlainTextObject('Single choice'), value: 'single' },
                { text: block.newPlainTextObject('Multiple choices'), value: 'multiple' },
            ],
        }),
        label: block.newPlainTextObject('Multiple choices'),
    });

    block.addInputBlock({
        blockId: 'config',
        element: block.newStaticSelectElement({
            actionId: 'allowChange',
            initialValue: 'yes',
            placeholder: block.newPlainTextObject('Select option'),
            options: [
                { text: block.newPlainTextObject('Allow vote change'), value: 'yes' },
                { text: block.newPlainTextObject('No vote change'), value: 'no' },
            ],
        }),
        label: block.newPlainTextObject('Allow vote change'),
    });

    block.addDividerBlock();

    block.addInputBlock({
        blockId: 'multiRound',
        element: block.newStaticSelectElement({
            actionId: 'totalRounds',
            initialValue: '1',
            placeholder: block.newPlainTextObject('Select rounds'),
            options: [
                { text: block.newPlainTextObject('1 round (no elimination)'), value: '1' },
                { text: block.newPlainTextObject('2 rounds'), value: '2' },
                { text: block.newPlainTextObject('3 rounds'), value: '3' },
                { text: block.newPlainTextObject('4 rounds'), value: '4' },
            ],
        }),
        label: block.newPlainTextObject('Number of rounds'),
    });

    return {
        id: viewId,
        title: block.newPlainTextObject('Create a Poll'),
        submit: block.newButtonElement({
            text: block.newPlainTextObject('Create'),
        }),
        close: block.newButtonElement({
            text: block.newPlainTextObject('Dismiss'),
        }),
        blocks: block.getBlocks(),
    };
}
