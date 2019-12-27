import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';

import { IPoll } from '../IPoll';
import { createPollBlocks } from './createPollBlocks';

export async function createPollMessage(data, read: IRead, modify: IModify, persistence: IPersistence) {
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
    const options = Object.entries<any>(state.poll)
        .filter(([key]) => key !== 'question')
        .map(([, question]) => question);

    // console.log('options ->', options);
    try {

        // console.log('context ->', context);
        const builder = modify.getCreator().startMessage()
            .setSender(data.user)
            .setRoom(record.room);
            // .setAvatarUrl('https://user-images.githubusercontent.com/8591547/44113440-751b9ff8-9fde-11e8-9e8c-8a555e6e382b.png')
            // .setText(`_${state.poll.question}_`)
            // .setUsernameAlias('Poll');

        const poll: IPoll = {
            question: state.poll.question,
            msgId: '',
            options,
            totalVotes: 0,
            votes: options.map(() => ({ quantity: 0, voters: [] })),
        };

        // console.log('poll ->', poll);

        const block = modify.getCreator().getBlockBuilder();
        createPollBlocks(block, poll.question, options, poll);

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
        console.log('error ->', e);
        // builder.setText('An error occured when trying to send the gif :disappointed_relieved:');
        // modify.getNotifier().notifyUser(context.getSender(), builder.getMessage());
    }
}
