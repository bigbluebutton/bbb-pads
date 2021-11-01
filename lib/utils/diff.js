const Diff = require('diff');
const Logger = require('../utils/logger');

const logger = new Logger('diff');

const getChangeType = (change) => {
  if (change.added) return 'added';

  if (change.removed) return 'removed';

  return 'skipped';
};

const isPrefix = (first, last) => {
  const firstType = getChangeType(first);
  const lastType = getChangeType(last);

  if (firstType === 'added' && lastType === 'skipped') return true;

  if (firstType === 'removed' && lastType === 'skipped') return true;

  return false;
};

const isSuffix = (first, last) => {
  const firstType = getChangeType(first);
  const lastType = getChangeType(last);

  if (firstType === 'skipped' && lastType === 'added') return true;

  if (firstType === 'skipped' && lastType === 'removed') return true;

  return false;
};

const isRoot = (first, last) => {
  const firstType = getChangeType(first);
  const lastType = getChangeType(last);

  if (firstType === 'skipped' && lastType === 'skipped') return true;

  return false;
};

const processSingleChangeset = (change, prevText, nextText) => {
  changeType = getChangeType(change);
  if (changeType === 'skipped') return null;

  logger.trace('single', change);

  return {
    start: 0,
    end: prevText.length,
    text: nextText,
  };
};

const processPrefixChange = (change, prevText) => {
  logger.trace('prefix', change);
  if (change.added) {

    return {
      start: 0,
      end: 0,
      text: change.value,
    };
  }

  // removed
  return {
    start: 0,
    end: change.count,
    text: '',
  };
};

const processSuffixChange = (change, prevText) => {
  logger.trace('suffix', change);
  if (change.added) {

    return {
      start: prevText.length,
      end: prevText.length,
      text: change.value,
    };
  }

  // removed
  return {
    start: prevText.length - change.count,
    end: prevText.length,
    text: '',
  };
};

const processDoubleChangeset = (changeset, prevText, nextText) => {
  const first = changeset[0];
  const last = changeset[changeset.length - 1];

  if (isSuffix(first, last)) return processSuffixChange(last, prevText);

  if (isPrefix(first, last)) return processPrefixChange(first, prevText);

  // replaced
  return processSingleChangeset(last, prevText, nextText);
};

const processMultipleChangeset = (changeset, prevText, nextText) => {
  const first = changeset[0];
  const last = changeset[changeset.length - 1];

  if (isRoot(first, last)) {
    const nextRoot = nextText.slice(first.count, -last.count);

    return {
      start: first.count,
      end: prevText.length - last.count,
      text: nextRoot,
    };
  }

  if (isSuffix(first, last)) {
    const nextSuffix = nextText.slice(first.count);

    return {
      start: first.count,
      end: prevText.length,
      text: nextSuffix,
    };
  }

  if (isPrefix(first, last)) {
    const nextPrefix = nextText.slice(0, -last.count);

    return {
      start: 0,
      end: prevText.length - last.count,
      text: nextPrefix,
    };
  }

  return {
    start: 0,
    end: prevText.length,
    text: nextText,
  };
};

const diff = (prevText, nextText) => {
  const changeset = Diff.diffChars(prevText, nextText);
  const single = changeset.length === 1;
  const double = changeset.length === 2;

  if (single) return processSingleChangeset(changeset.shift(), prevText, nextText);

  if (double) return processDoubleChangeset(changeset, prevText, nextText);

  return processMultipleChangeset(changeset, prevText, nextText);
};

module.exports = {
  diff,
};
