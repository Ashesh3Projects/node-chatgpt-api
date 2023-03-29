import ChatBot from './poe/poe.cjs';

class Poe {
    static bot = new ChatBot.ChatBot();

    static async talk(input, token) {
        console.log('talking rn', input);
        const res = await this.bot.ask(input, true, token, 'chatgpt');
        console.log('talking done', res);
        return res;
    }
}

export default Poe;
