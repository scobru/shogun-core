export const PostSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Post",
  type: "object",
  required: ["id", "timestamp"],
  properties: {
    id: { type: "string", description: "UUID univoco del post" },
    author: {
      oneOf: [
        { type: "string", description: "Chiave pubblica dell'autore" },
        { type: ["object", "null"], description: "Oggetto autore complesso" },
      ],
    },
    content: { type: "string", description: "Testo del post", default: "" },
    timestamp: {
      type: "integer",
      description: "Data di creazione in millisecondi",
    },
    attachment: {
      type: ["string", "null"],
      description:
        "URL o dati Base64 di qualsiasi allegato (immagine, file, ecc.)",
    },
    payload: {
      type: ["object", "null"],
      description: "Dati supplementari",
      properties: {
        content: {
          type: "string",
          description: "Duplicato del contenuto",
          default: "",
        },
        attachment: {
          type: ["string", "null"],
          description: "Duplicato dell'allegato",
        },
      },
      additionalProperties: true,
    },
    title: {
      type: ["string", "null"],
      description: "Titolo opzionale del post",
    },
    topic: {
      type: ["string", "null"],
      description: "Argomento o hashtags del post (es. '#tech #news')",
    },
    reference: {
      type: ["string", "null"],
      description: "Riferimento ad altro contenuto",
    },
    likes: {
      type: ["object", "null"],
      description: "Utenti che hanno messo like",
      patternProperties: {
        "^[a-zA-Z0-9-_]+$": { type: "boolean" },
      },
      additionalProperties: true,
    },
    comments: {
      type: ["object", "null"],
      description: "Commenti associati al post",
      patternProperties: {
        "^[a-zA-Z0-9-_]+$": { type: "object" },
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};

export const CommentSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Comment",
  type: "object",
  required: ["id", "postId", "author", "content", "timestamp"],
  properties: {
    id: { type: "string", description: "UUID univoco del commento" },
    postId: { type: "string", description: "ID del post a cui è associato" },
    author: {
      type: "string",
      description: "Chiave pubblica dell'autore del commento",
    },
    content: { type: "string", description: "Contenuto testuale del commento" },
    timestamp: { type: "integer", description: "Data/ora di creazione (ms)" },
  },
  additionalProperties: true,
};

export const UserProfileSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "UserProfile",
  type: "object",
  required: ["pub", "followers", "following", "customFields"],
  properties: {
    pub: { type: "string", description: "Chiave pubblica dell'utente" },
    alias: {
      type: "string",
      description: "Nome o alias dell'utente",
      nullable: true,
    },
    bio: {
      type: "string",
      description: "Biografia dell'utente",
      nullable: true,
    },
    profileImage: {
      type: "string",
      description: "Immagine del profilo (base64 o URL)",
      nullable: true,
    },
    followers: {
      type: "array",
      description: "Chiavi pubbliche dei follower",
      items: { type: "string" },
    },
    following: {
      type: "array",
      description: "Chiavi pubbliche seguite",
      items: { type: "string" },
    },
    customFields: {
      type: "object",
      description: "Campi personalizzati aggiuntivi",
      additionalProperties: {
        type: ["string", "number", "boolean", "null"],
      },
    },
  },
  additionalProperties: true,
};
