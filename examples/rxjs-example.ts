import { ShogunCore } from "../src/index";
import { Observable, combineLatest } from "rxjs";
import { map, switchMap, filter, take } from "rxjs/operators";

/**
 * Example showing how to use RxJS integration with GunDB
 */
const runRxJSExample = async () => {
  // Initialize Shogun Core with RxJS support
  const shogun = new ShogunCore({
    gundb: {
      peers: ["https://gun-server.example.com/gun"],
      localStorage: true
    }
  });

  console.log("RxJS Example Started");

  // Example 1: Basic observe
  // Observe a path and get updates when it changes
  const userProfile$ = shogun.observe<{ name: string; bio: string }>('users/profile/123');
  
  const subscription1 = userProfile$.subscribe({
    next: profile => console.log('Profile updated:', profile),
    error: err => console.error('Error observing profile:', err)
  });

  // Example 2: Update data and observe changes
  setTimeout(() => {
    // Update data using the traditional Gun way
    shogun.gun.get('users').get('profile').get('123').put({
      name: 'John Doe',
      bio: 'Web Developer'
    });
    
    // Or use the reactive way
    shogun.rxPut<{ name: string; bio: string }>('users/profile/123', {
      name: 'John Doe',
      bio: 'Web Developer & RxJS enthusiast'
    }).subscribe(() => console.log('Data updated successfully'));
  }, 1000);

  // Example 3: Observe a collection with matching
  const todoItems$ = shogun.match<{ id: string, task: string, completed: boolean }>('todos');
  
  const subscription2 = todoItems$.subscribe({
    next: todos => console.log('Todo items:', todos),
    error: err => console.error('Error observing todos:', err)
  });

  // Add some todo items
  setTimeout(() => {
    shogun.gun.get('todos').set({ id: '1', task: 'Learn RxJS', completed: false });
    shogun.gun.get('todos').set({ id: '2', task: 'Master GunDB', completed: false });
    shogun.gun.get('todos').set({ id: '3', task: 'Combine them', completed: false });
  }, 2000);

  // Example 4: Filter todos reactively
  const completedTodos$ = shogun.match<{ id: string, task: string, completed: boolean }>('todos')
    .pipe(
      // Use RxJS operators to filter array
      map(todos => todos.filter(todo => todo.completed))
    );
  
  const subscription3 = completedTodos$.subscribe({
    next: todos => console.log('Completed todos:', todos),
    error: err => console.error('Error filtering todos:', err)
  });

  // Mark a todo as completed
  setTimeout(() => {
    shogun.gun.get('todos').get('1').put({ completed: true });
  }, 3000);

  // Example 5: Compute derived data
  const todoStats$ = shogun.compute<any, { total: number, completed: number, pending: number }>(
    ['todos'], // You can provide multiple sources here
    (todos) => {
      if (!Array.isArray(todos)) return { total: 0, completed: 0, pending: 0 };
      
      const completed = todos.filter(t => t.completed).length;
      return {
        total: todos.length,
        completed,
        pending: todos.length - completed
      };
    }
  );

  const subscription4 = todoStats$.subscribe({
    next: stats => console.log('Todo stats:', stats),
    error: err => console.error('Error computing stats:', err)
  });

  // Example 6: User-specific data (requires authentication)
  if (shogun.isLoggedIn()) {
    const userPreferences$ = shogun.observeUser<{ theme: string, notifications: boolean }>('preferences');
    
    const subscription5 = userPreferences$.subscribe({
      next: prefs => console.log('User preferences:', prefs),
      error: err => console.error('Error observing user preferences:', err)
    });

    // Update user preferences
    shogun.rxUserPut<{ theme: string, notifications: boolean }>('preferences', {
      theme: 'dark',
      notifications: true
    }).subscribe(() => console.log('User preferences updated'));
  }

  // Cleanup subscriptions after some time
  setTimeout(() => {
    console.log('Cleaning up subscriptions');
    subscription1.unsubscribe();
    subscription2.unsubscribe();
    subscription3.unsubscribe();
    subscription4.unsubscribe();
    // subscription5 might not exist if user is not logged in
  }, 10000);
};

// Run the example
runRxJSExample().catch(err => console.error('Example failed:', err));

/**
 * Advanced example: Building a reactive chat application with RxJS
 */
const chatAppExample = async () => {
  // Initialize Shogun Core
  const shogun = new ShogunCore({
    gundb: {
      peers: ["https://gun-server.example.com/gun"],
      localStorage: true
    }
  });

  // Authentication (required for this example)
  try {
    // Either login or signup
    const result = await shogun.login('testuser', 'password123');
    if (!result.success) {
      console.log('Login failed, attempting signup');
      await shogun.signUp('testuser', 'password123');
    }
  } catch (err) {
    console.error('Authentication failed', err);
    return;
  }

  const roomId = 'public-room';

  // Get current user's ID
  const userPub = shogun.gun.user().is?.pub;
  if (!userPub) {
    console.error('User not authenticated properly');
    return;
  }

  console.log('Chat example started with user:', userPub);

  // Reactive message list
  const messages$ = shogun.match<{
    id: string;
    sender: string;
    senderName: string;
    text: string;
    timestamp: number;
  }>(`rooms/${roomId}/messages`);

  // Subscribe to new messages
  const messagesSubscription = messages$.pipe(
    // Sort messages by timestamp
    map(messages => 
      messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
    )
  ).subscribe({
    next: messages => {
      console.log('Messages updated:', messages.length);
      messages.forEach(msg => {
        // Format and display each message
        const isMine = msg.sender === userPub;
        console.log(
          `${isMine ? 'You' : msg.senderName}: ${msg.text} (${new Date(msg.timestamp).toLocaleTimeString()})`
        );
      });
    },
    error: err => console.error('Error getting messages:', err)
  });

  // User presence tracking
  const activeUsers$ = shogun.match<{
    id: string;
    name: string;
    lastSeen: number;
  }>(`rooms/${roomId}/users`);

  // Subscribe to active users
  const usersSubscription = activeUsers$.pipe(
    // Only show recently active users (last 5 minutes)
    map(users => 
      users.filter(user => 
        user.lastSeen && (Date.now() - user.lastSeen < 5 * 60 * 1000)
      )
    )
  ).subscribe({
    next: users => console.log('Active users:', users.map(u => u.name).join(', ')),
    error: err => console.error('Error tracking users:', err)
  });

  // Mark current user as active
  shogun.rx.put<{ id: string; name: string; lastSeen: number }>(`rooms/${roomId}/users/${userPub}`, {
    id: userPub,
    name: 'TestUser', // In a real app, get this from profile
    lastSeen: Date.now()
  }).subscribe();

  // Setup a presence heartbeat
  const heartbeat = setInterval(() => {
    shogun.gun.get(`rooms/${roomId}/users/${userPub}`).put({
      lastSeen: Date.now()
    });
  }, 30000);

  // Function to send a message
  const sendMessage = (text: string) => {
    const messageId = Math.random().toString(36).substring(2, 15);
    
    shogun.rxPut<{
      id: string;
      sender: string;
      senderName: string;
      text: string;
      timestamp: number;
    }>(`rooms/${roomId}/messages/${messageId}`, {
      id: messageId,
      sender: userPub,
      senderName: 'TestUser', // In a real app, get this from profile
      text,
      timestamp: Date.now()
    }).subscribe({
      next: () => console.log('Message sent'),
      error: err => console.error('Error sending message:', err)
    });
  };

  // Simulate sending messages
  setTimeout(() => sendMessage('Hello world!'), 1000);
  setTimeout(() => sendMessage('RxJS with GunDB is awesome'), 3000);
  setTimeout(() => sendMessage('This is a reactive chat example'), 5000);

  // Cleanup
  setTimeout(() => {
    console.log('Cleaning up chat example');
    messagesSubscription.unsubscribe();
    usersSubscription.unsubscribe();
    clearInterval(heartbeat);
    
    // Sign out
    shogun.logout();
  }, 15000);
};

// Uncomment to run the chat example
// chatAppExample().catch(err => console.error('Chat example failed:', err));

export { runRxJSExample, chatAppExample }; 