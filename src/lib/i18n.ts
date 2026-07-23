import { ITextObject } from '@rocket.chat/apps-engine/definition/uikit';

type Args = { [key: string]: string | number };

// Builds a UIKit text object that the client translates per viewer via `i18n.key`
// (interpolating `args`). `text` is only a fallback shown if the key fails to
// resolve, so we pass the key itself — en.json always ships, so it never shows.
function textObject(type: 'plain_text' | 'mrkdwn', key: string, args?: Args): ITextObject {
    return { type, text: key, i18n: { key, ...(args && { args }) } } as ITextObject;
}

export function plainText(key: string, args?: Args): ITextObject {
    return textObject('plain_text', key, args);
}

export function markdown(key: string, args?: Args): ITextObject {
    return textObject('mrkdwn', key, args);
}
