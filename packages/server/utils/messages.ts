import db from "db";
import {
    messages,
    users,
    attachments,
    messageChannels,
    Attachment,
} from "db/schema";
import { requireOne } from "db/utils";
import { and, eq, lt, desc, gt } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { pick } from "shared/common";
import { z } from "zod";
import {
    AttachmentType,
    UploadAttachment,
    contentSchema,
    uploadAttachmentSchema,
} from "shared/schema/chat";
import { createId } from "@paralleldrive/cuid2";
import ogs from "open-graph-scraper";

const userProfileKeys = ["id", "name", "image"] as const;

export function fetchMessages(
    channel: string,
    count: number,
    after?: number,
    before?: number
) {
    const reply_message = alias(messages, "reply_message");
    const reply_user = alias(users, "reply_user");
    const userProfileKeys = ["id", "name", "image"] as const;

    return db
        .select({
            ...(messages as typeof messages._.columns),
            author: pick(users, ...userProfileKeys),
            attachment: attachments,
            reply_message: pick(reply_message, "content"),
            reply_user: pick(reply_user, ...userProfileKeys),
        })
        .from(messages)
        .where(
            and(
                eq(messages.channel_id, channel),
                after != null ? gt(messages.id, after) : undefined,
                before != null ? lt(messages.id, before) : undefined
            )
        )
        .leftJoin(users, eq(users.id, messages.author_id))
        .leftJoin(attachments, eq(attachments.id, messages.attachment_id))
        .leftJoin(reply_message, eq(messages.reply_id, reply_message.id))
        .leftJoin(reply_user, eq(reply_message.author_id, reply_user.id))
        .orderBy(desc(messages.timestamp))
        .limit(count);
}

export const messageSchema = z
    .object({
        channelId: z.string(),
        content: contentSchema,
        attachment: uploadAttachmentSchema.optional(),
        reply: z.number().optional(),
        nonce: z.number().optional(),
    })
    .refine(
        ({ content, attachment }) => content.length !== 0 || attachment != null,
        "Message is empty"
    );

export type Embed = {
    url: string;
    title: string;
    description?: string;
    image?: string;
};

export async function createMessage(
    input: z.infer<typeof messageSchema>,
    author_id: string
) {
    const attachment = insertAttachment(input.attachment);
    const url_regex = /(https?:\/\/[^\s]+)/g;
    const url_result = input.content.match(url_regex);

    const embeds: Embed[] = [];
    if (url_result != null) {
        for (const url of url_result) {
            console.log(url_result);
            const { result, error } = await ogs({ url: url });

            if (!error && result.ogTitle != null) {
                embeds.push({
                    title: result.ogTitle,
                    url: result.ogUrl ?? url,
                    description:
                        result.ogDescription ??
                        result.dcDescription ??
                        result.twitterDescription,
                    image: result.ogImage?.[0]?.url,
                });
            }
        }
    }

    const message_id = await db
        .insert(messages)
        .values({
            author_id: author_id,
            content: input.content,
            channel_id: input.channelId,
            attachment_id: attachment?.id ?? null,
            reply_id: input.reply,
            embeds: embeds.length === 0 ? null : embeds,
        })
        .then((res) => Number(res.insertId));

    const reply_message = alias(messages, "reply_message");
    const reply_user = alias(users, "reply_user");

    const message = await db
        .select({
            ...(messages as typeof messages._.columns),
            reply_message: pick(reply_message, "content"),
            reply_user: pick(reply_user, ...userProfileKeys),
            author: pick(users, ...userProfileKeys),
        })
        .from(messages)
        .where(eq(messages.id, message_id))
        .innerJoin(users, eq(users.id, messages.author_id))
        .leftJoin(reply_message, eq(reply_message.id, messages.reply_id))
        .leftJoin(reply_user, eq(reply_message.author_id, reply_user.id))
        .then((res) => requireOne(res));

    db.update(messageChannels)
        .set({
            last_message_id: message.id,
        })
        .where(eq(messageChannels.id, message.channel_id))
        .execute();

    return { ...message, attachment, embeds };
}

function insertAttachment(
    attachment: UploadAttachment | null | undefined
): AttachmentType | null {
    if (attachment == null) return null;

    const values: Attachment = {
        ...attachment,
        id: createId(),
        width: attachment.width ?? null,
        height: attachment.height ?? null,
    };

    db.insert(attachments)
        .values({ ...values })
        .execute();

    return values;
}