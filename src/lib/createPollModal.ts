import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';

import { IModalContext } from '../definition';
import { uuid } from './uuid';

interface IModalState {
    options?: number;
    duration?: string;
}

// Current date/time formatted as the UTC "YYYY-MM-DD HH:mm" that parseCloseSchedule accepts.
function nowUtcInputValue(): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}`;
}

export async function createPollModal({ id = '', question, read, persistence, data, modify, options, duration }: {
    id?: string,
    question?: string,
    read: IRead,
    persistence: IPersistence,
    data: IModalContext,
    modify: IModify,
    options?: number,
    duration?: string,
}): Promise<IUIKitModalViewParam> {
    const viewId = id || uuid();

    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, viewId);
    await persistence.createWithAssociation(data, association);

    // The "Add a choice" and "Custom…" actions re-render the modal but carry no
    // view state, so we persist the working option count + close schedule keyed
    // by the view id and merge whichever value this call did not override.
    const stateAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `modal-state-${viewId}`);
    const [previousState] = await read.getPersistenceReader().readByAssociation(stateAssociation) as Array<IModalState>;

    const effectiveOptions = options !== undefined ? options : (previousState && previousState.options !== undefined ? previousState.options : 2);
    const effectiveDuration = duration !== undefined ? duration : (previousState && previousState.duration !== undefined ? previousState.duration : 'off');

    await persistence.updateByAssociation(stateAssociation, { options: effectiveOptions, duration: effectiveDuration }, true);

    const block = modify.getCreator().getBlockBuilder();
    block.addInputBlock({
        blockId: 'poll',
        element: block.newPlainTextInputElement({ initialValue: question, actionId: 'question' }),
        label: block.newPlainTextObject('Insert your question'),
    })
    .addDividerBlock();

    for (let i = 0; i < effectiveOptions; i++) {
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
                    value: String(effectiveOptions + 1),
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

    // "Close automatically" section: the duration select always lives here, and
    // when "Custom…" is chosen the free-text field is shown beside it.
    block.addSectionBlock({
        text: block.newMarkdownTextObject('*Close automatically*'),
    });

    block.addActionsBlock({
        blockId: 'schedule',
        elements: [
            block.newStaticSelectElement({
                placeholder: block.newPlainTextObject('No automatic closing'),
                actionId: 'duration',
                initialValue: effectiveDuration,
                options: [
                    {
                        text: block.newPlainTextObject('No automatic closing'),
                        value: 'off',
                    },
                    {
                        text: block.newPlainTextObject('Close in 1 hour'),
                        value: '1h',
                    },
                    {
                        text: block.newPlainTextObject('Close in 6 hours'),
                        value: '6h',
                    },
                    {
                        text: block.newPlainTextObject('Close in 1 day'),
                        value: '1d',
                    },
                    {
                        text: block.newPlainTextObject('Close in 3 days'),
                        value: '3d',
                    },
                    {
                        text: block.newPlainTextObject('Close in 1 week'),
                        value: '1w',
                    },
                    {
                        text: block.newPlainTextObject('Custom…'),
                        value: 'custom',
                    },
                ],
            }),
        ],
    });

    // Rendered as an input block (not an actions-block element) so it reports its
    // value only on submit, instead of dispatching a request on every keystroke.
    if (effectiveDuration === 'custom') {
        block.addInputBlock({
            blockId: 'schedule',
            optional: true,
            element: block.newPlainTextInputElement({
                actionId: 'closeAt',
                initialValue: nowUtcInputValue(),
                placeholder: block.newPlainTextObject('UTC · e.g. "3 hours" or "2026-06-30 18:00"'),
            }),
            label: block.newPlainTextObject('Close automatically at (UTC)'),
        });
    }

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
