import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { BlockElementType, IButtonElement, TextObjectType } from '@rocket.chat/apps-engine/definition/uikit';

const clearQuotes = (item) => item.replace(/(^['"]|['"]$)/g, '');

const avatarURL = 'https://user-images.githubusercontent.com/8591547/44113440-751b9ff8-9fde-11e8-9e8c-8a555e6e382b.png';

export class PollCommand implements ISlashCommand {

    public command = 'poll';
    public i18nParamsExample = 'params_example';
    public i18nDescription = 'cmd_description';
    public providesPreview = false;

    public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> {

        const room = context.getRoom();

        const builder = modify.getCreator().startMessage()
            .setSender(context.getSender())
            .setRoom(context.getRoom())
            // .setText('Choose an action')
            .setAvatarUrl(avatarURL)
            .setUsernameAlias('Poll');

        const block = modify.getCreator().getBlockBuilder();

        block.addSectionBlock({
            text: {
                type: TextObjectType.PLAINTEXT,
                text: 'Choose an action',
            },
        });

        block.addActionsBlock({
            elements: [
                {
                    type: BlockElementType.BUTTON,
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: 'Create poll',
                    },
                    actionId: 'create',
                    value: room.id,
                } as IButtonElement,
                // {
                //     type: BlockElementType.BUTTON,
                //     text: {
                //         type: TextObjectType.PLAINTEXT,
                //         text: 'Show results',
                //     },
                //     actionId: 'result',
                //     value: 'show',
                // } as IButtonElement,
            ],
        });

        builder.setBlocks(block);

        modify.getNotifier().notifyUser(context.getSender(), builder.getMessage());
    }

    private UUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}
