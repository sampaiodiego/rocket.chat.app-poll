import { BlockBuilder, BlockElementType, IBlock } from '@rocket.chat/apps-engine/definition/uikit';

import { IPoll } from '../definition';
import { buildVoteChart } from './buildVoteChart';
import { buildVoteGraph } from './buildVoteGraph';
import { buildVoters } from './buildVoters';
import { markdown, plainText } from './i18n';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Compact UTC time, e.g. "23 Jun 2026, 21:44".
function formatCloseTime(closesAt: number): string {
    const date = new Date(closesAt);
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}, ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

export function createPollBlocks(
    block: BlockBuilder,
    question: string,
    options: Array<any>,
    poll: IPoll,
    showNames: boolean,
    useChart: boolean,
): Array<IBlock> {
    const chart = useChart && (poll.showResults || poll.finished) ? buildVoteChart(poll) : undefined;

    block.addSectionBlock({
        text: block.newPlainTextObject(question),
        ...!poll.finished && {
            accessory: {
                type: BlockElementType.OVERFLOW_MENU,
                actionId: 'finish',
                options: [
                    { text: plainText('poll_finish'), value: 'finish' },
                ],
            },
        },
    });

    if (poll.finished) {
        block.addContextBlock({
            elements: [
                markdown('poll_finished_at', { date: new Date().toUTCString() }),
            ],
        });
    } else if (poll.closesAt) {
        block.addContextBlock({
            elements: [
                markdown('poll_closes_at', { time: formatCloseTime(poll.closesAt) }),
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
                    text: plainText('poll_vote'),
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

        if (!chart) {
            const graph = buildVoteGraph(poll.votes[index], poll.totalVotes);
            block.addContextBlock({
                elements: [
                    block.newMarkdownTextObject(graph),
                ],
            });
        }

        if (poll.confidential) {
            return;
        }

        const voters = buildVoters(poll.votes[index], showNames);
        if (!voters) {
            return;
        }

        block.addContextBlock({
            elements: [
                voters,
            ],
        });
    });

    // BlockBuilder can't add a data_visualization block, so it goes in raw after the options.
    return chart ? [...block.getBlocks(), chart as unknown as IBlock] : block.getBlocks();
}
