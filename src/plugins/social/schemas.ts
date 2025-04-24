export const PostSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Post",
  type: "object",
  required: ["id", "author", "content", "timestamp"],
  properties: {
    id: { type: "string", description: "UUID univoco del post" },
    author: { type: "string", description: "Chiave pubblica dell'autore" },
    content: { type: "string", description: "Testo del post" },
    timestamp: { type: "integer", description: "Data di creazione in millisecondi" },
    imageData: { type: "string", description: "Dati dell'immagine (base64 o URL)", nullable: true },
    payload: {
      type: "object",
      description: "Dati supplementari",
      properties: {
        imageData: { type: "string", description: "Duplicato dell'immagine", nullable: true },
        content: { type: "string", description: "Duplicato del contenuto" }
      },
      additionalProperties: true
    },
    hashtags: {
      type: "object",
      description: "Hashtag usati, con valori booleani",
      patternProperties: {
        "^[a-z0-9_]+$": { type: "boolean" }
      },
      additionalProperties: false
    },
    _hashtagsList: {
      type: "array",
      description: "Lista interna di hashtag normalizzati",
      items: { type: "string" }
    },
    likes: {
      type: "object",
      description: "Utenti che hanno messo like",
      patternProperties: {
        "^[a-zA-Z0-9-_]+$": { type: "boolean" }
      },
      additionalProperties: false
    },
    comments: {
      type: "object",
      description: "Commenti associati al post",
      patternProperties: {
        "^[a-zA-Z0-9-_]+$": { type: "object" }
      },
      additionalProperties: true
    }
  },
  additionalProperties: true
};

export const CommentSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Comment",
  type: "object",
  required: ["id", "postId", "author", "content", "timestamp"],
  properties: {
    id: { type: "string", description: "UUID univoco del commento" },
    postId: { type: "string", description: "ID del post a cui è associato" },
    author: { type: "string", description: "Chiave pubblica dell'autore del commento" },
    content: { type: "string", description: "Contenuto testuale del commento" },
    timestamp: { type: "integer", description: "Data/ora di creazione (ms)" }
  },
  additionalProperties: true
};

export const UserProfileSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "UserProfile",
  type: "object",
  required: ["pub", "followers", "following", "customFields"],
  properties: {
    pub: { type: "string", description: "Chiave pubblica dell'utente" },
    alias: { type: "string", description: "Nome o alias dell'utente", nullable: true },
    bio: { type: "string", description: "Biografia dell'utente", nullable: true },
    profileImage: { type: "string", description: "Immagine del profilo (base64 o URL)", nullable: true },
    followers: {
      type: "array",
      description: "Chiavi pubbliche dei follower",
      items: { type: "string" }
    },
    following: {
      type: "array",
      description: "Chiavi pubbliche seguite",
      items: { type: "string" }
    },
    customFields: {
      type: "object",
      description: "Campi personalizzati aggiuntivi",
      additionalProperties: {
        type: ["string", "number", "boolean", "null"]
      }
    }
  },
  additionalProperties: true
};
