module.exports = function (api) {
    api.cache(true);
  
    return {
      presets: ["babel-preset-expo"],
      plugins: [
        "nativewind/babel" // <-- Moved back to plugins!
      ],
    };
  };