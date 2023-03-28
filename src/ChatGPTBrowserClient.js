import './fetch-polyfill.js';
import crypto from 'crypto';
import Keyv from 'keyv';

import {
    ProxyAgent,
} from 'undici';
import Poe from './poe.js';

export default class ChatGPTBrowserClient {
    constructor(
        options = {},
        cacheOptions = {},
    ) {
        console.log("calling init inside ChatGPTBrowserClient", options.accessToken);
        Poe.init(options.accessToken);
        this.setOptions(options);

        cacheOptions.namespace = cacheOptions.namespace || 'chatgpt-browser';
        this.conversationsCache = new Keyv(cacheOptions);
    }

    setOptions(options) {
        if (this.options && !this.options.replaceOptions) {
            this.options = {
                ...this.options,
                ...options,
            };
        } else {
            this.options = options;
        }
        this.accessToken = this.options.accessToken;
        this.cookies = this.options.cookies;
        this.model = this.options.model || 'text-davinci-002-render-sha';
    }

    async postConversation(conversation, onProgress, abortController = null) {
        const {
            action = 'next',
                conversationId,
                parentMessageId = crypto.randomUUID(),
                message,
        } = conversation;

        if (!abortController) {
            abortController = new AbortController();
        }

        const {
            debug,
        } = this.options;
        const url = this.options.reverseProxyUrl || 'https://chat.openai.com/backend-api/conversation';
        const opts = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.accessToken}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
                Cookie: this.cookies || undefined,
            },

            body: JSON.stringify({
                conversation_id: conversationId,
                action,
                messages: message ? [{
                    id: message.id,
                    role: 'user',
                    content: {
                        content_type: 'text',
                        parts: [message.message],
                    },
                }] : undefined,
                parent_message_id: parentMessageId,
                model: this.model,
            }),
        };

        if (this.options.proxy) {
            opts.dispatcher = new ProxyAgent(this.options.proxy);
        }

        if (debug) {
            console.debug();
            console.debug(url);
            console.debug(opts);
            console.debug();
        }

        // data: {"message": {"id": "UUID", "role": "assistant", "user": null, "create_time": null, "update_time": null, "content": {"content_type": "text", "parts": ["That's alright! If you don't have a specific question or topic in mind, I can suggest some general conversation starters or topics to explore. \n\nFor example, we could talk about your interests, hobbies, or goals. Alternatively, we could discuss current events, pop culture, or science and technology. Is there anything in particular that you're curious about or would like to learn more about?"]}, "end_turn": true, "weight": 1.0, "metadata": {"message_type": "next", "model_slug": "text-davinci-002-render-sha", "finish_details": {"type": "stop", "stop": "<|im_end|>"}}, "recipient": "all"}, "conversation_id": "UUID", "error": null}
        // eslint-disable-next-line no-async-promise-executor
        const response = await new Promise(async (resolve, reject) => {
            try {
                resolve({
                    message: await Poe.talk(message.message),
                    conversation_id: Math.random().toString(36).substring(7),
                });
            } catch (err) {
                reject(err);
            }
        });

        if (!conversationId) {
            this.genTitle(response);
        }

        return response;
    }

    async sendMessage(
        message,
        opts = {},
    ) {
        if (opts.clientOptions && typeof opts.clientOptions === 'object') {
            this.setOptions(opts.clientOptions);
        }

        let {
            conversationId,
        } = opts;
        const parentMessageId = opts.parentMessageId || crypto.randomUUID();

        let conversation;
        if (conversationId) {
            conversation = await this.conversationsCache.get(conversationId);
        }
        if (!conversation) {
            conversation = {
                messages: [],
                createdAt: Date.now(),
            };
        }

        const userMessage = {
            id: crypto.randomUUID(),
            parentMessageId,
            role: 'User',
            message,
        };

        conversation.messages.push(userMessage);

        const result = await this.postConversation({
                conversationId,
                parentMessageId,
                message: userMessage,
            },
            opts.onProgress || (() => {}),
            opts.abortController || new AbortController(),
        );

        if (this.options.debug) {
            console.debug(JSON.stringify(result));
            console.debug();
        }

        conversationId = result.conversation_id;
        const reply = result.message;

        const replyMessage = {
            id: crypto.randomUUID(),
            parentMessageId: userMessage.id,
            role: 'ChatGPT',
            message: reply,
        };

        conversation.messages.push(replyMessage);

        await this.conversationsCache.set(conversationId, conversation);

        return {
            response: replyMessage.message,
            conversationId,
            parentMessageId: replyMessage.parentMessageId,
            messageId: replyMessage.id,
            details: result,
        };
    }

    genTitle(event) {
        return;
        const {
            debug,
        } = this.options;
        if (debug) {
            console.log('Generate title: ', event);
        }
        if (!event || !event.conversation_id || !event.message || !event.message.id) {
            return;
        }

        const conversationId = event.conversation_id;
        const messageId = event.message.id;

        const baseUrl = this.options.reverseProxyUrl || 'https://chat.openai.com/backend-api/conversation';
        const url = `${baseUrl}/gen_title/${conversationId}`;
        const opts = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.accessToken}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
                Cookie: this.cookies || undefined,
            },
            body: JSON.stringify({
                message_id: messageId,
                model: this.model,
            }),
        };

        if (this.options.proxy) {
            opts.dispatcher = new ProxyAgent(this.options.proxy);
        }

        if (debug) {
            console.debug(url, opts);
        }

        fetch(url, opts).then(async (ret) => {
            if (debug) {
                const data = await ret.text();
                console.log('Gen title response: ', data);
            }
        }).catch(console.error);
    }
}