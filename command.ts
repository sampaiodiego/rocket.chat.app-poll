import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-ts-definition/accessors';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-ts-definition/slashcommands';

const emojis = [
    ':zero:',
    ':one:',
    ':two:',
    ':three:',
    ':four:',
    ':five:',
    ':six:',
    ':seven:',
    ':eight:',
    ':nine:',
    ':keycap_ten:',
];

const clearQuotes = (item) => item.replace(/(^['"]|['"]$)/g, '');

export class PollCommand implements ISlashCommand {
    public command = 'poll';
    public i18nParamsExample = 'params_example';
    public i18nDescription = 'cmd_description';
    public providesPreview = false;

    public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> {
        const params = context.getArguments().join(' ');
        const match = params.match(/((["'])(?:(?=(\\?))\3.)*?\2)/g);

        if (!match) {
            throw new Error('Invalid params');
        }

        // let question;
        // const options: Array<string> = [];

        const options = match.map(clearQuotes);
        const question = options.shift();

        // match.forEach((item, i) => {
        //     const clearItem = item.replace(/(^['"]|['"]$)/g, '');
        //     if (i === 0) {
        //       question = clearItem;
        //     } else {
        //       options.push(`${ emojis[(options.length + 1)] } ${ clearItem }`);
        //     }
        // });

        const builder = modify.getCreator().startMessage()
            .setSender(context.getSender())
            .setRoom(context.getRoom())
            .setAvatarUrl('https://user-images.githubusercontent.com/8591547/44113440-751b9ff8-9fde-11e8-9e8c-8a555e6e382b.png')
            .setText('_Please vote using reactions_')
            .setUsernameAlias('Poll');

        try {
            builder.addAttachment({
                color: '#73a7ce',
                title: {
                    value: question,
                },
                text: options.map((option, index) => `${ emojis[index + 1] } ${ option }`).join('\n'),
            });

            await modify.getCreator().finish(builder);
        } catch (e) {
            // this.app.getLogger().error('Failed getting a gif', e);
            builder.setText('An error occured when trying to send the gif :disappointed_relieved:');

            modify.getNotifer().notifyUser(context.getSender(), builder.getMessage());
        }
    }
}
