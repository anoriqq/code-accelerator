const vscode = require("vscode");

module.exports.activate = function({ subscriptions }) {
  console.log('"js-acceleration" is now active');

  const on = vscode.commands.registerCommand("extension.jsa.on", () => {
    vscode.window.showInformationMessage("Activate JS Acceleration");
  });
  subscriptions.push(on);
  const off = vscode.commands.registerCommand("extension.jsa.off", () => {
    vscode.window.showInformationMessage("Deactivate JS Acceleration");
  });
  subscriptions.push(off);
};

module.exports.deactivate = function() {}
