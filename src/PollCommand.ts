import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { MessageActionType } from '@rocket.chat/apps-engine/definition/messages/MessageActionType';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { IPoll } from './IPoll';

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

        const options = match.map(clearQuotes);
        const question = options.shift();

        const builder = modify.getCreator().startMessage()
            .setSender(context.getSender())
            .setRoom(context.getRoom())
            .setAvatarUrl('https://user-images.githubusercontent.com/8591547/44113440-751b9ff8-9fde-11e8-9e8c-8a555e6e382b.png')
            .setText(`_${question}_`)
            .setUsernameAlias('Poll');

        try {

            const UUID = this.UUID();
            const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, UUID);
            const poll: IPoll = {
                options,
                votes: options.map(() => 0),
                voters: [],
            };

            await persis.createWithAssociation(poll, association);

            builder.addAttachment({
                actions: options.map((option: string, index: number) => ({
                    type: MessageActionType.BUTTON,
                    text: option,
                    msg_in_chat_window: true,
                    msg: `/vote ${UUID} ${index}`,
                })),
            });

            await modify.getCreator().finish(builder);
        } catch (e) {

            builder.setText('An error occured when trying to send the gif :disappointed_relieved:');

            modify.getNotifier().notifyUser(context.getSender(), builder.getMessage());
        }
    }

    private UUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}
