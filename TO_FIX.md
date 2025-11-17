
✅ RISOLTO: Eventi auth:login duplicati eliminati.

Gli eventi auth:login vengono ora emessi solo da subscribeToAuthEvents() in modo centralizzato.
Le emissioni duplicate da login(), loginWithPair() e createUserWithPair() sono state rimosse.
