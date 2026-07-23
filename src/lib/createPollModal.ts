import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';

import { IModalContext } from '../definition';
import { markdown, plainText } from './i18n';
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
        label: plainText('poll_question_label'),
    })
    .addDividerBlock();

    for (let i = 0; i < effectiveOptions; i++) {
        block.addInputBlock({
            blockId: 'poll',
            optional: true,
            element: block.newPlainTextInputElement({
                actionId: `option-${i}`,
                placeholder: plainText('poll_option_placeholder'),
            }),
            label: block.newPlainTextObject(''),
        });
    }

    block
        .addActionsBlock({
            blockId: 'config',
            elements: [
                block.newStaticSelectElement({
                    placeholder: plainText('poll_mode_multiple'),
                    actionId: 'mode',
                    initialValue: 'multiple',
                    options: [
                        { text: plainText('poll_mode_multiple'), value: 'multiple' },
                        { text: plainText('poll_mode_single'), value: 'single' },
                    ],
                }),
                block.newButtonElement({
                    actionId: 'addChoice',
                    text: plainText('poll_add_choice'),
                    value: String(effectiveOptions + 1),
                }),
                block.newStaticSelectElement({
                    placeholder: plainText('poll_visibility_open'),
                    actionId: 'visibility',
                    initialValue: 'open',
                    options: [
                        { text: plainText('poll_visibility_open'), value: 'open' },
                        { text: plainText('poll_visibility_confidential'), value: 'confidential' },
                    ],
                }),
                block.newStaticSelectElement({
                    placeholder: plainText('poll_show_results_always'),
                    actionId: 'showResults',
                    initialValue: 'always',
                    options: [
                        { text: plainText('poll_show_results_always'), value: 'always' },
                        { text: plainText('poll_show_results_finished'), value: 'finished' },
                    ],
                }),
            ],
        });

    // "Close automatically" section: the duration select always lives here, and
    // when "Custom…" is chosen the free-text field is shown beside it.
    block.addSectionBlock({
        text: markdown('poll_close_automatically'),
    });

    block.addActionsBlock({
        blockId: 'schedule',
        elements: [
            block.newStaticSelectElement({
                placeholder: plainText('poll_duration_off'),
                actionId: 'duration',
                initialValue: effectiveDuration,
                options: [
                    { text: plainText('poll_duration_off'), value: 'off' },
                    { text: plainText('poll_duration_1h'), value: '1h' },
                    { text: plainText('poll_duration_6h'), value: '6h' },
                    { text: plainText('poll_duration_1d'), value: '1d' },
                    { text: plainText('poll_duration_3d'), value: '3d' },
                    { text: plainText('poll_duration_1w'), value: '1w' },
                    { text: plainText('poll_duration_custom'), value: 'custom' },
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
                placeholder: plainText('poll_custom_placeholder'),
            }),
            label: plainText('poll_custom_label'),
        });
    }

    return {
        id: viewId,
        title: plainText('poll_modal_title'),
        submit: block.newButtonElement({
            text: plainText('poll_submit'),
        }),
        close: block.newButtonElement({
            text: plainText('poll_dismiss'),
        }),
        blocks: block.getBlocks(),
    };
}
