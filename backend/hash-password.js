// વાપરવા: node hash-password.js "તમારો_પાસવર્ડ"
// જે લખાણ મળે તે ADMIN_USERS માં પાસવર્ડની જગ્યાએ મુકો:  pramukh:scrypt$....
const { hashPassword } = require("./security");
const p = process.argv[2];
if (!p || p.length < 8) { console.log('વાપરો: node hash-password.js "ઓછામાં ઓછા 8 અક્ષરનો પાસવર્ડ"'); process.exit(1); }
console.log(hashPassword(p));
