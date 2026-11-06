console.info("[SOCIETY] addStrippingRecipes.js loaded");

ServerEvents.recipes((e) => {
  const strippedLogRecipe = (log) => {
    const splitLog = log.split(":");
    e.custom({
      type: "create:cutting",
      ingredients: [
        {
          item: log,
        },
      ],
      processingTime: 50,
      results: [
        {
          count: 1,
          item: `${splitLog[0]}:stripped_${splitLog[1]}`,
        },
      ],
    });
  };
  [
    "meadow:pine_log",
    "meadow:pine_wood",
    "beachparty:palm_log",
    "beachparty:palm_wood",
    "vinery:dark_cherry_log",
    "vinery:dark_cherry_wood",
  ].forEach((log) => {
    strippedLogRecipe(log);
  });
});
