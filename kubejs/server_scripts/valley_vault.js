// Valley: the community center vault takes money from the bank account instead of coins (decision 31).
// Each vault quest has a custom task; its submit button pays the amount and completes the task.
const valleyVaultTasks = {
  "22FC2E88EA6ABB6A": 2048,
  "393D8C55AE6556DC": 8192,
  "3E532DD7361F4599": 16384,
  "4FE5D5E3C4364207": 24576,
};

Object.keys(valleyVaultTasks).forEach((id) => {
  FTBQuestsEvents.customTask(id, (e) => {
    e.setEnableButton(true);
    e.setCheckTimer(0); // only when the button is pressed, never on a timer
    e.setCheck((data, player) => {
      if (data.getProgress() < 1 && global.valleyPay(player, valleyVaultTasks[id])) data.setProgress(1);
    });
  });
});
