import { IModify } from '@rocket.chat/apps-engine/definition/accessors';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';

import { IPoll, PollStatus } from '../../definition';

function buildVoteBar(percentage: number): string {
    const totalBlocks = 10;
    const filledBlocks = Math.round((percentage / 100) * totalBlocks);
    const emptyBlocks = totalBlocks - filledBlocks;
    const filled = '🟦'.repeat(filledBlocks);
    const empty = '⬜'.repeat(emptyBlocks);
    return filled + empty;
}

export function createResultsModal(
    poll: IPoll,
    modify: IModify,
    showVoterNames: boolean
): IUIKitModalViewParam {
    const block = modify.getCreator().getBlockBuilder();
    const isAnonymous = poll.isAnonymous || poll.confidential;

    block.addSectionBlock({
        text: block.newMarkdownTextObject(`**${poll.question}**`),
    });

    if (poll.description) {
        block.addContextBlock({
            elements: [block.newPlainTextObject(poll.description)],
        });
    }

    block.addDividerBlock();

    const sortedIndices = poll.votes
        .map((v, i) => ({ votes: v.quantity, index: i }))
        .sort((a, b) => b.votes - a.votes)
        .map(item => item.index);

    sortedIndices.forEach((index) => {
        const option = poll.options[index];
        const vote = poll.votes[index];
        const percentage = poll.totalVotes > 0
            ? ((vote.quantity / poll.totalVotes) * 100)
            : 0;

        block.addSectionBlock({
            text: block.newMarkdownTextObject(`**${option}**`),
        });

        const bar = buildVoteBar(percentage);
        block.addContextBlock({
            elements: [
                block.newPlainTextObject(`${bar} ${percentage.toFixed(2)}% (${vote.quantity})`),
            ],
        });

        if (!isAnonymous && vote.voters.length > 0) {
            const voterNames = vote.voters
                .slice(0, 10)
                .map(v => showVoterNames && v.name ? v.name : v.username)
                .join(', ');
            const moreText = vote.voters.length > 10 ? ` +${vote.voters.length - 10} more` : '';

            block.addContextBlock({
                elements: [
                    block.newPlainTextObject(`${vote.quantity} vote${vote.quantity !== 1 ? 's' : ''} – ${voterNames}${moreText}`),
                ],
            });
        }
    });

    block.addDividerBlock();

    const statusText = poll.status === PollStatus.ACTIVE ? 'Active' : 'Closed';
    const closedDate = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    block.addContextBlock({
        elements: [
            block.newPlainTextObject(`Total: ${poll.totalVotes} vote${poll.totalVotes !== 1 ? 's' : ''}  •  Status: ${statusText}`),
        ],
    });

    if (poll.status !== PollStatus.ACTIVE) {
        block.addContextBlock({
            elements: [
                block.newPlainTextObject(`Closed: ${closedDate}`),
            ],
        });
    }

    return {
        id: `results-${poll.msgId}`,
        title: block.newPlainTextObject('Poll Results'),
        close: block.newButtonElement({
            text: block.newPlainTextObject('Close'),
        }),
        blocks: block.getBlocks(),
    };
}
