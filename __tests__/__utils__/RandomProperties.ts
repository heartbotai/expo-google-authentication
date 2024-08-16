// This file is used to generate random properties for testing purposes.

const getString = () => {
  return Math.random().toString(36).substring(2);
};

export default {
  getString,
};
