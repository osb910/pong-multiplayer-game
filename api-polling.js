const POLL_RATE = 500;

setInterval(async () => {
  const messages = await fetch('https://api.mychatapp.com/messages');
}, POLL_RATE);
