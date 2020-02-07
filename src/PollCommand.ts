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

        // console.log('app', context.getRoom());

        const question = context.getArguments().join(' ');

        if (triggerId) {
            const modal = await createPollModal({ question, persistence: persis, modify, data: { room: (context.getRoom() as any).value } });

            await modify.getUiController().openModalView(modal, { triggerId }, context.getSender());
        }
    }
}
