// ============================
// 1️⃣ BACKEND (Node.js + Express)
// ============================
// File: server.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = 8080;

const TELEGRAM_BOT_TOKEN = '8115048642:AAGYjFR4LHgmJWjUoNZJ77o452Mr1IoSE1s';
const TELEGRAM_CHAT_ID = '4966626762';
const axios = require('axios');

app.use(cors());
app.use(bodyParser.json());

let loginRequests = {}; // Key: email, Value: { status, studio, time, deviceID }

app.post('/request-access', async (req, res) => {
    const { email, studio, deviceID } = req.body;
    const timestamp = new Date().toLocaleString();

    loginRequests[email] = { status: 'pending', studio, deviceID, timestamp };

    const message = `🛂 *New Login Request*\n👨‍🏫 Email: ${email}\n🏢 Studio: ${studio}\n🖥️ Device: ${deviceID}\n⏰ Time: ${timestamp}`;

    const approveButton = {
        text: '✅ Approve',
        callback_data: `approve_${email}`
    };
    const rejectButton = {
        text: '❌ Reject',
        callback_data: `reject_${email}`
    };

    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[approveButton, rejectButton]]
        }
    });

    res.json({ message: 'Request sent to admin' });
});

app.get('/check-status', (req, res) => {
    const { email } = req.query;
    if (!loginRequests[email]) return res.json({ status: 'not_found' });
    res.json({ status: loginRequests[email].status });
});

app.post('/bot-callback', (req, res) => {
    const callback = req.body.callback_query;
    const action = callback.data.split('_')[0];
    const email = callback.data.split('_')[1];

    if (loginRequests[email]) {
        loginRequests[email].status = action === 'approve' ? 'approved' : 'rejected';

        axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
            callback_query_id: callback.id,
            text: `You ${action}d ${email}`
        });
    }

    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
});
