const { diff } = require('./diff');

test('unchanged text', () => {
  expect(diff('', '')).toBe(null);

  expect(diff('a', 'a')).toEqual(null);

  expect(diff('abc', 'abc')).toEqual(null);
});

test('full text addition', () => {
  expect(diff('', 'a')).toEqual({
    start: 0,
    end: 0,
    text: 'a',
  });

  expect(diff('', 'ab')).toEqual({
    start: 0,
    end: 0,
    text: 'ab',
  });

  expect(diff('', 'abc')).toEqual({
    start: 0,
    end: 0,
    text: 'abc',
  });
});

test('full text removal', () => {
  expect(diff('a', '')).toEqual({
    start: 0,
    end: 1,
    text: '',
  });

  expect(diff('ab', '')).toEqual({
    start: 0,
    end: 2,
    text: '',
  });

  expect(diff('abc', '')).toEqual({
    start: 0,
    end: 3,
    text: '',
  });
});

test('full text replacement', () => {
  expect(diff('a', 'b')).toEqual({
    start: 0,
    end: 1,
    text: 'b',
  });

  expect(diff('a', 'bc')).toEqual({
    start: 0,
    end: 1,
    text: 'bc',
  });

  expect(diff('za', 'b')).toEqual({
    start: 0,
    end: 2,
    text: 'b',
  });
});

test('suffix text addition', () => {
  expect(diff('a', 'ab')).toEqual({
    start: 1,
    end: 1,
    text: 'b',
  });

  expect(diff('za', 'zab')).toEqual({
    start: 2,
    end: 2,
    text: 'b',
  });

  expect(diff('za', 'zabc')).toEqual({
    start: 2,
    end: 2,
    text: 'bc',
  });
});

test('suffix text removal', () => {
  expect(diff('ab', 'a')).toEqual({
    start: 1,
    end: 2,
    text: '',
  });

  expect(diff('zab', 'za')).toEqual({
    start: 2,
    end: 3,
    text: '',
  });

  expect(diff('zabc', 'za')).toEqual({
    start: 2,
    end: 4,
    text: '',
  });
});

test('prefix text addition', () => {
  expect(diff('a', 'za')).toEqual({
    start: 0,
    end: 0,
    text: 'z',
  });

  expect(diff('ab', 'zab')).toEqual({
    start: 0,
    end: 0,
    text: 'z',
  });

  expect(diff('ab', 'yzab')).toEqual({
    start: 0,
    end: 0,
    text: 'yz',
  });
});

test('prefix text removal', () => {
  expect(diff('za', 'a')).toEqual({
    start: 0,
    end: 1,
    text: '',
  });

  expect(diff('zab', 'ab')).toEqual({
    start: 0,
    end: 1,
    text: '',
  });

  expect(diff('yza', 'a')).toEqual({
    start: 0,
    end: 2,
    text: '',
  });
});
