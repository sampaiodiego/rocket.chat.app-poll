import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { buildOptions } from './buildOptions';
import { IPoll } from './IPoll';

export class VoteCommand implements ISlashCommand {

    public command = 'vote';
    public i18nParamsExample = 'params_example';
    public i18nDescription = 'cmd_description';
    public providesPreview = false;

    public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> {

        const args = context.getArguments().slice();

        if (!args || args.length < 2) {
            console.log('Invalid params', args);
            throw new Error('Invalid params');
        }

        const pollID = args.shift();
        const voteIndex = Number(args.shift());
        const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, pollID!);

        if (isNaN(voteIndex)) {
            console.log('Invalid index', voteIndex);
            throw new Error('Invalid index');
        }

        const polls = await read.getPersistenceReader().readByAssociation(association);

        if (!polls || polls.length < 1) {
            console.log('No poll found', polls);
            throw new Error('No poll found');
        }

        const poll = polls[0] as IPoll;

        const { username } = context.getSender();

        const hasVoted = poll.votes[voteIndex].voters.indexOf(username);

        if (hasVoted !== -1) {
            poll.totalVotes--;
            poll.votes[voteIndex].quantity--;
            poll.votes[voteIndex].voters.splice(hasVoted, 1);
        } else {
            poll.totalVotes++;
            poll.votes[voteIndex].quantity++;
            poll.votes[voteIndex].voters.push(username);
        }
        await persis.updateByAssociation(association, poll);

        const message = await modify.getUpdater().message(poll.messageId, context.getSender());
        message.setEditor(message.getSender());

        const attachments = message.getAttachments();
        attachments[0] = buildOptions(poll.options, poll);
        message.setAttachments(attachments);

        try {
            modify.getUpdater().finish(message);
        } catch (e) {
            message.setText('Could not vote :(');
            modify.getNotifier().notifyUser(context.getSender(), message.getMessage());
        }
    }
}
