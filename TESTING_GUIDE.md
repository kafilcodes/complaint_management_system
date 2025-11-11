# Testing Guide - Comprehensive Debug Logging

## Overview
All API routes and hooks now have comprehensive debug logging with unique request IDs for tracing operations.

## How to Test

### 1. Open Browser Console
Press F12 (or Cmd+Option+I on Mac) and go to the Console tab.

### 2. Debug Log Format
All logs follow this pattern:
```
[route-name:requestId] Action/Status
```

Example:
```
[tickets:a3f8e2] GET request started
[tickets:a3f8e2] Query params: { status: "open", brand: null, assignedTo: null, limit: 20 }
[tickets:a3f8e2] Query returned 5 tickets
[tickets:a3f8e2] Successfully fetched 5 tickets
```

---

## API Routes Testing

### 🎫 Tickets Routes

#### GET /api/tickets
**What to look for:**
```javascript
[tickets:xxxxx] GET request started
[tickets:xxxxx] Query params: { status, brand, assignedTo, limit }
[tickets:xxxxx] Applied status filter: open
[tickets:xxxxx] Query returned N tickets
[tickets:xxxxx] Successfully fetched N tickets
```

**Test steps:**
1. Navigate to `/tickets` page
2. Watch console for ticket fetch logs
3. Verify ticket count matches UI

#### POST /api/tickets
**What to look for:**
```javascript
[tickets:xxxxx] POST request started
[tickets:xxxxx] Creating ticket: { customerName, productName, createdBy, assignedTo }
[tickets:xxxxx] Ticket created with ID: abc123
[tickets:xxxxx] Notification created for assignee: userId
[tickets:xxxxx] Successfully created ticket abc123
```

**Test steps:**
1. Go to `/create-ticket`
2. Fill out form and submit
3. Watch console for creation logs
4. Verify ticket appears in list

---

### 📊 Dashboard Routes

#### GET /api/dashboard/stats
**What to look for:**
```javascript
[dashboard/stats:xxxxx] GET request started
[dashboard/stats:xxxxx] Query params: {}
[dashboard/stats:xxxxx] Query returned N tickets
[dashboard/stats:xxxxx] Unread count: N
```

**Test steps:**
1. Navigate to `/` (dashboard)
2. Watch console for stats fetch
3. Verify counts match displayed numbers

---

### 🔔 Notification Routes

#### GET /api/notifications
**What to look for:**
```javascript
[notifications:xxxxx] GET request started
[notifications:xxxxx] Query params: { userId, readFilter, limit, typeFilter }
[notifications:xxxxx] Building query for userId: abc123
[notifications:xxxxx] Query returned N notifications
[notifications:xxxxx] Unread count: N
```

**Test steps:**
1. Navigate to notifications page/panel
2. Watch console for fetch logs
3. Verify notification count

#### PUT /api/notifications/[id] (Mark as Read)
**What to look for:**
```javascript
[notifications/[id]:xxxxx] PUT request started
[notifications/[id]:xxxxx] notificationId: abc123, userId: xyz789
[notifications/[id]:xxxxx] Successfully marked as read
```

**Test steps:**
1. Click on a notification
2. Watch console for mark-as-read logs
3. Verify notification appears read in UI

#### PUT /api/notifications/mark-all-read
**What to look for:**
```javascript
[notifications/mark-all-read:xxxxx] PUT request started
[notifications/mark-all-read:xxxxx] userId: abc123
[notifications/mark-all-read:xxxxx] Found N unread notifications
[notifications/mark-all-read:xxxxx] Successfully marked N notifications as read
```

**Test steps:**
1. Click "Mark all as read" button
2. Watch console for bulk operation
3. Verify all notifications marked read

#### DELETE /api/notifications/[id]
**What to look for:**
```javascript
[notifications/[id]:xxxxx] DELETE request started
[notifications/[id]:xxxxx] notificationId: abc123, userId: xyz789
[notifications/[id]:xxxxx] Successfully deleted
```

**Test steps:**
1. Delete a notification
2. Watch console for delete logs
3. Verify notification removed from UI

---

### ✅ Resolution Routes

#### GET /api/tickets/[id]/resolution
**What to look for:**
```javascript
[tickets/[id]/resolution:xxxxx] GET request started
[tickets/[id]/resolution:xxxxx] ticketId: abc123
[tickets/[id]/resolution:xxxxx] Resolution found for ticket abc123
```

**Test steps:**
1. Open a closed ticket with resolution
2. Watch console for resolution fetch
3. Verify resolution data displays

#### POST /api/tickets/[id]/resolve
**What to look for:**
```javascript
[tickets/[id]/resolve:xxxxx] POST request started
[tickets/[id]/resolve:xxxxx] ticketId: abc123, userId: xyz789
[tickets/[id]/resolve:xxxxx] Successfully marked as read
```

**Test steps:**
1. Resolve a ticket as technician
2. Watch console for resolve operation
3. Verify ticket status changes to closed

---

## Hook Logging (Client-Side)

### useNotifications
```javascript
[useNotifications] Fetching notifications for user: abc123
[useNotifications] Fetched notifications: 5
```

### useUnreadCount
```javascript
[useUnreadCount] Fetching unread count for user: abc123
[useUnreadCount] Unread count: 3
```

### useMarkAsRead
```javascript
[useMarkAsRead] Marking notification as read: notif123 userId: user456
[useMarkAsRead] Success: { success: true, message: "..." }
```

### useMarkAllAsRead
```javascript
[useMarkAllAsRead] Marking all notifications as read for user: abc123
[useMarkAllAsRead] Success: { updatedCount: 5 }
```

### useDeleteNotification
```javascript
[useDeleteNotification] Deleting notification: notif123 userId: user456
[useDeleteNotification] Success: { success: true }
```

### useClearReadNotifications
```javascript
[useClearReadNotifications] Clearing read notifications for user: abc123
[useClearReadNotifications] Success: { deletedCount: 10 }
```

---

## Real-Time Listener Logs (useTicketData.ts)

### useTicketList
```javascript
[useTicketList] Firestore error: <error details>
[useTicketList] Setup error: <error details>
```

### useMyTicketList
```javascript
[useMyTicketList] Firestore error: <error details>
[useMyTicketList] Setup error: <error details>
```

### useTicketById
```javascript
[useTicketById] Firestore error: <error details>
[useTicketById] Setup error: <error details>
```

---

## Testing Checklist

### ✅ Data Fetching
- [ ] Dashboard loads with correct stats
- [ ] Tickets page shows all tickets
- [ ] Ticket details page loads individual ticket
- [ ] Notifications panel shows notifications
- [ ] Unread count badge displays correctly

### ✅ Real-Time Updates
- [ ] New ticket appears immediately (create in one browser, see in another)
- [ ] Ticket status updates reflect instantly
- [ ] Notification count updates in real-time
- [ ] Timeline events appear immediately

### ✅ CRUD Operations
- [ ] Create ticket works (with logs)
- [ ] Update ticket works
- [ ] Delete notification works
- [ ] Mark notification as read works
- [ ] Mark all as read works

### ✅ Error Handling
- [ ] No 401 errors (all routes public)
- [ ] Missing userId shows 400 error
- [ ] Not found returns 404
- [ ] Invalid data returns proper error

### ✅ Theme & UI
- [ ] Charts display in turquoise (#40e0d0)
- [ ] Sidebar active tabs are turquoise
- [ ] Accent colors are gray (not turquoise)
- [ ] Dark mode works correctly

---

## Common Issues & Solutions

### Issue: "userId parameter is required"
**Solution:** Ensure user is logged in. Check auth context.

### Issue: Tickets not loading
**Solution:** 
1. Check console for `[tickets:xxxxx]` logs
2. Look for Firestore errors
3. Verify Firebase config

### Issue: Notifications not updating
**Solution:**
1. Check `[notifications:xxxxx]` logs
2. Verify userId is being passed
3. Check Firestore rules allow read/write

### Issue: Real-time not working
**Solution:**
1. Check `[useTicketList]` logs for errors
2. Verify onSnapshot listener setup
3. Check network tab for WebSocket connection

---

## Performance Monitoring

Watch for these performance indicators:

1. **Request Count:** Each page load should trigger minimal API calls
2. **Response Time:** API routes should respond < 500ms
3. **Real-Time Lag:** Updates should appear < 1 second
4. **Memory Leaks:** Check for unsubscribed listeners in console

---

## Debug Mode Commands

Run in browser console:

```javascript
// Enable verbose logging
localStorage.setItem('debug', '*');

// Disable logging
localStorage.removeItem('debug');

// Check current user
console.log(JSON.parse(localStorage.getItem('auth-storage') || '{}'));

// Force refetch tickets
queryClient.invalidateQueries({ queryKey: ['tickets'] });

// Force refetch notifications
queryClient.invalidateQueries({ queryKey: ['notifications'] });
```

---

## Expected Log Flow: Complete User Journey

### 1. Login → Dashboard
```
[useTicketList] Firestore onSnapshot started
[tickets:xxx] GET request started
[tickets:xxx] Successfully fetched 10 tickets
[dashboard/stats:xxx] GET request started
[dashboard/stats:xxx] Query returned 10 tickets
[useUnreadCount] Fetching unread count
[notifications:xxx] Unread count: 3
```

### 2. Create Ticket
```
[tickets:xxx] POST request started
[tickets:xxx] Creating ticket: {...}
[tickets:xxx] Ticket created with ID: abc123
[tickets:xxx] Notification created for assignee
[useTicketList] Real-time update: +1 ticket
```

### 3. View Notifications
```
[useNotifications] Fetching notifications
[notifications:xxx] GET request started
[notifications:xxx] Query returned 5 notifications
[notifications:xxx] Unread count: 3
```

### 4. Mark Notification Read
```
[useMarkAsRead] Marking notification as read
[notifications/[id]:xxx] PUT request started
[notifications/[id]:xxx] Successfully marked as read
[useUnreadCount] Unread count: 2
```

---

## Success Criteria

✅ All routes log request start/complete  
✅ All errors logged with details  
✅ Request IDs enable tracing  
✅ No 401 errors anywhere  
✅ Real-time updates work  
✅ Theme colors correct  
✅ Data fetches successfully  

**Status: READY FOR PRODUCTION TESTING** 🚀
