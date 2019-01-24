import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { IPoll } from './IPoll';

const clearQuotes = (item) => item.replace(/(^['"]|['"]$)/g, '');

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

        const builder = modify.getCreator().startMessage()
            .setSender(context.getSender())
            .setRoom(context.getRoom())
            .setAvatarUrl('https://user-images.githubusercontent.com/8591547/44113440-751b9ff8-9fde-11e8-9e8c-8a555e6e382b.png')
            .setUsernameAlias('Poll');

        const sendError = (error: string) => {
            builder.setText(error);
            modify.getNotifier().notifyUser(context.getSender(), builder.getMessage());
        };

        const userID = context.getSender().id;

        if (poll.voters.includes(userID)) {
            return sendError(`You can't vote twice, *@${context.getSender().username}*`!);
        }

        poll.votes[voteIndex] += 1;
        poll.voters.push(userID);
        await persis.updateByAssociation(association, poll);

        const results = poll.options.map((option: string, index: number) => `${option} - *${poll.votes[index]}*`);
        const text = `Poll results:\n${results.join('\n')}`;

        builder.setText(text);

        try {
            await modify.getCreator().finish(builder);
        } catch (e) {
            return sendError('Could not vote :(');
        }
    }
}
