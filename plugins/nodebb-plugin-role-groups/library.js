'use strict';

const groups = require.main.require('./src/groups');

async function ensureGroups(names) {
  await Promise.all(names.map(async (name) => {
    const exists = await groups.exists(name);
    if (!exists) {
      await groups.create({ name, system: 0, hidden: 0 });
      console.log(`[roles] created group: ${name}`);
    }
  }));
}

exports.load = async function (params) {
  // Called when NodeBB boots
  await ensureGroups(['students', 'instructors']);
};