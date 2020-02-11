import { BlockBuilder, BlockElementType } from '@rocket.chat/apps-engine/definition/uikit';

import { buildVoters } from '../buildOptions';
import { buildVoteGraph } from './buildVoteGraph';

import { IPoll } from '../IPoll';

export function createPollBlocks(block: BlockBuilder, question: string, options: Array<any>, poll: IPoll) {
    block.addSectionBlock({
        text: block.newPlainTextObject(question),
        ...!poll.finished && {
            accessory: {
                type: BlockElementType.OVERFLOW_MENU,
                actionId: 'finish',
                options: [
                    {
                        text: block.newPlainTextObject('Finish poll'),
                        value: 'finish'
                    }
                ],
                confirm: {
                    title: block.newPlainTextObject('Sure?'),
                    text: block.newPlainTextObject('text'),
                    confirm: block.newPlainTextObject('yes'),
                    deny: block.newPlainTextObject('no'),
                },
            },
        },
    });

    if (poll.finished) {
        block.addContextBlock({
            elements: [
                block.newMarkdownTextObject(`The poll has been finished at ${new Date().toISOString()}`),
            ]
        });
    }

    block.addDividerBlock();

    options.forEach((option, index) => {
        block.addSectionBlock({
            text: block.newPlainTextObject(option),
            accessory: {
                type: BlockElementType.BUTTON,
                actionId: 'vote',
                text: block.newPlainTextObject('Vote'),
                value: String(index),
            },
        });
        if (!poll.votes[index]) {
            return;
        }
        const voters = buildVoters(poll.votes[index], poll.totalVotes);

        const graph = buildVoteGraph(poll.votes[index], poll.totalVotes);
        block.addContextBlock({
            elements: [
                block.newMarkdownTextObject(graph),
            ],
        });

        // addVoters(poll.votes[index], poll.totalVotes)
        if (!voters) {
            return;
        }

        if (!poll.confidential) {
            block.addContextBlock({
                elements: [
                    block.newMarkdownTextObject(voters),
                ],
            });
        }
    });
    // block.addContextBlock({
    //     elements: [
    //         {
    //             type: TextObjectType.MARKDOWN,
    //             text: '2 votes - @diego.sampaio, @guilherme.gazzo',
    //         },
    //     ],
    // });
}
