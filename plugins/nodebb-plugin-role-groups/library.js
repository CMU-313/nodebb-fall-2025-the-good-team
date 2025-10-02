
'use strict';

const groups = require.main.require('./src/groups');

async function ensure(name) {
  if (!(await groups.exists(name))) {
    await groups.create({ name, system: 0, hidden: 0, private: 0, disableJoinRequests: 1, description: '' });
  } else {
    if (typeof groups.setHidden === 'function') await groups.setHidden(name, 0);
    if (typeof groups.setPrivate === 'function') await groups.setPrivate(name, 0);
  }
}

exports.load = async function () {
  for (const name of ['students', 'instructors']) {
    await ensure(name);
  }
  // optional log to confirm it ran
  console.log('[role-groups] ensured students/instructors');
};