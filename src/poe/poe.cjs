/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ ChatBot)
});

;// CONCATENATED MODULE: external "cross-fetch"
const external_cross_fetch_namespaceObject = require("cross-fetch");
var external_cross_fetch_default = /*#__PURE__*/__webpack_require__.n(external_cross_fetch_namespaceObject);
;// CONCATENATED MODULE: ./src/utils/credentials.ts

const scrape = async (poe_cookie) => {
    const attempts = 5;
    for (let i = 0; i < attempts; i++) {
        try {
            const pbCookie = `p-b=${poe_cookie}`;
            const _setting = await external_cross_fetch_default()('https://poe.com/api/settings', { headers: { cookie: `${pbCookie}` } });
            if (_setting.status !== 200)
                throw new Error('Failed to fetch token');
            const appSettings = await _setting.json(), { tchannelData: { channel: channelName }, } = appSettings;
            return {
                pbCookie,
                channelName,
                appSettings,
            };
        }
        catch (e) {
            if (i === attempts - 1)
                throw e;
        }
    }
};
const getUpdatedSettings = async (channelName, pbCookie) => {
    const attempts = 5;
    for (let i = 0; i < attempts; i++) {
        try {
            const _setting = await external_cross_fetch_default()(`https://poe.com/api/settings?channel=${channelName}`, {
                headers: { cookie: `${pbCookie}` },
            });
            if (_setting.status !== 200)
                throw new Error('Failed to fetch token');
            const appSettings = await _setting.json(), { tchannelData: { minSeq: minSeq }, } = appSettings;
            return {
                minSeq,
            };
        }
        catch (e) {
            if (i === attempts - 1)
                throw e;
        }
    }
};


;// CONCATENATED MODULE: external "reconnecting-websocket"
const external_reconnecting_websocket_namespaceObject = require("reconnecting-websocket");
var external_reconnecting_websocket_default = /*#__PURE__*/__webpack_require__.n(external_reconnecting_websocket_namespaceObject);
;// CONCATENATED MODULE: external "ws"
const external_ws_namespaceObject = require("ws");
var external_ws_default = /*#__PURE__*/__webpack_require__.n(external_ws_namespaceObject);
;// CONCATENATED MODULE: external "diff"
const external_diff_namespaceObject = require("diff");
;// CONCATENATED MODULE: ./src/utils/websocket.ts



const getSocketUrl = async (credentials) => {
    const socketUrl = 'wss://' + `tch${credentials.wsHost}` + '.tch.quora.com';
    const appSettings = credentials.app_settings.tchannelData;
    const boxName = appSettings.boxName;
    const minSeq = appSettings.minSeq;
    const channel = appSettings.channel;
    const hash = appSettings.channelHash;
    return `${socketUrl}/up/${boxName}/updates?min_seq=${minSeq}&channel=${channel}&hash=${hash}`;
};
const connectWs = async (credentials) => {
    const url = await getSocketUrl(credentials);
    const ws = new (external_reconnecting_websocket_default())(url, [], {
        WebSocket: (external_ws_default()),
        debug: true,
        maxRetries: 15,
    });
    return new Promise((resolve, reject) => {
        ws.addEventListener('open', function open() {
            console.info('WS connectWs: Connected');
            return resolve(ws);
        });
    });
};
const disconnectWs = async (ws) => {
    return new Promise((resolve, reject) => {
        if (ws.readyState === 3) {
            console.info('WS disconnectWs: Already disconnected');
            return resolve(true);
        }
        ws.addEventListener('close', function close() {
            console.info('WS disconnectWs: Disconnected');
            return resolve(true);
        });
        ws.close();
    });
};
const listenWs = async (ws) => {
    let previousText = '';
    return new Promise((resolve, reject) => {
        if (ws.readyState !== 1) {
            console.error('WS listenWs: Not connected');
            return reject('WS listenWs: Not connected');
        }
        const onMessage = function incoming(data) {
            let jsonData = JSON.parse(data.data);
            console.log('WS onMessage: ', jsonData);
            if (jsonData.messages && jsonData.messages.length > 0) {
                const messages = JSON.parse(jsonData.messages[0]);
                const dataPayload = messages.payload.data;
                const text = dataPayload.messageAdded.text;
                const state = dataPayload.messageAdded.state;
                if (state !== 'complete') {
                    const differences = external_diff_namespaceObject.diffChars(previousText, text);
                    let result = '';
                    differences.forEach((part) => {
                        if (part.added) {
                            result += part.value;
                        }
                    });
                    previousText = text;
                }
                else {
                    ws.removeEventListener('message', onMessage);
                    // return complete result
                    return resolve(text);
                }
            }
        };
        ws.addEventListener('message', onMessage);
        ws.addEventListener('error', function error(e) {
            console.log('WS error: ', e);
            return reject(e);
        });
    });
};

;// CONCATENATED MODULE: external "fs"
const external_fs_namespaceObject = require("fs");
;// CONCATENATED MODULE: external "path"
const external_path_namespaceObject = require("path");
var external_path_default = /*#__PURE__*/__webpack_require__.n(external_path_namespaceObject);
;// CONCATENATED MODULE: ./src/index.ts




//const gqlDir = './node_modules/quora-poe.js/graphql';
const gqlDir = './graphql';
const queries = {
    chatViewQuery: (0,external_fs_namespaceObject.readFileSync)(external_path_default().join(gqlDir, 'ChatViewQuery.graphql'), 'utf8'),
    addMessageBreakMutation: (0,external_fs_namespaceObject.readFileSync)(external_path_default().join(gqlDir, '/AddMessageBreakMutation.graphql'), 'utf8'),
    chatPaginationQuery: (0,external_fs_namespaceObject.readFileSync)(external_path_default().join(gqlDir, '/ChatPaginationQuery.graphql'), 'utf8'),
    addHumanMessageMutation: (0,external_fs_namespaceObject.readFileSync)(external_path_default().join(gqlDir, '/AddHumanMessageMutation.graphql'), 'utf8'),
    loginMutation: (0,external_fs_namespaceObject.readFileSync)(external_path_default().join(gqlDir, '/LoginWithVerificationCodeMutation.graphql'), 'utf8'),
    signUpWithVerificationCodeMutation: (0,external_fs_namespaceObject.readFileSync)(external_path_default().join(gqlDir, '/SignupWithVerificationCodeMutation.graphql'), 'utf8'),
    sendVerificationCodeMutation: (0,external_fs_namespaceObject.readFileSync)(external_path_default().join(gqlDir, '/SendVerificationCodeForLoginMutation.graphql'), 'utf8'),
};
let [pbCookie, channelName, appSettings, formkey] = ['', '', '', ''];
class ChatBot {
    headers = {
        'Content-Type': 'application/json',
        Accept: '*/*',
        Host: 'poe.com',
        'Accept-Encoding': 'gzip, deflate, br',
        Origin: 'https://poe.com',
    };
    chatId = 0;
    bot = '';
    ws;
    credentials = {
        poe_cookie: '',
        quora_formkey: '',
        quora_cookie: '',
        channel_name: '',
        wsHost: Math.floor(Math.random() * 1e6).toString(),
        app_settings: {},
    };
    async start(poe_cookie) {
        this.credentials.poe_cookie = poe_cookie;
        await this.setCredentials();
        await this.subscribe();
        // await this.login();
        let { minSeq } = await getUpdatedSettings(channelName, pbCookie);
        this.credentials.app_settings.tchannelData.minSeq = minSeq;
        await this.subscribe();
    }
    async ask(msg, chatBreak, poe_cookie, model = 'gpt-4') {
        await this.start(poe_cookie);
        if (this.ws) {
            await disconnectWs(this.ws);
        }
        this.ws = await connectWs(this.credentials);
        if (this.ws) {
            this.ws.addEventListener('error', async (e) => {
                console.log('WS error: ', e);
                await disconnectWs(this.ws);
                this.ws = await connectWs(this.credentials);
            });
        }
        let formatModel;
        if (model === 'gpt-4') {
            formatModel = 'beaver';
        }
        else if (model === 'chatgpt') {
            formatModel = 'chinchilla';
        }
        else if (model === 'sage') {
            formatModel = 'capybara';
        }
        else if (model === 'claude+') {
            formatModel = 'a2_2';
        }
        else if (model === 'claude') {
            formatModel = 'a2';
        }
        else if (model === 'dragonfly') {
            formatModel = 'nutria';
        }
        await this.getChatId(formatModel);
        await this.sendMsg(msg, chatBreak);
        let res = await listenWs(this.ws);
        return res;
    }
    async send(messages, poe_cookie, model = 'gpt-4') {
        var prompt = '';
        for (var i = 0; i < messages.length; i++) {
            if (i == messages.length - 1) {
                prompt += `${messages[i].role}: ${messages[i].content}\n`;
            }
            else {
                prompt += `${messages[i].role}: ${messages[i].content}`;
            }
        }
        var answer = await this.ask(prompt, poe_cookie, model);
        return answer;
    }
    async makeRequest(request) {
        const attempts = 5;
        for (let i = 0; i < attempts; i++) {
            console.log(i, 'Making request: ', request);
            try {
                this.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(request), 'utf8');
                this.headers['User-Agent'] =
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Edg/111.0.1661.54';
                let response = await fetch('https://poe.com/api/gql_POST', {
                    method: 'POST',
                    headers: this.headers,
                    body: JSON.stringify(request),
                });
                console.log(i, 'Response Status: ', response.status);
                let text = response.json();
                console.log(i, 'Response Text: ', text);
                return text;
            }
            catch (e) {
                if (i === attempts - 1) {
                    throw e;
                }
            }
        }
    }
    async getChatId(bot) {
        try {
            const { data: { chatOfBot: { chatId }, }, } = await this.makeRequest({
                query: `${queries.chatViewQuery}`,
                variables: {
                    bot,
                },
            });
            this.chatId = chatId;
            this.bot = bot;
        }
        catch (e) {
            throw new Error('Could not get chat id, invalid formkey or cookie! Please remove the quora_formkey value from the config.json file and try again.');
        }
    }
    async sendMsg(query, chatBreak) {
        try {
            await this.makeRequest({
                query: `${queries.addHumanMessageMutation}`,
                variables: {
                    bot: this.bot,
                    chatId: this.chatId,
                    query: query,
                    source: null,
                    withChatBreak: chatBreak,
                },
            });
        }
        catch (e) {
            throw new Error('Could not send message');
        }
    }
    async setCredentials() {
        let result = await scrape(this.credentials.poe_cookie);
        this.credentials.quora_formkey = result.appSettings.formkey;
        this.credentials.quora_cookie = result.pbCookie;
        // For websocket later feature
        this.credentials.channel_name = result.channelName;
        this.credentials.app_settings = result.appSettings;
        // set value
        formkey = result.appSettings.formkey;
        pbCookie = result.pbCookie;
        // For websocket later feature
        channelName = result.channelName;
        appSettings = result.appSettings;
        this.headers['poe-formkey'] = formkey;
        this.headers['poe-tchannel'] = channelName;
        this.headers['Cookie'] = pbCookie;
    }
    async subscribe() {
        const query = {
            queryName: 'subscriptionsMutation',
            variables: {
                subscriptions: [
                    {
                        subscriptionName: 'messageAdded',
                        query: 'subscription subscriptions_messageAdded_Subscription(\n  $chatId: BigInt!\n) {\n  messageAdded(chatId: $chatId) {\n    id\n    messageId\n    creationTime\n    state\n    ...ChatMessage_message\n    ...chatHelpers_isBotMessage\n  }\n}\n\nfragment ChatMessageDownvotedButton_message on Message {\n  ...MessageFeedbackReasonModal_message\n  ...MessageFeedbackOtherModal_message\n}\n\nfragment ChatMessageDropdownMenu_message on Message {\n  id\n  messageId\n  vote\n  text\n  ...chatHelpers_isBotMessage\n}\n\nfragment ChatMessageFeedbackButtons_message on Message {\n  id\n  messageId\n  vote\n  voteReason\n  ...ChatMessageDownvotedButton_message\n}\n\nfragment ChatMessageOverflowButton_message on Message {\n  text\n  ...ChatMessageDropdownMenu_message\n  ...chatHelpers_isBotMessage\n}\n\nfragment ChatMessageSuggestedReplies_SuggestedReplyButton_message on Message {\n  messageId\n}\n\nfragment ChatMessageSuggestedReplies_message on Message {\n  suggestedReplies\n  ...ChatMessageSuggestedReplies_SuggestedReplyButton_message\n}\n\nfragment ChatMessage_message on Message {\n  id\n  messageId\n  text\n  author\n  linkifiedText\n  state\n  ...ChatMessageSuggestedReplies_message\n  ...ChatMessageFeedbackButtons_message\n  ...ChatMessageOverflowButton_message\n  ...chatHelpers_isHumanMessage\n  ...chatHelpers_isBotMessage\n  ...chatHelpers_isChatBreak\n  ...chatHelpers_useTimeoutLevel\n  ...MarkdownLinkInner_message\n}\n\nfragment MarkdownLinkInner_message on Message {\n  messageId\n}\n\nfragment MessageFeedbackOtherModal_message on Message {\n  id\n  messageId\n}\n\nfragment MessageFeedbackReasonModal_message on Message {\n  id\n  messageId\n}\n\nfragment chatHelpers_isBotMessage on Message {\n  ...chatHelpers_isHumanMessage\n  ...chatHelpers_isChatBreak\n}\n\nfragment chatHelpers_isChatBreak on Message {\n  author\n}\n\nfragment chatHelpers_isHumanMessage on Message {\n  author\n}\n\nfragment chatHelpers_useTimeoutLevel on Message {\n  id\n  state\n  text\n  messageId\n}\n',
                    },
                    {
                        subscriptionName: 'viewerStateUpdated',
                        query: 'subscription subscriptions_viewerStateUpdated_Subscription {\n  viewerStateUpdated {\n    id\n    ...ChatPageBotSwitcher_viewer\n  }\n}\n\nfragment BotHeader_bot on Bot {\n  displayName\n  ...BotImage_bot\n}\n\nfragment BotImage_bot on Bot {\n  profilePicture\n  displayName\n}\n\nfragment BotLink_bot on Bot {\n  displayName\n}\n\nfragment ChatPageBotSwitcher_viewer on Viewer {\n  availableBots {\n    id\n    ...BotLink_bot\n    ...BotHeader_bot\n  }\n}\n',
                    },
                ],
            },
            query: 'mutation subscriptionsMutation(\n  $subscriptions: [AutoSubscriptionQuery!]!\n) {\n  autoSubscribe(subscriptions: $subscriptions) {\n    viewer {\n      id\n    }\n  }\n}\n',
        };
        await this.makeRequest(query);
    }
}

module.exports.ChatBot = __webpack_exports__["default"];
/******/ })()
;