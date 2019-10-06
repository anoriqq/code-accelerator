const { window, workspace, commands, Disposable } = require("vscode");
const { throttle, sum } = require("lodash");
const configuration = workspace.getConfiguration("code-accelerator");

const COMMANDS = {
  INFO: "code-accelerator.info",
  RESET: "code-accelerator.reset"
};
const ALERT_MESSAGE = "つまずいていることがあれば､誰かに相談しよう!";
const MESSAGE_ITEMS = {
  CANCEL: {
    TITLE: "問題ない",
    MESSAGE: "Great!!"
  },
  RESOLVED: {
    TITLE: "解決した",
    MESSAGE: "Cool!!"
  }
};
const WAIT = 1000 * configuration.get("waitTimeRangeSec");
const NUMBER_OF_SECTIONS = configuration.get("numberOfSections");
const THRESHOLD = configuration.get("alertThreshold");

module.exports.activate = function({ subscriptions }) {
  const counter = new Counter();
  subscriptions.push(counter);
  subscriptions.push(new CounterController(counter));

  subscriptions.push(
    commands.registerCommand(COMMANDS.INFO, () => {
      window.showInformationMessage(
        `Stack points is ${counter.stackPoints} / ${THRESHOLD}`
      );
    })
  );

  subscriptions.push(
    commands.registerCommand(COMMANDS.RESET, () => {
      counter.init();
      window.showInformationMessage(`Stack points reset`);
    })
  );
};

module.exports.deactivate = function() {};

class Counter {
  constructor() {
    this.latestStatus = new Array(NUMBER_OF_SECTIONS).fill(0);
    this.stackPoints = sum(this.latestStatus);
    this.isActiveSection = false;
    this.interval = null;

    this.init();
  }

  init() {
    if (this.interval) clearInterval(this.interval);
    this.latestStatus.fill(0);
    this.updateStackPoints();
    this.interval = setInterval(this.checkSectionStatus, WAIT, this);
  }

  activateSection() {
    this.isActiveSection = true;
  }

  inactivateSection() {
    this.isActiveSection = false;
  }

  pushActiveStatus() {
    this.latestStatus.shift();
    this.latestStatus.push(0);
    this.updateStackPoints();
  }

  pushInactiveStatus() {
    this.latestStatus.shift();
    this.latestStatus.push(1);
    this.updateStackPoints();
  }

  updateStackPoints() {
    this.stackPoints = sum(this.latestStatus);
  }

  checkSectionStatus(_this) {
    if (_this.isActiveSection) _this.pushActiveStatus();
    else _this.pushInactiveStatus();
    _this.inactivateSection();

    if (_this.stackPoints >= THRESHOLD) _this.alert();
  }

  async alert() {
    const items = Object.keys(MESSAGE_ITEMS).map(key => {
      return MESSAGE_ITEMS[key].TITLE;
    });
    const selection = await window.showInformationMessage(
      ALERT_MESSAGE,
      ...items
    );
    for (const key of Object.keys(MESSAGE_ITEMS)) {
      if (MESSAGE_ITEMS[key].TITLE === selection) {
        window.showInformationMessage(MESSAGE_ITEMS[key].MESSAGE);
        return;
      }
    }
  }
}

class CounterController {
  constructor(counter) {
    this._counter = counter;

    let subscriptions = [];
    this._onEvent = throttle(this.activateSection, WAIT, {
      trailing: false
    });
    window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);
    workspace.onDidChangeTextDocument(this._onEvent, this, subscriptions);

    this._disposable = Disposable.from(...subscriptions);
  }

  activateSection() {
    this._counter.activateSection();
  }
}
