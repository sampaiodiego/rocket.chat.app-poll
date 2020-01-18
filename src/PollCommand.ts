import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { createPollModal } from './lib/createPollModal';

export class PollCommand implements ISlashCommand {

    public command = 'poll';
    public i18nParamsExample = 'params_example';
    public i18nDescription = 'cmd_description';
    public providesPreview = false;

    public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> {
        const triggerId = context.getTriggerId();

        console.log('app', context.getRoom());

        const question = context.getArguments().join(" ");

        if (triggerId) {
            const modal = await createPollModal({ question, persistence: persis, modify, data: { room: (context.getRoom() as any).value } });

            await modify.getUiController().openModalView(modal, { triggerId }, context.getSender());
        }
    //     console.log(context);
    //
    //     const room = context.getRoom();
    //
    //     const builder = modify.getCreator().startMessage()
    //         .setSender(context.getSender())
    //         .setRoom(context.getRoom())
    //         // .setText('Choose an action')
    //         .setAvatarUrl(avatarURL)
    //         .setUsernameAlias('Poll');
    //
    //     const block = modify.getCreator().getBlockBuilder();
    //
    //     block.addSectionBlock({
    //         text: {
    //             type: TextObjectType.PLAINTEXT,
    //             text: 'Choose an action',
    //         },
    //     });
    //
    //     block.addActionsBlock({
    //         elements: [
    //             {
    //                 type: BlockElementType.BUTTON,
    //                 text: {
    //                     type: TextObjectType.PLAINTEXT,
    //                     text: 'Create poll',
    //                 },
    //                 actionId: 'create',
    //                 value: room.id,
    //             } as IButtonElement,
    //             // {
    //             //     type: BlockElementType.BUTTON,
    //             //     text: {
    //             //         type: TextObjectType.PLAINTEXT,
    //             //         text: 'Show results',
    //             //     },
    //             //     actionId: 'result',
    //             //     value: 'show',
    //             // } as IButtonElement,
    //         ],
    //     });
    //
    //     builder.setBlocks(block);
    //
    //     modify.getNotifier().notifyUser(context.getSender(), builder.getMessage());
    }

    private UUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}
