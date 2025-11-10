# CORS Troubleshooting Guide

## Issue Analysis:
Photo shows after upload (cached) but not after refresh (fetch from CDN)
Photo URL: https://storage.googleapis.com/complaint-management-pwa.firebasestorage.app/profile-photos/.../profile.jpg

## Possible Root Causes:

### 1. File Permissions Issue (Most Likely)
The file.makePublic() might not be setting proper permissions.

### 2. CORS Headers Not Propagating
CORS changes can take 2-5 minutes to propagate globally.

### 3. Browser Cache
Old CORS policy might be cached.

## Debug Steps:

### Step 1: Check the actual error in browser
1. Open your app: http://localhost:3000/profile
2. Open DevTools (Cmd+Option+I)
3. Go to Console tab
4. Refresh the page (Cmd+R)
5. Look for CORS error - copy the EXACT error message

### Step 2: Check Network request
1. In DevTools, go to Network tab
2. Refresh page
3. Find the request to storage.googleapis.com
4. Click on it
5. Look at Response Headers
6. Check if "access-control-allow-origin" is present

### Step 3: Test direct URL access
1. Copy the photoURL from your console
2. Open it in a new browser tab
3. Does the image load?
   - YES → File is public, CORS is the issue
   - NO → File permissions issue

