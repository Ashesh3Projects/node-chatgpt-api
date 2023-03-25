import ChatBot from './poe/index.js';

const bot = new ChatBot();

const ai = 'chinchilla';

const isFormkeyAvailable = await bot.getCredentials();

if (!isFormkeyAvailable) {
    console.log('Formkey and cookie not available');

    await bot.setCredentials();

    const myEmail = 'poe@ashesh.cloud';
    const signInStatus = await bot.sendVerifCode(null, myEmail);

    let loginStatus = 'invalid_verification_code';
    const otp = 633787;
    if (signInStatus === 'user_with_confirmed_phone_number_not_found') {
        loginStatus = await bot.signUpWithVerificationCode(myEmail, null, otp);
    } else {
        loginStatus = await bot.signInOrUp(null, myEmail, otp);
    }
}

export default async function talk(input) {
    await bot.clearContext(ai);
    await bot.sendMsg(ai, input);
    const response = await bot.getResponse(ai);
    return response.data;
}