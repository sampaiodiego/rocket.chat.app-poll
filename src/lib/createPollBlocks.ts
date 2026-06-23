import { BlockBuilder, BlockElementType } from '@rocket.chat/apps-engine/definition/uikit';

import { IPoll } from '../definition';
import { buildVoteGraph } from './buildVoteGraph';
import { buildVoters } from './buildVoters';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Compact UTC time, e.g. "23 Jun 2026, 21:44".
function formatCloseTime(closesAt: number): string {
    const date = new Date(closesAt);
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}, ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

export function createPollBlocks(block: BlockBuilder, question: string, options: Array<any>, poll: IPoll, showNames: boolean) {
    block.addSectionBlock({
        text: block.newPlainTextObject(question),
        ...!poll.finished && {
            accessory: {
                type: BlockElementType.OVERFLOW_MENU,
                actionId: 'finish',
                options: [
                    {
                        text: block.newPlainTextObject('Finish poll'),
                        value: 'finish',
                    },
                ],
            },
        },
    });

    if (poll.finished) {
        block.addContextBlock({
            elements: [
                block.newMarkdownTextObject(`The poll has been finished at ${new Date().toUTCString()}`),
            ],
        });
    } else if (poll.closesAt) {
        block.addContextBlock({
            elements: [
                block.newMarkdownTextObject(`⏰ Closes ${formatCloseTime(poll.closesAt)} UTC`),
            ],
        });
    }

    block.addDividerBlock();

    options.forEach((option, index) => {
        block.addSectionBlock({
            text: block.newPlainTextObject(option),
            ...!poll.finished && {
                    accessory: {
                    type: BlockElementType.BUTTON,
                    actionId: 'vote',
                    text: block.newPlainTextObject('Vote'),
                    value: String(index),
                },
            },
        });

        if (!poll.votes[index]) {
            return;
        }

        if (!poll.showResults && !poll.finished) {
            return;
        }

        const graph = buildVoteGraph(poll.votes[index], poll.totalVotes);
        block.addContextBlock({
            elements: [
                block.newMarkdownTextObject(graph),
            ],
        });

        if (poll.confidential) {
            return;
        }

        const voters = buildVoters(poll.votes[index], showNames);
        if (!voters) {
            return;
        }

        block.addContextBlock({
            elements: [
                block.newMarkdownTextObject(voters),
            ],
        });
    });
}
