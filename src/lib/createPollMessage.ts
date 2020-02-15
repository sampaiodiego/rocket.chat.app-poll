import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUIKitViewSubmitIncomingInteraction } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionTypes';
import { IPoll } from '../IPoll';
import { createPollBlocks } from './createPollBlocks';

export async function createPollMessage(data: IUIKitViewSubmitIncomingInteraction, read: IRead, modify: IModify, persistence: IPersistence, uid: string) {
    // console.log('data ->', data);

    const { view: { id } } = data;
    const { state }: {
        state?: any;
    } = data.view;
    // console.log('state ->', state);
    // console.log('poll ->', value);
    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, id);
    const [record] = await read.getPersistenceReader().readByAssociation(association) as Array<{
        room: IRoom;
    }>;

    if (!state.poll || !state.poll.question || state.poll.question.trim() === '') {
        throw { question: 'Please type your question here' };
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
        throw {
            'option-1': 'Please provide one more option',
        };
    }

    // console.log('options ->', options);
    try {
        const { config = { mode: 'multiple', visibility: 'open' } } = state;
        const { mode = 'multiple', visibility = 'open' } = config;

        const showNames = await read.getEnvironmentReader().getSettings().getById('use-user-name');

        const builder = modify.getCreator().startMessage()
            // .setSender(data.user)
            .setUsernameAlias((showNames.value && data.user.name) || data.user.username)
            .setRoom(record.room)
            // .setAvatarUrl('https://user-images.githubusercontent.com/8591547/44113440-751b9ff8-9fde-11e8-9e8c-8a555e6e382b.png')
            .setText(state.poll.question);

        const poll: IPoll = {
            question: state.poll.question,
            uid,
            msgId: '',
            options,
            totalVotes: 0,
            votes: options.map(() => ({ quantity: 0, voters: [] })),
            confidential: visibility === 'confidential',
            singleChoice: mode === 'single',
        };

        const block = modify.getCreator().getBlockBuilder();
        createPollBlocks(block, poll.question, options, poll, showNames.value);

        // console.log('setBlocks')

        builder.setBlocks(block);
        // console.log('finish')

        const messageId = await modify.getCreator().finish(builder);
        // console.log('done')
        poll.msgId = messageId;

        const pollAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, messageId);
        // console.log('save')
        await persistence.createWithAssociation(poll, pollAssociation);
    } catch (e) {
        throw e;
    }
}
