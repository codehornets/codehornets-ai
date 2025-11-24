const fs = require("fs");
const os = require("os");
const path = require("path");

const configPath = path.join(os.homedir(), ".claude.json");
const c = JSON.parse(fs.readFileSync(configPath, "utf-8"));

console.log("Has oauthTokens:", !!c.oauthTokens);
console.log("Has primaryApiKey:", !!c.primaryApiKey);
console.log("Has oauthAccount:", !!c.oauthAccount);

if (c.oauthAccount) {
  console.log("Account email:", c.oauthAccount.emailAddress);
}
