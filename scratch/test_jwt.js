const { AccessToken } = require('livekit-server-sdk');
const https = require('https');

const apiKey = "APIoCRJ6zVrNLK4";

// Template secret key with placeholders for the two ambiguous characters
// Index 14: placeholder {1}
// Index 28: placeholder {2}
const secretTemplate = "Abzk7T9VeFp0Jp{1}YrYsaRtFwWnsR{2}JnktmtFdMcw8TH";

const chars1 = ["l", "I", "1", "L"];
const chars2 = ["L", "l", "I", "1"];

function testValidate(token) {
  return new Promise((resolve) => {
    const url = `https://anour-rv83fs3g.livekit.cloud/rtc/v1/validate?access_token=${token}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    }).on('error', (err) => {
      resolve({ status: 500, body: err.message });
    });
  });
}

async function run() {
  const combos = [];
  for (const c1 of chars1) {
    for (const c2 of chars2) {
      combos.push({ c1, c2 });
    }
  }

  console.log(`Testing ${combos.length} key combinations...`);

  for (const combo of combos) {
    const secret = secretTemplate
      .replace("{1}", combo.c1)
      .replace("{2}", combo.c2);

    try {
      const at = new AccessToken(apiKey, secret, {
        identity: `test_${combo.c1}_${combo.c2}`,
        name: "Test"
      });
      at.addGrant({
        room: "test_room",
        roomJoin: true
      });
      const token = await at.toJwt();
      const res = await testValidate(token);
      
      console.log(`Combo {1}=${combo.c1}, {2}=${combo.c2} -> Secret: ${secret}`);
      console.log(`   Status: ${res.status} | Body: ${res.body.trim()}`);
      
      if (res.status === 200) {
        console.log(`🎉 SUCCESS! The correct secret is: ${secret}`);
        return;
      }
    } catch (e) {
      console.log(`Combo {1}=${combo.c1}, {2}=${combo.c2} failed with error:`, e.message);
    }
  }
  console.log("All combinations finished.");
}

run();
