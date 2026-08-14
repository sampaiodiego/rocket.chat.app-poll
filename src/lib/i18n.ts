import { ITextObject } from '@rocket.chat/apps-engine/definition/uikit';
import { en } from './en';

type Args = { [key: string]: string | number };

// Builds a UIKit text object that the client translates per viewer via `i18n.key`
// Web clients resolve `i18n.key` for locale-aware display; mobile clients fall back
// to `text`, so we set it to the English string rather than the bare key.
function textObject(type: 'plain_text' | 'mrkdwn', key: string, args?: Args): ITextObject {
    const i18n = type === 'plain_text' ? { key, ...(args && { args }) } : undefined;
    return { type, text: en[key], ...(i18n && { i18n }) } as ITextObject;
}

export function plainText(key: string, args?: Args): ITextObject {
    return textObject('plain_text', key, args);
}

export function markdown(key: string, args?: Args): ITextObject {
    return textObject('mrkdwn', key, args);
}
