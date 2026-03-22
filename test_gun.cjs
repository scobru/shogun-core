const Gun = require('gun');
require('gun/sea');
const gun = Gun({file: 'test_gun_data'});
const user = gun.user();

async function run() {
  const pair = await Gun.SEA.pair();
  user.auth(pair, (ack) => {
    console.log('auth ack', ack);
    if (!ack.err) {
      let longString = "";
      for (let i = 0; i < 2000; i++) {
        longString += "a";
      }
      user.get('test_bundle').put(longString, (putAck) => {
        console.log('put string ack', putAck);
        user.get('test_bundle2').put({ payload: longString }, (putAck2) => {
          console.log('put object ack', putAck2);
          process.exit();
        });
      });
    }
  });
}
run();
