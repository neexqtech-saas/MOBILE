# FCM Notification Setup Guide

## Mobile App Setup ✅

Mobile app mein FCM notifications setup ho chuka hai:

1. **Toast Notifications**: `react-native-toast-message` installed aur configured
2. **Notification Listeners**: App.tsx mein notification listeners setup ho chuke hain
3. **FCM Token**: Login ke time automatically backend ko send hota hai

## Backend Setup Required

Backend se FCM notification send karne ke liye yeh steps follow karein:

### 1. Install Required Packages

```bash
pip install firebase-admin
```

### 2. Firebase Service Account Setup

1. Firebase Console mein jao: https://console.firebase.google.com/
2. Project select karo
3. Settings > Service Accounts
4. "Generate new private key" click karo
5. JSON file download karo
6. Backend mein `firebase_service_account.json` naam se save karo

### 3. Backend Code Example

```python
# Backend/core/utils/fcm_notifications.py
import firebase_admin
from firebase_admin import credentials, messaging
import os
from django.conf import settings

# Initialize Firebase Admin SDK
def initialize_firebase():
    if not firebase_admin._apps:
        cred_path = os.path.join(settings.BASE_DIR, 'firebase_service_account.json')
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)

def send_task_assignment_notification(user_fcm_token, task_title, task_id, assigned_by):
    """
    Send FCM notification when task is assigned
    """
    try:
        initialize_firebase()
        
        # Create notification message
        message = messaging.Message(
            notification=messaging.Notification(
                title="New Task Assigned",
                body=f"You have been assigned a new task: {task_title}",
            ),
            data={
                'type': 'task_assigned',
                'task_id': str(task_id),
                'task_title': task_title,
                'assigned_by': assigned_by,
            },
            token=user_fcm_token,
            android=messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    sound='default',
                    channel_id='task_notifications',
                ),
            ),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        sound='default',
                        badge=1,
                    ),
                ),
            ),
        )
        
        # Send notification
        response = messaging.send(message)
        print(f'Successfully sent notification: {response}')
        return True
        
    except Exception as e:
        print(f'Error sending notification: {str(e)}')
        return False

def send_notification_to_user(user_id, title, body, notification_type='info', data=None):
    """
    Generic function to send notification to user
    """
    try:
        # Get FCM token from database
        from AuthN.models import UserProfile
        user_profile = UserProfile.objects.get(user_id=user_id)
        
        if not user_profile.fcm_token:
            print(f'No FCM token found for user {user_id}')
            return False
        
        initialize_firebase()
        
        message_data = {
            'type': notification_type,
        }
        if data:
            message_data.update(data)
        
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=message_data,
            token=user_profile.fcm_token,
            android=messaging.AndroidConfig(
                priority='high',
            ),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        sound='default',
                        badge=1,
                    ),
                ),
            ),
        )
        
        response = messaging.send(message)
        print(f'Successfully sent notification: {response}')
        return True
        
    except Exception as e:
        print(f'Error sending notification: {str(e)}')
        return False
```

### 4. Task Assignment View Mein Use Karein

```python
# Backend/core/TaskControl/views.py
from utils.fcm_notifications import send_task_assignment_notification

class TaskCreateView(APIView):
    def post(self, request):
        # ... task creation logic ...
        
        # After task is created and assigned
        if task.assigned_to:
            user_profile = UserProfile.objects.get(user_id=task.assigned_to.user_id)
            if user_profile.fcm_token:
                send_task_assignment_notification(
                    user_fcm_token=user_profile.fcm_token,
                    task_title=task.title,
                    task_id=task.id,
                    assigned_by=request.user.username
                )
        
        return Response(...)
```

## Notification Types Supported

Mobile app mein yeh notification types handle ho rahe hain:

1. **task_assigned** - Green toast (success)
2. **task_completed** - Green toast (success)
3. **task_rejected** - Red toast (error)
4. **error** - Red toast (error)
5. **info** - Blue toast (default)

## Testing

1. Backend se notification send karo
2. Mobile app mein toast notification automatically show hoga
3. Notification tap karne par console mein log dikhega

## Notes

- FCM token automatically login ke time backend ko send hota hai
- Token `UserProfile` model mein `fcm_token` field mein store hota hai
- Notification tap karne par navigation add kar sakte ho (App.tsx mein TODO comment dekho)

