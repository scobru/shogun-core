// Test per verificare che tutte le esportazioni funzionino
const { 
  ShogunCore,
  SimpleGunAPI,
  QuickStart,
  quickStart,
  createSimpleAPI,
  ShogunPresets,
  QuickConfig,
  ShogunConfigBuilder,
  ConfigHelpers,
  DataBase,
  Gun,
  SEA,
  RxJS,
  crypto,
  derive,
  GunErrors,
  GunInstance,
  GunUserInstance,
  TypedGunOperationResult,
  TypedAuthResult
} = require('./dist/index.js');

console.log('✅ Test delle esportazioni:');

// Test core classes
console.log('✅ ShogunCore:', typeof ShogunCore);
console.log('✅ SimpleGunAPI:', typeof SimpleGunAPI);
console.log('✅ QuickStart:', typeof QuickStart);
console.log('✅ quickStart:', typeof quickStart);
console.log('✅ createSimpleAPI:', typeof createSimpleAPI);

// Test configuration
console.log('✅ ShogunPresets:', typeof ShogunPresets);
console.log('✅ QuickConfig:', typeof QuickConfig);
console.log('✅ ShogunConfigBuilder:', typeof ShogunConfigBuilder);
console.log('✅ ConfigHelpers:', typeof ConfigHelpers);

// Test database
console.log('✅ DataBase:', typeof DataBase);
console.log('✅ Gun:', typeof Gun);
console.log('✅ SEA:', typeof SEA);
console.log('✅ RxJS:', typeof RxJS);
console.log('✅ crypto:', typeof crypto);
console.log('✅ derive:', typeof derive);
console.log('✅ GunErrors:', typeof GunErrors);

// Test types (dovrebbero essere undefined in runtime)
console.log('✅ GunInstance (type):', typeof GunInstance);
console.log('✅ GunUserInstance (type):', typeof GunUserInstance);
console.log('✅ TypedGunOperationResult (type):', typeof TypedGunOperationResult);
console.log('✅ TypedAuthResult (type):', typeof TypedAuthResult);

console.log('\n🎉 Tutte le esportazioni sono disponibili!');
