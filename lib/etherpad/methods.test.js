const { validate } = require('./methods');

test('createGroup method validation', () => {
  expect(validate('createGroup')).toBe(true);
});

test('deleteGroup method validation', () => {
  expect(validate('deleteGroup', { groupID: 'groupID' })).toBe(true);
});

test('listPads method validation', () => {
  expect(validate('listPads', { groupID: 'groupID' })).toBe(true);
});

test('createGroupPad method validation', () => {
  expect(validate('createGroupPad', {
    groupID: 'groupID',
    padName: 'name',
  })).toBe(true);

  expect(validate('createGroupPad', {
    groupID: 'groupID',
    padName: 'padName',
    text: 'text',
  })).toBe(true);
});

test('listAllGroups method validation', () => {
  expect(validate('listAllGroups')).toBe(true);
});

test('createAuthor method validation', () => {
  expect(validate('createAuthor')).toBe(true);
  expect(validate('createAuthor', { name: 'name' })).toBe(true);
});

test('listPadsOfAuthor method validation', () => {
  expect(validate('listPadsOfAuthor', { authorID: 'authorID' })).toBe(true);
});

test('getAuthorName method validation', () => {
  expect(validate('getAuthorName', { authorID: 'authorID' })).toBe(true);
});

test('createSession method validation', () => {
  expect(validate('createSession', {
    groupID: 'groupID',
    authorID: 'authorID',
    validUntil: 'validUntil',
  })).toBe(true);
});

test('deleteSession method validation', () => {
  expect(validate('deleteSession', { sessionID: 'sessionID' })).toBe(true);
});

test('getSessionInfo method validation', () => {
  expect(validate('getSessionInfo', { sessionID: 'sessionID' })).toBe(true);
});

test('listSessionsOfGroup method validation', () => {
  expect(validate('listSessionsOfGroup', { groupID: 'groupID' })).toBe(true);
});

test('listSessionsOfAuthor method validation', () => {
  expect(validate('listSessionsOfAuthor', { authorID: 'authorID' })).toBe(true);
});

test('getText method validation', () => {
  expect(validate('getText', { padID: 'padID' })).toBe(true);
  expect(validate('getText', {
    padID: 'padID',
    rev: 'rev',
  })).toBe(true);
});

test('setText method validation', () => {
  expect(validate('setText', {
    padID: 'padID',
    text: 'text',
  })).toBe(true);
});

test('appendText method validation', () => {
  expect(validate('appendText', {
    padID: 'padID',
    text: 'text',
  })).toBe(true);
});

test('getHTML method validation', () => {
  expect(validate('getHTML', { padID: 'padID' })).toBe(true);
  expect(validate('getHTML', {
    padID: 'padID',
    rev: 'rev',
  })).toBe(true);
});

test('setHTML method validation', () => {
  expect(validate('setHTML', {
    padID: 'padID',
    html: 'html',
  })).toBe(true);
});

test('getAttributePool method validation', () => {
  expect(validate('getAttributePool', { padID: 'padID' })).toBe(true);
});

test('getRevisionChangeset method validation', () => {
  expect(validate('getRevisionChangeset', { padID: 'padID' })).toBe(true);
  expect(validate('getRevisionChangeset', {
    padID: 'padID',
    rev: 'rev',
  })).toBe(true);
});

test('createDiffHTML method validation', () => {
  expect(validate('createDiffHTML', {
    padID: 'padID',
    startRev: 'startRev',
    endRev: 'endRev',
  })).toBe(true);
});

test('restoreRevision method validation', () => {
  expect(validate('restoreRevision', {
    padID: 'padID',
    rev: 'rev',
  })).toBe(true);
});

test('createPad method validation', () => {
  expect(validate('createPad', { padID: 'padID' })).toBe(true);
  expect(validate('createPad', {
    padID: 'padID',
    text: 'text',
  })).toBe(true);
});

test('getRevisionsCount method validation', () => {
  expect(validate('getRevisionsCount', { padID: 'padID' })).toBe(true);
});

test('getSavedRevisionsCount method validation', () => {
  expect(validate('getSavedRevisionsCount', { padID: 'padID' })).toBe(true);
});

test('listSavedRevisions method validation', () => {
  expect(validate('listSavedRevisions', { padID: 'padID' })).toBe(true);
});

test('saveRevision method validation', () => {
  expect(validate('saveRevision', { padID: 'padID' })).toBe(true);
  expect(validate('saveRevision', {
    padID: 'padID',
    rev: 'rev',
  })).toBe(true);
});

test('padUsersCount method validation', () => {
  expect(validate('padUsersCount', { padID: 'padID' })).toBe(true);
});

test('padUsers method validation', () => {
  expect(validate('padUsers', { padID: 'padID' })).toBe(true);
});

test('deletePad method validation', () => {
  expect(validate('deletePad', { padID: 'padID' })).toBe(true);
});

test('copyPad method validation', () => {
  expect(validate('copyPad', {
    sourceID: 'sourceID',
    destinationID: 'destinationID',
  })).toBe(true);

  expect(validate('copyPad', {
    sourceID: 'sourceID',
    destinationID: 'destinationID',
    force: 'force',
  })).toBe(true);
});

test('copyPadWithoutHistory method validation', () => {
  expect(validate('copyPadWithoutHistory', {
    sourceID: 'sourceID',
    destinationID: 'destinationID',
  })).toBe(true);

  expect(validate('copyPadWithoutHistory', {
    sourceID: 'sourceID',
    destinationID: 'destinationID',
    force: 'force',
  })).toBe(true);
});

test('movePad method validation', () => {
  expect(validate('movePad', {
    sourceID: 'sourceID',
    destinationID: 'destinationID',
  })).toBe(true);

  expect(validate('movePad', {
    sourceID: 'sourceID',
    destinationID: 'destinationID',
    force: 'force',
  })).toBe(true);
});

test('getReadOnlyID method validation', () => {
  expect(validate('getReadOnlyID', { padID: 'padID' })).toBe(true);
});

test('getPadID method validation', () => {
  expect(validate('getPadID', { readOnlyID: 'readOnlyID' })).toBe(true);
});

test('setPublicStatus method validation', () => {
  expect(validate('setPublicStatus', {
    padID: 'padID',
    publicStatus: 'publicStatus',
  })).toBe(true);
});

test('getPublicStatus method validation', () => {
  expect(validate('getPublicStatus', { padID: 'padID' })).toBe(true);
});

test('listAuthorsOfPad method validation', () => {
  expect(validate('listAuthorsOfPad', { padID: 'padID' })).toBe(true);
});

test('getLastEdited method validation', () => {
  expect(validate('getLastEdited', { padID: 'padID' })).toBe(true);
});

test('checkToken method validation', () => {
  expect(validate('checkToken')).toBe(true);
});

test('listAllPads method validation', () => {
  expect(validate('listAllPads')).toBe(true);
});

test('getStats method validation', () => {
  expect(validate('getStats')).toBe(true);
});
