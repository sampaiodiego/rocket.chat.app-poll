import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';

import { PollApp } from '../PollApp';
import { buildOptions } from './buildOptions';
import { IPoll } from './IPoll';

export class VoteCommand implements ISlashCommand {

    public command = 'vote';
    public i18nParamsExample = 'params_example';
    public i18nDescription = 'cmd_description';
    public providesPreview = false;

    public constructor(private readonly app: PollApp) {
    }

    public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> {

        const args = context.getArguments().slice();

        if (!args || args.length < 2) {
            console.log('Invalid params', args);
            throw new Error('Invalid params');
        }

        const pollID = args.shift();
        const voteIndex = Number(args.shift());

        if (isNaN(voteIndex)) {
            console.log('Invalid index', voteIndex);
            throw new Error('Invalid index');
        }

        const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, pollID!);
        const polls = await read.getPersistenceReader().readByAssociation(association);

        if (!polls || polls.length < 1) {
            console.log('No poll found', polls);
            throw new Error('No poll found');
        }

        const poll = polls[0] as IPoll;

        const useUserName = await read.getEnvironmentReader().getSettings().getById('use-user-name');

        const displayedName = useUserName.value ? context.getSender().name : '@' + context.getSender().username;

        const hasVoted = poll.votes[voteIndex].voters.indexOf(displayedName);

        if (hasVoted !== -1) {
            poll.totalVotes--;
            poll.votes[voteIndex].quantity--;
            poll.votes[voteIndex].voters.splice(hasVoted, 1);
        } else {
            poll.totalVotes++;
            poll.votes[voteIndex].quantity++;
            poll.votes[voteIndex].voters.push(displayedName);
        }
        await persis.updateByAssociation(association, poll);

        const message = await modify.getUpdater().message(poll.msgId, context.getSender());
        message.setEditor(message.getSender());

        const attachments = message.getAttachments();
        attachments[0] = buildOptions(poll.options, poll);
        message.setAttachments(attachments);

        try {
            await modify.getUpdater().finish(message);
        } catch (e) {
            console.error('Error voting: ', e);

            this.app.getLogger().error('Error voting: ', e);

            const errorMessage = modify.getCreator().startMessage()
                .setSender(context.getSender())
                .setRoom(context.getRoom())
                .setText('Could not vote :(')
                .setUsernameAlias('Poll');
            modify.getNotifier().notifyUser(context.getSender(), errorMessage.getMessage());
        }
    }
}
