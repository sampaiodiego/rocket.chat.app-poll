import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import {
    IUIKitViewSubmitIncomingInteraction,
} from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionTypes';

import { IModalContext, IPoll } from '../definition';
import { createPollBlocks } from './createPollBlocks';

export async function createPollMessage(data: IUIKitViewSubmitIncomingInteraction, read: IRead, modify: IModify, persistence: IPersistence, uid: string) {
    const { view: { id } } = data;
    const { state }: {
        state?: any;
    } = data.view;

    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, id);
    const [record] = await read.getPersistenceReader().readByAssociation(association) as Array<IModalContext>;

    if (!state.poll || !state.poll.question || state.poll.question.trim() === '') {
        throw { question: 'Please type your question here' };
    }

    if (!record.room) {
        throw new Error('Invalid room');
    }

    const options = Object.entries<any>(state.poll || {})
        .filter(([key]) => key !== 'question')
        .map(([, option]) => option)
        .filter((option) => option.trim() !== '');

    if (!options.length) {
        throw {
            'option-0': 'Please provide some options',
            'option-1': 'Please provide some options',
        };
    }

    if (options.length === 1) {
        if (!state.poll['option-0'] || state.poll['option-0'] === '') {
            throw {
                'option-0': 'Please provide one more option',
            };
        }
        if (!state.poll['option-1'] || state.poll['option-1'] === '') {
            throw {
                'option-1': 'Please provide one more option',
            };
        }
    }

    try {
        const { config = { mode: 'multiple', visibility: 'open', showResults: 'always' } } = state;
        const { mode = 'multiple', visibility = 'open', showResults = 'always' } = config;

        const showNames = await read.getEnvironmentReader().getSettings().getById('use-user-name');

        const builder = modify.getCreator().startMessage()
            .setUsernameAlias((showNames.value && data.user.name) || data.user.username)
            .setRoom(record.room)
            .setText(state.poll.question);

        // if poll created from inside a thread, need to set the thread id
        if (record.threadId) {
            builder.setThreadId(record.threadId);
        }

        const poll: IPoll = {
            question: state.poll.question,
            uid,
            msgId: '',
            options,
            totalVotes: 0,
            votes: options.map(() => ({ quantity: 0, voters: [] })),
            confidential: visibility === 'confidential',
            singleChoice: mode === 'single',
            showResults: showResults === 'always',
        };

        const block = modify.getCreator().getBlockBuilder();
        createPollBlocks(block, poll.question, options, poll, showNames.value);

        builder.setBlocks(block);

        const messageId = await modify.getCreator().finish(builder);
        poll.msgId = messageId;

        const pollAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, messageId);

        await persistence.createWithAssociation(poll, pollAssociation);
    } catch (e) {
        throw e;
    }
}
