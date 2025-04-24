# 📡 Social Protocol Specification

This document outlines the specification of a decentralized social protocol implemented using [GunDB](https://gun.eco), focused on posts, comments, user profiles, and interactions like likes and follows.

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

---

## 🔄 Core Functionality

### Posts

- `post(content, imageData?)`: Create a post
- `deletePost(postId)`: Delete a post
- `getTimeline()`: Fetch recent posts
- `getTimelineObservable()`: Real-time feed of posts
- `searchByHashtag(tag)`: Search posts by hashtag

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

---

## 🔐 Authentication & Security

- Based on GunDB's SEA (key pair encryption)
- Auth-required operations validate `this.user.is.pub`
- Events and side effects are emitted through `EventEmitter`

---

## 💡 Observability

- Uses RxJS observables for live updates:
  - Posts
  - Comments
  - Likes
  - Profiles
- Allows real-time UI and data binding

---

## 🧠 Caching

- User profile cache with 5-minute TTL
- Timeouts on async reads to prevent hanging behavior

---

## 📁 Data Paths (GunDB)

```
users/{pubKey} => profile info, followers/following, posts
posts/{postId} => content, author, timestamp, comments, likes
posts/{postId}/comments/{commentId} => comment object
posts/{postId}/likes/{pubKey} => true
hashtags/{tag}/{postId} => true
```

---

## ✅ Compliance

- Compatible with JSON Schema (Post, Comment, UserProfile)
- Easy to validate and extend

---

## 🚀 Extensions (Idea)

- Private messages with end-to-end encryption
- Moderation tools (report, hide)
- Reputation/karma system
- Federated or bridged instances

---

> This protocol is designed to be lightweight, human-readable, and fully decentralized, enabling peer-to-peer social interactions without central servers.
