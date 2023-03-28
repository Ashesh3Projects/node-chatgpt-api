import ChatBot from './poe/poe.cjs';

class Poe {
    static state = 'stopped';

    static tries = 0;

    static tries2 = 0;

    static bot = new ChatBot.ChatBot();

    static token = '';

    static async init(accessToken) {
        if (!accessToken) throw new Error('No access token provided.');
        for (let i = 0; i <= 5; i++) {
            try {
                this.token = accessToken;
                console.log('[init]poe status: ', this.state);
                if (this.state !== 'stopped') return 0;
                console.log('init inside poe.js');
                this.state = 'starting';
                await this.bot.start(accessToken);
                this.state = 'started';
                this.tries2 = 0;
                return 0;
            } catch (e) {
                this.tries2 += 1;
                this.init(this.token);
                if (this.tries2 > 5) {
                    this.state = 'stopped';
                    throw new Error('Poe is down. Please try again later.');
                }
            }
        }
    }

    static async talk(input) {
        for (let i = 0; i <= 5; i++) {
            try {
                console.log('[talk]poe status: ', this.state);
                if (this.state === 'starting') {
                    console.log('waiting for poe to start');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return this.talk(input);
                }
                if (this.state !== 'started') {
                    throw new Error('Poe not started');
                }
                console.log('talking rn', input);
                const res = await this.bot.ask(input, true, 'chatgpt');
                console.log('talking done', res);
                this.tries = 0;
                return res;
            } catch (e) {
                this.tries += 1;
                this.init(this.token);
                if (this.tries > 5) {
                    this.state = 'stopped';
                    throw new Error('Poe is down. Please try again later.');
                }
            }
        }
    }
}

export default Poe;
