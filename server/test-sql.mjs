import sqlModule from 'sql.js';
console.log("Module type:", typeof sqlModule);
console.log("Module keys:", Object.keys(sqlModule));
console.log("Default export:", typeof sqlModule.default);
console.log("Module itself:", sqlModule);
