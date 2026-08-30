module.exports = {
  v4: () => 'mock-uuid-' + Math.random().toString(36).substring(7),
  v1: () => 'mock-uuid-v1',
  NIL: '00000000-0000-0000-0000-000000000000',
};
