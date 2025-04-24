# 📡 Social Protocol Specification

Questo documento descrive le specifiche del protocollo sociale decentralizzato implementato con [GunDB](https://gun.eco), focalizzato su post, commenti, profili utente, messaggistica privata e interazioni come like e follow.

---

## 🗃️ Data Model

### 📝 Post

- Unique ID (UUID)
- Author (public key)
- Content (text)
- Optional image (Base64 or URL)
- Timestamp (epoch ms)
- Hashtags (object `{ tag: true }` and optional list `_hashtagsList[]`)
- Likes (map of public keys)
- Comments (map of comment objects)
- Payload (duplicate or fallback fields)

### 💬 Comment

- Unique ID (UUID)
- Post ID (parent post)
- Author (public key)
- Content
- Timestamp

### 👤 User Profile

- Public key (`pub`)
- Optional alias, bio, and profile image
- Followers (array of public keys)
- Following (array of public keys)
- Custom fields (optional key-value map)

### 📨 Message

- Unique ID (UUID)
- Room ID (chat room identifier)
- Sender (public key)
- Content (encrypted text)
- Timestamp
- Type (text, voice, etc.)

### 👥 Friend Request

- Key (identifier)
- Sender (public key)
- Recipient (public key)
- Status (pending, accepted, rejected)

### 🔒 Certificate

- Public key (target)
- Type (friendRequests, addFriend, chats, messages)
- SEA certificate data

---

## 🔄 Core Functionality

### Posts

- `post(content, imageData?)`: Create a post
- `deletePost(postId)`: Delete a post
- `getTimeline()`: Fetch recent posts
- `getTimelineObservable()`: Real-time feed of posts
- `searchByHashtag(tag)`: Search posts by hashtag
- `getUserPosts(limit, options)`: Get user's own posts
- `getUserPostsObservable(limit, options)`: Real-time stream of user's posts

### Comments

- `addComment(postId, content)`: Comment on a post
- `getComments(postId)`: Fetch comments
- `getCommentsObservable(postId)`: Live comments

### Likes

- `likePost(postId)` / `unlikePost(postId)`
- `getLikes(postId)` / `getLikeCount(postId)`
- `getLikesObservable(postId)` / `getLikeCountObservable(postId)`

### User Profiles

- `getProfile(pub)` / `getProfileObservable(pub)`
- `updateProfile(field, value)`
- `getAllUsers()` / `getAllUsersObservable()`

### Social Graph

- `follow(pubKey)` / `unfollow(pubKey)`

### Friends

- `addFriendRequest(publicKey)`: Invia una richiesta di amicizia
- `acceptFriendRequest(params)`: Accetta una richiesta di amicizia
- `rejectFriendRequest(key)`: Rifiuta una richiesta di amicizia

### Messaging

- `createChat(publicKey)`: Crea una chat privata con un utente
- `sendMessage(roomId, publicKey, message)`: Invia un messaggio testuale
- `sendVoiceMessage(roomId, publicKey, voiceRecording)`: Invia un messaggio vocale
- `messageList(roomId, pub)`: Ottiene la lista dei messaggi di una chat

### Certificates

- `generateFriendRequestsCertificate()`: Genera certificato per richieste di amicizia
- `generateAddFriendCertificate(publicKey)`: Genera certificato per aggiungere amici
- `createChatsCertificate(publicKey)`: Genera certificato per le chat
- `createMessagesCertificate(publicKey)`: Genera certificato per i messaggi

---

## 🔐 Authentication & Security

- Basato su GunDB's SEA (key pair encryption)
- Operazioni che richiedono autenticazione validano `this.user.is.pub`
- Eventi ed effetti collaterali sono emessi tramite `EventEmitter`
- Comunicazioni private criptate end-to-end con SEA.encrypt/decrypt
- Sistema di certificati per garantire l'autorizzazione alle operazioni

---

## 💡 Observability

- Usa Observable RxJS per aggiornamenti in tempo reale:
  - Posts
  - Comments
  - Likes
  - Profiles
  - Friend requests
  - Chats
- Permette data binding UI in tempo reale

---

## 🧠 Caching

- Cache dei profili utente con TTL di 5 minuti
- Cache dei post con TTL di 2 minuti
- Timeout su letture asincrone per prevenire comportamenti di blocco

---

## 📁 Data Paths (GunDB)

```
users/{pubKey} => profile info, followers/following, posts
posts/{postId} => content, author, timestamp, comments, likes
posts/{postId}/comments/{commentId} => comment object
posts/{postId}/likes/{pubKey} => true
hashtags/{tag}/{postId} => true

// Friend system
users/{pubKey}/friends/{friendPubKey} => true
users/{pubKey}/friendRequests/{requestId} => {pub, key, ...}

// Messaging system
users/{pubKey}/chats/{otherPubKey} => {roomId, pub, latestMessage}
users/{pubKey}/messages/{roomId} => encrypted messages
users/{pubKey}/certificates/{otherPubKey}/{type} => SEA certificate
```

---

## ✅ Compliance

- Compatibile con JSON Schema (Post, Comment, UserProfile)
- Validazione tramite AJV (Ajv JSON Schema Validator)
- Facile da validare ed estendere

---

## 📚 Servizi

Il protocollo è implementato attraverso diversi servizi specializzati:

### PostService

Gestisce la creazione, recupero e interazione con i post.

### MessageService

Gestisce la creazione di chat e lo scambio di messaggi criptati.

### FriendService

Gestisce le richieste di amicizia e le relazioni tra utenti.

### CertificateService

Gestisce i certificati di sicurezza necessari per le operazioni tra peer.

---

## 🚀 Extensions (Implementate)

- Messaggi privati con crittografia end-to-end
- Sistema di amicizia con richieste e accettazioni
- Gestione certificati per autorizzazioni sicure
- Post multimediali con immagini

## 🔮 Future Extensions (Idee)

- Strumenti di moderazione (report, hide)
- Sistema di reputazione/karma
- Istanze federate o bridge tra reti

---

> Questo protocollo è progettato per essere leggero, comprensibile e completamente decentralizzato, permettendo interazioni sociali peer-to-peer senza server centrali.
