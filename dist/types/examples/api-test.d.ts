/**
 * Esempio completo che mostra le differenze tra i vari metodi dell'API ShogunCore
 *
 * Questo esempio dimostra:
 * - get() vs getData() vs getNode() vs node() vs chain()
 * - put() vs set() vs putUserData() vs setUserData()
 * - remove() vs removeUserData()
 * - Operazioni globali vs operazioni utente
 */
declare function demonstrateAPIDifferences(): Promise<void>;
declare function showAPIDifferences(): void;
export { demonstrateAPIDifferences, showAPIDifferences };
