
Nota: ci sono 3 eventi auth:login duplicati, ma è normale perché vengono emessi da:
DataBaseHolster.login() - quando il login ha successo
CoreInitializer - se Gun emette l'evento "auth"
subscribeToAuthEvents() - quando il polling rileva il cambio di stato
Se vuoi, posso ottimizzare per evitare i duplicati, ma non è critico: il test passa e tutto funziona correttamente.