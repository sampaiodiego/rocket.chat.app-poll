import { BlockBuilder, BlockElementType } from '@rocket.chat/apps-engine/definition/uikit';

import { IPoll, PollStatus, VoteMode } from '../../definition';

function buildVoteBar(percentage: number): string {
    const totalBlocks = 10;
    const filledBlocks = Math.round((percentage / 100) * totalBlocks);
    const emptyBlocks = totalBlocks - filledBlocks;
    const filled = '🟦'.repeat(filledBlocks);
    const empty = '⬜'.repeat(emptyBlocks);
    return filled + empty;
}

export function createPollBlocks(
    block: BlockBuilder,
    question: string,
    options: string[],
    poll: IPoll,
    showNames: boolean
): void {
    const isActive = poll.status === PollStatus.ACTIVE && !poll.finished;
    const isSingleChoice = poll.voteMode === VoteMode.SINGLE || poll.singleChoice;
    const isAnonymous = poll.isAnonymous || poll.confidential;
    const hasMultipleRounds = poll.totalRounds > 1;

    block.addSectionBlock({
        text: block.newMarkdownTextObject(`**${question}**`),
    });

    if (!isActive) {
        const closedDate = new Date().toLocaleString('en-GB', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'long',
        });
        block.addContextBlock({
            elements: [
                block.newPlainTextObject(`The poll has been finished at ${closedDate}`),
            ],
        });
    }

    block.addDividerBlock();

    options.forEach((option, index) => {
        const vote = poll.votes[index];
        const voteCount = vote?.quantity || 0;
        const percentage = poll.totalVotes > 0
            ? ((voteCount / poll.totalVotes) * 100)
            : 0;

        block.addSectionBlock({
            text: block.newMarkdownTextObject(`**${option}**`),
            ...(isActive ? {
                accessory: {
                    type: BlockElementType.BUTTON,
                    actionId: 'vote',
                    text: block.newPlainTextObject('Vote'),
                    value: String(index),
                },
            } : {}),
        });

        const bar = buildVoteBar(percentage);
        block.addContextBlock({
            elements: [
                block.newPlainTextObject(`${bar} ${percentage.toFixed(2)}% (${voteCount})`),
            ],
        });

        if (!isAnonymous && vote?.voters && vote.voters.length > 0) {
            const voterList = vote.voters
                .slice(0, 5)
                .map(v => showNames && v.name ? v.name : v.username)
                .join(', ');
            const moreText = vote.voters.length > 5 ? '...' : '';

            block.addContextBlock({
                elements: [
                    block.newPlainTextObject(`${voteCount} vote${voteCount !== 1 ? 's' : ''} - ${voterList}${moreText}`),
                ],
            });
        }
    });

    block.addDividerBlock();

    const infoItems: string[] = [];
    infoItems.push(`${poll.totalVotes} vote${poll.totalVotes !== 1 ? 's' : ''} total`);
    if (isSingleChoice) infoItems.push('Single choice');
    if (isAnonymous) infoItems.push('Anonymous');
    if (hasMultipleRounds) infoItems.push(`Round ${poll.currentRound}/${poll.totalRounds}`);

    block.addContextBlock({
        elements: [block.newPlainTextObject(infoItems.join('  •  '))],
    });

    if (isActive) {
        const actionElements: any[] = [
            block.newButtonElement({
                actionId: 'finish',
                text: block.newPlainTextObject('Finish poll'),
                value: 'finish',
            }),
        ];

        if (hasMultipleRounds && poll.currentRound < poll.totalRounds) {
            actionElements.push(
                block.newButtonElement({
                    actionId: 'nextRound',
                    text: block.newPlainTextObject('Next round'),
                    value: 'nextRound',
                })
            );
        }

        actionElements.push(
            block.newButtonElement({
                actionId: 'export',
                text: block.newPlainTextObject('Export'),
                value: 'export',
            })
        );

        block.addActionsBlock({
            blockId: 'pollActions',
            elements: actionElements,
        });
    } else {
        block.addActionsBlock({
            blockId: 'pollActions',
            elements: [
                block.newButtonElement({
                    actionId: 'export',
                    text: block.newPlainTextObject('Export results'),
                    value: 'export',
                }),
            ],
        });
    }
}
